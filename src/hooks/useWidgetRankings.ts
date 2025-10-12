import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useWidgetRankings = (
  category: string,
  country: string = "Australia",
  limit: number = 10
) => {
  return useQuery({
    queryKey: ["widget-rankings", category, country, limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("current_rankings")
        .select("*")
        .eq("category", category as any)
        .eq("country", country)
        .order("rank")
        .limit(limit);

      if (error) throw error;
      return data || [];
    },
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refresh every minute
  });
};
