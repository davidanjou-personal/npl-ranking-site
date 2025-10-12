import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useAdminStats = () => {
  return useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      // Get overall stats
      const { data: stats, error: statsError } = await supabase
        .rpc("get_admin_stats" as any)
        .single();

      // Fallback if function doesn't exist - query manually
      if (statsError) {
        const [playersRes, eventsRes, recentEventsRes, recentPlayersRes] = await Promise.all([
          supabase.from("players").select("id", { count: "exact", head: true }),
          supabase.from("events").select("id", { count: "exact", head: true }),
          supabase.from("events").select("id", { count: "exact", head: true }).gte("match_date", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
          supabase.from("players").select("id", { count: "exact", head: true }).gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
        ]);

        const countryStats = await supabase
          .from("players")
          .select("country")
          .order("country");

        const countryCounts = countryStats.data?.reduce((acc: any, player) => {
          acc[player.country] = (acc[player.country] || 0) + 1;
          return acc;
        }, {});

        const topCountries = Object.entries(countryCounts || {})
          .map(([country, count]) => ({ country, count: count as number }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10);

        const categoryStats = await supabase
          .from("events")
          .select("category");

        const categoryCounts = categoryStats.data?.reduce((acc: any, event) => {
          acc[event.category] = (acc[event.category] || 0) + 1;
          return acc;
        }, {});

        return {
          totalPlayers: playersRes.count || 0,
          totalEvents: eventsRes.count || 0,
          eventsThisMonth: recentEventsRes.count || 0,
          newPlayersThisMonth: recentPlayersRes.count || 0,
          topCountries,
          categoryDistribution: Object.entries(categoryCounts || {}).map(([category, count]) => ({
            category,
            count: count as number,
          })),
        };
      }

      return stats;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
