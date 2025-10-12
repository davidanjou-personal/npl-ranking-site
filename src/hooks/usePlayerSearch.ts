import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";

export const usePlayerSearch = (searchTerm: string, enabled: boolean = true) => {
  const [debouncedSearch, setDebouncedSearch] = useState(searchTerm);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  return useQuery({
    queryKey: ["player-search", debouncedSearch],
    queryFn: async () => {
      if (!debouncedSearch.trim()) {
        // Return top players by points if no search term
        const { data, error } = await supabase
          .from("current_rankings")
          .select("player_id, name, country, total_points, rank, category")
          .order("total_points", { ascending: false })
          .limit(50);

        if (error) throw error;
        
        // Get unique players (they appear once per category)
        const uniquePlayers = new Map();
        data?.forEach(player => {
          if (!uniquePlayers.has(player.player_id)) {
            uniquePlayers.set(player.player_id, player);
          }
        });
        
        return Array.from(uniquePlayers.values());
      }

      const { data, error } = await supabase
        .from("players_public")
        .select(`
          *,
          current_rankings:current_rankings(rank, total_points, category)
        `)
        .or(`name.ilike.%${debouncedSearch}%,country.ilike.%${debouncedSearch}%,player_code.ilike.%${debouncedSearch}%`)
        .limit(50);

      if (error) throw error;
      return data || [];
    },
    enabled: enabled,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};
