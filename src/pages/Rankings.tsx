import { useEffect, useState } from "react";
import { Navigation } from "@/components/Navigation";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Medal, Award } from "lucide-react";

interface PlayerRanking {
  id: string;
  player_id: string;
  category: string;
  total_points: number;
  rank: number;
  players: {
    name: string;
    country: string;
  };
}

const categoryLabels: Record<string, string> = {
  mens_singles: "Men's Singles",
  womens_singles: "Women's Singles",
  mens_doubles: "Men's Doubles",
  womens_doubles: "Women's Doubles",
  mixed_doubles: "Mixed Doubles",
};

const getRankIcon = (rank: number) => {
  if (rank === 1) return <Trophy className="h-6 w-6 text-yellow-500" />;
  if (rank === 2) return <Medal className="h-6 w-6 text-gray-400" />;
  if (rank === 3) return <Award className="h-6 w-6 text-amber-600" />;
  return null;
};

export default function Rankings() {
  const [players, setPlayers] = useState<PlayerRanking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlayers();
  }, []);

  const fetchPlayers = async () => {
    const { data, error } = await supabase
      .from("player_rankings")
      .select(`
        *,
        players (
          name,
          country,
          gender
        )
      `)
      .order("category")
      .order("rank");

    if (!error && data) {
      setPlayers(data as PlayerRanking[]);
    }
    setLoading(false);
  };

  const getPlayersByCategory = (category: string) => {
    return players.filter((p) => p.category === category);
  };

  const PlayerRow = ({ player }: { player: PlayerRanking }) => (
    <div
      className="flex items-center gap-4 p-4 rounded-lg transition-all hover:shadow-[var(--shadow-hover)]"
      style={{ 
        background: "var(--gradient-card)",
        boxShadow: "var(--shadow-card)"
      }}
    >
      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary font-bold text-xl">
        {getRankIcon(player.rank) || `#${player.rank}`}
      </div>
      
      <div className="flex-1">
        <h3 className="text-lg font-bold text-foreground">{player.players.name}</h3>
        <p className="text-sm text-muted-foreground">{player.players.country}</p>
      </div>
      
      <div className="text-right">
        <p className="text-2xl font-bold text-secondary">{player.total_points}</p>
        <p className="text-xs text-muted-foreground">points</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div 
        className="py-16 px-4"
        style={{ background: "var(--gradient-hero)" }}
      >
        <div className="container mx-auto text-center">
          <h1 className="text-5xl font-bold text-primary-foreground mb-4">
            World Rankings
          </h1>
          <p className="text-xl text-primary-foreground/90">
            Official Pickleball Player Rankings Across All Categories
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading rankings...</p>
          </div>
        ) : (
          <Tabs defaultValue="mens_singles" className="w-full">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 mb-8 h-auto">
              {Object.entries(categoryLabels).map(([key, label]) => (
                <TabsTrigger key={key} value={key} className="text-xs md:text-sm">
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>

            {Object.entries(categoryLabels).map(([key]) => (
              <TabsContent key={key} value={key}>
                <div className="space-y-4">
                  {getPlayersByCategory(key).length > 0 ? (
                    getPlayersByCategory(key).map((player) => (
                      <PlayerRow key={player.id} player={player} />
                    ))
                  ) : (
                    <Card className="p-8 text-center">
                      <p className="text-muted-foreground">No players ranked in this category yet.</p>
                    </Card>
                  )}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        )}
      </div>
    </div>
  );
}
