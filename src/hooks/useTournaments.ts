import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface TournamentFilters {
  category?: string;
  tier?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
}

interface GroupedTournament {
  tournament_name: string;
  match_date: string;
  tier: string;
  categories: string[];
  event_count: number;
  earliest_event_id: string;
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

      const { data, error } = await query;
      if (error) throw error;
      
      // Group events by tournament name and date
      const groupedMap = new Map<string, GroupedTournament>();
      
      (data || []).forEach((event) => {
        const key = `${event.tournament_name}-${event.match_date}`;
        
        if (!groupedMap.has(key)) {
          groupedMap.set(key, {
            tournament_name: event.tournament_name,
            match_date: event.match_date,
            tier: event.tier,
            categories: [event.category],
            event_count: 1,
            earliest_event_id: event.id,
          });
        } else {
          const existing = groupedMap.get(key)!;
          existing.categories.push(event.category);
          existing.event_count++;
        }
      });

      const grouped = Array.from(groupedMap.values());
      
      if (filters.limit) {
        return grouped.slice(0, filters.limit);
      }
      
      return grouped;
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
