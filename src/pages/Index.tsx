import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Trophy, TrendingUp, Users, Award } from "lucide-react";
import nplLogo from "@/assets/npl-logo.svg";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <section className="py-16 sm:py-20 md:py-28 px-4 relative overflow-hidden" style={{ background: "var(--gradient-hero)" }}>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }} />
        </div>
        <div className="container mx-auto text-center relative z-10">
          <img src={nplLogo} alt="NPL Logo" className="h-20 w-20 sm:h-28 sm:w-28 mx-auto mb-6 sm:mb-8 drop-shadow-lg animate-fade-in" />
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-heading font-bold text-primary-foreground mb-6 sm:mb-8 px-2 tracking-tight">
            National Pickleball League
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl text-primary-foreground/95 mb-8 sm:mb-10 max-w-3xl mx-auto px-2 leading-relaxed">
            Australia's premier pickleball competition. Track player ratings and follow the best place to play
            pickleball in Australia.
          </p>
          <div className="flex justify-center gap-4">
            <Link to="/rankings">
              <Button size="lg" variant="secondary" className="text-base sm:text-lg px-8 py-6 sm:px-10 sm:py-7 w-full sm:w-auto font-semibold hover-lift shadow-lg">
                View Rankings
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-heading font-bold text-center mb-12 sm:mb-16 text-foreground">How It Works</h2>

          <div className="grid md:grid-cols-3 gap-8 sm:gap-10 max-w-6xl mx-auto">
            <div
              className="glass-card p-8 sm:p-10 rounded-xl text-center hover-lift group"
              style={{ boxShadow: "var(--shadow-premium)" }}
            >
              <div className="bg-primary/10 w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 group-hover:scale-110 transition-transform">
                <Users className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
              </div>
              <h3 className="text-xl sm:text-2xl font-heading font-bold mb-3 text-foreground">Players Compete</h3>
              <p className="text-muted-foreground leading-relaxed">Players compete in official tournaments across various categories</p>
            </div>

            <div
              className="glass-card p-8 sm:p-10 rounded-xl text-center hover-lift group"
              style={{ boxShadow: "var(--shadow-premium)" }}
            >
              <div className="bg-secondary/10 w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 group-hover:scale-110 transition-transform">
                <TrendingUp className="h-8 w-8 sm:h-10 sm:w-10 text-secondary" />
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
              <div className="bg-accent/10 w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 group-hover:scale-110 transition-transform">
                <Award className="h-8 w-8 sm:h-10 sm:w-10 text-accent" />
              </div>
              <h3 className="text-xl sm:text-2xl font-heading font-bold mb-3 text-foreground">Rankings Updated</h3>
              <p className="text-muted-foreground leading-relaxed">Player rankings are updated in real-time based on total points</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20 px-4">
        <div className="container mx-auto">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-heading font-bold text-center mb-12 sm:mb-16 text-foreground">Categories</h2>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-6 sm:gap-8 max-w-6xl mx-auto">
            {["Men's Singles", "Women's Singles", "Men's Doubles", "Women's Doubles", "Mixed Doubles"].map(
              (category) => (
                <div
                  key={category}
                  className="glass-card p-6 sm:p-8 rounded-xl text-center hover-lift group"
                  style={{ boxShadow: "var(--shadow-card)" }}
                >
                  <div className="bg-secondary/10 w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 group-hover:scale-110 transition-transform">
                    <Trophy className="h-6 w-6 sm:h-7 sm:w-7 text-secondary" />
                  </div>
                  <h3 className="text-sm sm:text-base font-heading font-bold text-foreground">{category}</h3>
                </div>
              ),
            )}
          </div>
        </div>
      </section>

      <footer className="border-t py-8 px-4 bg-card">
        <div className="container mx-auto text-center text-muted-foreground">
          <p>&copy; 2025 National Pickleball League. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
