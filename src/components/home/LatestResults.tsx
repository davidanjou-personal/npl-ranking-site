import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, Trophy } from "lucide-react";
import { useLatestResults } from "@/hooks/useLatestResults";
import { Skeleton } from "@/components/ui/skeleton";

export const LatestResults = () => {
  const { data: events, isLoading } = useLatestResults(5);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-AU', {
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

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Latest Results
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!events || events.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          Latest Results
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {events.map((event: any) => (
          <Link
            key={event.id}
            to={`/tournaments/${event.id}`}
            className="block hover:bg-accent/50 rounded-lg p-3 -m-3 transition-colors"
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <h4 className="font-semibold">{event.tournament_name}</h4>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                  <Calendar className="h-3 w-3" />
                  {formatDate(event.match_date)}
                  <Badge variant="secondary" className="text-xs">
                    {getCategoryLabel(event.category)}
                  </Badge>
                </div>
              </div>
            </div>
            {event.event_results && event.event_results.length > 0 && (
              <div className="space-y-2 mt-3">
                {event.event_results.slice(0, 3).map((result: any, idx: number) => (
                  <div key={result.id} className="flex items-center gap-2 text-sm">
                    <span className="font-medium w-6">
                      {idx === 0 ? "🥇" : idx === 1 ? "🥈" : "🥉"}
                    </span>
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={result.players?.avatar_url || ""} />
                      <AvatarFallback className="text-xs">
                        {result.players?.name?.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="flex-1">{result.players?.name}</span>
                    <span className="text-muted-foreground font-medium">
                      {result.points_awarded}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Link>
        ))}
      </CardContent>
    </Card>
  );
};
