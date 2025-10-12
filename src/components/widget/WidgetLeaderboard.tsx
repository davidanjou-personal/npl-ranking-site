import { useSearchParams, Link } from "react-router-dom";
import { useWidgetRankings } from "@/hooks/useWidgetRankings";
import { WidgetLeaderboardTable } from "./WidgetLeaderboardTable";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface WidgetLeaderboardProps {
  category: string;
  defaultCountry?: string;
  defaultLimit?: number;
  hideHeader?: boolean;
  compact?: boolean;
  theme?: "light" | "dark";
}

export const WidgetLeaderboard = ({
  category,
  defaultCountry = "Australia",
  defaultLimit = 10,
  hideHeader = false,
  compact = false,
  theme = "light",
}: WidgetLeaderboardProps) => {
  const [searchParams] = useSearchParams();
  
  const country = searchParams.get("country") || defaultCountry;
  const limit = parseInt(searchParams.get("limit") || String(defaultLimit));
  const hideHeaderParam = searchParams.get("hideHeader") === "true";
  const compactParam = searchParams.get("compact") === "true";
  
  const { data: players, isLoading, error } = useWidgetRankings(category, country, limit);

  const getCategoryName = (cat: string) => {
    const names: Record<string, string> = {
      mens_singles: "Men's Singles",
      womens_singles: "Women's Singles",
      mens_doubles: "Men's Doubles",
      womens_doubles: "Women's Doubles",
      mixed_doubles: "Mixed Doubles",
    };
    return names[cat] || cat;
  };

  if (isLoading) {
    return (
      <div className="w-full p-4 space-y-4">
        {!hideHeader && !hideHeaderParam && (
          <Skeleton className="h-8 w-48" />
        )}
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full p-4 text-center text-muted-foreground">
        Failed to load rankings. Please try again later.
      </div>
    );
  }

  return (
    <div className={`w-full p-4 ${compact || compactParam ? "space-y-2" : "space-y-4"}`}>
      {!hideHeader && !hideHeaderParam && (
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">{getCategoryName(category)}</h2>
          <span className="text-sm text-muted-foreground">{country} Rankings</span>
        </div>
      )}

      <WidgetLeaderboardTable 
        players={players || []} 
        category={category}
        compact={compact || compactParam}
        country={country}
      />

      <div className="flex justify-center pt-4">
        <Link to={`/rankings?country=${country}&category=${category}`} target="_parent">
          <Button variant="outline" size="sm" className="w-full sm:w-auto">
            View Full Rankings
            <ExternalLink className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
};
