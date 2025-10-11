import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface RankingHistory {
  id: string;
  player_id: string;
  category: string;
  old_rank: number | null;
  new_rank: number;
  old_points: number | null;
  new_points: number;
  change_date: string;
}

export function useRankingHistory(playerId?: string, category?: string) {
  return useQuery({
    queryKey: ["ranking-history", playerId, category],
    queryFn: async () => {
      let query = supabase
        .from("ranking_history" as any)
        .select("*")
        .order("change_date", { ascending: false });

      if (playerId) {
        query = query.eq("player_id", playerId);
      }

      if (category) {
        query = query.eq("category", category);
      }

      const { data, error } = await query.limit(50);

      if (error) throw error;
      return ((data || []) as unknown) as RankingHistory[];
    },
    enabled: !!playerId || !!category,
  });
}

export function useLatestRankingChange(playerId: string, category: string) {
  return useQuery({
    queryKey: ["latest-ranking-change", playerId, category],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ranking_history" as any)
        .select("*")
        .eq("player_id", playerId)
        .eq("category", category)
        .order("change_date", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return ((data || null) as unknown) as RankingHistory | null;
    },
    enabled: !!playerId && !!category,
  });
}
