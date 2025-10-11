import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlayersTable } from "@/components/admin/PlayersTable";
import { AddPlayerForm } from "@/components/admin/AddPlayerForm";
import { AddMatchResultForm } from "@/components/admin/AddMatchResultForm";
import { BulkImportTab } from "@/components/admin/BulkImportTab";
import { MatchesList } from "@/components/admin/MatchesList";
import type { Player, MatchWithResults } from "@/types/admin";

export default function Admin() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [players, setPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<MatchWithResults[]>([]);

  useEffect(() => {
    checkAdminAccess();
    fetchPlayers();
    fetchMatches();
  }, []);

  const checkAdminAccess = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/auth");
      return;
    }

    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!data) {
      toast({
        variant: "destructive",
        title: "Access Denied",
        description: "You do not have admin privileges.",
      });
      navigate("/");
    } else {
      setIsAdmin(true);
    }
    setLoading(false);
  };

  const fetchPlayers = async () => {
    const { data } = await supabase
      .from("players")
      .select("*")
      .order("name");
    
    if (data) setPlayers(data as Player[]);
  };

  const fetchMatches = async () => {
    const { data } = await supabase
      .from("matches")
      .select(`
        *,
        match_results (
          *,
          players (
            name,
            country
          )
        )
      `)
      .order("match_date", { ascending: false })
      .limit(50);
    
    if (data) setMatches(data as MatchWithResults[]);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-12 text-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8 text-foreground">Admin Dashboard</h1>

        <Tabs defaultValue="add-player" className="w-full">
          <TabsList className="grid w-full grid-cols-1 sm:grid-cols-5 mb-8">
            <TabsTrigger value="add-player">Add Player</TabsTrigger>
            <TabsTrigger value="add-result">Record Match Result</TabsTrigger>
            <TabsTrigger value="bulk-import">Bulk Import</TabsTrigger>
            <TabsTrigger value="view-players">View Players</TabsTrigger>
            <TabsTrigger value="view-matches">View Matches</TabsTrigger>
          </TabsList>

          <TabsContent value="add-player">
            <AddPlayerForm onPlayerAdded={fetchPlayers} />
          </TabsContent>

          <TabsContent value="add-result">
            <AddMatchResultForm 
              players={players} 
              onMatchAdded={() => {
                fetchPlayers();
                fetchMatches();
              }} 
            />
          </TabsContent>

          <TabsContent value="bulk-import">
            <BulkImportTab onImportComplete={fetchPlayers} />
          </TabsContent>

          <TabsContent value="view-players">
            <PlayersTable players={players} onRefresh={fetchPlayers} />
          </TabsContent>

          <TabsContent value="view-matches">
            <MatchesList matches={matches} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
