import { Navigation } from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const WidgetEmbedGuide = () => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const baseUrl = window.location.origin;

  const copyToClipboard = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    toast.success("Code copied to clipboard!");
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const embedCodes = {
    allCategories: `<iframe 
  src="${baseUrl}/widget/all-categories?country=Australia&limit=10"
  width="100%"
  height="650px"
  frameborder="0"
  scrolling="no"
  style="border: none; max-width: 100%;"
></iframe>`,
    mensSingles: `<iframe 
  src="${baseUrl}/widget/mens-singles?country=Australia&limit=10"
  width="100%"
  height="550px"
  frameborder="0"
  scrolling="no"
  style="border: none; max-width: 100%;"
></iframe>`,
    womensSingles: `<iframe 
  src="${baseUrl}/widget/womens-singles?country=Australia&limit=10"
  width="100%"
  height="550px"
  frameborder="0"
  scrolling="no"
  style="border: none; max-width: 100%;"
></iframe>`,
    mensDoubles: `<iframe 
  src="${baseUrl}/widget/mens-doubles?country=Australia&limit=10"
  width="100%"
  height="550px"
  frameborder="0"
  scrolling="no"
  style="border: none; max-width: 100%;"
></iframe>`,
    womensDoubles: `<iframe 
  src="${baseUrl}/widget/womens-doubles?country=Australia&limit=10"
  width="100%"
  height="550px"
  frameborder="0"
  scrolling="no"
  style="border: none; max-width: 100%;"
></iframe>`,
    mixedDoubles: `<iframe 
  src="${baseUrl}/widget/mixed-doubles?country=Australia&limit=10"
  width="100%"
  height="550px"
  frameborder="0"
  scrolling="no"
  style="border: none; max-width: 100%;"
></iframe>`,
  };

  const CodeBlock = ({ code, id }: { code: string; id: string }) => (
    <div className="relative">
      <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
        <code>{code}</code>
      </pre>
      <Button
        size="sm"
        variant="outline"
        className="absolute top-2 right-2"
        onClick={() => copyToClipboard(code, id)}
      >
        {copiedCode === id ? (
          <Check className="h-4 w-4" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Widget Embed Guide</h1>
          <p className="text-muted-foreground">
            Embed NPL rankings on your website using these simple iframe codes
          </p>
        </div>

        <Tabs defaultValue="all-categories" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-6">
            <TabsTrigger value="all-categories">All Categories</TabsTrigger>
            <TabsTrigger value="mens-singles">Men's Singles</TabsTrigger>
            <TabsTrigger value="womens-singles">Women's Singles</TabsTrigger>
            <TabsTrigger value="mens-doubles">Men's Doubles</TabsTrigger>
            <TabsTrigger value="womens-doubles">Women's Doubles</TabsTrigger>
            <TabsTrigger value="mixed-doubles">Mixed Doubles</TabsTrigger>
          </TabsList>

          <TabsContent value="all-categories" className="space-y-6">
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-2">All Categories Widget</h2>
              <p className="text-muted-foreground mb-4">
                Shows all 5 categories in tabs. Recommended for main rankings pages.
              </p>
              <CodeBlock code={embedCodes.allCategories} id="all-categories" />
              <div className="mt-4 p-4 bg-primary/10 rounded-lg">
                <p className="text-sm font-medium">
                  💡 Recommended height: 650px
                </p>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-4">Live Preview</h3>
              <div className="border rounded-lg overflow-hidden">
                <iframe
                  src={`${baseUrl}/widget/all-categories?country=Australia&limit=10`}
                  width="100%"
                  height="650px"
                  frameBorder="0"
                  scrolling="no"
                  style={{ border: "none" }}
                />
              </div>
            </Card>
          </TabsContent>

          {[
            { key: "mens-singles", name: "Men's Singles" },
            { key: "womens-singles", name: "Women's Singles" },
            { key: "mens-doubles", name: "Men's Doubles" },
            { key: "womens-doubles", name: "Women's Doubles" },
            { key: "mixed-doubles", name: "Mixed Doubles" },
          ].map((category) => (
            <TabsContent key={category.key} value={category.key} className="space-y-6">
              <Card className="p-6">
                <h2 className="text-2xl font-bold mb-2">{category.name} Widget</h2>
                <p className="text-muted-foreground mb-4">
                  Shows top 10 players in {category.name.toLowerCase()}.
                </p>
                <CodeBlock
                  code={embedCodes[category.key as keyof typeof embedCodes]}
                  id={category.key}
                />
                <div className="mt-4 p-4 bg-primary/10 rounded-lg">
                  <p className="text-sm font-medium">
                    💡 Recommended height: 550px
                  </p>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-xl font-semibold mb-4">Live Preview</h3>
                <div className="border rounded-lg overflow-hidden">
                  <iframe
                    src={`${baseUrl}/widget/${category.key}?country=Australia&limit=10`}
                    width="100%"
                    height="550px"
                    frameBorder="0"
                    scrolling="no"
                    style={{ border: "none" }}
                  />
                </div>
              </Card>
            </TabsContent>
          ))}
        </Tabs>

        <div className="mt-8 space-y-6">
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-4">Customization Options</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2 font-semibold">Parameter</th>
                    <th className="text-left p-2 font-semibold">Type</th>
                    <th className="text-left p-2 font-semibold">Default</th>
                    <th className="text-left p-2 font-semibold">Description</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="p-2 font-mono">country</td>
                    <td className="p-2">string</td>
                    <td className="p-2">Australia</td>
                    <td className="p-2">Filter rankings by country</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2 font-mono">limit</td>
                    <td className="p-2">number</td>
                    <td className="p-2">10</td>
                    <td className="p-2">Number of players to show (1-50)</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2 font-mono">hideHeader</td>
                    <td className="p-2">boolean</td>
                    <td className="p-2">false</td>
                    <td className="p-2">Hide the category title</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2 font-mono">compact</td>
                    <td className="p-2">boolean</td>
                    <td className="p-2">false</td>
                    <td className="p-2">Use more compact spacing</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2 font-mono">defaultCategory</td>
                    <td className="p-2">string</td>
                    <td className="p-2">mens_singles</td>
                    <td className="p-2">Default tab for all-categories widget</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="mt-4">
              <p className="font-semibold mb-2">Example with custom parameters:</p>
              <CodeBlock
                code={`<iframe src="${baseUrl}/widget/all-categories?country=USA&limit=15&compact=true" ...></iframe>`}
                id="custom-example"
              />
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-4">Platform-Specific Instructions</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold mb-2">Wix</h3>
                <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                  <li>Add a section where you want the widget</li>
                  <li>Click "+ Add Elements" → Embed → "HTML iframe"</li>
                  <li>Paste the iframe code from above</li>
                  <li>Adjust width/height as needed</li>
                  <li>Preview and publish your site</li>
                </ol>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-2">WordPress</h3>
                <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                  <li>Edit the page in Gutenberg editor</li>
                  <li>Add a "Custom HTML" block</li>
                  <li>Paste the iframe code from above</li>
                  <li>Preview and publish</li>
                </ol>
                <p className="mt-2 text-sm text-muted-foreground">
                  Alternative: Install the "iframe" plugin and use shortcode format
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-4">Troubleshooting</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold">Widget not loading?</h3>
                <p className="text-muted-foreground">Check that the URL is correct and accessible</p>
              </div>
              <div>
                <h3 className="font-semibold">Content cut off?</h3>
                <p className="text-muted-foreground">Increase the height parameter in the iframe code</p>
              </div>
              <div>
                <h3 className="font-semibold">Country filter not working?</h3>
                <p className="text-muted-foreground">Verify the country code matches exactly (e.g., "Australia", "USA")</p>
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default WidgetEmbedGuide;
