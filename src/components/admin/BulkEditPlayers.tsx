import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Save, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Player {
  id: string;
  name: string;
  country: string;
  gender: string;
  player_code: string;
}

interface BulkEditPlayersProps {
  players: Player[];
  onComplete: () => void;
}

export function BulkEditPlayers({ players, onComplete }: BulkEditPlayersProps) {
  const { toast } = useToast();
  const [selectedPlayers, setSelectedPlayers] = useState<Set<string>>(new Set());
  const [bulkField, setBulkField] = useState<string>("");
  const [bulkValue, setBulkValue] = useState<string>("");
  const [saving, setSaving] = useState(false);

  const togglePlayer = (playerId: string) => {
    const newSelection = new Set(selectedPlayers);
    if (newSelection.has(playerId)) {
      newSelection.delete(playerId);
    } else {
      newSelection.add(playerId);
    }
    setSelectedPlayers(newSelection);
  };

  const selectAll = () => {
    if (selectedPlayers.size === players.length) {
      setSelectedPlayers(new Set());
    } else {
      setSelectedPlayers(new Set(players.map(p => p.id)));
    }
  };

  const handleBulkUpdate = async () => {
    if (selectedPlayers.size === 0) {
      toast({
        variant: "destructive",
        title: "No players selected",
        description: "Please select at least one player to update.",
      });
      return;
    }

    if (!bulkField || !bulkValue) {
      toast({
        variant: "destructive",
        title: "Missing information",
        description: "Please select a field and enter a value.",
      });
      return;
    }

    setSaving(true);
    try {
      const updates = Array.from(selectedPlayers).map(playerId => ({
        id: playerId,
        [bulkField]: bulkValue,
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from("players")
          .update({ [bulkField]: bulkValue })
          .eq("id", update.id);

        if (error) throw error;
      }

      toast({
        title: "Bulk update successful",
        description: `Updated ${selectedPlayers.size} player(s).`,
      });

      setSelectedPlayers(new Set());
      setBulkField("");
      setBulkValue("");
      onComplete();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Bulk update failed",
        description: error.message,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bulk Edit Players</CardTitle>
        <CardDescription>
          Select players and apply changes to all selected at once
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Bulk action controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
          <div className="space-y-2">
            <Label>Field to Update</Label>
            <Select value={bulkField} onValueChange={setBulkField}>
              <SelectTrigger>
                <SelectValue placeholder="Select field..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="country">Country</SelectItem>
                <SelectItem value="gender">Gender</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>New Value</Label>
            {bulkField === "gender" ? (
              <Select value={bulkValue} onValueChange={setBulkValue}>
                <SelectTrigger>
                  <SelectValue placeholder="Select gender..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <Input
                value={bulkValue}
                onChange={(e) => setBulkValue(e.target.value)}
                placeholder="Enter new value..."
              />
            )}
          </div>

          <div className="flex items-end gap-2">
            <Button
              onClick={handleBulkUpdate}
              disabled={saving || selectedPlayers.size === 0}
              className="flex-1"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Update ({selectedPlayers.size})
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => setSelectedPlayers(new Set())}
              disabled={selectedPlayers.size === 0}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Player selection */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Select Players</Label>
            <Button variant="ghost" size="sm" onClick={selectAll}>
              {selectedPlayers.size === players.length ? "Deselect All" : "Select All"}
            </Button>
          </div>

          <div className="max-h-96 overflow-y-auto border rounded-lg">
            {players.map((player) => (
              <div
                key={player.id}
                className="flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors border-b last:border-b-0"
              >
                <Checkbox
                  checked={selectedPlayers.has(player.id)}
                  onCheckedChange={() => togglePlayer(player.id)}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{player.name}</p>
                  <div className="flex gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      {player.country}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {player.gender}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {player.player_code}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
