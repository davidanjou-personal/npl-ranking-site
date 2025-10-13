import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { Plus, Trash2, Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Player, MatchFormData } from "@/types/admin";

const matchSchema = z.object({
  tournament_name: z.string().min(1, "Tournament name is required").max(200),
  match_date: z.string().min(1, "Date is required"),
  tier: z.enum(["tier1", "tier2", "tier3", "tier4", "historic"]),
  category: z.enum(["mens_singles", "womens_singles", "mens_doubles", "womens_doubles", "mens_mixed_doubles", "womens_mixed_doubles"]),
  results: z.array(z.object({
    player_id: z.string().uuid(),
    finishing_position: z.enum(["winner", "second", "third", "fourth", "quarterfinalist", "round_of_16", "points_awarded"])
  })).min(1, "At least one result is required")
});

interface AddMatchResultFormProps {
  players: Player[];
  onMatchAdded: () => void;
}

export function AddMatchResultForm({ players, onMatchAdded }: AddMatchResultFormProps) {
  const { toast } = useToast();
  const [playerResultCount, setPlayerResultCount] = useState(8);
  const [openPlayerId, setOpenPlayerId] = useState<number | null>(null);
  const [matchData, setMatchData] = useState<MatchFormData>({
    tournament_name: "",
    match_date: "",
    tier: "tier4",
    category: "mens_singles",
    results: Array(8).fill(null).map(() => ({
      player_id: "",
      finishing_position: "points_awarded" as const,
    })),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const filteredResults = matchData.results.filter(r => r.player_id);
      const validatedData = matchSchema.parse({
        ...matchData,
        results: filteredResults,
      });

      const { data: match, error: matchError } = await supabase
        .from("events")
        .insert([{
          tournament_name: validatedData.tournament_name,
          match_date: validatedData.match_date,
          tier: validatedData.tier,
          category: validatedData.category,
        }])
        .select()
        .single();

      if (matchError) throw matchError;

      const resultsToInsert = validatedData.results.map(result => ({
        event_id: match.id,
        player_id: result.player_id,
        finishing_position: result.finishing_position,
      }));

      const { error: resultsError } = await supabase
        .from("event_results")
        .insert(resultsToInsert);

      if (resultsError) throw resultsError;

      toast({
        title: "Success",
        description: "Event result added successfully",
      });

      setMatchData({
        tournament_name: "",
        match_date: "",
        tier: "tier4",
        category: "mens_singles",
        results: Array(8).fill(null).map(() => ({
          player_id: "",
          finishing_position: "points_awarded" as const,
        })),
      });
      setPlayerResultCount(8);

      onMatchAdded();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to add event result",
      });
    }
  };

  const addPlayerResult = () => {
    setMatchData({
      ...matchData,
      results: [
        ...matchData.results,
        { player_id: "", finishing_position: "points_awarded" as const },
      ],
    });
    setPlayerResultCount(playerResultCount + 1);
  };

  const removePlayerResult = (index: number) => {
    const newResults = matchData.results.filter((_, i) => i !== index);
    setMatchData({ ...matchData, results: newResults });
    setPlayerResultCount(playerResultCount - 1);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Record Event Result</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tournament_name">Tournament Name *</Label>
              <Input
                id="tournament_name"
                value={matchData.tournament_name}
                onChange={(e) =>
                  setMatchData({ ...matchData, tournament_name: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="match_date">Event Date *</Label>
              <Input
                id="match_date"
                type="date"
                value={matchData.match_date}
                onChange={(e) =>
                  setMatchData({ ...matchData, match_date: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tier">Tournament Tier *</Label>
              <Select
                value={matchData.tier}
                onValueChange={(value: any) =>
                  setMatchData({ ...matchData, tier: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tier1">Tier 1 (1000 pts)</SelectItem>
                  <SelectItem value="tier2">Tier 2 (500 pts)</SelectItem>
                  <SelectItem value="tier3">Tier 3 (250 pts)</SelectItem>
                  <SelectItem value="tier4">Tier 4 (100 pts)</SelectItem>
                  <SelectItem value="historic">Historic/Imported (no tier display)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select
                value={matchData.category}
                onValueChange={(value: any) =>
                  setMatchData({ ...matchData, category: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mens_singles">Men's Singles</SelectItem>
                  <SelectItem value="womens_singles">Women's Singles</SelectItem>
                  <SelectItem value="mens_doubles">Men's Doubles</SelectItem>
                  <SelectItem value="womens_doubles">Women's Doubles</SelectItem>
                  <SelectItem value="mens_mixed_doubles">Men's Mixed Doubles</SelectItem>
                  <SelectItem value="womens_mixed_doubles">Women's Mixed Doubles</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Event Results *</Label>
              <Button type="button" variant="outline" size="sm" onClick={addPlayerResult}>
                <Plus className="h-4 w-4 mr-2" />
                Add Player
              </Button>
            </div>

            {matchData.results.map((result, index) => (
              <div key={index} className="flex gap-2 items-end">
                <div className="flex-1 space-y-2">
                  <Label htmlFor={`player_${index}`}>Player</Label>
                  <Popover 
                    open={openPlayerId === index} 
                    onOpenChange={(open) => setOpenPlayerId(open ? index : null)}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openPlayerId === index}
                        className="w-full justify-between"
                      >
                        {result.player_id
                          ? players.find((player) => player.id === result.player_id)?.name + 
                            ` (${players.find((player) => player.id === result.player_id)?.country})`
                          : "Select player..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[400px] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Search player by name or country..." />
                        <CommandList>
                          <CommandEmpty>No player found.</CommandEmpty>
                          <CommandGroup>
                            {players.map((player) => (
                              <CommandItem
                                key={player.id}
                                value={`${player.name} ${player.country} ${player.player_code || ''}`}
                                onSelect={() => {
                                  const newResults = [...matchData.results];
                                  newResults[index].player_id = player.id;
                                  setMatchData({ ...matchData, results: newResults });
                                  setOpenPlayerId(null);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    result.player_id === player.id ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {player.name} ({player.country})
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="flex-1 space-y-2">
                  <Label htmlFor={`position_${index}`}>Finishing Position</Label>
                  <Select
                    value={result.finishing_position}
                    onValueChange={(value: any) => {
                      const newResults = [...matchData.results];
                      newResults[index].finishing_position = value;
                      setMatchData({ ...matchData, results: newResults });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="winner">Winner</SelectItem>
                      <SelectItem value="second">2nd Place</SelectItem>
                      <SelectItem value="third">3rd Place</SelectItem>
                      <SelectItem value="fourth">4th Place</SelectItem>
                      <SelectItem value="quarterfinalist">Quarter Finalist</SelectItem>
                      <SelectItem value="round_of_16">Round of 16</SelectItem>
                      <SelectItem value="points_awarded">Points Awarded</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removePlayerResult(index)}
                  disabled={matchData.results.length === 1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          <Button type="submit">Record Event Result</Button>
        </form>
      </CardContent>
    </Card>
  );
}
