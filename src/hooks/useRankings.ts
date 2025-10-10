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
