import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, ArrowRight, Search, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Player {
  id: string;
  name: string;
  player_code: string;
  country: string;
  gender: string;
  email?: string;
  dupr_id?: string;
  date_of_birth?: string;
  avatar_url?: string;
}

interface PlayerStats {
  events_count: number;
  total_points: number;
  points_transferred: number;
  has_account: boolean;
}

interface MergeResult {
  success: boolean;
  primary_player_id: string;
  merged_player_id: string;
  events_transferred: number;
  points_transferred: number;
}

interface PlayerMergeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function PlayerMergeDialog({
  open,
  onOpenChange,
  onSuccess,
}: PlayerMergeDialogProps) {
  const { toast } = useToast();
  const [step, setStep] = useState<"select" | "confirm">("select");
  const [primarySearch, setPrimarySearch] = useState("");
  const [duplicateSearch, setDuplicateSearch] = useState("");
  const [primaryResults, setPrimaryResults] = useState<Player[]>([]);
  const [duplicateResults, setDuplicateResults] = useState<Player[]>([]);
  const [selectedPrimary, setSelectedPrimary] = useState<Player | null>(null);
  const [selectedDuplicate, setSelectedDuplicate] = useState<Player | null>(null);
  const [primaryStats, setPrimaryStats] = useState<PlayerStats | null>(null);
  const [duplicateStats, setDuplicateStats] = useState<PlayerStats | null>(null);
  const [merging, setMerging] = useState(false);

  const searchPlayers = async (searchTerm: string, setPrimaryResults: (results: Player[]) => void) => {
    if (!searchTerm || searchTerm.length < 2) {
      setPrimaryResults([]);
      return;
    }

    const { data, error } = await supabase
      .from("players")
      .select("*")
      .or(`name.ilike.%${searchTerm}%,player_code.ilike.%${searchTerm}%`)
      .limit(10);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to search players",
        variant: "destructive",
      });
      return;
    }

    setPrimaryResults(data || []);
  };

  const loadPlayerStats = async (playerId: string): Promise<PlayerStats> => {
    const [eventsResult, accountResult] = await Promise.all([
      supabase
        .from("event_results")
        .select("points_awarded", { count: "exact" })
        .eq("player_id", playerId),
      supabase
        .from("player_accounts")
        .select("id", { count: "exact" })
        .eq("player_id", playerId)
        .single(),
    ]);

    const totalPoints = eventsResult.data?.reduce((sum, r) => sum + r.points_awarded, 0) || 0;
    
    return {
      events_count: eventsResult.count || 0,
      total_points: totalPoints,
      points_transferred: totalPoints,
      has_account: !!accountResult.data,
    };
  };

  const selectPrimary = async (player: Player) => {
    setSelectedPrimary(player);
    const stats = await loadPlayerStats(player.id);
    setPrimaryStats(stats);
  };

  const selectDuplicate = async (player: Player) => {
    setSelectedDuplicate(player);
    const stats = await loadPlayerStats(player.id);
    setDuplicateStats(stats);
  };

  const handleConfirm = async () => {
    if (!selectedPrimary || !selectedDuplicate) return;

    setMerging(true);

    try {
      const { data, error } = await supabase.rpc("merge_players", {
        primary_player_id: selectedPrimary.id,
        duplicate_player_id: selectedDuplicate.id,
      });

      if (error) throw error;

      const result = data as unknown as MergeResult;

      toast({
        title: "Players merged successfully",
        description: `Transferred ${result.events_transferred} events and ${result.points_transferred} points`,
      });

      onSuccess();
      onOpenChange(false);
      resetDialog();
    } catch (error: any) {
      toast({
        title: "Merge failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setMerging(false);
    }
  };

  const resetDialog = () => {
    setStep("select");
    setPrimarySearch("");
    setDuplicateSearch("");
    setPrimaryResults([]);
    setDuplicateResults([]);
    setSelectedPrimary(null);
    setSelectedDuplicate(null);
    setPrimaryStats(null);
    setDuplicateStats(null);
  };

  const canProceed = selectedPrimary && selectedDuplicate && selectedPrimary.id !== selectedDuplicate.id;
  const hasBothAccounts = primaryStats?.has_account && duplicateStats?.has_account;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Merge Player Profiles
          </DialogTitle>
          <DialogDescription>
            Combine duplicate player profiles into one. All events and data will be transferred to the primary profile.
          </DialogDescription>
        </DialogHeader>

        {step === "select" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Primary Player Selection */}
              <div className="space-y-2">
                <Label className="text-primary font-semibold">Primary Player (Keep)</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Search by name or code..."
                    value={primarySearch}
                    onChange={(e) => {
                      setPrimarySearch(e.target.value);
                      searchPlayers(e.target.value, setPrimaryResults);
                    }}
                  />
                  <Button variant="outline" size="icon">
                    <Search className="h-4 w-4" />
                  </Button>
                </div>

                {primaryResults.length > 0 && !selectedPrimary && (
                  <div className="border rounded-md max-h-48 overflow-y-auto">
                    {primaryResults.map((player) => (
                      <button
                        key={player.id}
                        onClick={() => selectPrimary(player)}
                        className="w-full p-2 text-left hover:bg-muted transition-colors border-b last:border-b-0"
                      >
                        <div className="font-medium">{player.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {player.player_code} • {player.country}
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {selectedPrimary && primaryStats && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">{selectedPrimary.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-1 text-sm">
                      <div>Code: {selectedPrimary.player_code}</div>
                      <div>Country: {selectedPrimary.country}</div>
                      <div>Events: {primaryStats.events_count}</div>
                      <div>Points: {primaryStats.total_points}</div>
                      <div>Account: {primaryStats.has_account ? "✓ Linked" : "✗ None"}</div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedPrimary(null);
                          setPrimaryStats(null);
                        }}
                      >
                        Change
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Duplicate Player Selection */}
              <div className="space-y-2">
                <Label className="text-destructive font-semibold">Duplicate Player (Remove)</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Search by name or code..."
                    value={duplicateSearch}
                    onChange={(e) => {
                      setDuplicateSearch(e.target.value);
                      searchPlayers(e.target.value, setDuplicateResults);
                    }}
                  />
                  <Button variant="outline" size="icon">
                    <Search className="h-4 w-4" />
                  </Button>
                </div>

                {duplicateResults.length > 0 && !selectedDuplicate && (
                  <div className="border rounded-md max-h-48 overflow-y-auto">
                    {duplicateResults.map((player) => (
                      <button
                        key={player.id}
                        onClick={() => selectDuplicate(player)}
                        className="w-full p-2 text-left hover:bg-muted transition-colors border-b last:border-b-0"
                      >
                        <div className="font-medium">{player.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {player.player_code} • {player.country}
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {selectedDuplicate && duplicateStats && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">{selectedDuplicate.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-1 text-sm">
                      <div>Code: {selectedDuplicate.player_code}</div>
                      <div>Country: {selectedDuplicate.country}</div>
                      <div>Events: {duplicateStats.events_count}</div>
                      <div>Points: {duplicateStats.total_points}</div>
                      <div>Account: {duplicateStats.has_account ? "✓ Linked" : "✗ None"}</div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedDuplicate(null);
                          setDuplicateStats(null);
                        }}
                      >
                        Change
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>

            {hasBothAccounts && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Both players have linked accounts. This merge cannot proceed automatically. Please manually resolve the account conflict first.
                </AlertDescription>
              </Alert>
            )}

            {canProceed && !hasBothAccounts && (
              <Button onClick={() => setStep("confirm")} className="w-full" size="lg">
                Continue to Preview <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        )}

        {step === "confirm" && selectedPrimary && selectedDuplicate && primaryStats && duplicateStats && (
          <div className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                This action cannot be undone. The duplicate player will be permanently deleted after merging.
              </AlertDescription>
            </Alert>

            <div className="border rounded-lg p-4 space-y-2 bg-muted/50">
              <h3 className="font-semibold">What will happen:</h3>
              <ul className="space-y-1 text-sm list-disc list-inside">
                <li>Transfer {duplicateStats.events_count} events ({duplicateStats.points_transferred} points) to {selectedPrimary.name}</li>
                <li>Add "{selectedDuplicate.name}" to {selectedPrimary.name}'s alternate names</li>
                <li>Merge any missing profile data (email, DUPR ID, etc.)</li>
                {duplicateStats.has_account && <li>Transfer account link to primary player</li>}
                <li>Delete {selectedDuplicate.name} ({selectedDuplicate.player_code})</li>
                <li>Recalculate rankings</li>
              </ul>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep("select")} className="flex-1">
                Back
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={merging}
                className="flex-1"
                variant="destructive"
              >
                {merging ? "Merging..." : "Confirm Merge"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
