import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface ImportRecord {
  player_code?: string;
  player_name: string;
  country: string;
  gender: 'male' | 'female';
  category: string;
  points: number;
  event_date: string;
  email?: string;
  date_of_birth?: string;
  nationality?: string;
  dupr_id?: string;
}

interface DuplicateMatch {
  csv_row: number;
  csv_name: string;
  existing_players: Array<{
    id: string;
    name: string;
    player_code?: string;
    email?: string;
    country: string;
  }>;
}

// Normalization helpers
const allowedCategories = new Set(['mens_singles','womens_singles','mens_doubles','womens_doubles','mixed_doubles']);

function normalizeGender(value?: string): 'male' | 'female' | null {
  if (!value) return null;
  const v = value.trim().toLowerCase();
  if (v.startsWith('m')) return 'male';
  if (v.startsWith('f')) return 'female';
  return null;
}

function normalizeCategory(value?: string): string {
  if (!value) return '';
  let v = value.trim().toLowerCase().replace(/[\s-]+/g, '_');
  const map: Record<string, string> = {
    'men': 'mens_singles',
    'mens': 'mens_singles',
    "men's": 'mens_singles',
    'mens_singles': 'mens_singles',
    "men's_singles": 'mens_singles',
    'ms': 'mens_singles',
    'women': 'womens_singles',
    'womens': 'womens_singles',
    "women's": 'womens_singles',
    'womens_singles': 'womens_singles',
    "women's_singles": 'womens_singles',
    'ws': 'womens_singles',
    'mens_doubles': 'mens_doubles',
    'md': 'mens_doubles',
    'womens_doubles': 'womens_doubles',
    'wd': 'womens_doubles',
    'mixed_doubles': 'mixed_doubles',
    'mixed': 'mixed_doubles',
    'xd': 'mixed_doubles',
    'mx': 'mixed_doubles',
  };
  if (map[v]) v = map[v];
  return allowedCategories.has(v) ? v : '';
}

function normalizeDate(value?: string): string | null {
  if (!value) return null;
  const s = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const m = s.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})$/);
  if (m) {
    let d = parseInt(m[1], 10);
    let mo = parseInt(m[2], 10);
    const y = parseInt(m[3], 10);
    if (d <= 12 && mo > 12) {
      const tmp = d; d = mo; mo = tmp;
    }
    const mm = String(mo).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    return `${y}-${mm}-${dd}`;
  }
  return null;
}

// Server
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get auth user
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    // Check admin role
    const { data: roleData } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (!roleData) {
      throw new Error('Admin access required');
    }

    // Support both JSON (csvText) and multipart/form-data (file)
    const contentType = req.headers.get('content-type') || '';
    let csvText = '';
    let fileName = 'upload.csv';
    let resolutionMap: Record<string, string> | null = null;

    if (contentType.includes('application/json')) {
      const payload = await req.json();
      csvText = (payload.csvText ?? '').toString();
      fileName = (payload.fileName ?? fileName).toString();
      resolutionMap = payload.duplicateResolutions ?? null;
      if (!csvText) {
        throw new Error('No CSV content provided');
      }
    } else {
      // Parse form data
      const formData = await req.formData();
      const file = formData.get('file') as File | null;
      const duplicateResolutions = formData.get('duplicateResolutions');
      resolutionMap = duplicateResolutions ? JSON.parse(duplicateResolutions as string) : null;

      if (!file) {
        throw new Error('No file provided');
      }
      csvText = await file.text();
      fileName = file.name || fileName;
    }

    const lines = csvText.split('\n').filter(line => line.trim());
    
    if (lines.length < 2) {
      throw new Error('File is empty or has no data rows');
    }

    // Parse CSV (skip header)
    // Expected format: player_name,player_code,country,gender,category,points,event_date,email,date_of_birth,nationality,dupr_id
    const records: ImportRecord[] = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const cols = line.split(',').map(col => col.trim());
      if (cols.length < 7) continue;
      const gender = normalizeGender(cols[3]);
      const category = normalizeCategory(cols[4]);
      const eventDate = normalizeDate(cols[6]);

      records.push({
        player_name: cols[0] || '',
        player_code: cols[1] || undefined,
        country: cols[2] || '',
        gender: (gender ?? undefined) as any,
        category: category || '',
        points: parseInt(cols[5]) || 0,
        event_date: eventDate ?? '',
        email: cols[7] || undefined,
        date_of_birth: cols[8] || undefined,
        nationality: cols[9] || undefined,
        dupr_id: cols[10] || undefined,
      });
    }

    // If no resolutions provided, check for duplicates and return them
    if (!resolutionMap) {
      const duplicates: DuplicateMatch[] = [];
      
      for (let i = 0; i < records.length; i++) {
        const record = records[i];
        
        // Check for existing players with same name (case-insensitive)
        const { data: existingPlayers } = await supabaseClient
          .from('players')
          .select('id, name, player_code, email, country')
          .ilike('name', record.player_name);

        if (existingPlayers && existingPlayers.length > 0) {
          duplicates.push({
            csv_row: i + 2, // +2 because: +1 for 0-index, +1 for header row
            csv_name: record.player_name,
            existing_players: existingPlayers,
          });
        }
      }

      // If duplicates found, return them for user resolution
      if (duplicates.length > 0) {
        return new Response(
          JSON.stringify({
            needs_resolution: true,
            duplicates,
            total_records: records.length,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    let successful = 0;
    let failed = 0;
    const errors: any[] = [];

    // Process each record
    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      try {
        // Validate record
        if (!record.player_name) {
          throw new Error('Player name is required');
        }
        if (!record.gender) {
          throw new Error(`Invalid gender for ${record.player_name}. Use "male" or "female".`);
        }
        if (!record.category || !allowedCategories.has(record.category)) {
          throw new Error(`Invalid or missing category for ${record.player_name}. Allowed: mens_singles, womens_singles, mens_doubles, womens_doubles, mixed_doubles.`);
        }
        if (!record.event_date) {
          throw new Error(`Invalid or missing event_date for ${record.player_name}. Use YYYY-MM-DD.`);
        }
        let playerId: string;
        const rowKey = `row_${i}`;
        
        // Check if user provided resolution for this row
        if (resolutionMap && resolutionMap[rowKey]) {
          playerId = resolutionMap[rowKey];
        } else {
          // Try to find existing player by player_code, dupr_id, or email
          let existingPlayer = null;
          
          if (record.player_code) {
            const { data } = await supabaseClient
              .from('players')
              .select('id')
              .eq('player_code', record.player_code)
              .maybeSingle();
            existingPlayer = data;
          }
          
          if (!existingPlayer && record.dupr_id) {
            const { data } = await supabaseClient
              .from('players')
              .select('id')
              .eq('dupr_id', record.dupr_id)
              .maybeSingle();
            existingPlayer = data;
          }
          
          if (!existingPlayer && record.email) {
            const { data } = await supabaseClient
              .from('players')
              .select('id')
              .eq('email', record.email)
              .maybeSingle();
            existingPlayer = data;
          }

          if (existingPlayer) {
            playerId = existingPlayer.id;
          } else {
            // Create new player
            const { data: newPlayer, error: playerError } = await supabaseClient
              .from('players')
              .insert({
                name: record.player_name,
                country: record.country,
                gender: record.gender,
                player_code: record.player_code || null,
                email: record.email || null,
                date_of_birth: record.date_of_birth || null,
                nationality: record.nationality || null,
                dupr_id: record.dupr_id || null,
              })
              .select('id')
              .single();

            if (playerError || !newPlayer) {
              throw playerError || new Error('Failed to create player');
            }

            playerId = newPlayer.id;
          }
        }

        // Create a match entry for this import
        const { data: match, error: matchError } = await supabaseClient
          .from('matches')
          .insert({
            tournament_name: `Bulk Import - ${fileName}`,
            match_date: record.event_date,
            category: record.category,
            tier: 'tier4', // Default tier for bulk imports
          })
          .select('id')
          .single();

        if (matchError || !match) {
          throw matchError || new Error('Failed to create match');
        }

        // Create match result with points
        const { error: resultError } = await supabaseClient
          .from('match_results')
          .insert({
            match_id: match.id,
            player_id: playerId,
            finishing_position: 'event_win',
            points_awarded: record.points,
          });

        if (resultError) {
          throw resultError;
        }

        successful++;
      } catch (error: any) {
        console.error('Error processing record:', record, error);
        failed++;
        errors.push({
          record: record.player_code,
          error: error.message,
        });
      }
    }

    // Log import history
    await supabaseClient.from('import_history').insert({
      imported_by: user.id,
      file_name: fileName,
      total_rows: records.length,
      successful_rows: successful,
      failed_rows: failed,
      error_log: errors.length > 0 ? errors : null,
    });

    return new Response(
      JSON.stringify({
        successful,
        failed,
        total: records.length,
        errors: errors.slice(0, 10), // Return first 10 errors
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Bulk import error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
