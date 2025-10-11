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
import { BulkImportMatchesTab } from "@/components/admin/BulkImportMatchesTab";
import { MatchesList } from "@/components/admin/MatchesList";
import { ImportHistoryList } from "@/components/admin/ImportHistoryList";
import type { Player, MatchWithResults } from "@/types/admin";

export default function Admin() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [players, setPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<MatchWithResults[]>([]);
  const [imports, setImports] = useState<any[]>([]);
  const [isRunningCleanup, setIsRunningCleanup] = useState(false);

  useEffect(() => {
    checkAdminAccess();
    fetchPlayers();
    fetchMatches();
    fetchImports();
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

  const fetchImports = async () => {
    const { data } = await supabase
      .from("import_history")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (data) setImports(data);
  };

  const handleRunCleanup = async () => {
    setIsRunningCleanup(true);
    try {
      const { data, error } = await supabase.functions.invoke('bulk-import-rankings', {
        body: { runCleanup: true }
      });
      
      if (error) throw error;
      
      toast({
        title: "Cleanup Completed",
        description: `Successfully linked ${data.updated_matches} matches to imports`,
      });
      await fetchImports();
      await fetchMatches();
    } catch (error) {
      console.error('Cleanup error:', error);
      toast({
        variant: "destructive",
        title: "Cleanup Failed",
        description: "Failed to run cleanup. Please try again.",
      });
    } finally {
      setIsRunningCleanup(false);
    }
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
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 mb-8">
            <TabsTrigger value="add-player">Add Player</TabsTrigger>
            <TabsTrigger value="add-result">Record Match</TabsTrigger>
            <TabsTrigger value="bulk-import-players">Import Players</TabsTrigger>
            <TabsTrigger value="bulk-import-matches">Import Matches</TabsTrigger>
            <TabsTrigger value="view-players">View Players</TabsTrigger>
            <TabsTrigger value="view-matches">View Matches</TabsTrigger>
            <TabsTrigger value="import-history">Import History</TabsTrigger>
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

          <TabsContent value="bulk-import-players">
            <BulkImportTab onImportComplete={fetchPlayers} />
          </TabsContent>

          <TabsContent value="bulk-import-matches">
            <BulkImportMatchesTab 
              onImportComplete={() => {
                fetchPlayers();
                fetchMatches();
              }} 
            />
          </TabsContent>

          <TabsContent value="view-players">
            <PlayersTable players={players} onRefresh={fetchPlayers} />
          </TabsContent>

          <TabsContent value="view-matches">
            <MatchesList matches={matches} onRefresh={fetchMatches} />
          </TabsContent>

          <TabsContent value="import-history">
            <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-2">
                <strong>One-time cleanup required:</strong> Link existing matches to their imports to enable deletion.
              </p>
              <button 
                onClick={handleRunCleanup}
                disabled={isRunningCleanup}
                className="px-4 py-2 bg-background border border-input rounded-md text-sm font-medium hover:bg-accent hover:text-accent-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isRunningCleanup ? 'Running Cleanup...' : 'Run Cleanup Now'}
              </button>
            </div>
            
            <ImportHistoryList 
              imports={imports} 
              onRefresh={() => {
                fetchImports();
                fetchMatches();
                fetchPlayers();
              }} 
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
