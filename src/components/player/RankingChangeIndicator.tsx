import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface RankingChangeIndicatorProps {
  oldRank?: number | null;
  newRank: number;
  oldPoints?: number | null;
  newPoints: number;
}

export function RankingChangeIndicator({ 
  oldRank, 
  newRank, 
  oldPoints, 
  newPoints 
}: RankingChangeIndicatorProps) {
  if (!oldRank || !oldPoints) {
    return null;
  }

  const rankChange = oldRank - newRank; // Positive means improved (lower rank number is better)
  const pointsChange = newPoints - oldPoints;

  const getRankChangeIcon = () => {
    if (rankChange > 0) {
      return <TrendingUp className="h-3 w-3 text-primary" />;
    } else if (rankChange < 0) {
      return <TrendingDown className="h-3 w-3 text-red-500" />;
    }
    return <Minus className="h-3 w-3 text-muted-foreground" />;
  };

  const getRankChangeColor = () => {
    if (rankChange > 0) return "default"; // Green for improvement
    if (rankChange < 0) return "destructive"; // Red for decline
    return "secondary"; // Gray for no change
  };

  const formatRankChange = () => {
    if (rankChange === 0) return "No change";
    return rankChange > 0 ? `+${rankChange}` : rankChange.toString();
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant={getRankChangeColor()} className="flex items-center gap-1 cursor-help">
            {getRankChangeIcon()}
            <span className="text-xs">{formatRankChange()}</span>
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-sm space-y-1">
            <p>Rank: {oldRank} → {newRank}</p>
            <p>Points: {oldPoints} → {newPoints} ({pointsChange > 0 ? '+' : ''}{pointsChange})</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
