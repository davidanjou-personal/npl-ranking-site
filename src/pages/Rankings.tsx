import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Award, Filter } from "lucide-react";

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
  const [selectedCountry, setSelectedCountry] = useState<string>("all");

  useEffect(() => {
    fetchPlayers();
  }, [viewMode]);

  // Reset filters when switching views to avoid stale country limiting results
  useEffect(() => {
    setSelectedCountry('all');
  }, [viewMode]);

  const fetchPlayers = async () => {
    setLoading(true);
    
    if (viewMode === 'current') {
      // Compute CURRENT (last 12 months) directly from match_results
      const cutoff = new Date();
      cutoff.setMonth(cutoff.getMonth() - 12);
      const cutoffStr = cutoff.toISOString().slice(0, 10);

      // Fetch ALL match results in batches to avoid pagination limits
      let allData: any[] = [];
      let from = 0;
      const batchSize = 1000;
      
      while (true) {
        const { data, error } = await supabase
          .from('match_results')
          .select(`
            player_id,
            points_awarded,
            matches!inner(match_date,category),
            players:players!match_results_player_id_fkey (
              name,
              country
            )
          `)
          .gte('matches.match_date', cutoffStr)
          .range(from, from + batchSize - 1);

        if (error) {
          console.error('Error fetching current rankings:', error);
          break;
        }
        
        if (!data || data.length === 0) break;
        
        allData = [...allData, ...data];
        console.log(`Fetched batch: ${from}-${from + data.length - 1}, total: ${allData.length}`);
        
        if (data.length < batchSize) break;
        from += batchSize;
      }

      console.log(`Total match results for current view: ${allData.length}`);

      type Row = {
          player_id: string;
          points_awarded: number;
          matches: { match_date: string; category: string } | null;
          players: { name?: string; country?: string } | null;
        };
      
      const totals = new Map<string, { 
        player_id: string; 
        category: string; 
        total_points: number; 
        players?: { name?: string; country?: string } 
      }>();
      
      (allData as Row[]).forEach((r) => {
          const category = r.matches?.category;
          if (!category) return;
          const key = `${r.player_id}|${category}`;
          const prev = totals.get(key);
          const pts = Number(r.points_awarded) || 0;
          if (prev) {
            prev.total_points += pts;
          } else {
            totals.set(key, {
              player_id: r.player_id,
              category,
              total_points: pts,
              players: r.players || undefined,
          });
        }
      });

      console.log(`Aggregated ${totals.size} unique player-category combinations`);

      const all: PlayerRanking[] = [];
      const byCategory: Record<string, PlayerRanking[]> = {};
      totals.forEach((val) => {
        const id = `${val.player_id}-${val.category}`;
        const pr: PlayerRanking = {
          id,
          player_id: val.player_id,
          category: val.category,
          total_points: val.total_points,
          rank: 0,
          players: val.players,
        };
        if (!byCategory[val.category]) byCategory[val.category] = [];
        byCategory[val.category].push(pr);
      });

      Object.keys(byCategory).forEach((cat) => {
        const list = byCategory[cat];
        list.sort((a, b) => b.total_points - a.total_points);
        let currentRank = 0;
        let lastPoints = Infinity;
        list.forEach((item, idx) => {
          if (item.total_points !== lastPoints) {
            currentRank = idx + 1;
            lastPoints = item.total_points;
          }
          item.rank = currentRank;
          all.push(item);
        });
        console.log(`${cat}: ${list.length} players`);
      });

      setPlayers(all);
    } else {
      // Compute ALL-TIME directly from match_results
      let allData: any[] = [];
      let from = 0;
      const batchSize = 1000;
      
      while (true) {
        const { data, error } = await supabase
          .from('match_results')
          .select(`
            player_id,
            points_awarded,
            matches!inner(category),
            players:players!match_results_player_id_fkey (
              name,
              country
            )
          `)
          .range(from, from + batchSize - 1);

        if (error) {
          console.error('Error fetching all-time rankings:', error);
          break;
        }
        
        if (!data || data.length === 0) break;
        
        allData = [...allData, ...data];
        console.log(`Fetched batch: ${from}-${from + data.length - 1}, total: ${allData.length}`);
        
        if (data.length < batchSize) break;
        from += batchSize;
      }

      console.log(`Total match results for all-time: ${allData.length}`);
      type Row = {
        player_id: string;
        points_awarded: number;
        matches: { category: string } | null;
        players: { name?: string; country?: string } | null;
      };
      
      const totals = new Map<string, { 
        player_id: string; 
        category: string; 
        total_points: number; 
        players?: { name?: string; country?: string } 
      }>();
      
      (allData as Row[]).forEach((r) => {
          const category = r.matches?.category;
          if (!category) return;
          const key = `${r.player_id}|${category}`;
          const prev = totals.get(key);
          const pts = Number(r.points_awarded) || 0;
          if (prev) {
            prev.total_points += pts;
          } else {
            totals.set(key, {
              player_id: r.player_id,
              category,
              total_points: pts,
              players: r.players || undefined,
          });
        }
      });

      console.log(`Aggregated ${totals.size} unique player-category combinations for all-time`);

      const all: PlayerRanking[] = [];
      const byCategory: Record<string, PlayerRanking[]> = {};
      totals.forEach((val) => {
        const id = `${val.player_id}-${val.category}`;
        const pr: PlayerRanking = {
          id,
          player_id: val.player_id,
          category: val.category,
          total_points: val.total_points,
          rank: 0,
          players: val.players,
        };
        if (!byCategory[val.category]) byCategory[val.category] = [];
        byCategory[val.category].push(pr);
      });

      Object.keys(byCategory).forEach((cat) => {
        const list = byCategory[cat];
        list.sort((a, b) => b.total_points - a.total_points);
        let currentRank = 0;
        let lastPoints = Infinity;
        list.forEach((item, idx) => {
          if (item.total_points !== lastPoints) {
            currentRank = idx + 1;
            lastPoints = item.total_points;
          }
          item.rank = currentRank;
          all.push(item);
        });
        console.log(`${cat}: ${list.length} players`);
      });

      setPlayers(all);
    }
    setLoading(false);
  };

  // Get unique countries for filter
  const countries = useMemo(() => {
    const uniqueCountries = new Set(
      players
        .map((p) => p.players?.country)
        .filter((country): country is string => !!country)
    );
    return Array.from(uniqueCountries).sort();
  }, [players]);

  const getPlayersByCategory = (category: string) => {
    let filtered = players.filter((p) => p.category === category);
    
    if (selectedCountry !== "all") {
      filtered = filtered.filter((p) => p.players?.country === selectedCountry);
    }
    
    return filtered;
  };

  const PlayerRow = ({ player }: { player: PlayerRanking }) => (
    <Link to={`/player/${player.player_id}`}>
      <div
        className="flex items-center gap-4 p-4 rounded-lg transition-all hover:shadow-[var(--shadow-hover)] cursor-pointer"
        style={{ 
          background: "var(--gradient-card)",
          boxShadow: "var(--shadow-card)"
        }}
      >
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary font-bold text-xl">
          {getRankIcon(player.rank) || `#${player.rank}`}
        </div>
        
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-bold text-foreground hover:text-primary transition-colors">
              {player.players?.name ?? 'Unknown Player'}
            </h3>
            {player.players?.country && (
              <Badge variant="outline" className="text-xs">
                {player.players.country}
              </Badge>
            )}
          </div>
        </div>
        
        <div className="text-right">
          <p className="text-2xl font-bold text-secondary">{player.total_points}</p>
          <p className="text-xs text-muted-foreground">points</p>
        </div>
      </div>
    </Link>
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
        <div className="flex flex-col md:flex-row justify-center items-center gap-4 mb-8">
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

          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={selectedCountry} onValueChange={setSelectedCountry}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by country" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Countries</SelectItem>
                {countries.map((country) => (
                  <SelectItem key={country} value={country}>
                    {country}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
