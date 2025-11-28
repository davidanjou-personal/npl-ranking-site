import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Download, Plus, Trash2, Search } from "lucide-react";
import { usePlayerDoublesRanking, DoublesCategory } from "@/hooks/usePlayerDoublesRanking";
import { PlayerSearchDialog } from "./PlayerSearchDialog";
import { supabase } from "@/integrations/supabase/client";
import { exportRankings } from "@/utils/csvExport";
import { useToast } from "@/hooks/use-toast";
interface Player {
  id: string;
  name: string;
  country: string;
  gender?: string;
}

interface Partnership {
  id: string;
  player1: Player;
  player2: Player;
  player1Points: number;
  player2Points: number;
  combinedPoints: number;
}

export function PartnershipCalculatorTab() {
  const { toast } = useToast();
  const [category, setCategory] = useState<DoublesCategory>("mens_doubles");
  const [partnerships, setPartnerships] = useState<Partnership[]>([]);
  
  // Player selection state
  const [player1, setPlayer1] = useState<Player | null>(null);
  const [player2, setPlayer2] = useState<Player | null>(null);
  const [player1DialogOpen, setPlayer1DialogOpen] = useState(false);
  const [player2DialogOpen, setPlayer2DialogOpen] = useState(false);

  // Fetch rankings for selected players
  const { data: player1Ranking } = usePlayerDoublesRanking(player1?.id ?? null, category);
  const { data: player2Ranking } = usePlayerDoublesRanking(player2?.id ?? null, category);

  const combinedTotal = (player1Ranking?.points ?? 0) + (player2Ranking?.points ?? 0);

  // Sort partnerships by combined points
  const rankedPartnerships = useMemo(() => {
    return [...partnerships].sort((a, b) => b.combinedPoints - a.combinedPoints);
  }, [partnerships]);

  const handleAddPartnership = () => {
    if (!player1 || !player2) return;
    
    const newPartnership: Partnership = {
      id: `${player1.id}-${player2.id}-${Date.now()}`,
      player1,
      player2,
      player1Points: player1Ranking?.points ?? 0,
      player2Points: player2Ranking?.points ?? 0,
      combinedPoints: combinedTotal,
    };

    setPartnerships((prev) => [...prev, newPartnership]);
    setPlayer1(null);
    setPlayer2(null);
  };

  const handleRemovePartnership = (id: string) => {
    setPartnerships((prev) => prev.filter((p) => p.id !== id));
  };

  const handleClearAll = () => {
    setPartnerships([]);
  };

  const handleExportPartnerships = () => {
    if (rankedPartnerships.length === 0) return;

    const categoryLabel = category.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
    const headers = ["Rank", "Player 1", "Player 1 Country", "Player 2", "Player 2 Country", "P1 Points", "P2 Points", "Combined"];
    const rows = rankedPartnerships.map((p, idx) => [
      idx + 1,
      p.player1.name,
      p.player1.country,
      p.player2.name,
      p.player2.country,
      p.player1Points,
      p.player2Points,
      p.combinedPoints,
    ]);

    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `partnership-rankings-${categoryLabel.toLowerCase().replace(" ", "-")}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleExportRankings = async () => {
    try {
      const { data, error } = await supabase
        .from("current_rankings")
        .select("*")
        .order("category")
        .order("rank");

      if (error) throw error;

      if (!data || data.length === 0) {
        toast({ title: "No rankings data to export", variant: "destructive" });
        return;
      }

      exportRankings(data, "current");
      toast({ title: "Rankings exported successfully" });
    } catch (error) {
      console.error("Error exporting rankings:", error);
      toast({ title: "Failed to export rankings", variant: "destructive" });
    }
  };

  const handleCategoryChange = (newCategory: string) => {
    setCategory(newCategory as DoublesCategory);
    // Clear selections when category changes
    setPlayer1(null);
    setPlayer2(null);
  };

  const getCategoryLabel = () => {
    switch (category) {
      case "mens_doubles":
        return "Men's Doubles";
      case "womens_doubles":
        return "Women's Doubles";
      case "mixed_doubles":
        return "Mixed Doubles";
    }
  };

  const getGenderFilter = (playerNumber: 1 | 2): string | undefined => {
    if (category === "mens_doubles") return "male";
    if (category === "womens_doubles") return "female";
    if (category === "mixed_doubles") {
      // For mixed doubles, player 1 is male, player 2 is female
      return playerNumber === 1 ? "male" : "female";
    }
    return undefined;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Partnership Rankings Calculator</CardTitle>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExportRankings}>
            <Download className="h-4 w-4 mr-2" />
            Export Rankings
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportPartnerships} disabled={rankedPartnerships.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Export Partnerships
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs value={category} onValueChange={handleCategoryChange}>
          <TabsList>
            <TabsTrigger value="mens_doubles">Men's Doubles</TabsTrigger>
            <TabsTrigger value="womens_doubles">Women's Doubles</TabsTrigger>
            <TabsTrigger value="mixed_doubles">Mixed Doubles</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Partnership Builder */}
        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle className="text-lg">Create Partnership</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Player 1 */}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Player 1 {category === "mixed_doubles" && "(Male)"}
                </label>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => setPlayer1DialogOpen(true)}
                >
                  <Search className="h-4 w-4 mr-2" />
                  {player1 ? (
                    <span>
                      {player1.name} ({player1.country})
                    </span>
                  ) : (
                    "Search Player..."
                  )}
                </Button>
                {player1 && player1Ranking && (
                  <p className="text-sm text-muted-foreground">
                    {getCategoryLabel()} Points: <span className="font-semibold text-foreground">{player1Ranking.points}</span>
                    {player1Ranking.rank > 0 && ` (Rank #${player1Ranking.rank})`}
                  </p>
                )}
              </div>

              {/* Player 2 */}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Player 2 {category === "mixed_doubles" && "(Female)"}
                </label>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => setPlayer2DialogOpen(true)}
                >
                  <Search className="h-4 w-4 mr-2" />
                  {player2 ? (
                    <span>
                      {player2.name} ({player2.country})
                    </span>
                  ) : (
                    "Search Player..."
                  )}
                </Button>
                {player2 && player2Ranking && (
                  <p className="text-sm text-muted-foreground">
                    {getCategoryLabel()} Points: <span className="font-semibold text-foreground">{player2Ranking.points}</span>
                    {player2Ranking.rank > 0 && ` (Rank #${player2Ranking.rank})`}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <div className="text-lg">
                Combined Total: <span className="font-bold text-primary">{combinedTotal} points</span>
              </div>
              <Button onClick={handleAddPartnership} disabled={!player1 || !player2}>
                <Plus className="h-4 w-4 mr-2" />
                Add Partnership
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Partnerships Table */}
        {rankedPartnerships.length > 0 ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Partnership Rankings</h3>
              <Button variant="ghost" size="sm" onClick={handleClearAll}>
                <Trash2 className="h-4 w-4 mr-2" />
                Clear All
              </Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Rank</TableHead>
                  <TableHead>Player 1</TableHead>
                  <TableHead>Player 2</TableHead>
                  <TableHead className="text-right">P1 Points</TableHead>
                  <TableHead className="text-right">P2 Points</TableHead>
                  <TableHead className="text-right">Combined</TableHead>
                  <TableHead className="w-16"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rankedPartnerships.map((partnership, index) => (
                  <TableRow key={partnership.id}>
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    <TableCell>
                      {partnership.player1.name}
                      <span className="text-muted-foreground ml-1">({partnership.player1.country})</span>
                    </TableCell>
                    <TableCell>
                      {partnership.player2.name}
                      <span className="text-muted-foreground ml-1">({partnership.player2.country})</span>
                    </TableCell>
                    <TableCell className="text-right">{partnership.player1Points}</TableCell>
                    <TableCell className="text-right">{partnership.player2Points}</TableCell>
                    <TableCell className="text-right font-semibold">{partnership.combinedPoints}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemovePartnership(partnership.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No partnerships added yet. Select two players above to create a partnership.
          </div>
        )}

        {/* Player Search Dialogs */}
        <PlayerSearchDialog
          open={player1DialogOpen}
          onOpenChange={setPlayer1DialogOpen}
          onSelectPlayer={(p) => setPlayer1({ id: p.id, name: p.name, country: p.country, gender: p.gender })}
          csvPlayerName=""
          genderFilter={getGenderFilter(1)}
        />
        <PlayerSearchDialog
          open={player2DialogOpen}
          onOpenChange={setPlayer2DialogOpen}
          onSelectPlayer={(p) => setPlayer2({ id: p.id, name: p.name, country: p.country, gender: p.gender })}
          csvPlayerName=""
          genderFilter={getGenderFilter(2)}
        />
      </CardContent>
    </Card>
  );
}
