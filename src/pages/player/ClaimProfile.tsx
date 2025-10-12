import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Search, Trophy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Player {
  id: string;
  name: string;
  country: string;
  player_code: string;
  avatar_url: string | null;
  gender: string;
}

export default function ClaimProfile() {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Player[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [claimMessage, setClaimMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .rpc('get_players_public')
        .or(`name.ilike.%${searchTerm}%,country.ilike.%${searchTerm}%,player_code.ilike.%${searchTerm}%`)
        .limit(10);

      if (error) throw error;
      setSearchResults(data || []);
    } catch (error) {
      console.error("Search error:", error);
      toast({
        title: "Search failed",
        description: "Could not search for players. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClaimSubmit = async () => {
    if (!selectedPlayer) return;

    setLoading(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) {
        toast({
          title: "Not authenticated",
          description: "Please log in to claim a profile.",
          variant: "destructive",
        });
        navigate("/auth");
        return;
      }

      // Check if player is already claimed
      const { data: existingAccount } = await supabase
        .from("player_accounts")
        .select("*")
        .eq("player_id", selectedPlayer.id)
        .single();

      if (existingAccount) {
        toast({
          title: "Already claimed",
          description: "This profile has already been claimed by another user.",
          variant: "destructive",
        });
        return;
      }

      // Check if user already has a pending claim for this player
      const { data: existingClaim } = await supabase
        .from("player_claims")
        .select("*")
        .eq("user_id", session.session.user.id)
        .eq("player_id", selectedPlayer.id)
        .eq("status", "pending")
        .single();

      if (existingClaim) {
        toast({
          title: "Claim pending",
          description: "You already have a pending claim for this profile.",
        });
        return;
      }

      // Create claim
      const { error: claimError } = await supabase
        .from("player_claims")
        .insert({
          user_id: session.session.user.id,
          player_id: selectedPlayer.id,
          claim_message: claimMessage,
          status: "pending",
        });

      if (claimError) throw claimError;

      toast({
        title: "Claim submitted",
        description: "Your claim has been submitted for admin review.",
      });
      
      navigate("/player/profile");
    } catch (error) {
      console.error("Claim error:", error);
      toast({
        title: "Claim failed",
        description: "Could not submit claim. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container max-w-4xl mx-auto py-12 px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Claim Your Player Profile</h1>
          <p className="text-muted-foreground">
            Search for your profile and submit a claim request. An admin will review and approve it.
          </p>
        </div>

        {!selectedPlayer ? (
          <Card>
            <CardHeader>
              <CardTitle>Search for Your Profile</CardTitle>
              <CardDescription>
                Search by name, country, or player code
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-6">
                <Input
                  placeholder="Search players..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                />
                <Button onClick={handleSearch} disabled={loading}>
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
              </div>

              {searchResults.length > 0 && (
                <div className="space-y-4">
                  {searchResults.map((player) => (
                    <Card key={player.id} className="cursor-pointer hover:border-primary transition-colors" onClick={() => setSelectedPlayer(player)}>
                      <CardContent className="flex items-center gap-4 p-4">
                        <Avatar className="h-16 w-16">
                          <AvatarImage src={player.avatar_url || ""} />
                          <AvatarFallback>{player.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{player.name}</h3>
                          <p className="text-sm text-muted-foreground">{player.country}</p>
                          <Badge variant="outline" className="mt-1">{player.player_code}</Badge>
                        </div>
                        <Button variant="outline" size="sm">
                          Select
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {searchResults.length === 0 && searchTerm && !loading && (
                <p className="text-center text-muted-foreground py-8">
                  No players found. Try a different search term.
                </p>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Confirm Your Claim</CardTitle>
              <CardDescription>
                Review the profile details and submit your claim
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={selectedPlayer.avatar_url || ""} />
                  <AvatarFallback>{selectedPlayer.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-xl">{selectedPlayer.name}</h3>
                  <p className="text-muted-foreground">{selectedPlayer.country}</p>
                  <Badge variant="outline" className="mt-1">{selectedPlayer.player_code}</Badge>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Message to Admin (Optional)
                </label>
                <Textarea
                  placeholder="Add any information that can help verify your identity..."
                  value={claimMessage}
                  onChange={(e) => setClaimMessage(e.target.value)}
                  rows={4}
                />
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setSelectedPlayer(null)}
                  disabled={loading}
                >
                  Back to Search
                </Button>
                <Button
                  onClick={handleClaimSubmit}
                  disabled={loading}
                  className="flex-1"
                >
                  <Trophy className="h-4 w-4 mr-2" />
                  Submit Claim
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
