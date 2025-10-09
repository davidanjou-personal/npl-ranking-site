import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Award } from "lucide-react";

interface PlayerRankingCardProps {
  playerId: string;
  rank: number;
  name: string;
  country?: string;
  totalPoints: number;
}

const getRankIcon = (rank: number) => {
  if (rank === 1) return <Trophy className="h-6 w-6 text-yellow-500" />;
  if (rank === 2) return <Medal className="h-6 w-6 text-gray-400" />;
  if (rank === 3) return <Award className="h-6 w-6 text-amber-600" />;
  return null;
};

export function PlayerRankingCard({ playerId, rank, name, country, totalPoints }: PlayerRankingCardProps) {
  return (
    <Link to={`/player/${playerId}`}>
      <div
        className="flex items-center gap-4 p-4 rounded-lg transition-all hover:shadow-[var(--shadow-hover)] cursor-pointer"
        style={{ 
          background: "var(--gradient-card)",
          boxShadow: "var(--shadow-card)"
        }}
      >
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary font-bold text-xl">
          {getRankIcon(rank) || `#${rank}`}
        </div>
        
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-bold text-foreground hover:text-primary transition-colors">
              {name}
            </h3>
            {country && (
              <Badge variant="outline" className="text-xs">
                {country}
              </Badge>
            )}
          </div>
        </div>
        
        <div className="text-right">
          <p className="text-2xl font-bold text-secondary">{totalPoints}</p>
          <p className="text-xs text-muted-foreground">points</p>
        </div>
      </div>
    </Link>
  );
}
