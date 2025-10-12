import { Trophy, Medal } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";

interface Player {
  player_id: string;
  name: string;
  rank: number;
  total_points: number;
  country: string;
}

interface WidgetLeaderboardTableProps {
  players: Player[];
  category: string;
  compact?: boolean;
  country?: string;
}

export const WidgetLeaderboardTable = ({
  players,
  category,
  compact = false,
  country = "Australia",
}: WidgetLeaderboardTableProps) => {
  const navigate = useNavigate();

  const getMedalIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="h-5 w-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
    if (rank === 3) return <Medal className="h-5 w-5 text-amber-600" />;
    return null;
  };

  const getMedalEmoji = (rank: number) => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return null;
  };

  const handlePlayerClick = (playerId: string) => {
    navigate(`/player/${playerId}`);
  };

  return (
    <div className="w-full">
      {/* Mobile View - Cards */}
      <div className="md:hidden space-y-2">
        {players.map((player) => (
          <Card
            key={player.player_id}
            className="p-3 cursor-pointer hover:bg-accent transition-colors"
            onClick={() => handlePlayerClick(player.player_id)}
          >
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted">
                {getMedalEmoji(player.rank) || (
                  <span className="text-sm font-semibold">{player.rank}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{player.name}</p>
                <p className="text-sm text-muted-foreground">
                  {player.country} • {player.total_points.toLocaleString()} pts
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Desktop View - Table */}
      <div className="hidden md:block overflow-hidden rounded-lg border">
        <table className="w-full">
          <thead>
            <tr className="bg-muted/50 border-b">
              <th className="text-left p-3 font-semibold">Rank</th>
              <th className="text-left p-3 font-semibold">Player</th>
              <th className="text-left p-3 font-semibold">Country</th>
              <th className="text-right p-3 font-semibold">Points</th>
            </tr>
          </thead>
          <tbody>
            {players.map((player) => (
              <tr
                key={player.player_id}
                className="border-b cursor-pointer hover:bg-accent/50 transition-colors"
                onClick={() => handlePlayerClick(player.player_id)}
              >
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    {getMedalIcon(player.rank)}
                    <span className={player.rank <= 3 ? "font-semibold" : ""}>
                      {player.rank}
                    </span>
                  </div>
                </td>
                <td className="p-3 font-medium">{player.name}</td>
                <td className="p-3 text-muted-foreground">{player.country}</td>
                <td className="p-3 text-right font-semibold">
                  {player.total_points.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
