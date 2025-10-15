import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Globe, Target, Users, Award } from "lucide-react";

const About = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-muted/20">
      <Navigation />
      
      <main className="flex-grow container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-12">
          {/* Hero Section */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-heading font-bold text-gradient bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              About the Global Pickleball Alliance
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Uniting pickleball federations worldwide with standardized international rankings
            </p>
          </div>

          {/* Mission Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-6 w-6 text-primary" />
                Our Mission
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground leading-relaxed">
                The Global Pickleball Alliance (GPA) is dedicated to fostering the growth and development of pickleball as a truly global sport. We provide a unified ranking system that allows players from different nations to compete fairly and transparently, regardless of where they play.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                By establishing consistent standards for tournament classification, point allocation, and player ranking across member federations, we ensure that every match contributes meaningfully to a player's global standing.
              </p>
            </CardContent>
          </Card>

          {/* Vision Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-6 w-6 text-primary" />
                Our Vision
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                We envision a world where pickleball is recognized as a premier international sport, with clear pathways for players to progress from local clubs to world championships. Through collaboration between national federations, we aim to create opportunities for cross-border competition, cultural exchange, and the elevation of the sport to new heights.
              </p>
            </CardContent>
          </Card>

          {/* Core Values */}
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Inclusivity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Welcoming players of all skill levels, ages, and backgrounds from every corner of the globe.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-primary" />
                  Excellence
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Maintaining the highest standards in tournament organization, officiating, and player development.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-primary" />
                  Unity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Bringing together national federations to create a cohesive, globally recognized sport.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* History Section */}
          <Card>
            <CardHeader>
              <CardTitle>Our History</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground leading-relaxed">
                Founded in 2025, the Global Pickleball Alliance emerged from conversations between leading national federations who recognized the need for standardized international competition. Starting with founding member NPL Australia, the GPA quickly grew to encompass federations from across Asia-Pacific, Europe, and the Americas.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Today, the GPA coordinates rankings for thousands of players competing in hundreds of sanctioned tournaments annually, providing a transparent and fair system that rewards consistent performance and competitive achievement.
              </p>
            </CardContent>
          </Card>

          {/* Leadership Section */}
          <Card>
            <CardHeader>
              <CardTitle>Leadership</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold text-lg mb-2">Executive Board</h3>
                <div className="space-y-2 text-muted-foreground">
                  <p><span className="font-medium text-foreground">President:</span> TBD</p>
                  <p><span className="font-medium text-foreground">Vice President:</span> TBD</p>
                  <p><span className="font-medium text-foreground">Secretary General:</span> TBD</p>
                  <p><span className="font-medium text-foreground">Treasurer:</span> TBD</p>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold text-lg mb-2">Technical Committee</h3>
                <p className="text-sm text-muted-foreground">
                  Responsible for overseeing tournament standards, rankings calculations, and rule uniformity across member federations.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default About;
