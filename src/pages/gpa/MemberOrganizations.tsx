import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, MapPin } from "lucide-react";

const MemberOrganizations = () => {
  const members = [
    {
      name: "NPL Australia",
      country: "Australia",
      region: "Asia-Pacific",
      status: "Founding Member",
      website: "https://nplrankings.com",
      description: "National Pickleball League - Australia's premier pickleball ranking system",
      joined: "2025",
    },
    // Placeholder for future members
    {
      name: "New Zealand Pickleball Federation",
      country: "New Zealand", 
      region: "Asia-Pacific",
      status: "Prospective Member",
      website: "#",
      description: "Leading pickleball organization in New Zealand",
      joined: "TBD",
    },
    {
      name: "Singapore Pickleball Association",
      country: "Singapore",
      region: "Asia-Pacific",
      status: "Prospective Member",
      website: "#",
      description: "Governing body for pickleball in Singapore",
      joined: "TBD",
    },
    {
      name: "Malaysia Pickleball Association",
      country: "Malaysia",
      region: "Asia-Pacific",
      status: "Prospective Member",
      website: "#",
      description: "National federation for pickleball in Malaysia",
      joined: "TBD",
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
              National federations united in growing pickleball globally
            </p>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-3xl font-bold text-primary">1</div>
                <div className="text-sm text-muted-foreground">Active Members</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-3xl font-bold text-primary">3</div>
                <div className="text-sm text-muted-foreground">Prospective Members</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-3xl font-bold text-primary">2</div>
                <div className="text-sm text-muted-foreground">Regions</div>
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
                The GPA welcomes national federations committed to growing pickleball through standardized competition and player development. 
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
