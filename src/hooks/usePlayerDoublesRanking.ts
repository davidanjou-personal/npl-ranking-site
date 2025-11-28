import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type DoublesCategory = "mens_doubles" | "womens_doubles" | "mixed_doubles";

interface PlayerDoublesRanking {
  points: number;
  rank: number;
}

export const usePlayerDoublesRanking = (
  playerId: string | null,
  category: DoublesCategory
) => {
  return useQuery({
    queryKey: ["player-doubles-ranking", playerId, category],
    queryFn: async (): Promise<PlayerDoublesRanking | null> => {
      if (!playerId) return null;

      // For mixed doubles, we need to check both mens_mixed_doubles and womens_mixed_doubles
      // based on the player's gender
      let categoryToQuery = category;
      
      if (category === "mixed_doubles") {
        // First get player's gender
        const { data: playerData } = await supabase
          .from("players_public")
          .select("gender")
          .eq("id", playerId)
          .maybeSingle();
        
        if (playerData?.gender === "male") {
          categoryToQuery = "mens_mixed_doubles" as DoublesCategory;
        } else {
          categoryToQuery = "womens_mixed_doubles" as DoublesCategory;
        }
      }

      const { data, error } = await supabase
        .from("current_rankings")
        .select("total_points, rank")
        .eq("player_id", playerId)
        .eq("category", categoryToQuery)
        .maybeSingle();

      if (error) throw error;

      return {
        points: data?.total_points ?? 0,
        rank: data?.rank ?? 0,
      };
    },
    enabled: !!playerId,
  });
};
