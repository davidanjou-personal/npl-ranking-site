import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { z } from "zod";
import { Plus, Trash2 } from "lucide-react";

const playerSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  country: z.string().min(1, "Country is required").max(100),
  gender: z.enum(["male", "female"]),
  player_code: z.string().optional(),
});

const matchSchema = z.object({
  tournament_name: z.string().min(1, "Tournament name is required").max(200),
  match_date: z.string().min(1, "Date is required"),
  tier: z.enum(["tier1", "tier2", "tier3", "tier4"]),
  category: z.enum(["mens_singles", "womens_singles", "mens_doubles", "womens_doubles", "mixed_doubles"]),
  results: z.array(z.object({
    player_id: z.string().uuid(),
    finishing_position: z.enum(["winner", "second", "third", "fourth", "quarterfinalist", "round_of_16", "event_win"])
  })).min(1, "At least one result is required")
});

export default function Admin() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [players, setPlayers] = useState<any[]>([]);
  const [playerResultCount, setPlayerResultCount] = useState(8);
  const [matches, setMatches] = useState<any[]>([]);

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
    
    if (data) setPlayers(data);
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
      .order("match_date", { ascending: false });
    
    if (data) setMatches(data);
  };

  const handleAddPlayer = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const playerData = {
      name: formData.get("name") as string,
      country: formData.get("country") as string,
      gender: formData.get("gender") as "male" | "female",
      player_code: formData.get("player_code") as string || null,
    };

    const validation = playerSchema.safeParse(playerData);
    if (!validation.success) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: validation.error.errors[0].message,
      });
      return;
    }

    const { error } = await supabase.from("players").insert([playerData]);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } else {
      toast({
        title: "Success",
        description: "Player added successfully!",
      });
      fetchPlayers();
      e.currentTarget.reset();
    }
  };

  const handleAddMatchResult = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    // Parse player results
    const results = [];
    const playerIds = formData.getAll('player_id');
    const positions = formData.getAll('finishing_position');
    
    for (let i = 0; i < playerIds.length; i++) {
      if (playerIds[i] && positions[i]) {
        results.push({
          player_id: playerIds[i] as string,
          finishing_position: positions[i] as string,
        });
      }
    }

    const matchData = {
      tournament_name: formData.get("tournament") as string,
      match_date: formData.get("date") as string,
      tier: formData.get("tier") as "tier1" | "tier2" | "tier3" | "tier4",
      category: formData.get("matchCategory") as "mens_singles" | "womens_singles" | "mens_doubles" | "womens_doubles" | "mixed_doubles",
      results,
    };

    const validation = matchSchema.safeParse(matchData);
    if (!validation.success) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: validation.error.errors[0].message,
      });
      return;
    }

    const { data: matchInsert, error: matchError } = await supabase
      .from("matches")
      .insert([{
        tournament_name: matchData.tournament_name,
        match_date: matchData.match_date,
        tier: matchData.tier,
        category: matchData.category,
      }])
      .select()
      .single();

    if (matchError || !matchInsert) {
      toast({
        variant: "destructive",
        title: "Error",
        description: matchError?.message || "Failed to create match",
      });
      return;
    }

    const matchResults = results.map(result => ({
      match_id: matchInsert.id,
      player_id: result.player_id,
      finishing_position: result.finishing_position,
    }));

    const { error: resultsError } = await supabase
      .from("match_results")
      .insert(matchResults);

    if (resultsError) {
      toast({
        variant: "destructive",
        title: "Error",
        description: resultsError.message,
      });
    } else {
      toast({
        title: "Success",
        description: "Match result recorded and rankings updated!",
      });
      e.currentTarget.reset();
      setPlayerResultCount(8);
      fetchPlayers();
      fetchMatches();
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
          <TabsList className="grid w-full grid-cols-1 sm:grid-cols-4 mb-8">
            <TabsTrigger value="add-player">Add Player</TabsTrigger>
            <TabsTrigger value="add-result">Record Match Result</TabsTrigger>
            <TabsTrigger value="bulk-import">Bulk Import</TabsTrigger>
            <TabsTrigger value="view-matches">View Matches</TabsTrigger>
          </TabsList>

          <TabsContent value="add-player">
            <Card>
              <CardHeader>
                <CardTitle>Add New Player</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddPlayer} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Player Name</Label>
                    <Input id="name" name="name" required maxLength={100} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Input id="country" name="country" required maxLength={100} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender</Label>
                    <Select name="gender" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="player_code">Player Code (Optional)</Label>
                    <Input id="player_code" name="player_code" maxLength={50} placeholder="e.g., NPL001" />
                    <p className="text-xs text-muted-foreground">Unique identifier for bulk imports</p>
                  </div>

                  <Button type="submit" className="w-full">Add Player</Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="add-result">
            <Card>
              <CardHeader>
                <CardTitle>Record Match Result</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddMatchResult} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="tournament">Tournament Name</Label>
                    <Input id="tournament" name="tournament" required maxLength={200} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="date">Match Date</Label>
                    <Input id="date" name="date" type="date" required />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tier">Tournament Tier</Label>
                    <Select name="tier" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select tier" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tier1">Tier 1 (1000 points)</SelectItem>
                        <SelectItem value="tier2">Tier 2 (500 points)</SelectItem>
                        <SelectItem value="tier3">Tier 3 (250 points)</SelectItem>
                        <SelectItem value="tier4">Tier 4 (100 points)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="matchCategory">Category</Label>
                    <Select name="matchCategory" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mens_singles">Men's Singles</SelectItem>
                        <SelectItem value="womens_singles">Women's Singles</SelectItem>
                        <SelectItem value="mens_doubles">Men's Doubles</SelectItem>
                        <SelectItem value="womens_doubles">Women's Doubles</SelectItem>
                        <SelectItem value="mixed_doubles">Mixed Doubles</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Player Results</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setPlayerResultCount(prev => prev + 1)}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Player
                      </Button>
                    </div>
                    {Array.from({ length: playerResultCount }, (_, i) => i + 1).map((index) => (
                      <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 border rounded-lg bg-muted/20 relative">
                        {index > 8 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full"
                            onClick={() => setPlayerResultCount(prev => Math.max(8, prev - 1))}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                        <div className="space-y-2">
                          <Label className="text-sm">Player {index}</Label>
                          <Select name="player_id">
                            <SelectTrigger>
                              <SelectValue placeholder="Select player (optional)" />
                            </SelectTrigger>
                            <SelectContent>
                              {players.map((player) => (
                                <SelectItem key={player.id} value={player.id}>
                                  {player.name} ({player.country})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm">Position</Label>
                          <Select name="finishing_position">
                            <SelectTrigger>
                              <SelectValue placeholder="Select position (optional)" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="winner">Winner (100%)</SelectItem>
                              <SelectItem value="second">2nd Place (80%)</SelectItem>
                              <SelectItem value="third">3rd Place (60%)</SelectItem>
                              <SelectItem value="fourth">4th Place (40%)</SelectItem>
                              <SelectItem value="quarterfinalist">Quarterfinalist (25%)</SelectItem>
                              <SelectItem value="round_of_16">Round of 16 (15%)</SelectItem>
                              <SelectItem value="event_win">Event Win - min 1 match (5%)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Button type="submit" className="w-full">Record Result</Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bulk-import">
            <Card>
              <CardHeader>
                <CardTitle>Bulk Import Rankings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="rounded-lg border bg-muted/30 p-4">
                    <h3 className="font-semibold mb-2">CSV Format Required:</h3>
                    <pre className="text-xs bg-background p-3 rounded overflow-x-auto">
player_code,player_name,country,gender,category,points,event_date
NPL001,John Doe,AUS,male,mens_singles,1000,2025-01-15
NPL002,Jane Smith,AUS,female,womens_singles,800,2025-01-15
                    </pre>
                    <ul className="text-sm space-y-1 mt-3 text-muted-foreground">
                      <li>• <strong>player_code</strong>: Unique identifier (will create or match existing players)</li>
                      <li>• <strong>category</strong>: mens_singles, womens_singles, mens_doubles, womens_doubles, mixed_doubles</li>
                      <li>• <strong>gender</strong>: male or female</li>
                      <li>• <strong>event_date</strong>: YYYY-MM-DD format (for 12-month rolling points)</li>
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bulk-file">Upload CSV File</Label>
                    <Input 
                      id="bulk-file" 
                      type="file" 
                      accept=".csv,.xlsx,.xls"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;

                        const formData = new FormData();
                        formData.append('file', file);

                        toast({
                          title: "Processing...",
                          description: "Importing data, please wait...",
                        });

                        try {
                          const { data, error } = await supabase.functions.invoke('bulk-import-rankings', {
                            body: formData,
                          });

                          if (error) throw error;

                          toast({
                            title: "Import Complete",
                            description: `Successfully imported ${data.successful} records. ${data.failed} failed.`,
                          });

                          fetchPlayers();
                          fetchMatches();
                        } catch (error: any) {
                          toast({
                            variant: "destructive",
                            title: "Import Failed",
                            description: error.message || "Failed to import data",
                          });
                        }

                        e.target.value = '';
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="view-matches">
            <Card>
              <CardHeader>
                <CardTitle>Match Results History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {matches.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No matches recorded yet.</p>
                  ) : (
                    matches.map((match) => (
                      <div key={match.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-bold text-lg">{match.tournament_name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {new Date(match.match_date).toLocaleDateString()} • {match.category.replace('_', ' ')} • {match.tier.toUpperCase()}
                            </p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm">Results:</Label>
                          {match.match_results?.map((result: any) => (
                            <div key={result.id} className="flex justify-between items-center text-sm bg-muted/30 p-2 rounded">
                              <span>{result.players?.name} ({result.players?.country})</span>
                              <span className="font-medium">{result.finishing_position.replace('_', ' ')} - {result.points_awarded} pts</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
