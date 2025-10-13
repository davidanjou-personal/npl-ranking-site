import { useParams, Link } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Calendar, MapPin, Trophy, Medal } from "lucide-react";
import { useTournamentDetail } from "@/hooks/useTournaments";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function TournamentDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: eventData, isLoading } = useTournamentDetail(id || "");
  
  // Group all events from the same tournament
  const tournament = eventData ? {
    ...eventData,
    all_results: eventData.event_results || [],
  } : null;

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      mens_singles: "Men's Singles",
      womens_singles: "Women's Singles",
      mens_doubles: "Men's Doubles",
      womens_doubles: "Women's Doubles",
      mens_mixed_doubles: "Men's Mixed Doubles",
      womens_mixed_doubles: "Women's Mixed Doubles",
    };
    return labels[category] || category;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-AU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getPositionLabel = (position: string) => {
    const labels: Record<string, string> = {
      winner: "Winner",
      first: "1st Place",
      second: "2nd Place",
      third: "3rd Place",
      fourth: "4th Place",
      semifinalist: "Semi-Finalist",
      quarterfinalist: "Quarter-Finalist",
      r16: "Round of 16",
      r32: "Round of 32",
      r64: "Round of 64",
    };
    return labels[position] || position;
  };

  const getPositionIcon = (position: string) => {
    if (position === "winner" || position === "first") return <Trophy className="h-5 w-5 text-yellow-500" />;
    if (position === "second") return <Medal className="h-5 w-5 text-gray-400" />;
    if (position === "third") return <Medal className="h-5 w-5 text-amber-600" />;
    return null;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto py-8 px-4">
          <Skeleton className="h-10 w-32 mb-8" />
          <Card>
            <CardHeader>
              <Skeleton className="h-8 w-3/4 mb-4" />
              <div className="flex gap-4">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-6 w-32" />
              </div>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto py-8 px-4">
          <Card className="p-12 text-center">
            <h3 className="text-lg font-semibold mb-2">Tournament not found</h3>
            <Link to="/tournaments">
              <Button variant="outline">Back to Tournaments</Button>
            </Link>
          </Card>
        </main>
      </div>
    );
  }

  // Get all categories for this tournament (same name and date)
  const categories = [...new Set(tournament.all_results.map((r: any) => r.category || tournament.category))];
  
  const sortedResults = [...(tournament.all_results || [])].sort((a, b) => {
    const order = ["winner", "second", "third", "fourth", "semifinalist", "quarterfinalist", "r16", "r32", "r64"];
    const indexA = order.indexOf(a.finishing_position);
    const indexB = order.indexOf(b.finishing_position);
    
    // Handle unknown positions by putting them at the end
    const finalA = indexA === -1 ? 999 : indexA;
    const finalB = indexB === -1 ? 999 : indexB;
    
    return finalA - finalB;
  });

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto py-8 px-4">
        <Link to="/tournaments">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Tournaments
          </Button>
        </Link>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <CardTitle className="text-3xl mb-2">{tournament.tournament_name}</CardTitle>
                <div className="flex flex-wrap gap-4 text-muted-foreground mb-3">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    {formatDate(tournament.match_date)}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => (
                    <Badge key={cat} variant="outline">
                      {getCategoryLabel(cat)}
                    </Badge>
                  ))}
                </div>
              </div>
              <Badge variant={tournament.tier === 'tier1' ? 'default' : 'secondary'} className="text-lg px-4 py-2">
                {tournament.tier.toUpperCase()}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <h3 className="text-xl font-semibold mb-4">Results - All Categories</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead className="w-[120px]">Position</TableHead>
                  <TableHead>Player</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead className="text-right">Points</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedResults.map((result: any) => (
                  <TableRow key={result.id}>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {getCategoryLabel(result.category || tournament.category)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getPositionIcon(result.finishing_position)}
                        <span className="text-sm font-medium">
                          {getPositionLabel(result.finishing_position)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Link to={`/player/${result.players?.id}`} className="hover:underline">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={result.players?.avatar_url || ""} />
                            <AvatarFallback>
                              {result.players?.name?.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{result.players?.name}</span>
                        </div>
                      </Link>
                    </TableCell>
                    <TableCell>{result.players?.country}</TableCell>
                    <TableCell className="text-right font-semibold">
                      {result.points_awarded}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
