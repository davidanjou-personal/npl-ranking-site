import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trophy, Calendar, TrendingUp, Info } from "lucide-react";
import { Link } from "react-router-dom";

export default function HowItWorks() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <div 
        className="py-16 px-4"
        style={{ background: "var(--gradient-hero)" }}
      >
        <div className="container mx-auto text-center">
          <Trophy className="h-16 w-16 text-primary-foreground mx-auto mb-4" />
          <h1 className="text-5xl font-bold text-primary-foreground mb-4">
            How Rankings Work
          </h1>
          <p className="text-xl text-primary-foreground/90 max-w-2xl mx-auto">
            Understanding the National Pickleball League ranking system
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 max-w-5xl">
        {/* Overview */}
        <section className="mb-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5 text-primary" />
                Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p>
                The NPL ranking system rewards players for their performance in sanctioned tournaments. 
                Points are calculated based on the tournament tier, finishing position, and are tracked 
                over a rolling 12-month period for current rankings.
              </p>
              <p>
                Rankings are maintained separately for five competition categories: Men's Singles, 
                Women's Singles, Men's Doubles, Women's Doubles, and Mixed Doubles.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Points Calculation */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-6 flex items-center gap-2">
            <TrendingUp className="h-7 w-7 text-primary" />
            Points Calculation
          </h2>

          <div className="space-y-6">
            {/* Tier Base Points */}
            <Card>
              <CardHeader>
                <CardTitle>Tournament Tier Base Points</CardTitle>
                <CardDescription>
                  Base points are determined by the tournament tier
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tier</TableHead>
                      <TableHead className="text-right">Base Points</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">Tier 1</TableCell>
                      <TableCell className="text-right">1,000</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Tier 2</TableCell>
                      <TableCell className="text-right">500</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Tier 3</TableCell>
                      <TableCell className="text-right">250</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Tier 4</TableCell>
                      <TableCell className="text-right">100</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Historic</TableCell>
                      <TableCell className="text-right text-muted-foreground">Varies</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Finishing Position Multipliers */}
            <Card>
              <CardHeader>
                <CardTitle>Finishing Position Multipliers</CardTitle>
                <CardDescription>
                  Your final points = Base Points × Position Multiplier
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Finishing Position</TableHead>
                      <TableHead className="text-right">Multiplier</TableHead>
                      <TableHead className="text-right">Tier 1 Example</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">Winner (1st Place)</TableCell>
                      <TableCell className="text-right">100% (×1.0)</TableCell>
                      <TableCell className="text-right font-semibold text-secondary">1,000 pts</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Runner-up (2nd Place)</TableCell>
                      <TableCell className="text-right">60% (×0.6)</TableCell>
                      <TableCell className="text-right font-semibold text-secondary">600 pts</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">3rd Place</TableCell>
                      <TableCell className="text-right">40% (×0.4)</TableCell>
                      <TableCell className="text-right font-semibold text-secondary">400 pts</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">4th Place</TableCell>
                      <TableCell className="text-right">30% (×0.3)</TableCell>
                      <TableCell className="text-right font-semibold text-secondary">300 pts</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Quarter Finalist</TableCell>
                      <TableCell className="text-right">20% (×0.2)</TableCell>
                      <TableCell className="text-right font-semibold text-secondary">200 pts</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Round of 16</TableCell>
                      <TableCell className="text-right">10% (×0.1)</TableCell>
                      <TableCell className="text-right font-semibold text-secondary">100 pts</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Event Participation*</TableCell>
                      <TableCell className="text-right">5% (×0.05)</TableCell>
                      <TableCell className="text-right font-semibold text-secondary">50 pts</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
                <p className="text-sm text-muted-foreground mt-4">
                  * Event Participation points are awarded to players who won at least one match 
                  but did not advance to the Round of 16 or better. Players who lost immediately 
                  receive 0 points.
                </p>
              </CardContent>
            </Card>

            {/* Calculation Example */}
            <Card style={{ background: "var(--gradient-card)" }}>
              <CardHeader>
                <CardTitle>Example Calculation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-4 bg-background/50 rounded-lg">
                  <p className="font-medium mb-2">Scenario: Quarter Finalist in Tier 2 Tournament</p>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p>• Tournament Tier: <span className="font-medium text-foreground">Tier 2</span></p>
                    <p>• Base Points: <span className="font-medium text-foreground">500 points</span></p>
                    <p>• Finishing Position: <span className="font-medium text-foreground">Quarter Finalist</span></p>
                    <p>• Multiplier: <span className="font-medium text-foreground">20% (×0.2)</span></p>
                  </div>
                  <Separator className="my-3" />
                  <p className="text-lg font-bold text-secondary">
                    Final Points: 500 × 0.2 = 100 points
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Rolling 12-Month Window */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-6 flex items-center gap-2">
            <Calendar className="h-7 w-7 text-primary" />
            Rolling 12-Month Window
          </h2>

          <Card>
            <CardHeader>
              <CardTitle>Current Rankings vs All-Time Rankings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-foreground mb-2">Current Rankings (12-month)</h3>
                <p className="text-muted-foreground">
                  Your current ranking is based on points earned from events within the last 12 months. 
                  As events age past 12 months, those points automatically drop off your current total. 
                  This system ensures rankings reflect recent performance and form.
                </p>
              </div>
              <Separator />
              <div>
                <h3 className="font-semibold text-foreground mb-2">All-Time Rankings</h3>
                <p className="text-muted-foreground">
                  All-time rankings track your total accumulated points across your entire career, 
                  with no time restrictions. This showcases your legacy and overall contribution to the sport.
                </p>
              </div>
              <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">Example:</strong> If you earned 600 points on January 15, 2024, 
                  those points will count toward your current ranking until January 15, 2025, when they expire 
                  from the 12-month window. However, they remain in your all-time total forever.
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Categories */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-6">Competition Categories</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { name: "Men's Singles", desc: "Individual male players compete one-on-one" },
              { name: "Women's Singles", desc: "Individual female players compete one-on-one" },
              { name: "Men's Doubles", desc: "Teams of two male players" },
              { name: "Women's Doubles", desc: "Teams of two female players" },
              { name: "Mixed Doubles", desc: "Teams with one male and one female player" },
            ].map((category) => (
              <Card key={category.name}>
                <CardHeader>
                  <CardTitle className="text-lg">{category.name}</CardTitle>
                  <CardDescription>{category.desc}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>

          <p className="text-sm text-muted-foreground mt-4">
            Rankings are maintained independently for each category. Performance in one category 
            does not affect rankings in another.
          </p>
        </section>

        {/* FAQs */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-6">Frequently Asked Questions</h2>

          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger>How often are rankings updated?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Rankings are updated immediately after event results are processed and verified. 
                Your points and rank will reflect the latest tournament outcomes as soon as they're officially recorded.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2">
              <AccordionTrigger>What happens if I don't play for several months?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                If you don't play for an extended period, your points from events older than 12 months 
                will gradually expire from your current ranking. However, your all-time ranking remains 
                intact. To maintain or improve your current ranking, consistent participation is important.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3">
              <AccordionTrigger>Can I see when my points will expire?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Yes! On your player profile page, you'll see warnings about points that are approaching 
                their 12-month expiration date. This helps you plan your tournament schedule strategically.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4">
              <AccordionTrigger>How do I earn points if I'm just starting?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Participate in any NPL sanctioned tournament! Even if you don't make it far in the bracket, 
                winning at least one match in any tier tournament will earn you points. Start with Tier 4 
                events to build experience and points, then work your way up to higher tiers.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5">
              <AccordionTrigger>What's the difference between tournament tiers?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Tier 1 tournaments are the most prestigious with the highest base points (1,000), typically 
                featuring the strongest competition. Tier 4 events are more accessible with lower base points (100), 
                perfect for newer players or local competitions. The tier structure ensures that both elite 
                and developing players can earn meaningful points at their level.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-6">
              <AccordionTrigger>Do doubles rankings count partners separately?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Yes! In doubles categories (Men's, Women's, and Mixed), each player on the team receives 
                the full points for their finishing position. Your doubles ranking is based on your individual 
                accumulated points, not your partnership combinations.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>

        {/* CTA Section */}
        <section>
          <Card style={{ background: "var(--gradient-card)", boxShadow: "var(--shadow-card)" }}>
            <CardHeader>
              <CardTitle>Ready to Check the Rankings?</CardTitle>
              <CardDescription>
                View current and all-time rankings across all categories
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-4">
              <Link to="/rankings">
                <Badge className="px-4 py-2 text-base cursor-pointer hover:bg-primary/90">
                  View Rankings →
                </Badge>
              </Link>
              <Link to="/">
                <Badge variant="outline" className="px-4 py-2 text-base cursor-pointer">
                  Back to Home
                </Badge>
              </Link>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
