import { useEffect, useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Trophy, Calendar, Award, ArrowLeft, Mail, Globe, User, UserPlus, TrendingUp } from "lucide-react";
import { ExpiringPointsWarning } from "@/components/player/ExpiringPointsWarning";
import { RankingChangeIndicator } from "@/components/player/RankingChangeIndicator";
import { PlayerStats } from "@/components/player/PlayerStats";
import { TournamentHistory } from "@/components/player/TournamentHistory";
import { useLatestRankingChange } from "@/hooks/useRankingHistory";
import { useCurrentRankingsByCategory, calculateNationalRanks } from "@/hooks/useRankings";
import { Skeleton } from "@/components/ui/skeleton";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";

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
  events: {
    id: string;
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
  mens_mixed_doubles: "Men's Mixed Doubles",
  womens_mixed_doubles: "Women's Mixed Doubles",
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
  const [isClaimed, setIsClaimed] = useState(false);

  useEffect(() => {
    if (id) {
      fetchPlayerData();
    }
  }, [id]);

  const fetchPlayerData = async () => {
    setLoading(true);

    const { data: playerData, error: playerError } = await supabase
      .from("players_public")
      .select("*")
      .eq("id", id)
      .single();

    if (!playerError && playerData) {
      setPlayer(playerData);
      
      const { data: accountData } = await supabase
        .from("player_accounts")
        .select("id")
        .eq("player_id", id)
        .maybeSingle();
      
      setIsClaimed(!!accountData);
    }

    const { data: rankingsData, error: rankingsError } = await supabase
      .from("current_rankings")
      .select("category, total_points, rank")
      .eq("player_id", id);

    if (!rankingsError && rankingsData) {
      // Rankings are now correct from the database - no recalculation needed
      setRankings(rankingsData);
    }

    const { data: resultsData, error: resultsError } = await supabase
      .from("event_results")
      .select(`
        id,
        points_awarded,
        finishing_position,
        events (
          id,
          tournament_name,
          match_date,
          category,
          tier
        )
      `)
      .eq("player_id", id)
      .order("events(match_date)", { ascending: false });

    if (!resultsError && resultsData) {
      setMatchResults(resultsData as any);
    }

    setLoading(false);
  };

  // Calculate player stats
  const playerStats = useMemo(() => {
    if (!matchResults.length) return null;

    const totalEvents = matchResults.length;
    const totalPoints = matchResults.reduce((sum, r) => sum + r.points_awarded, 0);
    
    // Best finish
    const finishOrder = ['winner', 'second', 'third', 'fourth', 'quarterfinalist', 'round_of_16', 'event_win'];
    const bestFinish = finishOrder.find(pos => 
      matchResults.some(r => r.finishing_position === pos)
    ) || 'event_win';
    
    // Recent form (last 5 events) - calculate percentage based on points vs max possible
    const recentEvents = matchResults.slice(0, 5);
    const recentPoints = recentEvents.reduce((sum, r) => sum + r.points_awarded, 0);
    const maxPossible = recentEvents.length * 1000; // Max tier1 winner points
    const recentForm = Math.round((recentPoints / maxPossible) * 100);

    return { totalEvents, totalPoints, bestFinish, recentForm };
  }, [matchResults]);

  // Transform match results to tournament history format
  const tournamentHistory = useMemo(() => {
    return matchResults.map(result => ({
      id: result.events.id,
      tournament_name: result.events.tournament_name,
      match_date: result.events.match_date,
      category: result.events.category,
      tier: result.events.tier,
      finishing_position: result.finishing_position,
      points_awarded: result.points_awarded,
    }));
  }, [matchResults]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-8 w-64 mb-4" />
          <Skeleton className="h-32 w-full mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32" />)}
          </div>
          <Skeleton className="h-64 w-full" />
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

      {/* Breadcrumbs */}
      <div className="container mx-auto px-4 pt-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/players">Players</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{player.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div
        className="py-8 sm:py-12 px-4"
        style={{ background: "var(--gradient-hero)" }}
      >
        <div className="container mx-auto">
          <Link
            to="/rankings"
            className="inline-flex items-center gap-2 text-primary-foreground/90 hover:text-primary-foreground mb-4 sm:mb-6 transition-colors text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Rankings
          </Link>

          <div className="flex flex-col sm:flex-row items-center sm:items-start md:items-center gap-4 sm:gap-6">
            <Avatar className="h-24 w-24 sm:h-32 sm:w-32 border-4 border-primary-foreground/20 flex-shrink-0">
              <AvatarImage
                src={player.avatar_url || undefined}
                alt={player.name}
              />
              <AvatarFallback className="text-2xl sm:text-3xl bg-primary text-primary-foreground">
                {getInitials(player.name)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary-foreground mb-2">
                {player.name}
              </h1>
              <div className="flex flex-wrap justify-center sm:justify-start gap-2 sm:gap-3 text-sm sm:text-base text-primary-foreground/90">
                <div className="flex items-center gap-2">
                  <Globe className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span>{player.country}</span>
                </div>
                {player.player_code && (
                  <div className="flex items-center gap-2">
                    <User className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span>Code: {player.player_code}</span>
                  </div>
                )}
              </div>
              
              {!isClaimed && (
                <div className="mt-4">
                  <Link to="/player/claim">
                    <Button variant="secondary" size="sm">
                      <UserPlus className="mr-2 h-4 w-4" />
                      Claim This Profile
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 sm:py-12">
        {/* Point Expiry Warning */}
        {id && (
          <div className="mb-6 sm:mb-8">
            <ExpiringPointsWarning playerId={id} />
          </div>
        )}

        {/* Player Stats */}
        {playerStats && (
          <div className="mb-8">
            <PlayerStats
              totalEvents={playerStats.totalEvents}
              totalPoints={playerStats.totalPoints}
              bestFinish={playerStats.bestFinish}
              recentForm={playerStats.recentForm}
            />
          </div>
        )}

        {/* Current Rankings Section */}
        <div className="mb-8 sm:mb-12">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-2">
            <h2 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
              <Trophy className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              Current Rankings (12-month)
            </h2>
            <Link to="/how-it-works" className="text-xs sm:text-sm text-muted-foreground hover:text-foreground underline transition-colors">
              How do rankings work?
            </Link>
          </div>

          {rankings.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {rankings.map((ranking) => {
                const RankingCard = () => {
                  const { data: latestChange } = useLatestRankingChange(id!, ranking.category);
                  const { data: categoryData } = useCurrentRankingsByCategory(ranking.category);
                  
                  const nationalRankData = useMemo(() => {
                    if (!categoryData || !player?.country) return null;
                    const nationalRankings = calculateNationalRanks(categoryData, player.country);
                    return nationalRankings.find(r => r.player_id === id);
                  }, [categoryData]);
                  
                  return (
                    <Card
                      key={ranking.category}
                      className="p-6 hover-lift"
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

        {/* Tournament History Section */}
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-4 sm:mb-6 flex items-center gap-2">
            <Award className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            Tournament History
          </h2>

          <TournamentHistory results={tournamentHistory} />
        </div>
      </div>
    </div>
  );
}
