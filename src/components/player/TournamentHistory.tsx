import { Link } from "react-router-dom";
import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal } from "lucide-react";

interface TournamentResult {
  id: string;
  tournament_name: string;
  match_date: string;
  category: string;
  tier: string;
  finishing_position: string;
  points_awarded: number;
}

interface TournamentHistoryProps {
  results: TournamentResult[];
}

export const TournamentHistory = ({ results }: TournamentHistoryProps) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-AU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

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

  const getPositionLabel = (position: string) => {
    const labels: Record<string, string> = {
      winner: "Winner",
      second: "2nd Place",
      third: "3rd Place",
      fourth: "4th Place",
      semifinalist: "Semi Final",
      quarterfinalist: "Quarter Final",
      round_of_16: "Round of 16",
      points_awarded: "Points Awarded",
      r32: "Round of 32",
      r64: "Round of 64",
    };
    return labels[position] || position;
  };

  const getPositionIcon = (position: string) => {
    if (position === "winner") return <Trophy className="h-4 w-4 text-yellow-500 inline mr-1" />;
    if (position === "second") return <Medal className="h-4 w-4 text-gray-400 inline mr-1" />;
    if (position === "third") return <Medal className="h-4 w-4 text-amber-600 inline mr-1" />;
    return null;
  };

  const categorizedResults = useMemo(() => {
    const grouped: Record<string, TournamentResult[]> = {};
    
    results.forEach(result => {
      if (!grouped[result.category]) {
        grouped[result.category] = [];
      }
      grouped[result.category].push(result);
    });
    
    return grouped;
  }, [results]);

  const categories = Object.keys(categorizedResults).sort();

  const renderTable = (resultsToShow: TournamentResult[], showCategoryColumn = true) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Tournament</TableHead>
          <TableHead>Date</TableHead>
          {showCategoryColumn && <TableHead>Category</TableHead>}
          <TableHead>Position</TableHead>
          <TableHead className="text-right">Points</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {resultsToShow.map((result) => (
          <TableRow key={result.id}>
            <TableCell>
              <Link to={`/tournaments/${result.id}`} className="hover:underline font-medium">
                {result.tournament_name}
              </Link>
            </TableCell>
            <TableCell className="text-muted-foreground">
              {formatDate(result.match_date)}
            </TableCell>
            {showCategoryColumn && (
              <TableCell>
                <Badge variant="secondary" className="text-xs">
                  {getCategoryLabel(result.category)}
                </Badge>
              </TableCell>
            )}
            <TableCell>
              <span className="flex items-center">
                {getPositionIcon(result.finishing_position)}
                {getPositionLabel(result.finishing_position)}
              </span>
            </TableCell>
            <TableCell className="text-right font-semibold">
              {result.points_awarded}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  if (!results || results.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Tournament History</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">No tournament results found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tournament History</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="w-full justify-start flex-wrap h-auto">
            <TabsTrigger value="all">
              All Results ({results.length})
            </TabsTrigger>
            {categories.map(category => (
              <TabsTrigger key={category} value={category}>
                {getCategoryLabel(category)} ({categorizedResults[category].length})
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="all" className="mt-4">
            {renderTable(results, true)}
          </TabsContent>

          {categories.map(category => (
            <TabsContent key={category} value={category} className="mt-4">
              {renderTable(categorizedResults[category], false)}
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
};
