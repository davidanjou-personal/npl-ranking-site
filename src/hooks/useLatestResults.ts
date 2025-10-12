import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useLatestResults = (limit: number = 5) => {
  return useQuery({
    queryKey: ["latest-results", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select(`
          *,
          event_results (
            finishing_position,
            points_awarded,
            players:player_id (
              id,
              name,
              country,
              avatar_url
            )
          )
        `)
        .gte("match_date", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order("match_date", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
