// Shared TypeScript interfaces for Admin functionality

export interface Player {
  id: string;
  name: string;
  country: string;
  gender: string;
  player_code: string;
  email?: string | null;
  date_of_birth?: string | null;
  dupr_id?: string | null;
  avatar_url?: string | null;
  alternate_names?: string[] | null;
  created_at?: string;
  updated_at?: string;
}

// Event data (previously called "match")
export interface Match {
  id: string;
  tournament_name: string;
  match_date: string;
  tier: "tier1" | "tier2" | "tier3" | "tier4" | "historic";
  category: "mens_singles" | "womens_singles" | "mens_doubles" | "womens_doubles" | "mixed_doubles";
  created_at?: string;
  created_by?: string;
}

// Event result for a player (previously called "match_result")
export interface MatchResult {
  id: string;
  event_id: string; // Renamed from match_id
  match_id?: string; // Backward compatibility
  player_id: string;
  finishing_position: "winner" | "second" | "third" | "fourth" | "quarterfinalist" | "round_of_16" | "event_win";
  points_awarded: number;
  created_at?: string;
}

// Event with all player results
export interface MatchWithResults extends Match {
  event_results: Array<MatchResult & { players: Partial<Player> }>;
  match_results?: Array<MatchResult & { players: Partial<Player> }>; // Backward compatibility
}

export interface DuplicatePlayer {
  csv_row: number;
  csv_name: string;
  csv_data: Partial<Player>;
  existing_players: Player[];
}

export interface BulkImportResolutions {
  [key: string]: string; // key format: "row_${index}", value: "new" | playerId | "merge_${playerId}"
}

export interface PlayerFormData {
  name: string;
  country: string;
  gender: "male" | "female";
  player_code?: string;
  email?: string;
  date_of_birth?: string;
  dupr_id?: string;
  alternate_names?: string[];
}

// Event form data (previously "match" form data)
export interface MatchFormData {
  tournament_name: string;
  match_date: string;
  tier: "tier1" | "tier2" | "tier3" | "tier4" | "historic";
  category: "mens_singles" | "womens_singles" | "mens_doubles" | "womens_doubles" | "mixed_doubles";
  results: Array<{
    player_id: string;
    finishing_position: "winner" | "second" | "third" | "fourth" | "quarterfinalist" | "round_of_16" | "event_win";
  }>;
}

export interface IncompletePlayer {
  csv_row: number;
  player_name: string;
  existing_data: {
    player_code?: string;
    email?: string;
    country?: string;
    gender?: 'male' | 'female';
    date_of_birth?: string;
    dupr_id?: string;
  };
  missing_fields: string[];
}

export interface NewPlayerCompletions {
  [key: string]: {
    player_name?: string;
    country?: string;
    gender?: 'male' | 'female';
    player_code?: string;
    email?: string;
    date_of_birth?: string;
    dupr_id?: string;
  };
}
