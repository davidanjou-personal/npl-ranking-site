import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";

export interface UpcomingTournament {
  id: string;
  tournament_name: string;
  tournament_date: string;
  registration_url: string;
  location?: string;
  description?: string;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

export const useUpcomingTournaments = () => {
  const { currentOrg } = useOrganization();
  
  return useQuery({
    queryKey: ["upcoming-tournaments", currentOrg?.id],
    queryFn: async () => {
      if (!currentOrg) return [];
      
      const { data, error } = await supabase
        .from("upcoming_tournaments")
        .select("*")
        .eq("organization_id", currentOrg.id)
        .gte("tournament_date", new Date().toISOString().split('T')[0])
        .order("tournament_date", { ascending: true })
        .order("is_featured", { ascending: false });

      if (error) throw error;
      return data as UpcomingTournament[];
    },
    enabled: !!currentOrg,
  });
};
