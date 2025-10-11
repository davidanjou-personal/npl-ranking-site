import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { MatchWithResults } from "@/types/admin";

interface MatchesListProps {
  matches: MatchWithResults[];
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
  quarterfinalist: "Quarterfinalist",
  round_of_16: "Round of 16",
  event_win: "Event Win",
};

export function MatchesList({ matches }: MatchesListProps) {
  if (matches.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">No match results recorded yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {matches.map((match) => (
        <Card key={match.id}>
          <CardHeader>
            <CardTitle className="text-lg flex items-center justify-between">
              <span>{match.tournament_name}</span>
              <Badge variant="outline">{categoryLabels[match.category]}</Badge>
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {new Date(match.match_date).toLocaleDateString()} • {match.tier.toUpperCase()}
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Results:</h4>
              <ul className="space-y-1">
                {match.match_results?.map((result) => (
                  <li key={result.id} className="text-sm flex items-center justify-between">
                    <span>
                      {result.players?.name} -{" "}
                      <span className="text-muted-foreground">
                        {positionLabels[result.finishing_position]}
                      </span>
                    </span>
                    <Badge variant="secondary">{result.points_awarded} pts</Badge>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
