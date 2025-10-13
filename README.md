# NPL Rankings - National Pickleball League Ranking System

## Project Overview

This is the official National Pickleball League (NPL) ranking system that tracks player rankings across five competitive categories using a points-based system with a rolling 12-month window.

**Live Demo**: https://lovable.dev/projects/ff6821c0-9546-4dfb-876b-cad21a1642a5

## Features

### Rankings System
- **Current Rankings (12-month)**: Active points from events in the last 12 months
- **All-Time Rankings**: Lifetime total points across all recorded events
- **National Rankings**: Country-specific leaderboards showing both national and global ranks
- **Five Categories**: Men's Singles, Women's Singles, Men's Doubles, Women's Doubles, Mixed Doubles

### Points Calculation
Points are awarded based on:
- **Tournament Tier**: Tier 1 (1000 base points) down to Tier 4 (100 points)
- **Finishing Position**: Winner (100%), 2nd (80%), 3rd (60%), 4th (50%), Quarter-Finalist (30%), Round of 16 (20%), Points Awarded (5%)
- **Rolling Window**: Points expire 12 months after the event date

[Learn more about how rankings work](https://your-domain.com/how-it-works)

### Admin Features
- Player management with detailed profiles
- Event result recording and editing
- Bulk CSV import for players and event results
- Import history tracking with rollback capability
- Duplicate player detection and resolution
- Real-time ranking calculations

## Terminology

The system uses **"Events"** to refer to tournament competitions (previously called "matches"):
- **Event**: A tournament competition with results
- **Event Results**: Individual player finishes in an event
- **Event Date**: When the competition took place
- **Event History**: Record of all events a player participated in

## Project Info

**URL**: https://lovable.dev/projects/ff6821c0-9546-4dfb-876b-cad21a1642a5

## How to Edit This Code

There are several ways to edit this application:

### Use Lovable

Simply visit the [Lovable Project](https://lovable.dev/projects/ff6821c0-9546-4dfb-876b-cad21a1642a5) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

### Use Your Preferred IDE

Clone and work locally using your own IDE:

```sh
# Step 1: Clone the repository
git clone <YOUR_GIT_URL>

# Step 2: Navigate to project directory
cd <YOUR_PROJECT_NAME>

# Step 3: Install dependencies
npm i

# Step 4: Start development server
npm run dev
```

### Edit Directly in GitHub

- Navigate to the desired file(s)
- Click the "Edit" button (pencil icon) at the top right
- Make your changes and commit

### Use GitHub Codespaces

- Navigate to the main page of your repository
- Click on the "Code" button (green button) near the top right
- Select the "Codespaces" tab
- Click on "New codespace" to launch a new Codespace environment
- Edit files directly within the Codespace and commit and push your changes

## Technologies Used

This project is built with:

- **Frontend**: React + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn-ui components
- **Backend**: Supabase (via Lovable Cloud)
  - PostgreSQL database
  - Row-Level Security (RLS) policies
  - Edge Functions for bulk imports
  - Real-time subscriptions
- **State Management**: TanStack Query (React Query)
- **Routing**: React Router
- **Forms**: React Hook Form + Zod validation

## Database Structure

### Core Tables
- `events`: Tournament events with tier, category, and date
- `event_results`: Player finishes and points awarded
- `players`: Player profiles with country, gender, and codes
- `player_rankings`: Materialized all-time rankings
- `current_rankings`: View of active 12-month rankings

### Security
- Row-Level Security (RLS) enabled on all sensitive tables
- Admin-only access for data modifications
- Public read access for rankings and player profiles
- Audit logging for all data changes

## How to Deploy

Open [Lovable](https://lovable.dev/projects/ff6821c0-9546-4dfb-876b-cad21a1642a5) and click on **Share → Publish**.

## Custom Domain

You can connect a custom domain to your deployed application.

Navigate to **Project > Settings > Domains** and click **Connect Domain**.

Read more: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)

## Admin Access

Admin functionality requires authentication and specific role assignment:

1. Sign up/login via the Auth page
2. Contact system administrator to assign admin role
3. Access admin dashboard at `/admin`

### CSV Import Formats

**Player Import Template:**
```csv
name,country,gender,player_code,email,date_of_birth,dupr_id
John Doe,USA,male,NPL000000001,john@example.com,1990-01-01,12345678
```

**Event Results Import Template:**
```csv
player_name,player_code,country,gender,category,finishing_position,event_date,tournament_name,tier
John Doe,NPL000000001,USA,male,mens_singles,1,2024-10-01,Spring Championship,tier2
```

**Valid Categories**: `mens_singles`, `womens_singles`, `mens_doubles`, `womens_doubles`, `mixed_doubles`

**Valid Tiers**: `tier1`, `tier2`, `tier3`, `tier4`, `historic`

**Valid Finishing Positions**: `winner`, `second`, `third`, `fourth`, `quarterfinalist`, `round_of_16`, `points_awarded`

**Note:** `points_awarded` represents:
- Historic points allocation for legacy data
- 5% participation points for pool play or pre-Round 16 wins
- This is NOT considered a competitive finish for "Best Finish" stats

## Support

For issues or questions, please contact the development team or open an issue in this repository.

## License

© 2025 National Pickleball League. All rights reserved.
