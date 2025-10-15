import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Trophy, TrendingUp, Users, Award } from "lucide-react";
import nplLogo from "@/assets/npl-logo-light.svg";
import gpaLogo from "@/assets/gpa-logo-light.svg";
import { LatestResults } from "@/components/home/LatestResults";
import { UpcomingTournaments } from "@/components/home/UpcomingTournaments";
import { useOrganization } from "@/contexts/OrganizationContext";

const Index = () => {
  const { currentOrg, isLoading } = useOrganization();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  const isGPA = currentOrg?.slug === 'gpa';
  const logo = isGPA ? gpaLogo : nplLogo;
  const heroGradient = isGPA ? 'var(--gpa-gradient-hero)' : 'var(--gradient-hero)';
  const title = isGPA ? 'Global Pickleball Alliance' : 'Pickleball Rankings';
  const description = isGPA 
    ? 'Professional pickleball goes global. Seven international partners unite to create one world calendar, unified rankings, and unprecedented opportunities for players worldwide.'
    : "Australia's premier pickleball competition. Track player ratings and follow the best place to play pickleball in Australia.";

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <section
        className="py-16 sm:py-20 md:py-28 px-4 relative overflow-hidden"
        style={{ background: heroGradient }}
      >
        <div className="container mx-auto text-center relative z-10">
          <img
            src={logo}
            alt={`${currentOrg?.name} Logo`}
            className="h-32 w-32 sm:h-40 sm:w-40 mx-auto mb-6 sm:mb-8 drop-shadow-lg animate-fade-in"
          />
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-heading font-bold text-primary-foreground mb-6 sm:mb-8 px-2 tracking-tight">
            {title}
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl text-primary-foreground/95 mb-8 sm:mb-10 max-w-3xl mx-auto px-2 leading-relaxed">
            {description}
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
            {isGPA && (
              <Link to="/about">
                <Button
                  size="lg"
                  variant="secondary"
                  className="text-base sm:text-lg px-8 py-6 sm:px-10 sm:py-7 w-full sm:w-auto font-semibold hover-lift shadow-lg"
                >
                  Learn About GPA
                </Button>
              </Link>
            )}
            <Link to="/rankings">
              <Button
                size="lg"
                variant={isGPA ? "outline" : "secondary"}
                className="text-base sm:text-lg px-8 py-6 sm:px-10 sm:py-7 w-full sm:w-auto font-semibold hover-lift shadow-lg"
              >
                View Rankings
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {isGPA && (
        <section className="py-16 sm:py-20 px-4">
          <div className="container mx-auto max-w-4xl">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-heading font-bold text-center mb-8 text-foreground">
              A New Era for Professional Pickleball
            </h2>
            <p className="text-lg text-muted-foreground text-center mb-12 max-w-3xl mx-auto">
              The Global Pickleball Alliance brings together seven international organizations to deliver a coordinated calendar of 30+ tournaments, unified world rankings, and a tiered prize structure for professional players.
            </p>
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="glass-card p-6 rounded-xl">
                <h3 className="text-xl font-heading font-bold mb-3 text-foreground">Member Organizations</h3>
                <ul className="text-muted-foreground space-y-2">
                  <li>• Association of Pickleball Players (APP)</li>
                  <li>• Canadian National Pickleball League</li>
                  <li>• European Pickleball Federation</li>
                  <li>• Global Sports (India)</li>
                  <li>• National Pickleball League (Australia)</li>
                  <li>• Pickleball England</li>
                  <li>• Pickleball D-Joy (Vietnam)</li>
                </ul>
              </div>
              <div className="glass-card p-6 rounded-xl">
                <h3 className="text-xl font-heading font-bold mb-3 text-foreground">2026 Season Highlights</h3>
                <ul className="text-muted-foreground space-y-2">
                  <li>• 30+ coordinated tournaments worldwide</li>
                  <li>• Unified global ranking system</li>
                  <li>• Three-tier tournament structure</li>
                  <li>• Events across 4 continents</li>
                  <li>• Strategic calendar coordination</li>
                  <li>• Progressive prize pools</li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="py-16 sm:py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-heading font-bold text-center mb-12 sm:mb-16 text-foreground">
            {isGPA ? 'How GPA Rankings Work' : 'How It Works'}
          </h2>

          <div className="grid md:grid-cols-3 gap-8 sm:gap-10 max-w-6xl mx-auto">
            <div
              className="glass-card p-8 sm:p-10 rounded-xl text-center hover-lift group"
              style={{ boxShadow: "var(--shadow-premium)" }}
            >
              <div className="bg-primary/10 w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 group-hover:scale-110 transition-transform">
                <Users className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
              </div>
              <h3 className="text-xl sm:text-2xl font-heading font-bold mb-3 text-foreground">Players Compete</h3>
              <p className="text-muted-foreground leading-relaxed">
                Players compete in official tournaments across various categories
              </p>
            </div>

            <div
              className="glass-card p-8 sm:p-10 rounded-xl text-center hover-lift group"
              style={{ boxShadow: "var(--shadow-premium)" }}
            >
              <div className="bg-primary/10 w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 group-hover:scale-110 transition-transform">
                <TrendingUp className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
              </div>
              <h3 className="text-xl sm:text-2xl font-heading font-bold mb-3 text-foreground">Points Awarded</h3>
              <p className="text-muted-foreground leading-relaxed">
                Event results are recorded and points are automatically calculated
              </p>
            </div>

            <div
              className="glass-card p-8 sm:p-10 rounded-xl text-center hover-lift group"
              style={{ boxShadow: "var(--shadow-premium)" }}
            >
              <div className="bg-primary/10 w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 group-hover:scale-110 transition-transform">
                <Award className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
              </div>
              <h3 className="text-xl sm:text-2xl font-heading font-bold mb-3 text-foreground">Rankings Updated</h3>
              <p className="text-muted-foreground leading-relaxed">
                Player rankings are updated in real-time based on total points
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20 px-4">
        <div className="container mx-auto">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-heading font-bold text-center mb-12 sm:mb-16 text-foreground">
            Categories
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6 sm:gap-8 max-w-6xl mx-auto">
            {["Men's Singles", "Women's Singles", "Men's Doubles", "Women's Doubles", "Mixed Doubles"].map(
              (category) => (
                <div
                  key={category}
                  className="glass-card p-6 sm:p-8 rounded-xl text-center hover-lift group"
                  style={{ boxShadow: "var(--shadow-card)" }}
                >
                  <div className="bg-primary/10 w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 group-hover:scale-110 transition-transform">
                    <Trophy className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
                  </div>
                  <h3 className="text-sm sm:text-base font-heading font-bold text-foreground">{category}</h3>
                </div>
              ),
            )}
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <UpcomingTournaments />
        </div>
      </section>

      <section className="py-16 sm:py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <LatestResults />
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
