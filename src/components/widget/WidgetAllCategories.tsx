import { useSearchParams, Link } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useWidgetRankings } from "@/hooks/useWidgetRankings";
import { WidgetLeaderboardTable } from "./WidgetLeaderboardTable";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const categories = [
  { value: "mens_singles", label: "Men's Singles" },
  { value: "womens_singles", label: "Women's Singles" },
  { value: "mens_doubles", label: "Men's Doubles" },
  { value: "womens_doubles", label: "Women's Doubles" },
  { value: "mixed_doubles", label: "Mixed Doubles" },
];

export const WidgetAllCategories = () => {
  const [searchParams] = useSearchParams();
  
  const country = searchParams.get("country") || "Australia";
  const limit = parseInt(searchParams.get("limit") || "10");
  const defaultCategory = searchParams.get("defaultCategory") || "mens_singles";
  const compact = searchParams.get("compact") === "true";

  return (
    <div className="w-full p-3 sm:p-4">
      <div className="mb-3 sm:mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <h1 className="text-2xl sm:text-3xl font-bold">NPL Rankings</h1>
        <span className="text-xs sm:text-sm text-muted-foreground">{country}</span>
      </div>

      <Tabs defaultValue={defaultCategory} className="w-full">
        <TabsList className="w-full grid grid-cols-2 md:grid-cols-5 gap-1 mb-4">
          {categories.map((cat) => (
            <TabsTrigger key={cat.value} value={cat.value} className="text-xs md:text-sm">
              {cat.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {categories.map((cat) => (
          <TabsContent key={cat.value} value={cat.value} className="space-y-4">
            <CategoryContent 
              category={cat.value} 
              country={country} 
              limit={limit}
              compact={compact}
            />
          </TabsContent>
        ))}
      </Tabs>

      <div className="flex justify-center pt-3 sm:pt-4 mt-3 sm:mt-4 border-t">
        <Link to={`/rankings?country=${country}`} target="_parent" className="w-full sm:w-auto">
          <Button variant="default" size="sm" className="w-full text-xs sm:text-sm">
            View All Rankings
            <ExternalLink className="ml-2 h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
};

const CategoryContent = ({ 
  category, 
  country, 
  limit,
  compact 
}: { 
  category: string; 
  country: string; 
  limit: number;
  compact: boolean;
}) => {
  const { data: players, isLoading } = useWidgetRankings(category, country, limit);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  return (
    <WidgetLeaderboardTable 
      players={players || []} 
      category={category}
      compact={compact}
    />
  );
};
