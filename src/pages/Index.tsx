import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Trophy, TrendingUp, Users, Award } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <section className="py-12 sm:py-16 md:py-20 px-4" style={{ background: "var(--gradient-hero)" }}>
        <div className="container mx-auto text-center">
          <Trophy className="h-16 w-16 sm:h-20 sm:w-20 text-white mx-auto mb-4 sm:mb-6" />
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground mb-4 sm:mb-6 px-2">
            National Pickleball League
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-primary-foreground/90 mb-6 sm:mb-8 max-w-2xl mx-auto px-2">
            Australia's premier pickleball competition. Track player ratings, and follow the best place to play
            pickleball in Australia.
          </p>
          <Link to="/rankings">
            <Button size="lg" variant="secondary" className="text-base sm:text-lg px-6 py-5 sm:px-8 sm:py-6">
              View Rankings
            </Button>
          </Link>
        </div>
      </section>

      <section className="py-12 sm:py-16 px-4 bg-muted/30">
        <div className="container mx-auto">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-8 sm:mb-12 text-foreground">How It Works</h2>

          <div className="grid md:grid-cols-3 gap-6 sm:gap-8 max-w-5xl mx-auto">
            <div
              className="p-6 sm:p-8 rounded-lg text-center transition-all hover:shadow-[var(--shadow-hover)]"
              style={{
                background: "var(--gradient-card)",
                boxShadow: "var(--shadow-card)",
              }}
            >
              <Users className="h-10 w-10 sm:h-12 sm:w-12 text-primary mx-auto mb-3 sm:mb-4" />
              <h3 className="text-lg sm:text-xl font-bold mb-2 text-foreground">Players Compete</h3>
              <p className="text-muted-foreground">Players compete in official tournaments across various categories</p>
            </div>

            <div
              className="p-6 sm:p-8 rounded-lg text-center transition-all hover:shadow-[var(--shadow-hover)]"
              style={{
                background: "var(--gradient-card)",
                boxShadow: "var(--shadow-card)",
              }}
            >
              <TrendingUp className="h-10 w-10 sm:h-12 sm:w-12 text-secondary mx-auto mb-3 sm:mb-4" />
              <h3 className="text-lg sm:text-xl font-bold mb-2 text-foreground">Points Awarded</h3>
              <p className="text-muted-foreground">
                Event results are recorded and points are automatically calculated
              </p>
            </div>

            <div
              className="p-6 sm:p-8 rounded-lg text-center transition-all hover:shadow-[var(--shadow-hover)]"
              style={{
                background: "var(--gradient-card)",
                boxShadow: "var(--shadow-card)",
              }}
            >
              <Award className="h-10 w-10 sm:h-12 sm:w-12 text-accent mx-auto mb-3 sm:mb-4" />
              <h3 className="text-lg sm:text-xl font-bold mb-2 text-foreground">Rankings Updated</h3>
              <p className="text-muted-foreground">Player rankings are updated in real-time based on total points</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 sm:py-16 px-4">
        <div className="container mx-auto">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-8 sm:mb-12 text-foreground">Categories</h2>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 sm:gap-6 max-w-6xl mx-auto">
            {["Men's Singles", "Women's Singles", "Men's Doubles", "Women's Doubles", "Mixed Doubles"].map(
              (category) => (
                <div
                  key={category}
                  className="p-4 sm:p-6 rounded-lg text-center transition-all hover:shadow-[var(--shadow-hover)]"
                  style={{
                    background: "var(--gradient-card)",
                    boxShadow: "var(--shadow-card)",
                  }}
                >
                  <Trophy className="h-8 w-8 sm:h-10 sm:w-10 text-secondary mx-auto mb-2 sm:mb-3" />
                  <h3 className="text-sm sm:text-base font-bold text-foreground">{category}</h3>
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
