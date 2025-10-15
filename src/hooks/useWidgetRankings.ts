import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";

// Map display keys to actual backend categories
const categoryMapping: Record<string, { category: string; gender?: string }> = {
  mens_singles: { category: "mens_singles" },
  womens_singles: { category: "womens_singles" },
  mens_doubles: { category: "mens_doubles" },
  womens_doubles: { category: "womens_doubles" },
  mens_mixed_doubles: { category: "mens_mixed_doubles" },
  womens_mixed_doubles: { category: "womens_mixed_doubles" },
};

export const useWidgetRankings = (
  category: string,
  country: string = "Australia",
  limit: number = 10
) => {
  const { currentOrg } = useOrganization();
  
  return useQuery({
    queryKey: ["widget-rankings", category, country, limit, currentOrg?.id],
    queryFn: async () => {
      if (!currentOrg) return [];
      
      const mapping = categoryMapping[category] || { category };
      
      let query = supabase
        .from("current_rankings")
        .select("*")
        .eq("category", mapping.category as any)
        .eq("organization_id", currentOrg.id)
        .eq("country", country);
      
      // Gender filter no longer needed - categories are gender-specific
      
      const { data, error } = await query
        .order("rank")
        .limit(limit);

      if (error) throw error;
      return data || [];
    },
    enabled: !!currentOrg,
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refresh every minute
  });
};
