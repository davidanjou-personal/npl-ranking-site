import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Trophy, Calendar, Award } from "lucide-react";

interface PlayerStatsProps {
  totalEvents: number;
  totalPoints: number;
  bestFinish: string;
  recentForm: number; // percentage
}

export const PlayerStats = ({
  totalEvents,
  totalPoints,
  bestFinish,
  recentForm,
}: PlayerStatsProps) => {
  const getFinishLabel = (finish: string) => {
    const labels: Record<string, string> = {
      first: "1st Place",
      second: "2nd Place",
      third: "3rd Place",
      semifinalist: "Semi-Finalist",
      quarterfinalist: "Quarter-Finalist",
    };
    return labels[finish] || finish;
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Events</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalEvents}</div>
          <p className="text-xs text-muted-foreground">Last 12 months</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Points</CardTitle>
          <Trophy className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalPoints}</div>
          <p className="text-xs text-muted-foreground">Across all categories</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Best Finish</CardTitle>
          <Award className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{getFinishLabel(bestFinish)}</div>
          <p className="text-xs text-muted-foreground">Career best</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Recent Form</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{recentForm}%</div>
          <p className="text-xs text-muted-foreground">Last 5 events</p>
        </CardContent>
      </Card>
    </div>
  );
};
