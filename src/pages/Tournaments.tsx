import { useState } from "react";
import { Link } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, MapPin, Trophy } from "lucide-react";
import { useTournaments } from "@/hooks/useTournaments";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export default function Tournaments() {
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [tierFilter, setTierFilter] = useState<string>("all");

  const { data: tournaments, isLoading } = useTournaments({
    category: categoryFilter === "all" ? undefined : categoryFilter,
    tier: tierFilter === "all" ? undefined : tierFilter,
  });

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-AU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Tournaments</h1>
          <p className="text-muted-foreground">Browse past tournaments and view results</p>
        </div>

        <div className="flex flex-wrap gap-4 mb-8">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="mens_singles">Men's Singles</SelectItem>
              <SelectItem value="womens_singles">Women's Singles</SelectItem>
              <SelectItem value="mens_doubles">Men's Doubles</SelectItem>
              <SelectItem value="womens_doubles">Women's Doubles</SelectItem>
              <SelectItem value="mixed_doubles">Mixed Doubles</SelectItem>
            </SelectContent>
          </Select>

          <Select value={tierFilter} onValueChange={setTierFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Tier" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tiers</SelectItem>
              <SelectItem value="tier1">Tier 1</SelectItem>
              <SelectItem value="tier2">Tier 2</SelectItem>
              <SelectItem value="tier3">Tier 3</SelectItem>
              <SelectItem value="tier4">Tier 4</SelectItem>
              <SelectItem value="historic">Historic</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : tournaments && tournaments.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {tournaments.map((tournament) => (
              <Link key={`${tournament.tournament_name}-${tournament.match_date}`} to={`/tournaments/${tournament.earliest_event_id}`}>
                <Card className="h-full hover:border-primary transition-colors cursor-pointer">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <Trophy className="h-5 w-5 text-primary" />
                      <Badge variant={tournament.tier === 'tier1' ? 'default' : 'secondary'}>
                        {tournament.tier.toUpperCase()}
                      </Badge>
                    </div>
                    <CardTitle className="text-xl">{tournament.tournament_name}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4 mr-2" />
                      {formatDate(tournament.match_date)}
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {tournament.categories.map((cat) => (
                        <Badge key={cat} variant="outline" className="text-xs">
                          {getCategoryLabel(cat)}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {tournament.event_count} {tournament.event_count === 1 ? 'category' : 'categories'}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <Trophy className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No tournaments found</h3>
            <p className="text-muted-foreground">Try adjusting your filters</p>
          </Card>
        )}
      </main>
    </div>
  );
}
