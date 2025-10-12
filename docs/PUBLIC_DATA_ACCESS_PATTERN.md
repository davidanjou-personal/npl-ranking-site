# Public Data Access Pattern

## The Problem
When we have tables with sensitive data (like `players` which contains email and date_of_birth), we need to:
1. Lock down the table to admin-only access via RLS
2. Still allow public users to see safe, non-sensitive data

## The Solution: SECURITY DEFINER Functions + Views

### Pattern Overview
```
[Public User] 
    ↓ queries
[View with SECURITY DEFINER] 
    ↓ bypasses RLS to read
[Locked Down Table]
    ↓ returns only safe columns
[Public User sees safe data]
```

### Implementation

#### 1. Lock Down the Base Table
```sql
-- Enable RLS on players table
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;

-- Only admins can see full player details
CREATE POLICY "Only admins can view full player details"
ON public.players FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));
```

#### 2. Create SECURITY DEFINER Function
```sql
CREATE OR REPLACE FUNCTION public.get_players_public_data()
RETURNS TABLE(
  id uuid, 
  name text, 
  country text, 
  gender text, 
  player_code text, 
  dupr_id text, 
  avatar_url text, 
  created_at timestamp with time zone, 
  updated_at timestamp with time zone
)
LANGUAGE sql
STABLE
SECURITY DEFINER  -- This is the key!
SET search_path TO 'public'
AS $function$
  SELECT 
    id,
    name,
    country,
    gender,
    player_code,
    dupr_id,
    avatar_url,
    created_at,
    updated_at
  FROM public.players;
  -- Note: email and date_of_birth are NOT included!
$function$;
```

**Key Points:**
- `SECURITY DEFINER` makes the function run with the creator's permissions (not the caller's)
- This bypasses RLS on the `players` table
- **Only safe columns are returned** - sensitive data is excluded
- `STABLE` means it's read-only (no INSERT/UPDATE/DELETE)
- `SET search_path TO 'public'` prevents SQL injection attacks

#### 3. Create a View (Optional but Recommended)
```sql
CREATE OR REPLACE VIEW public.players_public AS
SELECT * FROM public.get_players_public_data();
```

This gives a cleaner interface for queries.

#### 4. Use in Frontend
```typescript
// Query the view - works for public users!
const { data } = await supabase
  .from("players_public")
  .select("*");
```

## Why This is Safe

### ✅ Security Definer is Safe When:
1. **Read-only** - Uses `STABLE` keyword (no mutations)
2. **Explicit column selection** - Only returns safe columns
3. **Set search_path** - Prevents SQL injection
4. **Well-documented** - Clear what data is exposed

### ❌ Security Definer is Dangerous When:
1. Allows INSERT/UPDATE/DELETE operations
2. Returns sensitive columns (email, passwords, etc.)
3. Missing `SET search_path`
4. Dynamic SQL construction

## Common Pitfall: Removing SECURITY DEFINER

**Don't do this:**
```sql
-- ❌ WRONG - Removes SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.get_players_public_data()
RETURNS TABLE(...)
LANGUAGE sql
STABLE  -- No SECURITY DEFINER!
SET search_path TO 'public'
AS $function$
  SELECT id, name, country FROM public.players;
$function$;
```

**What happens:**
- Function runs with caller's permissions
- Public users can't access `players` table (RLS blocks it)
- Function returns empty results
- **Public data disappears!**

## How to Verify Public Access Works

### 1. Test Without Authentication
```typescript
// Log out or use incognito
const { data, error } = await supabase
  .from("players_public")
  .select("*");

console.log(data); // Should return data!
```

### 2. Check Supabase Logs
- Go to Lovable Cloud backend
- Check database logs for RLS policy denials
- If you see "permission denied" for public/anon role, access is broken

### 3. Run Security Linter
```bash
# The linter will show SECURITY DEFINER warnings
# These are EXPECTED and SAFE if following this pattern
```

## Other Tables That Need This Pattern

### Events & Event Results
These are public tournament data, so they have direct RLS policies:

```sql
-- Allow public read access
CREATE POLICY "Allow public read access to events"
ON public.events FOR SELECT
TO public
USING (true);

CREATE POLICY "Allow public read access to event_results"
ON public.event_results FOR SELECT
TO public
USING (true);
```

**No SECURITY DEFINER needed** - these tables don't contain sensitive data.

### Ranking Views
Current ranking calculations need to join `players` table, so they use SECURITY DEFINER:

```sql
CREATE OR REPLACE FUNCTION public.get_current_rankings()
RETURNS TABLE(...)
LANGUAGE sql
STABLE
SECURITY DEFINER  -- Needed to join players table
SET search_path TO 'public'
AS $function$
  SELECT 
    p.id, p.name, p.country,  -- Only safe columns
    SUM(er.points_awarded) as total_points
  FROM public.events e
  JOIN public.event_results er ON e.id = er.event_id
  JOIN public.players p ON er.player_id = p.id
  GROUP BY p.id, p.name, p.country;
$function$;
```

## Checklist: When Adding New Public Features

- [ ] Does it need to query tables with sensitive data?
- [ ] If yes, create SECURITY DEFINER function that returns only safe columns
- [ ] If no, add direct RLS policy `USING (true)` for public access
- [ ] Test without authentication
- [ ] Document which columns are exposed and why
- [ ] Add comments in migration explaining the security model

## Summary

**The Rule:** 
- Sensitive tables → Admin-only RLS + SECURITY DEFINER functions exposing safe columns
- Public tables → Direct RLS policy allowing public access
- Never remove SECURITY DEFINER without understanding the implications!
