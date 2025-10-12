import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
      mixed_doubles: "Mixed Doubles",
    };
    return labels[category] || category;
  };

  const getPositionLabel = (position: string) => {
    const labels: Record<string, string> = {
      first: "1st",
      second: "2nd",
      third: "3rd",
      semifinalist: "SF",
      quarterfinalist: "QF",
      r16: "R16",
      r32: "R32",
      r64: "R64",
    };
    return labels[position] || position;
  };

  const getPositionIcon = (position: string) => {
    if (position === "first") return <Trophy className="h-4 w-4 text-yellow-500 inline mr-1" />;
    if (position === "second") return <Medal className="h-4 w-4 text-gray-400 inline mr-1" />;
    if (position === "third") return <Medal className="h-4 w-4 text-amber-600 inline mr-1" />;
    return null;
  };

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
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tournament</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Position</TableHead>
              <TableHead className="text-right">Points</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {results.map((result) => (
              <TableRow key={result.id}>
                <TableCell>
                  <Link to={`/tournaments/${result.id}`} className="hover:underline font-medium">
                    {result.tournament_name}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDate(result.match_date)}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="text-xs">
                    {getCategoryLabel(result.category)}
                  </Badge>
                </TableCell>
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
      </CardContent>
    </Card>
  );
};
