import { Calendar, MapPin, ExternalLink, Star } from "lucide-react";
import { format, formatDistanceToNow, isBefore, addDays } from "date-fns";
import { useUpcomingTournaments } from "@/hooks/useUpcomingTournaments";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export const UpcomingTournaments = () => {
  const { data: tournaments, isLoading, error } = useUpcomingTournaments();

  const formatTournamentDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const weekFromNow = addDays(today, 7);

    if (isBefore(date, weekFromNow)) {
      return formatDistanceToNow(date, { addSuffix: true });
    }
    return format(date, "MMMM d, yyyy");
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-heading font-bold text-center mb-8 sm:mb-12 text-foreground">
          Upcoming Tournaments
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-6">
              <Skeleton className="h-6 w-3/4 mb-4" />
              <Skeleton className="h-4 w-1/2 mb-2" />
              <Skeleton className="h-4 w-2/3 mb-4" />
              <Skeleton className="h-10 w-full" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return null;
  }

  if (!tournaments || tournaments.length === 0) {
    return (
      <div className="text-center py-12">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-heading font-bold mb-8 text-foreground">
          Upcoming Tournaments
        </h2>
        <p className="text-muted-foreground text-lg">No upcoming tournaments scheduled yet. Check back soon!</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h2 className="text-3xl sm:text-4xl md:text-5xl font-heading font-bold text-center text-foreground">
        Upcoming Tournaments
      </h2>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tournaments.map((tournament) => (
          <Card
            key={tournament.id}
            className="glass-card p-6 hover-lift group relative overflow-hidden"
            style={{ boxShadow: "var(--shadow-card)" }}
          >
            {tournament.is_featured && (
              <Badge className="absolute top-4 right-4 bg-primary text-primary-foreground">
                <Star className="h-3 w-3 mr-1" />
                Featured
              </Badge>
            )}
            
            <h3 className="text-xl font-heading font-bold mb-4 text-foreground pr-20">
              {tournament.tournament_name}
            </h3>
            
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4 flex-shrink-0" />
                <span className="text-sm">{formatTournamentDate(tournament.tournament_date)}</span>
              </div>
              
              {tournament.location && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4 flex-shrink-0" />
                  <span className="text-sm">{tournament.location}</span>
                </div>
              )}
              
              {tournament.description && (
                <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
                  {tournament.description}
                </p>
              )}
            </div>
            
            <Button
              className="w-full"
              onClick={() => window.open(tournament.registration_url, '_blank')}
            >
              Register Now
              <ExternalLink className="ml-2 h-4 w-4" />
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
};
