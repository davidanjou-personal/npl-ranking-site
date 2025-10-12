import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface RankingData {
  player_id: string;
  category: string;
  name: string;
  country: string | null;
  gender: string | null;
  total_points: number;
  rank: number;
  nationalRank?: number; // Calculated on-the-fly when country filter is active
}

// Utility function to recalculate ranks within a country subset
export function calculateNationalRanks(
  data: RankingData[],
  country: string
): RankingData[] {
  if (!country || country === 'all') {
    return data;
  }

  // Filter by country
  const countryPlayers = data.filter(
    (p) => p.country?.toLowerCase() === country.toLowerCase()
  );

  // Sort by total_points descending
  const sorted = [...countryPlayers].sort((a, b) => b.total_points - a.total_points);

  // Assign national ranks (handling ties with same rank)
  let currentRank = 1;
  let previousPoints = -1;
  
  return sorted.map((player, index) => {
    if (player.total_points !== previousPoints) {
      currentRank = index + 1;
      previousPoints = player.total_points;
    }
    
    return {
      ...player,
      nationalRank: currentRank,
    };
  });
}

// Hook to get national rankings for a specific country
export function useNationalRankings(
  category: string,
  country: string,
  viewMode: 'current' | 'lifetime'
) {
  const currentQuery = useCurrentRankingsByCategory(category);
  const lifetimeQuery = useAllTimeRankingsByCategory(category);
  
  const query = viewMode === 'current' ? currentQuery : lifetimeQuery;
  
  return {
    ...query,
    data: query.data ? calculateNationalRanks(query.data, country) : undefined,
  };
}

export function useCurrentRankings() {
  return useQuery({
    queryKey: ['rankings', 'current'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('current_rankings')
        .select('*')
        .order('category')
        .order('rank')
        .range(0, 9999);
      
      if (error) throw error;
      return data as RankingData[];
    },
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchOnMount: 'always',
  });
}

export function useAllTimeRankings() {
  return useQuery({
    queryKey: ['rankings', 'lifetime'],
    queryFn: async () => {
      const { data: rankings, error: rankingsError } = await supabase
        .from('player_rankings')
        .select('player_id, category, total_points, rank')
        .order('category')
        .order('rank')
        .range(0, 9999);
      
      if (rankingsError) throw rankingsError;
      if (!rankings || rankings.length === 0) return [];

      const playerIds = [...new Set(rankings.map(r => r.player_id))];
      
      // Fetch player details in batches of 100 to avoid URL length limits
      const BATCH_SIZE = 100;
      const allPlayers: any[] = [];
      
      for (let i = 0; i < playerIds.length; i += BATCH_SIZE) {
        const batch = playerIds.slice(i, i + BATCH_SIZE);
        const { data: batchPlayers, error: playersError } = await supabase
          .from('players_public')
          .select('id, name, country, gender')
          .in('id', batch);
        
        if (playersError) throw playersError;
        if (batchPlayers) allPlayers.push(...batchPlayers);
      }
      
      const playerMap = new Map(allPlayers.map(p => [p.id, p]));
      
      return rankings.map(item => {
        const player = playerMap.get(item.player_id);
        return {
          player_id: item.player_id,
          category: item.category,
          name: player?.name || 'Unknown Player',
          country: player?.country || null,
          gender: player?.gender || null,
          total_points: item.total_points,
          rank: item.rank || 999,
        };
      }) as RankingData[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useCurrentRankingsByCategory(category: string) {
  return useQuery({
    queryKey: ['rankings', 'current', category],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('current_rankings')
        .select('*')
        .eq('category', category as any)
        .order('rank')
        .range(0, 9999);
      if (error) throw error;
      return data as RankingData[];
    },
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchOnMount: 'always',
  });
}

export function useAllTimeRankingsByCategory(category: string) {
  return useQuery({
    queryKey: ['rankings', 'lifetime', category],
    queryFn: async () => {
      const { data: rankings, error: rankingsError } = await supabase
        .from('player_rankings')
        .select('player_id, category, total_points, rank')
        .eq('category', category as any)
        .order('rank')
        .range(0, 9999);
      
      if (rankingsError) throw rankingsError;
      if (!rankings || rankings.length === 0) return [];

      const playerIds = [...new Set(rankings.map(r => r.player_id))];
      
      // Fetch player details in batches of 100 to avoid URL length limits
      const BATCH_SIZE = 100;
      const allPlayers: any[] = [];
      
      for (let i = 0; i < playerIds.length; i += BATCH_SIZE) {
        const batch = playerIds.slice(i, i + BATCH_SIZE);
        const { data: batchPlayers, error: playersError } = await supabase
          .from('players_public')
          .select('id, name, country, gender')
          .in('id', batch);
        
        if (playersError) throw playersError;
        if (batchPlayers) allPlayers.push(...batchPlayers);
      }
      
      const playerMap = new Map(allPlayers.map(p => [p.id, p]));
      
      return rankings.map(item => {
        const player = playerMap.get(item.player_id);
        return {
          player_id: item.player_id,
          category: item.category,
          name: player?.name || 'Unknown Player',
          country: player?.country || null,
          gender: player?.gender || null,
          total_points: item.total_points,
          rank: item.rank || 999,
        };
      }) as RankingData[];
    },
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchOnMount: 'always',
  });
}
