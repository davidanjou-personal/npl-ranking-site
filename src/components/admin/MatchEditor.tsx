import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { MatchWithResults } from "@/types/admin";

interface MatchEditorProps {
  match: MatchWithResults;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

const categoryOptions = [
  { value: "mens_singles", label: "Men's Singles" },
  { value: "womens_singles", label: "Women's Singles" },
  { value: "mens_doubles", label: "Men's Doubles" },
  { value: "womens_doubles", label: "Women's Doubles" },
  { value: "mixed_doubles", label: "Mixed Doubles" },
];

const tierOptions = [
  { value: "tier1", label: "Tier 1" },
  { value: "tier2", label: "Tier 2" },
  { value: "tier3", label: "Tier 3" },
  { value: "tier4", label: "Tier 4" },
  { value: "historic", label: "Historic/Imported" },
];

const positionOptions = [
  { value: "winner", label: "Winner" },
  { value: "second", label: "2nd Place" },
  { value: "third", label: "3rd Place" },
  { value: "fourth", label: "4th Place" },
  { value: "quarterfinalist", label: "Quarter Finalist" },
  { value: "round_of_16", label: "Round of 16" },
  { value: "event_win", label: "Points Awarded" },
];

export function MatchEditor({ match, open, onOpenChange, onSaved }: MatchEditorProps) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  
  const [tournamentName, setTournamentName] = useState(match.tournament_name);
  const [matchDate, setMatchDate] = useState(match.match_date);
  const [category, setCategory] = useState<string>(match.category);
  const [tier, setTier] = useState<string>(match.tier);
  
  const [results, setResults] = useState(
    match.match_results?.map(r => ({
      id: r.id,
      playerId: r.player_id,
      playerName: r.players?.name || 'Unknown',
      finishingPosition: r.finishing_position as string,
      pointsAwarded: r.points_awarded,
    })) || []
  );

  const handleSave = async () => {
    setSaving(true);
    try {
      // Update event details
      const { error: eventError } = await supabase
        .from('events')
        .update({
          tournament_name: tournamentName,
          match_date: matchDate,
          category: category as any,
          tier: tier as any,
        })
        .eq('id', match.id);

      if (eventError) throw eventError;

      // Update each result
      for (const result of results) {
        const { error: resultError } = await supabase
          .from('event_results')
          .update({
            finishing_position: result.finishingPosition as any,
            points_awarded: result.pointsAwarded,
          })
          .eq('id', result.id);

        if (resultError) throw resultError;
      }

      toast({
        title: "Event updated",
        description: "Match details have been saved successfully.",
      });

      onSaved();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Save failed",
        description: error.message,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Match</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Match Details */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="tournament">Tournament Name</Label>
              <Input
                id="tournament"
                value={tournamentName}
                onChange={(e) => setTournamentName(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="date">Match Date</Label>
              <Input
                id="date"
                type="date"
                value={matchDate}
                onChange={(e) => setMatchDate(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger id="category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="tier">Tier</Label>
                <Select value={tier} onValueChange={setTier}>
                  <SelectTrigger id="tier">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {tierOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="space-y-3">
            <h3 className="font-semibold">Event Results</h3>
            {results.map((result, idx) => (
              <div key={result.id} className="border rounded-lg p-4 space-y-3">
                <div className="font-medium">{result.playerName}</div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Position</Label>
                    <Select
                      value={result.finishingPosition}
                      onValueChange={(value) => {
                        const newResults = [...results];
                        newResults[idx].finishingPosition = value;
                        setResults(newResults);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {positionOptions.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Points</Label>
                    <Input
                      type="number"
                      value={result.pointsAwarded}
                      onChange={(e) => {
                        const newResults = [...results];
                        newResults[idx].pointsAwarded = parseInt(e.target.value) || 0;
                        setResults(newResults);
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}