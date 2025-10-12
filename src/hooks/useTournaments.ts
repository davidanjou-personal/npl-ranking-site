import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface TournamentFilters {
  category?: string;
  tier?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
}

export const useTournaments = (filters: TournamentFilters = {}) => {
  return useQuery({
    queryKey: ["tournaments", filters],
    queryFn: async () => {
      let query = supabase
        .from("events")
        .select("*")
        .order("match_date", { ascending: false });

      if (filters.category) {
        query = query.eq("category", filters.category as any);
      }
      if (filters.tier) {
        query = query.eq("tier", filters.tier as any);
      }
      if (filters.startDate) {
        query = query.gte("match_date", filters.startDate);
      }
      if (filters.endDate) {
        query = query.lte("match_date", filters.endDate);
      }
      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useTournamentDetail = (eventId: string) => {
  return useQuery({
    queryKey: ["tournament", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select(`
          *,
          event_results (
            *,
            players:player_id (
              id,
              name,
              country,
              avatar_url,
              player_code
            )
          )
        `)
        .eq("id", eventId)
        .single();

      if (error) throw error;
      return data;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};
