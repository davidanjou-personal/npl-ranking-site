import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ImportRecord {
  player_code: string;
  player_name: string;
  country: string;
  gender: 'male' | 'female';
  category: string;
  points: number;
  event_date: string;
}

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

    // Parse form data
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      throw new Error('No file provided');
    }

    const text = await file.text();
    const lines = text.split('\n').filter(line => line.trim());
    
    if (lines.length < 2) {
      throw new Error('File is empty or has no data rows');
    }

    // Parse CSV (skip header)
    const records: ImportRecord[] = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const cols = line.split(',').map(col => col.trim());
      if (cols.length < 7) continue;

      records.push({
        player_code: cols[0],
        player_name: cols[1],
        country: cols[2],
        gender: cols[3] as 'male' | 'female',
        category: cols[4],
        points: parseInt(cols[5]) || 0,
        event_date: cols[6],
      });
    }

    let successful = 0;
    let failed = 0;
    const errors: any[] = [];

    // Process each record
    for (const record of records) {
      try {
        // Validate record
        if (!record.player_code || !record.player_name) {
          throw new Error('Missing required fields');
        }

        // Check if player exists by code
        let playerId: string;
        const { data: existingPlayer } = await supabaseClient
          .from('players')
          .select('id')
          .eq('player_code', record.player_code)
          .maybeSingle();

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
              player_code: record.player_code,
            })
            .select('id')
            .single();

          if (playerError || !newPlayer) {
            throw playerError || new Error('Failed to create player');
          }

          playerId = newPlayer.id;
        }

        // Create a match entry for this import
        const { data: match, error: matchError } = await supabaseClient
          .from('matches')
          .insert({
            tournament_name: `Bulk Import - ${file.name}`,
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
      file_name: file.name,
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
