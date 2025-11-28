import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useCombinedDoublesRankings } from "@/hooks/useCombinedDoublesRankings";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CombinedDoublesTab() {
  const [gender, setGender] = useState<"male" | "female">("male");
  const { data: players, isLoading } = useCombinedDoublesRankings(gender);

  const handleExport = () => {
    if (!players?.length) return;

    const genderLabel = gender === "male" ? "Mens" : "Womens";
    const headers = ["Rank", "Name", "Country", `${genderLabel} Doubles Points`, "Mixed Doubles Points", "Total Points"];
    const rows = players.map(p => [
      p.rank,
      p.name,
      p.country,
      p.gendered_doubles_points,
      p.mixed_doubles_points,
      p.total_doubles_points,
    ]);

    const csv = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `combined_doubles_${gender}_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Combined Doubles Rankings</CardTitle>
        <Button onClick={handleExport} variant="outline" size="sm" disabled={!players?.length}>
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          Sum of gendered doubles + mixed doubles points for each player (current 12-month rankings).
        </p>

        <Tabs value={gender} onValueChange={(v) => setGender(v as "male" | "female")}>
          <TabsList className="mb-4">
            <TabsTrigger value="male">Men's Combined Doubles</TabsTrigger>
            <TabsTrigger value="female">Women's Combined Doubles</TabsTrigger>
          </TabsList>

          <TabsContent value={gender}>
            {isLoading ? (
              <div className="space-y-2">
                {[...Array(10)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : !players?.length ? (
              <p className="text-muted-foreground text-center py-8">No doubles rankings found.</p>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">Rank</TableHead>
                      <TableHead>Player</TableHead>
                      <TableHead>Country</TableHead>
                      <TableHead className="text-right">
                        {gender === "male" ? "Men's" : "Women's"} Doubles
                      </TableHead>
                      <TableHead className="text-right">Mixed Doubles</TableHead>
                      <TableHead className="text-right font-bold">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {players.map((player) => (
                      <TableRow key={player.player_id}>
                        <TableCell className="font-medium">{player.rank}</TableCell>
                        <TableCell>{player.name}</TableCell>
                        <TableCell>{player.country}</TableCell>
                        <TableCell className="text-right">
                          {player.gendered_doubles_points.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          {player.mixed_doubles_points.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right font-bold">
                          {player.total_doubles_points.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
