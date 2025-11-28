import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";

export const usePlayerSearch = (searchTerm: string, enabled: boolean = true, genderFilter?: string) => {
  const [debouncedSearch, setDebouncedSearch] = useState(searchTerm);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  return useQuery({
    queryKey: ["player-search", debouncedSearch, genderFilter],
    queryFn: async () => {
      if (!debouncedSearch.trim()) {
        // Return top players by points if no search term
        let query = supabase
          .from("current_rankings")
          .select("player_id, name, country, gender, total_points, rank, category")
          .order("total_points", { ascending: false })
          .limit(100);

        if (genderFilter) {
          query = query.eq("gender", genderFilter);
        }

        const { data, error } = await query;

        if (error) throw error;
        
        // Get unique players (they appear once per category)
        const uniquePlayers = new Map();
        data?.forEach(player => {
          if (!uniquePlayers.has(player.player_id)) {
            uniquePlayers.set(player.player_id, player);
          }
        });
        
        return Array.from(uniquePlayers.values()).slice(0, 50);
      }

      let query = supabase
        .from("players_public")
        .select("*")
        .or(`name.ilike.%${debouncedSearch}%,country.ilike.%${debouncedSearch}%,player_code.ilike.%${debouncedSearch}%`)
        .limit(50);

      if (genderFilter) {
        query = query.eq("gender", genderFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    },
    enabled: enabled,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};
