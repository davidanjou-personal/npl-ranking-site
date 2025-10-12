import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Award } from "lucide-react";

interface PlayerRankingCardProps {
  playerId: string;
  rank: number;
  name: string;
  country?: string;
  totalPoints: number;
  nationalRank?: number;
  showNationalRank?: boolean;
}

const getRankIcon = (rank: number) => {
  if (rank === 1) return <Trophy className="h-6 w-6 text-yellow-500" />;
  if (rank === 2) return <Medal className="h-6 w-6 text-gray-400" />;
  if (rank === 3) return <Award className="h-6 w-6 text-amber-600" />;
  return null;
};

export function PlayerRankingCard({ 
  playerId, 
  rank, 
  name, 
  country, 
  totalPoints,
  nationalRank,
  showNationalRank = false 
}: PlayerRankingCardProps) {
  // When showing national rank, display it as primary, global as secondary
  const displayRank = showNationalRank && nationalRank ? nationalRank : rank;
  
  return (
    <Link to={`/player/${playerId}`}>
      <div
        className="glass-card flex items-center gap-4 sm:gap-6 p-5 sm:p-6 rounded-xl hover-lift cursor-pointer group"
        style={{ boxShadow: "var(--shadow-premium)" }}
      >
        <div className="flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border-2 border-primary/20 text-primary font-bold text-lg sm:text-xl group-hover:scale-110 group-hover:border-primary/40 transition-all">
          {getRankIcon(displayRank) || `#${displayRank}`}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h3 className="text-lg sm:text-xl font-heading font-bold text-foreground group-hover:text-primary transition-colors">
              {name}
            </h3>
            {country && (
              <Badge variant="outline" className="text-xs font-medium">
                {country}
              </Badge>
            )}
          </div>
          {showNationalRank && nationalRank && (
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <Badge variant="default" className="text-xs font-semibold bg-gradient-to-r from-primary to-secondary">
                National #{nationalRank}
              </Badge>
              <Badge variant="outline" className="text-xs text-muted-foreground">
                Global #{rank}
              </Badge>
            </div>
          )}
        </div>
        
        <div className="text-right flex-shrink-0">
          <p className="text-2xl sm:text-3xl font-heading font-bold bg-gradient-to-br from-secondary to-primary bg-clip-text text-transparent">{totalPoints}</p>
          <p className="text-xs text-muted-foreground font-medium">points</p>
        </div>
      </div>
    </Link>
  );
}
