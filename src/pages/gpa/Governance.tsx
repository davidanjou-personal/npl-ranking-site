import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { FileText, Users, Scale, Award } from "lucide-react";

const Governance = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-muted/20">
      <Navigation />
      
      <main className="flex-grow container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-12">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-heading font-bold text-gradient bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Governance & Structure
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Transparent leadership and decision-making for the global pickleball community
            </p>
          </div>

          {/* Organizational Structure */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-6 w-6 text-primary" />
                Organizational Structure
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold text-lg mb-3">Executive Board</h3>
                <p className="text-muted-foreground mb-4">
                  The Executive Board provides strategic direction and oversees the GPA's operations. Board members are elected by member federations for three-year terms.
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• <span className="font-medium text-foreground">President:</span> Leads the organization and represents the GPA internationally</li>
                  <li>• <span className="font-medium text-foreground">Vice President:</span> Supports the President and leads special initiatives</li>
                  <li>• <span className="font-medium text-foreground">Secretary General:</span> Manages communications and member relations</li>
                  <li>• <span className="font-medium text-foreground">Treasurer:</span> Oversees financial management and budgeting</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-3">Technical Committee</h3>
                <p className="text-muted-foreground text-sm">
                  Comprises representatives from member federations with expertise in tournament operations, 
                  rankings systems, and competition rules. Responsible for maintaining technical standards 
                  and ensuring fair play across all sanctioned events.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-3">Member Assembly</h3>
                <p className="text-muted-foreground text-sm">
                  Each member federation has one vote in the annual Member Assembly, where major decisions 
                  about rules, policies, and strategic direction are made democratically.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Decision-Making Process */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scale className="h-6 w-6 text-primary" />
                Decision-Making Process
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="proposals">
                  <AccordionTrigger>How are proposals submitted?</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Any member federation or the Executive Board can submit proposals for rule changes, 
                    policy updates, or new initiatives. Proposals must be submitted at least 30 days before 
                    the annual Member Assembly to allow for proper review and discussion.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="voting">
                  <AccordionTrigger>Voting Requirements</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Major decisions require a two-thirds majority vote of member federations. Routine 
                    operational matters can be decided by simple majority. The Executive Board has authority 
                    to make urgent decisions between assemblies, subject to ratification at the next meeting.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="transparency">
                  <AccordionTrigger>Transparency & Accountability</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    All meeting minutes, financial reports, and policy documents are made available to member 
                    federations. The GPA publishes an annual report detailing activities, finances, and 
                    achievements accessible to the public.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="disputes">
                  <AccordionTrigger>Dispute Resolution</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Disputes between member federations or regarding player rankings are handled by an 
                    independent arbitration panel. The panel's decisions are binding and made according to 
                    established GPA bylaws and international sporting standards.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          {/* Key Policies */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-6 w-6 text-primary" />
                Key Policies & Documents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <a 
                  href="#" 
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors"
                >
                  <span className="font-medium">Constitution & Bylaws</span>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </a>
                <a 
                  href="#" 
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors"
                >
                  <span className="font-medium">Code of Conduct</span>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </a>
                <a 
                  href="#" 
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors"
                >
                  <span className="font-medium">Ranking System Guidelines</span>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </a>
                <a 
                  href="#" 
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors"
                >
                  <span className="font-medium">Tournament Sanctioning Rules</span>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </a>
                <a 
                  href="#" 
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors"
                >
                  <span className="font-medium">Financial Transparency Report 2025</span>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </a>
              </div>
            </CardContent>
          </Card>

          {/* Ethics & Integrity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-6 w-6 text-primary" />
                Ethics & Integrity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground leading-relaxed">
                The GPA is committed to maintaining the highest standards of ethical conduct and sporting 
                integrity. We have zero tolerance for match-fixing, doping, or any form of cheating or 
                unsportsmanlike behavior.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                All member federations must adhere to the World Anti-Doping Agency (WADA) code and implement 
                appropriate testing protocols. Players, coaches, and officials are required to complete 
                annual ethics training and sign the GPA Code of Conduct.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Governance;
