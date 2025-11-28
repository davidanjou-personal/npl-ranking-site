import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";

interface CombinedDoublesPlayer {
  player_id: string;
  name: string;
  country: string;
  gender: string;
  gendered_doubles_points: number;
  mixed_doubles_points: number;
  total_doubles_points: number;
  rank: number;
}

export function useCombinedDoublesRankings(gender: "male" | "female") {
  const { currentOrg } = useOrganization();

  return useQuery({
    queryKey: ["combined-doubles-rankings", gender, currentOrg?.id],
    queryFn: async (): Promise<CombinedDoublesPlayer[]> => {
      if (!currentOrg) return [];

      // Determine which categories to sum based on gender
      const genderedDoublesCategory = gender === "male" ? "mens_doubles" : "womens_doubles";
      const mixedDoublesCategory = gender === "male" ? "mens_mixed_doubles" : "womens_mixed_doubles";

      // Fetch all current rankings for the relevant categories
      const { data: rankings, error } = await supabase
        .from("current_rankings")
        .select("player_id, name, country, gender, category, total_points")
        .eq("organization_id", currentOrg.id)
        .in("category", [genderedDoublesCategory, mixedDoublesCategory]);

      if (error) throw error;
      if (!rankings) return [];

      // Group by player and sum points
      const playerMap = new Map<string, CombinedDoublesPlayer>();

      for (const ranking of rankings) {
        if (!ranking.player_id) continue;

        const existing = playerMap.get(ranking.player_id);
        const points = ranking.total_points || 0;

        if (existing) {
          if (ranking.category === genderedDoublesCategory) {
            existing.gendered_doubles_points = points;
          } else {
            existing.mixed_doubles_points = points;
          }
          existing.total_doubles_points = existing.gendered_doubles_points + existing.mixed_doubles_points;
        } else {
          playerMap.set(ranking.player_id, {
            player_id: ranking.player_id,
            name: ranking.name || "Unknown",
            country: ranking.country || "Unknown",
            gender: ranking.gender || gender,
            gendered_doubles_points: ranking.category === genderedDoublesCategory ? points : 0,
            mixed_doubles_points: ranking.category === mixedDoublesCategory ? points : 0,
            total_doubles_points: points,
            rank: 0,
          });
        }
      }

      // Convert to array and sort by total points
      const players = Array.from(playerMap.values())
        .filter(p => p.total_doubles_points > 0)
        .sort((a, b) => b.total_doubles_points - a.total_doubles_points);

      // Assign ranks (handling ties)
      let currentRank = 1;
      let previousPoints = -1;
      let playersAtPreviousRank = 0;

      for (const player of players) {
        if (player.total_doubles_points === previousPoints) {
          player.rank = currentRank;
          playersAtPreviousRank++;
        } else {
          currentRank += playersAtPreviousRank;
          player.rank = currentRank;
          previousPoints = player.total_doubles_points;
          playersAtPreviousRank = 1;
        }
      }

      return players;
    },
    enabled: !!currentOrg,
  });
}
