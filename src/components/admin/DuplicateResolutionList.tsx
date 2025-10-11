import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import type { DuplicatePlayer, BulkImportResolutions, Player } from "@/types/admin";
import { useToast } from "@/hooks/use-toast";

interface DuplicateResolutionListProps {
  duplicates: DuplicatePlayer[];
  resolutions: BulkImportResolutions;
  onResolutionChange: (resolutions: BulkImportResolutions) => void;
  onResolve: () => void;
  isResolving: boolean;
}

export function DuplicateResolutionList({
  duplicates,
  resolutions,
  onResolutionChange,
  onResolve,
  isResolving,
}: DuplicateResolutionListProps) {
  const { toast } = useToast();

  const allResolved = duplicates.every((d) => resolutions[`row_${d.csv_row - 2}`]);

  const applyToAllByName = (csvName: string) => {
    const newResolutions = { ...resolutions };
    duplicates.forEach((d) => {
      if (d.csv_name === csvName) {
        newResolutions[`row_${d.csv_row - 2}`] = "new";
      }
    });
    onResolutionChange(newResolutions);
  };

  const applyToAllByNameUseExisting = (csvName: string, playerId: string) => {
    const newResolutions = { ...resolutions };
    let count = 0;
    duplicates.forEach((d) => {
      if (d.csv_name === csvName) {
        newResolutions[`row_${d.csv_row - 2}`] = playerId;
        count++;
      }
    });
    onResolutionChange(newResolutions);
    toast({
      title: "Use Existing Applied",
      description: `Set ${count} occurrences of "${csvName}" to use existing player data.`,
    });
  };

  const applyToAllByNameMerge = (csvName: string, playerId: string) => {
    const newResolutions = { ...resolutions };
    let count = 0;
    duplicates.forEach((d) => {
      if (d.csv_name === csvName) {
        newResolutions[`row_${d.csv_row - 2}`] = `merge_${playerId}`;
        count++;
      }
    });
    onResolutionChange(newResolutions);
    toast({
      title: "Merge Applied",
      description: `Set ${count} occurrences of "${csvName}" to merge with existing data.`,
    });
  };

  const isExactMatch = (dup: DuplicatePlayer) => {
    const csvData = dup.csv_data || {};
    return dup.existing_players?.some(
      (player: Player) =>
        !(csvData.player_code && csvData.player_code !== player.player_code) &&
        !(csvData.email && csvData.email !== player.email) &&
        !(csvData.date_of_birth && csvData.date_of_birth !== player.date_of_birth) &&
        !(csvData.country && csvData.country !== player.country) &&
        !(csvData.dupr_id && csvData.dupr_id !== player.dupr_id)
    );
  };

  const applyUseExistingForAllExactMatches = () => {
    const newResolutions = { ...resolutions };
    duplicates.forEach((d) => {
      const csvData = d.csv_data || {};
      const exact = d.existing_players?.find(
        (player: Player) =>
          !(csvData.player_code && csvData.player_code !== player.player_code) &&
          !(csvData.email && csvData.email !== player.email) &&
          !(csvData.date_of_birth && csvData.date_of_birth !== player.date_of_birth) &&
          !(csvData.country && csvData.country !== player.country) &&
          !(csvData.dupr_id && csvData.dupr_id !== player.dupr_id)
      );
      if (exact) {
        newResolutions[`row_${d.csv_row - 2}`] = exact.id;
      }
    });
    onResolutionChange(newResolutions);
  };

  const applyMergeForAllWithNewData = () => {
    const newResolutions = { ...resolutions };
    duplicates.forEach((d) => {
      const csvData = d.csv_data || {};
      const playerWithNewData = d.existing_players?.find(
        (player: Player) =>
          (csvData.player_code && csvData.player_code !== player.player_code) ||
          (csvData.email && csvData.email !== player.email) ||
          (csvData.date_of_birth && csvData.date_of_birth !== player.date_of_birth) ||
          (csvData.country && csvData.country !== player.country) ||
          (csvData.dupr_id && csvData.dupr_id !== player.dupr_id)
      );
      if (playerWithNewData) {
        newResolutions[`row_${d.csv_row - 2}`] = `merge_${playerWithNewData.id}`;
      }
    });
    onResolutionChange(newResolutions);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-yellow-500" />
          Resolve Duplicate Players ({duplicates.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertDescription>
            The following players already exist in the database. Choose how to handle each one.
          </AlertDescription>
        </Alert>

        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={applyUseExistingForAllExactMatches}>
            Use Existing for All Exact Matches
          </Button>
          <Button variant="outline" size="sm" onClick={applyMergeForAllWithNewData}>
            Merge All with New Data
          </Button>
        </div>

        <div className="space-y-4">
          {duplicates.map((dup, index) => {
            const rowKey = `row_${dup.csv_row - 2}`;
            const isExact = isExactMatch(dup);

            return (
              <Card key={index}>
                <CardContent className="pt-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold">
                        CSV Row {dup.csv_row}: {dup.csv_name}
                      </h4>
                      {isExact && (
                        <Badge variant="secondary" className="mt-1">
                          Exact Match
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => applyToAllByName(dup.csv_name)}
                      >
                        Create New for All "{dup.csv_name}"
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Resolution</Label>
                    <Select
                      value={resolutions[rowKey] || ""}
                      onValueChange={(value) => {
                        const newResolutions = { ...resolutions };
                        newResolutions[rowKey] = value;
                        onResolutionChange(newResolutions);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select resolution" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">Create New Player</SelectItem>
                        {dup.existing_players.map((player) => (
                          <SelectItem key={player.id} value={player.id}>
                            Use Existing: {player.name} ({player.player_code})
                          </SelectItem>
                        ))}
                        {dup.existing_players.map((player) => (
                          <SelectItem key={`merge_${player.id}`} value={`merge_${player.id}`}>
                            Merge with: {player.name} ({player.player_code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {dup.existing_players.length > 0 && (
                    <div className="flex gap-2 flex-wrap">
                      {dup.existing_players.map((player) => (
                        <div key={player.id} className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => applyToAllByNameUseExisting(dup.csv_name, player.id)}
                          >
                            Use {player.player_code} for all "{dup.csv_name}"
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => applyToAllByNameMerge(dup.csv_name, player.id)}
                          >
                            Merge {player.player_code} for all "{dup.csv_name}"
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>
                      <strong>CSV Data:</strong> {dup.csv_data.country}, {dup.csv_data.gender}
                      {dup.csv_data.player_code && `, Code: ${dup.csv_data.player_code}`}
                    </p>
                    {dup.existing_players.map((player) => (
                      <p key={player.id}>
                        <strong>Existing:</strong> {player.name} - {player.country}, {player.gender}, 
                        Code: {player.player_code}
                      </p>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Button onClick={onResolve} disabled={!allResolved || isResolving}>
          {isResolving ? "Resolving..." : "Resolve and Import"}
        </Button>
      </CardContent>
    </Card>
  );
}
