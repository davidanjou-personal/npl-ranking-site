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
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [loadingPage, setLoadingPage] = useState(false);
  

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

  const PAGE_SIZE = 1000;

  const fetchPlayersPage = async (pageNum: number) => {
    setLoadingPage(true);
    const { data, count } = await supabase
      .from("players")
      .select("*", { count: "exact" })
      .order("name")
      .range(pageNum * PAGE_SIZE, (pageNum + 1) * PAGE_SIZE - 1);
    
    if (data) {
      if (pageNum === 0) {
        setPlayers(data as Player[]);
      } else {
        setPlayers(prev => [...prev, ...data as Player[]]);
      }
      setTotalCount(count);
    }
    setLoadingPage(false);
  };

  const fetchPlayers = () => fetchPlayersPage(0);

  const loadMorePlayers = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchPlayersPage(nextPage);
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
            <div className="mt-4 flex items-center justify-between border-t pt-4">
              <p className="text-sm text-muted-foreground">
                Loaded {players.length} of {totalCount ?? "..."} players
              </p>
              {totalCount && players.length < totalCount && (
                <button
                  onClick={loadMorePlayers}
                  disabled={loadingPage}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
                >
                  {loadingPage ? "Loading..." : "Load More"}
                </button>
              )}
            </div>
          </TabsContent>

          <TabsContent value="view-matches">
            <MatchesList matches={matches} onRefresh={fetchMatches} />
          </TabsContent>

          <TabsContent value="import-history">
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
