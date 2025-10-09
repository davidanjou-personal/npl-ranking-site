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
  tournament_name?: string;
  email?: string;
  date_of_birth?: string;
  dupr_id?: string;
}

interface DuplicateMatch {
  csv_row: number;
  csv_name: string;
    csv_data: {
      player_code?: string;
      email?: string;
      country: string;
      date_of_birth?: string;
      dupr_id?: string;
    };
    existing_players: Array<{
      id: string;
      name: string;
      player_code?: string;
      email?: string;
      country: string;
      date_of_birth?: string;
      dupr_id?: string;
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
    // Extract auth and create client with user context so auth.uid() works in triggers
    const authHeader = req.headers.get('Authorization') || '';
    const token = authHeader.replace('Bearer ', '');

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        global: {
          headers: {
            Authorization: authHeader,
          },
        },
      }
    );

    // Get auth user
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

    // Helper: Parse a CSV line respecting quotes
    function parseCSVLine(line: string): string[] {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    }

    const lines = csvText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    
    if (lines.length < 2) {
      throw new Error('File is empty or has no data rows');
    }

    // Parse header row and build column index map (case-insensitive, with aliases)
    const headerCols = parseCSVLine(lines[0]).map(h => h.toLowerCase().trim());
    
    const columnAliases: Record<string, string[]> = {
      'player_name': ['player_name', 'name'],
      'player_code': ['player_code', 'code', 'id'],
      'country': ['country', 'nationality'], // nationality is an alias for country
      'gender': ['gender'],
      'category': ['category'],
      'points': ['points'],
      'event_date': ['event_date', 'date', 'match_date'],
      'tournament_name': ['tournament_name', 'tournament', 'event_name', 'event'],
      'email': ['email'],
      'date_of_birth': ['date_of_birth', 'dob', 'birthdate'],
      'dupr_id': ['dupr_id'],
    };

    const colIndex: Record<string, number> = {};
    for (const [key, aliases] of Object.entries(columnAliases)) {
      for (const alias of aliases) {
        const idx = headerCols.indexOf(alias);
        if (idx !== -1) {
          colIndex[key] = idx;
          break;
        }
      }
    }

    console.log('Detected column indices:', colIndex);

    // Parse data rows
    const records: ImportRecord[] = [];
    const parseErrors: Array<{ row: number; error: string }> = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line || line.trim().length === 0) continue;

      try {
        const cols = parseCSVLine(line);
        
        // Skip rows that are too short
        if (cols.length < 3) {
          parseErrors.push({ row: i + 1, error: 'Row has too few columns' });
          continue;
        }

        const getCol = (key: string) => {
          const idx = colIndex[key];
          return idx !== undefined && idx < cols.length ? cols[idx] : undefined;
        };

        const playerName = getCol('player_name') || '';
        const countryVal = getCol('country') || ''; // nationality alias handled in columnAliases
        const genderVal = getCol('gender');
        const categoryVal = getCol('category');
        const pointsVal = getCol('points');
        const eventDateVal = getCol('event_date');
        const tournamentNameVal = getCol('tournament_name');
        const emailVal = getCol('email');
        const dobVal = getCol('date_of_birth');
        const duprIdVal = getCol('dupr_id');
        const playerCodeVal = getCol('player_code');

        const gender = normalizeGender(genderVal);
        const category = normalizeCategory(categoryVal);
        const eventDate = normalizeDate(eventDateVal);
        const dob = normalizeDate(dobVal);

        records.push({
          player_name: playerName,
          player_code: playerCodeVal || undefined,
          country: countryVal,
          gender: (gender ?? undefined) as any,
          category: category || '',
          points: parseInt(pointsVal || '0') || 0,
          event_date: eventDate ?? '',
          tournament_name: tournamentNameVal || undefined,
          email: emailVal || undefined,
          date_of_birth: dob ?? undefined,
          dupr_id: duprIdVal || undefined,
        });
      } catch (err: any) {
        parseErrors.push({ row: i + 1, error: err.message });
      }
    }

    if (parseErrors.length > 0) {
      console.warn('Parse warnings:', parseErrors.slice(0, 5));
    }

    console.log(`Parsed ${records.length} records from ${lines.length - 1} data rows`);

    // If no resolutions provided, check for duplicates and return them
    if (!resolutionMap) {
      console.log('Starting duplicate check for', records.length, 'records');
      
      // OPTIMIZATION: Fetch ALL existing players in ONE query instead of checking each record
      const { data: allPlayers, error: playersError } = await supabaseClient
        .from('players')
        .select('id, name, player_code, email, country, date_of_birth, dupr_id');

      if (playersError) {
        throw new Error('Failed to fetch existing players: ' + playersError.message);
      }

      console.log('Fetched', allPlayers?.length || 0, 'existing players from database');

      // Build an in-memory lookup map for fast duplicate detection
      // Key: normalized lowercase name -> Array of matching players
      const playersByName = new Map<string, typeof allPlayers>();
      
      if (allPlayers) {
        for (const player of allPlayers) {
          const normalizedName = player.name.toLowerCase().trim();
          const existing = playersByName.get(normalizedName) || [];
          existing.push(player);
          playersByName.set(normalizedName, existing);
        }
      }

      console.log('Built lookup map with', playersByName.size, 'unique normalized names');

      // Check each record against the in-memory map (fast lookups)
      const duplicates: DuplicateMatch[] = [];
      
      for (let i = 0; i < records.length; i++) {
        const record = records[i];
        
        // Skip duplicate check if no player_name (we'll match by code/id/email instead)
        if (!record.player_name || record.player_name.trim() === '') {
          continue;
        }
        
        const normalizedName = record.player_name.toLowerCase().trim();
        const existingPlayers = playersByName.get(normalizedName);

        if (existingPlayers && existingPlayers.length > 0) {
          duplicates.push({
            csv_row: i + 2, // +2 because: +1 for 0-index, +1 for header row
            csv_name: record.player_name,
            csv_data: {
              player_code: record.player_code,
              email: record.email,
              country: record.country,
              date_of_birth: record.date_of_birth,
              dupr_id: record.dupr_id,
            },
            existing_players: existingPlayers,
          });
        }
      }

      console.log('Found', duplicates.length, 'duplicate matches');

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

    // Fetch ALL existing players for fast lookup during import
    const { data: allPlayers, error: playersError } = await supabaseClient
      .from('players')
      .select('id, name, player_code, email, dupr_id');

    if (playersError) {
      throw new Error('Failed to fetch existing players: ' + playersError.message);
    }

    // Build lookup maps for fast player matching
    const playersByCode = new Map<string, any>();
    const playersByEmail = new Map<string, any>();
    const playersByDuprId = new Map<string, any>();

    if (allPlayers) {
      for (const player of allPlayers) {
        if (player.player_code) playersByCode.set(player.player_code, player);
        if (player.email) playersByEmail.set(player.email, player);
        if (player.dupr_id) playersByDuprId.set(player.dupr_id, player);
      }
    }

    console.log(`Built lookup maps: ${playersByCode.size} codes, ${playersByEmail.size} emails, ${playersByDuprId.size} DUPR IDs`);

    let successful = 0;
    let failed = 0;
    let updatedPlayers = 0;
    const errors: any[] = [];

    console.log('Parsed records:', records.length);
    console.log('Resolution keys:', resolutionMap ? Object.keys(resolutionMap) : []);
    
    // Batch process records for much better performance
    const BATCH_SIZE = 50; // Process in chunks
    const batches = [];
    for (let i = 0; i < records.length; i += BATCH_SIZE) {
      batches.push(records.slice(i, i + BATCH_SIZE));
    }

    console.log(`Processing ${records.length} records in ${batches.length} batches of ${BATCH_SIZE}`);

    for (let batchIdx = 0; batchIdx < batches.length; batchIdx++) {
      const batch = batches[batchIdx];
      console.log(`Processing batch ${batchIdx + 1}/${batches.length} (${batch.length} records)`);

      // Prepare all inserts/updates for this batch
      const newPlayersToInsert: any[] = [];
      const playersToUpdate: { id: string; data: any }[] = [];
      const matchesToInsert: any[] = [];
      const playerIdMap: Map<number, string> = new Map(); // rowIndex -> playerId

      for (let i = 0; i < batch.length; i++) {
        const record = batch[i];
        const rowIndex = batchIdx * BATCH_SIZE + i;
        const csvRowNumber = rowIndex + 2;
        const rowKey = `row_${rowIndex}`;

        try {
          // Validate
          const resolution = resolutionMap ? (resolutionMap[rowKey] as string | undefined) : undefined;
          const isPlayersOnly = (!record.category || record.category === '') && (!record.event_date || record.event_date === '');
          
          if (!isPlayersOnly) {
            if (!record.category || !allowedCategories.has(record.category)) {
              throw new Error(`Invalid or missing category`);
            }
            if (!record.event_date) {
              throw new Error(`Invalid or missing event_date`);
            }
          }

          let playerId: string | null = null;

          // Handle resolution
          if (resolutionMap && resolutionMap[rowKey]) {
            const resolution = resolutionMap[rowKey];
            
            if (resolution.startsWith('merge_')) {
              playerId = resolution.replace('merge_', '');
              
              const updateData: any = {};
              if (record.player_code) updateData.player_code = record.player_code;
              if (record.email) updateData.email = record.email;
              if (record.date_of_birth) updateData.date_of_birth = record.date_of_birth;
              if (record.dupr_id) updateData.dupr_id = record.dupr_id;
              if (record.country) updateData.country = record.country;
              if (record.gender) updateData.gender = record.gender;
              
              if (Object.keys(updateData).length > 0) {
                playersToUpdate.push({ id: playerId, data: updateData });
                updatedPlayers++;
              }
            } else {
              playerId = resolution;
            }
          } else {
            // Lookup existing player
            let existingPlayer = null;
            
            if (record.player_code) {
              existingPlayer = playersByCode.get(record.player_code);
            }
            
            if (!existingPlayer && record.dupr_id) {
              existingPlayer = playersByDuprId.get(record.dupr_id);
            }
            
            if (!existingPlayer && record.email) {
              existingPlayer = playersByEmail.get(record.email);
            }

            if (existingPlayer) {
              playerId = existingPlayer.id;
            } else {
              // Queue new player creation
              if (!record.player_name || record.player_name.trim() === '') {
                const identifier = record.player_code || record.dupr_id || record.email || 'unknown';
                throw new Error(`Player not found with code/id "${identifier}". To create a new player, provide player_name and gender.`);
              }
              
              if (!record.gender) {
                throw new Error(`Gender is required for new player "${record.player_name}"`);
              }
              
              newPlayersToInsert.push({
                name: record.player_name,
                country: record.country,
                gender: record.gender,
                player_code: record.player_code || null,
                email: record.email || null,
                date_of_birth: record.date_of_birth || null,
                dupr_id: record.dupr_id || null,
                _rowIndex: rowIndex,
              });
              // playerId will be assigned after batch insert
            }
          }

          if (playerId) {
            playerIdMap.set(rowIndex, playerId);
            
            // Queue match creation if needed
            if (record.category && record.event_date) {
              matchesToInsert.push({
                tournament_name: record.tournament_name || `Bulk Import - ${fileName}`,
                match_date: record.event_date,
                category: record.category,
                tier: 'tier4',
                _playerId: playerId,
                _points: record.points,
                _rowIndex: rowIndex,
              });
            }
          }
        } catch (error: any) {
          console.error(`Row ${csvRowNumber} error:`, error.message);
          failed++;
          errors.push({
            row: csvRowNumber,
            player_name: record.player_name || 'unknown',
            player_code: record.player_code,
            error: error.message,
          });
        }
      }

      // Batch insert new players
      if (newPlayersToInsert.length > 0) {
        const { data: insertedPlayers, error: batchInsertError } = await supabaseClient
          .from('players')
          .insert(newPlayersToInsert.map(p => {
            const { _rowIndex, ...playerData } = p;
            return playerData;
          }))
          .select('id, player_code, email, dupr_id');

        if (batchInsertError || !insertedPlayers) {
          console.error('Batch player insert failed:', batchInsertError);
          newPlayersToInsert.forEach(p => {
            const csvRowNumber = p._rowIndex + 2;
            errors.push({
              row: csvRowNumber,
              player_name: p.name,
              error: batchInsertError?.message || 'Failed to create player'
            });
            failed++;
          });
        } else {
          insertedPlayers.forEach((player, idx) => {
            const originalRecord = newPlayersToInsert[idx];
            const rowIndex = originalRecord._rowIndex;
            const record = batch[rowIndex % BATCH_SIZE];
            
            playerIdMap.set(rowIndex, player.id);
            
            // Add to lookup maps
            if (player.player_code) playersByCode.set(player.player_code, player);
            if (player.email) playersByEmail.set(player.email, player);
            if (player.dupr_id) playersByDuprId.set(player.dupr_id, player);
            
            // Queue match if needed
            if (record.category && record.event_date) {
              matchesToInsert.push({
                tournament_name: record.tournament_name || `Bulk Import - ${fileName}`,
                match_date: record.event_date,
                category: record.category,
                tier: 'tier4',
                _playerId: player.id,
                _points: record.points,
                _rowIndex: rowIndex,
              });
            }
          });
        }
      }

      // Batch update existing players
      for (const update of playersToUpdate) {
        await supabaseClient
          .from('players')
          .update(update.data)
          .eq('id', update.id);
      }

      // Batch insert matches
      if (matchesToInsert.length > 0) {
        const { data: insertedMatches, error: matchInsertError } = await supabaseClient
          .from('matches')
          .insert(matchesToInsert.map(m => {
            const { _playerId, _points, _rowIndex, ...matchData } = m;
            return matchData;
          }))
          .select('id');

        if (matchInsertError || !insertedMatches) {
          console.error('Batch match insert failed:', matchInsertError);
          matchesToInsert.forEach(m => {
            errors.push({
              row: m._rowIndex + 2,
              error: matchInsertError?.message || 'Failed to create match'
            });
            failed++;
          });
        } else {
          // Batch insert match results
          const resultsToInsert = insertedMatches.map((match, idx) => {
            const originalMatch = matchesToInsert[idx];
            return {
              match_id: match.id,
              player_id: originalMatch._playerId,
              finishing_position: 'event_win',
              points_awarded: originalMatch._points,
            };
          });

          const { error: resultsInsertError } = await supabaseClient
            .from('match_results')
            .insert(resultsToInsert);

          if (resultsInsertError) {
            console.error('Batch results insert failed:', resultsInsertError);
            matchesToInsert.forEach(m => {
              errors.push({
                row: m._rowIndex + 2,
                error: resultsInsertError.message
              });
              failed++;
            });
          } else {
            successful += resultsToInsert.length;
          }
        }
      } else {
        // If no matches, count successful player creations/updates
        successful += playerIdMap.size - matchesToInsert.length;
      }

      console.log(`Batch ${batchIdx + 1} complete. Success: ${successful}, Failed: ${failed}`);
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
        updated_players: updatedPlayers,
        errors: errors.slice(0, 20),
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
