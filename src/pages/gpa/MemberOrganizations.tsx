import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, MapPin } from "lucide-react";

const MemberOrganizations = () => {
  const members = [
    {
      name: "Association of Pickleball Players (APP)",
      country: "United States",
      region: "North America",
      status: "Founding Member",
      website: "https://theapp.global",
      description: "Leading professional pickleball tour and player organization in North America",
      joined: "2025",
    },
    {
      name: "Canadian National Pickleball League (CNPL)",
      country: "Canada",
      region: "North America",
      status: "Founding Member",
      website: "#",
      description: "Canada's premier professional pickleball league and ranking system",
      joined: "2025",
    },
    {
      name: "European Pickleball Federation (EPF)",
      country: "Europe",
      region: "Europe",
      status: "Founding Member",
      website: "#",
      description: "Unified federation governing professional pickleball across European nations",
      joined: "2025",
    },
    {
      name: "Global Sports",
      country: "India",
      region: "Asia",
      status: "Founding Member",
      website: "#",
      description: "India's largest tour operator driving professional pickleball growth in South Asia",
      joined: "2025",
    },
    {
      name: "National Pickleball League (NPL)",
      country: "Australia",
      region: "Asia-Pacific",
      status: "Founding Member",
      website: "https://nplrankings.com",
      description: "Australia's premier professional pickleball league and ranking system",
      joined: "2025",
    },
    {
      name: "Pickleball England",
      country: "England",
      region: "Europe",
      status: "Founding Member",
      website: "#",
      description: "National governing body for pickleball in England",
      joined: "2025",
    },
    {
      name: "Pickleball D-Joy",
      country: "Vietnam",
      region: "Asia",
      status: "Founding Member",
      website: "#",
      description: "Vietnam's leading pickleball tour operator and development organization",
      joined: "2025",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-muted/20">
      <Navigation />
      
      <main className="flex-grow container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-heading font-bold text-gradient bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Member Organizations
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              National federations and the world's largest tour operators united in growing pickleball globally
            </p>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-3xl font-bold text-primary">7</div>
                <div className="text-sm text-muted-foreground">Founding Members</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-3xl font-bold text-primary">30+</div>
                <div className="text-sm text-muted-foreground">2026 Events</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-3xl font-bold text-primary">4</div>
                <div className="text-sm text-muted-foreground">Continents</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-3xl font-bold text-primary">2025</div>
                <div className="text-sm text-muted-foreground">Founded</div>
              </CardContent>
            </Card>
          </div>

          {/* Member Cards */}
          <div className="grid md:grid-cols-2 gap-6">
            {members.map((member) => (
              <Card key={member.name} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <CardTitle className="text-xl">{member.name}</CardTitle>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        {member.country} • {member.region}
                      </div>
                    </div>
                    <Badge 
                      variant={member.status === "Founding Member" ? "default" : "secondary"}
                      className="whitespace-nowrap"
                    >
                      {member.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    {member.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Joined: {member.joined}
                    </span>
                    {member.website !== "#" && (
                      <a 
                        href={member.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline flex items-center gap-1"
                      >
                        Visit Website
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Call to Action */}
          <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
            <CardContent className="pt-6 text-center space-y-4">
              <h2 className="text-2xl font-heading font-bold">Interested in Joining?</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                The GPA welcomes national federations and the largest tour operators in their regions committed to growing pickleball through standardized competition and player development. 
                Contact us to learn about membership requirements and benefits.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a 
                  href="mailto:membership@gpa-pickleball.org" 
                  className="inline-flex items-center justify-center px-6 py-3 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  Contact Membership Team
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default MemberOrganizations;
