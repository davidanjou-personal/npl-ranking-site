import { useEffect, useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Trophy, Calendar, Award, ArrowLeft, Mail, Globe, User } from "lucide-react";
import { ExpiringPointsWarning } from "@/components/player/ExpiringPointsWarning";
import { RankingChangeIndicator } from "@/components/player/RankingChangeIndicator";
import { useLatestRankingChange } from "@/hooks/useRankingHistory";
import { useCurrentRankingsByCategory, calculateNationalRanks } from "@/hooks/useRankings";

interface PlayerData {
  id: string;
  name: string;
  country: string;
  gender: string;
  email?: string;
  player_code?: string;
  dupr_id?: string;
  date_of_birth?: string;
  avatar_url?: string;
}

interface RankingData {
  category: string;
  total_points: number;
  rank: number;
}

interface MatchResult {
  id: string;
  points_awarded: number;
  finishing_position: string;
  matches: {
    tournament_name: string;
    match_date: string;
    category: string;
    tier: string;
  };
}

const categoryLabels: Record<string, string> = {
  mens_singles: "Men's Singles",
  womens_singles: "Women's Singles",
  mens_doubles: "Men's Doubles",
  womens_doubles: "Women's Doubles",
  mixed_doubles: "Mixed Doubles",
};

const positionLabels: Record<string, string> = {
  winner: "Winner",
  second: "2nd Place",
  third: "3rd Place",
  fourth: "4th Place",
  quarterfinalist: "Quarter Finalist",
  round_of_16: "Round of 16",
  event_win: "Points Awarded",
};

export default function PlayerProfile() {
  const { id } = useParams<{ id: string }>();
  const [player, setPlayer] = useState<PlayerData | null>(null);
  const [rankings, setRankings] = useState<RankingData[]>([]);
  const [matchResults, setMatchResults] = useState<MatchResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchPlayerData();
    }
  }, [id]);

  const fetchPlayerData = async () => {
    setLoading(true);

    // Fetch player basic info (using public view to protect PII)
    const { data: playerData, error: playerError } = await supabase
      .from("players_public")
      .select("*")
      .eq("id", id)
      .single();

    if (!playerError && playerData) {
      setPlayer(playerData);
    }

    // Fetch current rankings (12-month)
    const { data: rankingsData, error: rankingsError } = await supabase
      .from("current_rankings")
      .select("category, total_points, rank")
      .eq("player_id", id);

    if (!rankingsError && rankingsData) {
      setRankings(rankingsData);
    }

    // Fetch match results
    const { data: resultsData, error: resultsError } = await supabase
      .from("match_results")
      .select(`
        id,
        points_awarded,
        finishing_position,
        matches (
          tournament_name,
          match_date,
          category,
          tier
        )
      `)
      .eq("player_id", id)
      .order("matches(match_date)", { ascending: false });

    if (!resultsError && resultsData) {
      setMatchResults(resultsData as any);
    }

    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-12">
          <p className="text-center text-muted-foreground">Loading player profile...</p>
        </div>
      </div>
    );
  }

  if (!player) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-12">
          <p className="text-center text-muted-foreground">Player not found</p>
          <div className="text-center mt-4">
            <Link to="/rankings" className="text-primary hover:underline">
              ← Back to Rankings
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div
        className="py-12 px-4"
        style={{ background: "var(--gradient-hero)" }}
      >
        <div className="container mx-auto">
          <Link
            to="/rankings"
            className="inline-flex items-center gap-2 text-primary-foreground/90 hover:text-primary-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Rankings
          </Link>

          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <Avatar className="h-32 w-32 border-4 border-primary-foreground/20">
              <AvatarImage
                src={player.avatar_url || undefined}
                alt={player.name}
              />
              <AvatarFallback className="text-3xl bg-primary text-primary-foreground">
                {getInitials(player.name)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <h1 className="text-4xl font-bold text-primary-foreground mb-2">
                {player.name}
              </h1>
              <div className="flex flex-wrap gap-3 text-primary-foreground/90">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  <span>{player.country}</span>
                </div>
                {player.player_code && (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>Code: {player.player_code}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* Point Expiry Warning */}
        {id && (
          <div className="mb-8">
            <ExpiringPointsWarning playerId={id} />
          </div>
        )}

        {/* Current Rankings Section */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Trophy className="h-6 w-6 text-primary" />
              Current Rankings (12-month)
            </h2>
            <Link to="/how-it-works" className="text-sm text-muted-foreground hover:text-foreground underline transition-colors">
              How do rankings work?
            </Link>
          </div>

          {rankings.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {rankings.map((ranking) => {
                const RankingCard = () => {
                  const { data: latestChange } = useLatestRankingChange(id!, ranking.category);
                  const { data: categoryData } = useCurrentRankingsByCategory(ranking.category);
                  
                  // Calculate national rank for player's country
                  const nationalRankData = useMemo(() => {
                    if (!categoryData || !player?.country) return null;
                    const nationalRankings = calculateNationalRanks(categoryData, player.country);
                    return nationalRankings.find(r => r.player_id === id);
                  }, [categoryData]);
                  
                  return (
                    <Card
                      key={ranking.category}
                      className="p-6"
                      style={{
                        background: "var(--gradient-card)",
                        boxShadow: "var(--shadow-card)",
                      }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-foreground">
                          {categoryLabels[ranking.category]}
                        </h3>
                        <div className="flex flex-col items-end gap-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">Global #{ranking.rank}</Badge>
                            {latestChange && (
                              <RankingChangeIndicator
                                oldRank={latestChange.old_rank}
                                newRank={latestChange.new_rank}
                                oldPoints={latestChange.old_points}
                                newPoints={latestChange.new_points}
                              />
                            )}
                          </div>
                          {nationalRankData?.nationalRank && player?.country && (
                            <Badge variant="outline" className="text-xs">
                              {player.country} #{nationalRankData.nationalRank}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <p className="text-3xl font-bold text-secondary">
                        {ranking.total_points} pts
                      </p>
                    </Card>
                  );
                };
                
                return <RankingCard key={ranking.category} />;
              })}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">
                No current rankings available
              </p>
            </Card>
          )}
        </div>

        <Separator className="my-8" />

        {/* Event Results Section */}
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
            <Award className="h-6 w-6 text-primary" />
            Event History
          </h2>

          {matchResults.length > 0 ? (
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="mb-6">
                <TabsTrigger value="all">All</TabsTrigger>
                {Object.keys(categoryLabels).map((cat) => {
                  const hasResults = matchResults.some(
                    (r) => r.matches?.category === cat
                  );
                  return hasResults ? (
                    <TabsTrigger key={cat} value={cat}>
                      {categoryLabels[cat]}
                    </TabsTrigger>
                  ) : null;
                })}
              </TabsList>

              <TabsContent value="all">
                <div className="space-y-3">
                  {matchResults.map((result) => (
                    <Card
                      key={result.id}
                      className="p-4 hover:shadow-lg transition-shadow"
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="font-semibold text-foreground mb-1">
                            {result.matches?.tournament_name}
                          </h3>
                          <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(
                                result.matches?.match_date
                              ).toLocaleDateString()}
                            </span>
                            <span>•</span>
                            <span>
                              {categoryLabels[result.matches?.category]}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <Badge variant="outline">
                            {positionLabels[result.finishing_position] ||
                              result.finishing_position}
                          </Badge>
                          <div className="text-right">
                            <p className="text-xl font-bold text-secondary">
                              +{result.points_awarded}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              points
                            </p>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {Object.keys(categoryLabels).map((cat) => {
                const categoryResults = matchResults.filter(
                  (r) => r.matches?.category === cat
                );
                return categoryResults.length > 0 ? (
                  <TabsContent key={cat} value={cat}>
                    <div className="space-y-3">
                      {categoryResults.map((result) => (
                        <Card
                          key={result.id}
                          className="p-4 hover:shadow-lg transition-shadow"
                        >
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex-1">
                              <h3 className="font-semibold text-foreground mb-1">
                                {result.matches?.tournament_name}
                              </h3>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                {new Date(
                                  result.matches?.match_date
                                ).toLocaleDateString()}
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <Badge variant="outline">
                                {positionLabels[result.finishing_position] ||
                                  result.finishing_position}
                              </Badge>
                              <div className="text-right">
                                <p className="text-xl font-bold text-secondary">
                                  +{result.points_awarded}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  points
                                </p>
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>
                ) : null;
              })}
            </Tabs>
          ) : (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">No event results found</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
