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
  players?: {
    name?: string;
    country?: string;
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
  const [viewMode, setViewMode] = useState<'current' | 'lifetime'>('current');

  useEffect(() => {
    fetchPlayers();
  }, [viewMode]);

  const fetchPlayers = async () => {
    if (viewMode === 'current') {
      // Fetch from active_player_rankings view
      const { data, error } = await supabase
        .from('active_player_rankings' as any)
        .select('*')
        .order("category")
        .order("rank");

      if (!error && data) {
        // Fetch player details separately
        const playerIds = [...new Set(data.map((d: any) => d.player_id))];
        const { data: playersData } = await supabase
          .from('players')
          .select('id, name, country')
          .in('id', playerIds);

        const playersMap = new Map(playersData?.map(p => [p.id, p]) || []);
        
        const enrichedData = data.map((item: any) => ({
          ...item,
          players: playersMap.get(item.player_id),
        }));
        
        setPlayers(enrichedData as PlayerRanking[]);
      }
    } else {
      // Fetch from player_rankings table
      const { data, error } = await supabase
        .from('player_rankings')
        .select(`
          *,
          players (
            name,
            country
          )
        `)
        .order("category")
        .order("rank");

      if (!error && data) {
        setPlayers(data as any);
      }
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
        <h3 className="text-lg font-bold text-foreground">{player.players?.name ?? 'Unknown Player'}</h3>
        <p className="text-sm text-muted-foreground">{player.players?.country ?? 'Unknown'}</p>
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
            NPL Rankings
          </h1>
          <p className="text-xl text-primary-foreground/90">
            Official National Pickleball League Player Rankings
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="flex justify-center mb-8">
          <div className="inline-flex rounded-lg border bg-muted p-1">
            <button
              onClick={() => setViewMode('current')}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'current'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Current (12-month)
            </button>
            <button
              onClick={() => setViewMode('lifetime')}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'lifetime'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              All-Time
            </button>
          </div>
        </div>

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
