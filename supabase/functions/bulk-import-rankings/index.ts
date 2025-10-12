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
  finishing_position: string;
  event_date: string;
  tournament_name?: string;
  tier?: string;
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

function normalizeCode(value?: string): string {
  if (!value) return '';
  return value.replace(/\u200B/g, '').trim().toUpperCase();
}

function normalizeFinishingPosition(value?: string): string {
  if (!value) return 'event_win'; // Default fallback (database value)
  
  // Check if value is numeric
  const numValue = parseInt(value.trim(), 10);
  if (!isNaN(numValue)) {
    if (numValue === 1) return 'winner';
    if (numValue === 2) return 'second';
    if (numValue === 3) return 'third';
    if (numValue === 4) return 'fourth';
    if (numValue >= 5 && numValue <= 8) return 'quarterfinalist';
    if (numValue >= 9 && numValue <= 16) return 'round_of_16';
    return 'event_win'; // 17+ or any other number
  }
  
  const normalized = value.toLowerCase().trim().replace(/[^a-z0-9_]/g, '_');
  
  const validPositions = [
    'winner', 'second', 'third', 'fourth', 
    'quarterfinalist', 'round_of_16', 'event_win'
  ];
  
  // Direct match
  if (validPositions.includes(normalized)) {
    return normalized;
  }
  
  // Handle common variations and new nomenclature
  const positionMap: Record<string, string> = {
    // New nomenclature support
    'points_awarded': 'event_win',
    'quarter_finalist': 'quarterfinalist',
    // Existing mappings
    '1st': 'winner',
    'first': 'winner',
    '1st_place': 'winner',
    'gold': 'winner',
    'champion': 'winner',
    '2nd': 'second',
    '2nd_place': 'second',
    'silver': 'second',
    'runner_up': 'second',
    '3rd': 'third',
    '3rd_place': 'third',
    'bronze': 'third',
    '4th': 'fourth',
    '4th_place': 'fourth',
    'quarters': 'quarterfinalist',
    'qf': 'quarterfinalist',
    'quarter_final': 'quarterfinalist',
    'r16': 'round_of_16',
    'round16': 'round_of_16',
    'last_16': 'round_of_16',
    'participation': 'event_win',
    'competed': 'event_win',
  };
  
  return positionMap[normalized] || 'event_win';
}

function normalizeTier(value?: string): string {
  if (!value) return 'historic'; // Default to historic for old imports
  const normalized = value.toLowerCase().trim();
  const validTiers = ['tier1', 'tier2', 'tier3', 'tier4', 'historic'];
  return validTiers.includes(normalized) ? normalized : 'historic';
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
    let newPlayerCompletions: Record<string, any> | null = null;

    if (contentType.includes('application/json')) {
      const payload = await req.json();
      
      csvText = (payload.csvText ?? '').toString();
      fileName = (payload.fileName ?? fileName).toString();
      resolutionMap = payload.duplicateResolutions ?? null;
      newPlayerCompletions = payload.newPlayerCompletions ?? null;
      if (!csvText) {
        throw new Error('No CSV content provided');
      }
    } else {
      // Parse form data
      const formData = await req.formData();
      const file = formData.get('file') as File | null;
      const duplicateResolutions = formData.get('duplicateResolutions');
      const playerCompletions = formData.get('newPlayerCompletions');
      resolutionMap = duplicateResolutions ? JSON.parse(duplicateResolutions as string) : null;
      newPlayerCompletions = playerCompletions ? JSON.parse(playerCompletions as string) : null;

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
      'finishing_position': ['finishing_position', 'position', 'finish', 'place'],
      'event_date': ['event_date', 'date', 'match_date'],
      'tournament_name': ['tournament_name', 'tournament', 'event_name', 'event'],
      'tier': ['tier'],
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
        const finishingPositionVal = getCol('finishing_position');
        const eventDateVal = getCol('event_date');
        const tournamentNameVal = getCol('tournament_name');
        const tierVal = getCol('tier');
        const emailVal = getCol('email');
        const dobVal = getCol('date_of_birth');
        const duprIdVal = getCol('dupr_id');
        const playerCodeVal = getCol('player_code');

        const gender = normalizeGender(genderVal);
        const category = normalizeCategory(categoryVal);
        const eventDate = normalizeDate(eventDateVal);
        const dob = normalizeDate(dobVal);
        const finishingPosition = normalizeFinishingPosition(finishingPositionVal);
        const tier = normalizeTier(tierVal);

        records.push({
          player_name: playerName,
          player_code: playerCodeVal ? normalizeCode(playerCodeVal) : undefined,
          country: countryVal,
          gender: (gender ?? undefined) as any,
          category: category || '',
          points: parseInt(pointsVal || '0') || 0,
          finishing_position: finishingPosition,
          event_date: eventDate ?? '',
          tournament_name: tournamentNameVal || undefined,
          tier: tier,
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

    // ALWAYS fetch existing players for lookups (needed for both duplicate detection and resolution processing)
    const allPlayers: any[] = [];
    let start = 0;
    const pageSize = 1000;
    while (true) {
      const { data, error } = await supabaseClient
        .from('players')
        .select('id, name, player_code, email, country, date_of_birth, dupr_id')
        .range(start, start + pageSize - 1);
      if (error) {
        throw new Error('Failed to fetch existing players: ' + error.message);
      }
      if (!data || data.length === 0) break;
      allPlayers.push(...data);
      start += pageSize;
      if (data.length < pageSize) break;
    }

    console.log('Fetched', allPlayers.length, 'existing players from database');

    // Build in-memory lookup maps for fast lookups (needed for both duplicate detection and resolution processing)
    const playersByCode = new Map<string, any>();
    const playersByEmail = new Map<string, any>();
    const playersByDuprId = new Map<string, any>();
    const playersByName = new Map<string, any[]>();
    
    if (allPlayers) {
      for (const player of allPlayers) {
        // Index by player_code
        const code = normalizeCode(player.player_code);
        if (code) playersByCode.set(code, player);
        
        // Index by email
        if (player.email) playersByEmail.set(player.email, player);
        
        // Index by dupr_id
        if (player.dupr_id) playersByDuprId.set(player.dupr_id, player);
        
        // Index by name (for fallback matching)
        const normalizedName = player.name.toLowerCase().trim();
        const existing = playersByName.get(normalizedName) || [];
        existing.push(player);
        playersByName.set(normalizedName, existing);
      }
    }

    console.log(`Built lookup maps: ${playersByCode.size} codes, ${playersByEmail.size} emails, ${playersByDuprId.size} DUPR IDs, ${playersByName.size} unique names`);

    // If no resolutions provided, check for duplicates and return them
    if (!resolutionMap) {
      console.log('Starting duplicate check for', records.length, 'records');
      
      // PRE-FLIGHT VALIDATION: Check for duplicate player_codes within CSV itself
      const intraCSVCodes = new Map<string, number[]>();
      for (let i = 0; i < records.length; i++) {
        const code = normalizeCode(records[i].player_code);
        if (code) {
          if (!intraCSVCodes.has(code)) intraCSVCodes.set(code, []);
          intraCSVCodes.get(code)!.push(i);
        }
      }
      const intraDuplicates = Array.from(intraCSVCodes.entries())
        .filter(([_, rows]) => rows.length > 1)
        .map(([code, rows]) => ({ code, row_indices: rows }));
      
      if (intraDuplicates.length > 0) {
        console.log(`Found ${intraDuplicates.length} duplicate player_codes within CSV:`, intraDuplicates);
      }

      // Check each record against the in-memory maps (fast lookups)
      // Priority: player_code > dupr_id > email > player_name
      const duplicates: DuplicateMatch[] = [];
      
      for (let i = 0; i < records.length; i++) {
        const record = records[i];
        let matchedPlayer: any = null;
        let matchType = '';
        
        // 1. Check by player_code (highest priority)
        if (record.player_code) {
          const code = normalizeCode(record.player_code);
          if (code && playersByCode.has(code)) {
            matchedPlayer = playersByCode.get(code);
            matchType = 'player_code';
            console.log(`Row ${i + 2} (${record.player_name}): Matched by player_code "${code}" to existing player "${matchedPlayer.name}"`);
          }
        }
        
        // 2. Check by dupr_id (second priority)
        if (!matchedPlayer && record.dupr_id) {
          if (playersByDuprId.has(record.dupr_id)) {
            matchedPlayer = playersByDuprId.get(record.dupr_id);
            matchType = 'dupr_id';
            console.log(`Row ${i + 2} (${record.player_name}): Matched by dupr_id to existing player "${matchedPlayer.name}"`);
          }
        }
        
        // 3. Check by email (third priority)
        if (!matchedPlayer && record.email) {
          if (playersByEmail.has(record.email)) {
            matchedPlayer = playersByEmail.get(record.email);
            matchType = 'email';
            console.log(`Row ${i + 2} (${record.player_name}): Matched by email to existing player "${matchedPlayer.name}"`);
          }
        }
        
        // 4. Check by player_name (fallback)
        if (!matchedPlayer && record.player_name && record.player_name.trim() !== '') {
          const normalizedName = record.player_name.toLowerCase().trim();
          const existingPlayers = playersByName.get(normalizedName);
          if (existingPlayers && existingPlayers.length > 0) {
            console.log(`Row ${i + 2} (${record.player_name}): Matched by name to ${existingPlayers.length} existing player(s)`);
            // For name matches, return all matching players (might be multiple)
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
            continue; // Already added to duplicates
          }
        }
        
        // If matched by code/dupr/email, add to duplicates
        if (matchedPlayer) {
          duplicates.push({
            csv_row: i + 2,
            csv_name: record.player_name || `[Match by ${matchType}]`,
            csv_data: {
              player_code: record.player_code,
              email: record.email,
              country: record.country,
              date_of_birth: record.date_of_birth,
              dupr_id: record.dupr_id,
            },
            existing_players: [matchedPlayer],
          });
        }
      }

      console.log('Found', duplicates.length, 'duplicate matches against existing players');

      // NEW VALIDATION: Detect incomplete new players
      const incompleteNewPlayers: Array<{
        csv_row: number;
        player_name: string;
        existing_data: any;
        missing_fields: string[];
      }> = [];

      for (let i = 0; i < records.length; i++) {
        const record = records[i];
        
        // Skip if this is a duplicate (will be resolved by user)
        if (duplicates.some(d => d.csv_row === i + 2)) continue;
        
        // Check if player exists by any identifier
        const code = normalizeCode(record.player_code);
        const existsByCode = code && playersByCode.has(code);
        const existsByEmail = record.email && playersByEmail.has(record.email);
        const existsByDupr = record.dupr_id && playersByDuprId.has(record.dupr_id);
        
        // If player doesn't exist, this is a NEW player
        if (!existsByCode && !existsByEmail && !existsByDupr) {
          const missingFields: string[] = [];
          
          // Check required fields
          if (!record.gender) missingFields.push('gender');
          if (!record.country || record.country.trim() === '') missingFields.push('country');
          if (!record.player_name || record.player_name.trim() === '') missingFields.push('player_name');
          
          // If any required fields are missing, add to incomplete list
          if (missingFields.length > 0) {
            incompleteNewPlayers.push({
              csv_row: i + 2,
              player_name: record.player_name || '[No Name]',
              existing_data: {
                player_code: record.player_code,
                email: record.email,
                country: record.country,
                gender: record.gender,
                date_of_birth: record.date_of_birth,
                dupr_id: record.dupr_id,
              },
              missing_fields: missingFields,
            });
          }
        }
      }

      console.log('Found', incompleteNewPlayers.length, 'incomplete new players');

      // Return duplicates AND incomplete new players
      return new Response(
        JSON.stringify({
          needs_resolution: duplicates.length > 0 || incompleteNewPlayers.length > 0,
          duplicates,
          incomplete_new_players: incompleteNewPlayers,
          total_records: records.length,
          intra_csv_duplicates: intraDuplicates.length > 0 ? intraDuplicates : undefined
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Player lookup maps are now initialized earlier (before duplicate check) for use in both phases

    console.log(`Built lookup maps: ${playersByCode.size} codes, ${playersByEmail.size} emails, ${playersByDuprId.size} DUPR IDs`);

    // Build event key to results map for consolidated match handling
    const eventKeyToResults = new Map<string, Array<{
      rowIndex: number;
      playerId: string;
      finishingPosition: string;
      points: number;
      tier: string;
    }>>();

    let successful = 0;
    let failed = 0;
    let updatedPlayers = 0;
    const errors: any[] = [];

    console.log('Parsed records:', records.length);
    if (resolutionMap) {
      console.log('Resolution keys with player names:');
      Object.keys(resolutionMap).forEach(key => {
        const rowIndex = parseInt(key.replace('row_', ''));
        const record = records[rowIndex];
        console.log(`  ${key} -> ${record?.player_name || 'unknown'} (${record?.player_code || 'no code'})`);
      });
    }
    
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
            
            if (resolution === 'new') {
              // Create new player from CSV data + completions
              const completionKey = `row_${rowIndex}`;
              const completedData = newPlayerCompletions?.[completionKey] || {};
              
              // Merge CSV data with completions (completions take priority)
              const finalPlayerData = {
                player_name: completedData.player_name || record.player_name,
                country: completedData.country || record.country,
                gender: completedData.gender || record.gender,
                player_code: completedData.player_code || record.player_code || null,
                email: completedData.email || record.email || null,
                date_of_birth: completedData.date_of_birth || record.date_of_birth || null,
                dupr_id: completedData.dupr_id || record.dupr_id || null,
              };
              
              if (!finalPlayerData.player_name || finalPlayerData.player_name.trim() === '') {
                throw new Error(`Player name is required to create a new player`);
              }
              if (!finalPlayerData.gender) {
                throw new Error(`Gender is required for new player "${finalPlayerData.player_name}"`);
              }
              
              newPlayersToInsert.push({
                name: finalPlayerData.player_name,
                country: finalPlayerData.country,
                gender: finalPlayerData.gender,
                player_code: finalPlayerData.player_code,
                email: finalPlayerData.email,
                date_of_birth: finalPlayerData.date_of_birth,
                dupr_id: finalPlayerData.dupr_id,
                _rowIndex: rowIndex,
              });
              // playerId will be assigned after batch insert
            } else if (resolution.startsWith('merge_')) {
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
              existingPlayer = playersByCode.get(normalizeCode(record.player_code));
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
              // Queue new player creation with completions
              const completionKey = `row_${rowIndex}`;
              const completedData = newPlayerCompletions?.[completionKey] || {};
              
              // Merge CSV data with completions
              const finalPlayerData = {
                player_name: completedData.player_name || record.player_name,
                country: completedData.country || record.country,
                gender: completedData.gender || record.gender,
                player_code: completedData.player_code || record.player_code || null,
                email: completedData.email || record.email || null,
                date_of_birth: completedData.date_of_birth || record.date_of_birth || null,
                dupr_id: completedData.dupr_id || record.dupr_id || null,
              };
              
              if (!finalPlayerData.player_name || finalPlayerData.player_name.trim() === '') {
                const identifier = record.player_code || record.dupr_id || record.email || 'unknown';
                throw new Error(`Player not found with code/id "${identifier}". To create a new player, provide player_name and gender.`);
              }
              
              if (!finalPlayerData.gender) {
                throw new Error(`Gender is required for new player "${finalPlayerData.player_name}"`);
              }
              
              newPlayersToInsert.push({
                name: finalPlayerData.player_name,
                country: finalPlayerData.country,
                gender: finalPlayerData.gender,
                player_code: finalPlayerData.player_code,
                email: finalPlayerData.email,
                date_of_birth: finalPlayerData.date_of_birth,
                dupr_id: finalPlayerData.dupr_id,
                _rowIndex: rowIndex,
              });
              // playerId will be assigned after batch insert
            }
          }

          if (playerId) {
            playerIdMap.set(rowIndex, playerId);
            
            // Add to event key map if this is a match result
            if (record.category && record.event_date) {
              const eventKey = `${record.tournament_name || `Bulk Import - ${fileName}`}|${record.event_date}|${record.category}`;
              if (!eventKeyToResults.has(eventKey)) {
                eventKeyToResults.set(eventKey, []);
              }
              eventKeyToResults.get(eventKey)!.push({
                rowIndex,
                playerId,
                finishingPosition: record.finishing_position,
                points: record.points,
                tier: record.tier || 'historic',
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

      // Batch update existing players FIRST to avoid later conflicts
      for (const update of playersToUpdate) {
        const { data: updated, error: updErr } = await supabaseClient
          .from('players')
          .update(update.data)
          .eq('id', update.id)
          .select('id, player_code, email, dupr_id')
          .single();
        if (!updErr && updated) {
          if (updated.player_code) playersByCode.set(normalizeCode(updated.player_code), updated);
          if (updated.email) playersByEmail.set(updated.email, updated);
          if (updated.dupr_id) playersByDuprId.set(updated.dupr_id, updated);
        }
      }

      // Filter out any new players that now conflict by player_code after updates
      const filteredNewPlayers = newPlayersToInsert.filter(p => {
        const code = p.player_code ? normalizeCode(p.player_code) : '';
        return !(code && playersByCode.has(code));
      });

      // For filtered-out (now existing) players, map their IDs and queue matches
      for (const p of newPlayersToInsert) {
        const code = p.player_code ? normalizeCode(p.player_code) : '';
        if (code && playersByCode.has(code)) {
          const existing = playersByCode.get(code);
              const rowIndex = p._rowIndex;
              playerIdMap.set(rowIndex, existing.id);
              const record = batch[rowIndex % BATCH_SIZE];
              if (record.category && record.event_date) {
                const eventKey = `${record.tournament_name || `Bulk Import - ${fileName}`}|${record.event_date}|${record.category}`;
                if (!eventKeyToResults.has(eventKey)) {
                  eventKeyToResults.set(eventKey, []);
                }
                eventKeyToResults.get(eventKey)!.push({
                  rowIndex,
                  playerId: existing.id,
                  finishingPosition: record.finishing_position,
                  points: record.points,
                  tier: record.tier || 'historic',
                });
              }
        }
      }

      // Dedupe by player_code within this batch to avoid intra-batch unique conflicts
      const seenCodes = new Set<string>();
      const dedupedNewPlayers: any[] = [];
      const duplicateRowsByCode = new Map<string, number[]>();
      for (const p of filteredNewPlayers) {
        const code = p.player_code ? normalizeCode(p.player_code) : '';
        if (code && seenCodes.has(code)) {
          const arr = duplicateRowsByCode.get(code) ?? [];
          arr.push(p._rowIndex);
          duplicateRowsByCode.set(code, arr);
        } else {
          if (code) seenCodes.add(code);
          dedupedNewPlayers.push(p);
        }
      }

      // Batch insert remaining new players (deduped)
      if (dedupedNewPlayers.length > 0) {
        console.log(`Inserting ${dedupedNewPlayers.length} new players in batch ${batchIdx + 1}`);
        const { data: insertedPlayers, error: batchInsertError } = await supabaseClient
          .from('players')
          .insert(dedupedNewPlayers.map(p => {
            const { _rowIndex, ...playerData } = p;
            return playerData;
          }))
          .select('id, player_code, email, dupr_id');

        if (batchInsertError || !insertedPlayers) {
          console.error('Batch player insert failed:', batchInsertError);
          console.log('Failed player codes:', dedupedNewPlayers.map(p => ({name: p.name, code: p.player_code})));

          // Refresh existing players for the candidate codes (handles case/whitespace mismatches)
          const codesToCheck = dedupedNewPlayers
            .map((p) => p.player_code)
            .filter((c): c is string => !!c);
          if (codesToCheck.length > 0) {
            console.log(`Checking for existing players with codes: ${codesToCheck.join(', ')}`);
            const { data: existingForCodes } = await supabaseClient
              .from('players')
              .select('id, name, player_code, email, dupr_id')
              .in('player_code', codesToCheck);
            if (existingForCodes && existingForCodes.length > 0) {
              console.log(`Found ${existingForCodes.length} existing players:`, existingForCodes.map(p => ({name: p.name, code: p.player_code})));
              for (const pl of existingForCodes) {
                const c = normalizeCode(pl.player_code);
                if (c) playersByCode.set(c, pl);
              }
            } else {
              console.log('No existing players found with those codes');
            }
          }

          // Map existing and collect retry list
          const retryPlayers: any[] = [];
          for (const p of dedupedNewPlayers) {
            const code = p.player_code ? normalizeCode(p.player_code) : '';
            if (code && playersByCode.has(code)) {
              const existing = playersByCode.get(code);
              const rowIndex = p._rowIndex;
              playerIdMap.set(rowIndex, existing.id);
              const record = batch[rowIndex % BATCH_SIZE];
              if (record.category && record.event_date) {
                const eventKey = `${record.tournament_name || `Bulk Import - ${fileName}`}|${record.event_date}|${record.category}`;
                if (!eventKeyToResults.has(eventKey)) {
                  eventKeyToResults.set(eventKey, []);
                }
                eventKeyToResults.get(eventKey)!.push({
                  rowIndex,
                  playerId: existing.id,
                  finishingPosition: record.finishing_position,
                  points: record.points,
                  tier: record.tier || 'historic',
                });
              }
            } else {
              retryPlayers.push(p);
            }
          }

          // Retry only genuinely new players
          if (retryPlayers.length > 0) {
            const { data: reInserted, error: retryErr } = await supabaseClient
              .from('players')
              .insert(retryPlayers.map(p => {
                const { _rowIndex, ...playerData } = p;
                return playerData;
              }))
              .select('id, player_code, email, dupr_id');

            if (retryErr || !reInserted) {
              console.error('Retry player insert failed:', retryErr);
              retryPlayers.forEach(p => {
                const csvRowNumber = p._rowIndex + 2;
                errors.push({
                  row: csvRowNumber,
                  player_name: p.name,
                  error: retryErr?.message || 'Failed to create player'
                });
                failed++;
              });
            } else {
              reInserted.forEach((player, idx) => {
                const originalRecord = retryPlayers[idx];
                const rowIndex = originalRecord._rowIndex;
                const record = batch[rowIndex % BATCH_SIZE];
                
                playerIdMap.set(rowIndex, player.id);
                { const codeN = normalizeCode(player.player_code); if (codeN) playersByCode.set(codeN, player); }
                if (player.email) playersByEmail.set(player.email, player);
                if (player.dupr_id) playersByDuprId.set(player.dupr_id, player);
                
                // Add to name lookup map
                const normalizedName = originalRecord.name.toLowerCase().trim();
                if (!playersByName.has(normalizedName)) {
                  playersByName.set(normalizedName, []);
                }
                playersByName.get(normalizedName)!.push(player);
                
                if (record.category && record.event_date) {
                  const eventKey = `${record.tournament_name || `Bulk Import - ${fileName}`}|${record.event_date}|${record.category}`;
                  if (!eventKeyToResults.has(eventKey)) {
                    eventKeyToResults.set(eventKey, []);
                  }
                  eventKeyToResults.get(eventKey)!.push({
                    rowIndex,
                    playerId: player.id,
                    finishingPosition: record.finishing_position,
                    points: record.points,
                    tier: record.tier || 'historic',
                  });
                }
              });
            }
          }

          // Map intra-batch duplicates to the inserted/existing player by normalized code
          for (const [code, rows] of duplicateRowsByCode.entries()) {
            const existing = code ? playersByCode.get(code) : null;
            if (existing) {
              for (const dupRowIndex of rows) {
                playerIdMap.set(dupRowIndex, existing.id);
                const record = batch[dupRowIndex % BATCH_SIZE];
                if (record.category && record.event_date) {
                  const eventKey = `${record.tournament_name || `Bulk Import - ${fileName}`}|${record.event_date}|${record.category}`;
                  if (!eventKeyToResults.has(eventKey)) {
                    eventKeyToResults.set(eventKey, []);
                  }
                  eventKeyToResults.get(eventKey)!.push({
                    rowIndex: dupRowIndex,
                    playerId: existing.id,
                    finishingPosition: record.finishing_position,
                    points: record.points,
                    tier: record.tier || 'historic',
                  });
                }
              }
            }
          }
        } else {
          insertedPlayers.forEach((player, idx) => {
            const originalRecord = dedupedNewPlayers[idx];
            const rowIndex = originalRecord._rowIndex;
            const record = batch[rowIndex % BATCH_SIZE];
            
            playerIdMap.set(rowIndex, player.id);
            
            // Add to lookup maps
            { const code = normalizeCode(player.player_code); if (code) playersByCode.set(code, player); }
            if (player.email) playersByEmail.set(player.email, player);
            if (player.dupr_id) playersByDuprId.set(player.dupr_id, player);
            
            // Add to name lookup map
            const normalizedName = originalRecord.name.toLowerCase().trim();
            if (!playersByName.has(normalizedName)) {
              playersByName.set(normalizedName, []);
            }
            playersByName.get(normalizedName)!.push(player);
            
            // Add to event key map if this is a match result
            if (record.category && record.event_date) {
              const eventKey = `${record.tournament_name || `Bulk Import - ${fileName}`}|${record.event_date}|${record.category}`;
              if (!eventKeyToResults.has(eventKey)) {
                eventKeyToResults.set(eventKey, []);
              }
              eventKeyToResults.get(eventKey)!.push({
                rowIndex,
                playerId: player.id,
                finishingPosition: record.finishing_position,
                points: record.points,
                tier: record.tier || 'historic',
              });
            }
          });

          // Map intra-batch duplicates to the inserted player by code
          for (const [code, rows] of duplicateRowsByCode.entries()) {
            const existing = code ? playersByCode.get(code) : null;
            if (existing) {
              for (const dupRowIndex of rows) {
                playerIdMap.set(dupRowIndex, existing.id);
                const record = batch[dupRowIndex % BATCH_SIZE];
                if (record.category && record.event_date) {
                  const eventKey = `${record.tournament_name || `Bulk Import - ${fileName}`}|${record.event_date}|${record.category}`;
                  if (!eventKeyToResults.has(eventKey)) {
                    eventKeyToResults.set(eventKey, []);
                  }
                  eventKeyToResults.get(eventKey)!.push({
                    rowIndex: dupRowIndex,
                    playerId: existing.id,
                    finishingPosition: record.finishing_position,
                    points: record.points,
                    tier: record.tier || 'historic',
                  });
                }
              }
            }
          }
        }
      }

      console.log(`Batch ${batchIdx + 1} complete. Success: ${successful}, Failed: ${failed}`);
    }

    // Log import history and get the ID BEFORE processing event keys
    const { data: importHistory, error: historyError } = await supabaseClient
      .from('import_history')
      .insert({
        imported_by: user.id,
        file_name: fileName,
        total_rows: records.length,
        successful_rows: 0, // Will be updated at the end
        failed_rows: 0,
        error_log: errors.length > 0 ? errors : null,
      })
      .select('id')
      .single();

    const importId = importHistory?.id || null;

    // Process all event keys: find or create match, delete old results, insert new ones
    console.log(`Processing ${eventKeyToResults.size} unique event keys for match consolidation`);
    for (const [eventKey, results] of eventKeyToResults.entries()) {
      const [tournamentName, matchDate, category] = eventKey.split('|');
      const matchTier = results[0]?.tier || 'historic'; // Use tier from first result
      
      // Find or create match
      const { data: existingMatches } = await supabaseClient
        .from('matches')
        .select('id')
        .eq('tournament_name', tournamentName)
        .eq('match_date', matchDate)
        .eq('category', category)
        .order('created_at', { ascending: false })
        .limit(1);
      
      let matchId: string;
      
      if (existingMatches && existingMatches.length > 0) {
        matchId = existingMatches[0].id;
        console.log(`Using existing match ${matchId} for ${tournamentName}|${matchDate}|${category}`);
        
        // Update import_id to current import
        const { error: updateError } = await supabaseClient
          .from('matches')
          .update({ import_id: importId })
          .eq('id', matchId);
        
        if (updateError) {
          console.error(`Failed to update import_id for match ${matchId}:`, updateError);
        }
        
        // Delete old results for this match
        const { error: deleteError } = await supabaseClient
          .from('match_results')
          .delete()
          .eq('match_id', matchId);
        
        if (deleteError) {
          console.error(`Failed to delete old results for match ${matchId}:`, deleteError);
        } else {
          console.log(`Deleted old results for match ${matchId}`);
        }
      } else {
        // Create new match
        const { data: newMatch, error: matchError } = await supabaseClient
          .from('matches')
          .insert({
            tournament_name: tournamentName,
            match_date: matchDate,
            category: category,
            tier: matchTier,
            import_id: importId,
          })
          .select('id')
          .single();
        
        if (matchError || !newMatch) {
          console.error(`Failed to create match for ${eventKey}:`, matchError);
          results.forEach(r => {
            errors.push({
              row: r.rowIndex + 2,
              error: matchError?.message || 'Failed to create match'
            });
            failed++;
          });
          continue;
        }
        
        matchId = newMatch.id;
        console.log(`Created new match ${matchId} for ${tournamentName}|${matchDate}|${category}`);
      }
      
      // Insert all results for this match
      const resultsToInsert = results.map(r => ({
        match_id: matchId,
        player_id: r.playerId,
        finishing_position: r.finishingPosition,
        points_awarded: r.points,
      }));
      
      const { error: resultsError } = await supabaseClient
        .from('match_results')
        .insert(resultsToInsert);
      
      if (resultsError) {
        console.error(`Failed to insert results for match ${matchId}:`, resultsError);
        results.forEach(r => {
          errors.push({
            row: r.rowIndex + 2,
            error: resultsError.message
          });
          failed++;
        });
      } else {
        successful += resultsToInsert.length;
        console.log(`Inserted ${resultsToInsert.length} results for match ${matchId}`);
      }
    }


    // Rankings are now automatically computed via the player_rankings VIEW
    // No manual rebuild needed - the VIEW always reflects current match_results data
    console.log('Rankings automatically updated (computed from VIEW)');

    // Verify all players have codes
    const { data: playersWithoutCodes } = await supabaseClient
      .from('players')
      .select('id, name')
      .is('player_code', null);

    if (playersWithoutCodes && playersWithoutCodes.length > 0) {
      console.warn('Players without codes:', playersWithoutCodes);
    }

    // Update import history with final counts
    if (importId) {
      const { error: updateError } = await supabaseClient
        .from('import_history')
        .update({
          successful_rows: successful,
          failed_rows: failed,
          error_log: errors.length > 0 ? errors : null,
        })
        .eq('id', importId);
      
      if (updateError) {
        console.error('Failed to update import history:', updateError);
      }
    }

    return new Response(
      JSON.stringify({
        successful,
        failed,
        total: records.length,
        updated_players: updatedPlayers,
        rankings_auto_computed: true,
        message: 'Import completed successfully. Rankings updated automatically.',
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
