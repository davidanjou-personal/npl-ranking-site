import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Target, TrendingUp, Users, Globe, Award } from "lucide-react";

const HowItWorks = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-muted/20">
      <Navigation />
      
      <main className="flex-grow container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-12">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-heading font-bold text-gradient bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              How GPA Rankings Work
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              A transparent, standardized system for global pickleball competition
            </p>
          </div>

          {/* Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-6 w-6 text-primary" />
                Global Ranking System
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground leading-relaxed">
                The GPA uses a rolling 12-month points-based system to rank players across member federations. 
                Every sanctioned tournament contributes to a player's global ranking, regardless of where it's held.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                This ensures fair competition between players from different countries and creates clear pathways 
                to international competition and recognition.
              </p>
            </CardContent>
          </Card>

          {/* Tournament Tiers */}
          <div>
            <h2 className="text-2xl font-heading font-bold mb-6">Tournament Classification</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <Card className="border-l-4 border-l-primary">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-primary" />
                    Tier 1 - International Championships
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">
                    Premier international events sanctioned by the GPA. Highest level of competition.
                  </p>
                  <div className="text-2xl font-bold text-primary">1,000 points</div>
                  <p className="text-xs text-muted-foreground mt-1">Winner receives full points</p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-primary/70">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Award className="h-5 w-5 text-primary" />
                    Tier 2 - National Championships
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">
                    National championship events held by member federations.
                  </p>
                  <div className="text-2xl font-bold text-primary">500 points</div>
                  <p className="text-xs text-muted-foreground mt-1">Winner receives full points</p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-primary/50">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    Tier 3 - Regional Tournaments
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">
                    Significant regional competitions with international participation.
                  </p>
                  <div className="text-2xl font-bold text-primary">250 points</div>
                  <p className="text-xs text-muted-foreground mt-1">Winner receives full points</p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-primary/30">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    Tier 4 - Sanctioned Events
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">
                    Local and regional tournaments sanctioned by member federations.
                  </p>
                  <div className="text-2xl font-bold text-primary">100 points</div>
                  <p className="text-xs text-muted-foreground mt-1">Winner receives full points</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Points Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-6 w-6 text-primary" />
                Points Distribution by Finishing Position
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <span className="font-semibold">Winner (1st Place)</span>
                  <span className="text-primary font-bold">100% of tier points</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <span className="font-semibold">Runner-up (2nd Place)</span>
                  <span className="text-primary font-bold">80% of tier points</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <span className="font-semibold">3rd Place</span>
                  <span className="text-primary font-bold">60% of tier points</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <span className="font-semibold">4th Place</span>
                  <span className="text-primary font-bold">40% of tier points</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <span className="font-semibold">Quarter-finalist</span>
                  <span className="text-primary font-bold">25% of tier points</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <span className="font-semibold">Round of 16</span>
                  <span className="text-primary font-bold">15% of tier points</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Rolling 12-Month System */}
          <Card>
            <CardHeader>
              <CardTitle>Rolling 12-Month System</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground leading-relaxed">
                Player rankings are based on their performance over the most recent 12 months. As new tournaments 
                are completed, older results gradually age out of the calculation.
              </p>
              <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                <p className="text-sm font-semibold text-foreground">Example:</p>
                <p className="text-sm text-muted-foreground">
                  • If you won a Tier 2 tournament on March 15, 2024, you earned 500 points<br/>
                  • Those points remain active until March 14, 2025<br/>
                  • On March 15, 2025, those points are removed from your total<br/>
                  • This ensures rankings reflect current form and recent achievements
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Categories */}
          <Card>
            <CardHeader>
              <CardTitle>Competition Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                The GPA maintains separate rankings for each competition format:
              </p>
              <div className="grid md:grid-cols-2 gap-3">
                <div className="p-3 bg-muted/30 rounded-lg">
                  <div className="font-semibold text-foreground">Men's Singles</div>
                  <p className="text-xs text-muted-foreground mt-1">Individual competition</p>
                </div>
                <div className="p-3 bg-muted/30 rounded-lg">
                  <div className="font-semibold text-foreground">Women's Singles</div>
                  <p className="text-xs text-muted-foreground mt-1">Individual competition</p>
                </div>
                <div className="p-3 bg-muted/30 rounded-lg">
                  <div className="font-semibold text-foreground">Men's Doubles</div>
                  <p className="text-xs text-muted-foreground mt-1">Team competition</p>
                </div>
                <div className="p-3 bg-muted/30 rounded-lg">
                  <div className="font-semibold text-foreground">Women's Doubles</div>
                  <p className="text-xs text-muted-foreground mt-1">Team competition</p>
                </div>
                <div className="p-3 bg-muted/30 rounded-lg">
                  <div className="font-semibold text-foreground">Men's Mixed Doubles</div>
                  <p className="text-xs text-muted-foreground mt-1">Mixed team competition</p>
                </div>
                <div className="p-3 bg-muted/30 rounded-lg">
                  <div className="font-semibold text-foreground">Women's Mixed Doubles</div>
                  <p className="text-xs text-muted-foreground mt-1">Mixed team competition</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tournament Sanctioning */}
          <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
            <CardHeader>
              <CardTitle>Tournament Sanctioning</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground leading-relaxed">
                For a tournament to count toward GPA rankings, it must be sanctioned by a member federation 
                and meet minimum standards for:
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <div className="mt-1 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                  <span>Certified officiating and scoring</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="mt-1 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                  <span>Minimum number of participating players</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="mt-1 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                  <span>Adherence to official GPA rules and regulations</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="mt-1 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                  <span>Proper registration and results reporting</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default HowItWorks;
