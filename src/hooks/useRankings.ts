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
        .order('rank');
      
      if (error) throw error;
      return data as RankingData[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useAllTimeRankings() {
  return useQuery({
    queryKey: ['rankings', 'lifetime'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('player_rankings')
        .select(`
          player_id,
          category,
          total_points,
          rank,
          players:players!player_rankings_player_id_fkey (
            name,
            country,
            gender
          )
        `)
        .order('category')
        .order('rank');
      
      if (error) throw error;
      
      // Transform to match RankingData interface
      return (data || []).map(item => ({
        player_id: item.player_id,
        category: item.category,
        name: item.players?.name || 'Unknown Player',
        country: item.players?.country || null,
        gender: item.players?.gender || null,
        total_points: item.total_points,
        rank: item.rank || 999,
      })) as RankingData[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
