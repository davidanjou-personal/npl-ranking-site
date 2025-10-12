import { useState } from "react";
import { Link } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, MapPin, Trophy, ExternalLink } from "lucide-react";
import { useTournaments } from "@/hooks/useTournaments";
import { useUpcomingTournaments } from "@/hooks/useUpcomingTournaments";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatDistanceToNow } from "date-fns";

export default function Tournaments() {
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [tierFilter, setTierFilter] = useState<string>("all");

  const { data: tournaments, isLoading } = useTournaments({
    category: categoryFilter === "all" ? undefined : categoryFilter,
    tier: tierFilter === "all" ? undefined : tierFilter,
  });

  const { data: upcomingTournaments, isLoading: isLoadingUpcoming } = useUpcomingTournaments();

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

  const formatUpcomingDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays <= 7 && diffInDays >= 0) {
      return `in ${formatDistanceToNow(date)}`;
    }
    return formatDate(dateString);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Tournaments</h1>
          <p className="text-muted-foreground">Browse upcoming and past tournaments</p>
        </div>

        {/* Upcoming Tournaments Section */}
        {!isLoadingUpcoming && upcomingTournaments && upcomingTournaments.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <h2 className="text-2xl font-semibold">Upcoming Tournaments</h2>
              <Badge variant="secondary">New</Badge>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {upcomingTournaments.map((tournament) => (
                <Card key={tournament.id} className="h-full border-l-4 border-l-primary bg-accent/5 hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <Calendar className="h-5 w-5 text-primary" />
                      {tournament.is_featured && (
                        <Badge variant="default">Featured</Badge>
                      )}
                    </div>
                    <CardTitle className="text-xl">{tournament.tournament_name}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4 mr-2" />
                      {formatUpcomingDate(tournament.tournament_date)}
                    </div>
                    {tournament.location && (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4 mr-2" />
                        {tournament.location}
                      </div>
                    )}
                    {tournament.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {tournament.description}
                      </p>
                    )}
                    <Button asChild className="w-full mt-4">
                      <a href={tournament.registration_url} target="_blank" rel="noopener noreferrer">
                        Register Now
                        <ExternalLink className="ml-2 h-4 w-4" />
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Separator */}
        {!isLoadingUpcoming && upcomingTournaments && upcomingTournaments.length > 0 && (
          <div className="mb-8">
            <Separator className="mb-4" />
            <h2 className="text-2xl font-semibold mb-6">Past Tournament Results</h2>
          </div>
        )}

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
                      {(tournament.categories || []).map((cat) => (
                        <Badge key={cat} variant="outline" className="text-xs">
                          {getCategoryLabel(cat)}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {tournament.event_count || 1} {(tournament.event_count || 1) === 1 ? 'category' : 'categories'}
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
      <Footer />
    </div>
  );
}
