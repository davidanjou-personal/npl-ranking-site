import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { AlertCircle, ChevronDown, ChevronRight } from "lucide-react";
import type { DuplicatePlayer, BulkImportResolutions, Player } from "@/types/admin";
import { useToast } from "@/hooks/use-toast";
import { useMemo, useState, useEffect } from "react";

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
  const [exactMatchesOpen, setExactMatchesOpen] = useState(false);
  const [newDataOpen, setNewDataOpen] = useState(true);
  const [newPlayersOpen, setNewPlayersOpen] = useState(true);
  const [defaultsApplied, setDefaultsApplied] = useState(false);

  const allResolved = duplicates.every((d) => resolutions[`row_${d.csv_row - 2}`]);

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

  const categorizedDuplicates = useMemo(() => {
    const exactMatches: DuplicatePlayer[] = [];
    const newData: DuplicatePlayer[] = [];
    const newPlayers: DuplicatePlayer[] = [];

    duplicates.forEach((dup) => {
      if (dup.existing_players.length === 0) {
        newPlayers.push(dup);
      } else if (isExactMatch(dup)) {
        exactMatches.push(dup);
      } else {
        newData.push(dup);
      }
    });

    return { exactMatches, newData, newPlayers };
  }, [duplicates]);

  // Auto-apply smart defaults only once on mount
  useEffect(() => {
    if (defaultsApplied) return;
    
    const autoResolutions = { ...resolutions };
    let hasChanges = false;

    // Auto-select "Use Existing" for exact matches
    categorizedDuplicates.exactMatches.forEach((dup) => {
      const rowKey = `row_${dup.csv_row - 2}`;
      if (!autoResolutions[rowKey] && dup.existing_players[0]) {
        autoResolutions[rowKey] = dup.existing_players[0].id;
        hasChanges = true;
      }
    });

    // Auto-select "Create New" for new players
    categorizedDuplicates.newPlayers.forEach((dup) => {
      const rowKey = `row_${dup.csv_row - 2}`;
      if (!autoResolutions[rowKey]) {
        autoResolutions[rowKey] = "new";
        hasChanges = true;
      }
    });

    if (hasChanges) {
      onResolutionChange(autoResolutions);
      setDefaultsApplied(true);
    }
  }, [categorizedDuplicates, defaultsApplied, onResolutionChange, resolutions]);

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

  const getDataDiff = (dup: DuplicatePlayer) => {
    const csvData = dup.csv_data || {};
    const existing = dup.existing_players[0];
    const diffs: string[] = [];

    if (csvData.email && csvData.email !== existing.email) {
      diffs.push(`Email: "${csvData.email}" vs "${existing.email || 'none'}"`);
    }
    if (csvData.player_code && csvData.player_code !== existing.player_code) {
      diffs.push(`Code: "${csvData.player_code}" vs "${existing.player_code}"`);
    }
    if (csvData.country && csvData.country !== existing.country) {
      diffs.push(`Country: "${csvData.country}" vs "${existing.country}"`);
    }
    if (csvData.date_of_birth && csvData.date_of_birth !== existing.date_of_birth) {
      diffs.push(`DOB: "${csvData.date_of_birth}" vs "${existing.date_of_birth || 'none'}"`);
    }
    if (csvData.dupr_id && csvData.dupr_id !== existing.dupr_id) {
      diffs.push(`DUPR ID: "${csvData.dupr_id}" vs "${existing.dupr_id || 'none'}"`);
    }

    return diffs;
  };

  const applyUseExistingForCategory = (category: DuplicatePlayer[]) => {
    const newResolutions = { ...resolutions };
    let count = 0;
    category.forEach((d) => {
      if (d.existing_players[0]) {
        newResolutions[`row_${d.csv_row - 2}`] = d.existing_players[0].id;
        count++;
      }
    });
    onResolutionChange(newResolutions);
    toast({
      title: "Applied",
      description: `Set ${count} players to use existing data.`,
    });
  };

  const applyMergeForCategory = (category: DuplicatePlayer[]) => {
    const newResolutions = { ...resolutions };
    let count = 0;
    category.forEach((d) => {
      if (d.existing_players[0]) {
        newResolutions[`row_${d.csv_row - 2}`] = `merge_${d.existing_players[0].id}`;
        count++;
      }
    });
    onResolutionChange(newResolutions);
    toast({
      title: "Applied",
      description: `Set ${count} players to merge with new data.`,
    });
  };

  const applyCreateNewForCategory = (category: DuplicatePlayer[]) => {
    const newResolutions = { ...resolutions };
    let count = 0;
    category.forEach((d) => {
      newResolutions[`row_${d.csv_row - 2}`] = "new";
      count++;
    });
    onResolutionChange(newResolutions);
    toast({
      title: "Applied",
      description: `Set ${count} players to create as new.`,
    });
  };

  const renderDuplicateCard = (dup: DuplicatePlayer, index: number, showDiff: boolean = false) => {
    const rowKey = `row_${dup.csv_row - 2}`;
    const diffs = showDiff && dup.existing_players.length > 0 ? getDataDiff(dup) : [];

    return (
      <Card key={index}>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold">
                CSV Row {dup.csv_row}: {dup.csv_name}
              </h4>
              {diffs.length > 0 && (
                <div className="mt-2 space-y-1">
                  {diffs.map((diff, i) => (
                    <Badge key={i} variant="outline" className="mr-2">
                      {diff}
                    </Badge>
                  ))}
                </div>
              )}
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
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-yellow-500" />
          Resolve Duplicate Players ({duplicates.length} total)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <AlertDescription>
            Duplicates are categorized below. Most common actions are pre-selected for you.
          </AlertDescription>
        </Alert>

        {/* Section 1: Exact Matches */}
        {categorizedDuplicates.exactMatches.length > 0 && (
          <div className="border rounded-lg p-4 space-y-4">
            <Collapsible open={exactMatchesOpen} onOpenChange={setExactMatchesOpen}>
              <div className="flex items-center justify-between">
                <CollapsibleTrigger className="flex items-center gap-2 hover:underline">
                  {exactMatchesOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  <h3 className="text-lg font-semibold">
                    Exact Matches ({categorizedDuplicates.exactMatches.length})
                  </h3>
                  <Badge variant="secondary">Auto-selected</Badge>
                </CollapsibleTrigger>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => applyUseExistingForCategory(categorizedDuplicates.exactMatches)}
                >
                  Use Existing for All ({categorizedDuplicates.exactMatches.length})
                </Button>
              </div>
              <CollapsibleContent className="space-y-4 mt-4">
                {categorizedDuplicates.exactMatches.map((dup, index) => renderDuplicateCard(dup, index, false))}
              </CollapsibleContent>
            </Collapsible>
          </div>
        )}

        {/* Section 2: New Data Being Added */}
        {categorizedDuplicates.newData.length > 0 && (
          <div className="border rounded-lg p-4 space-y-4">
            <Collapsible open={newDataOpen} onOpenChange={setNewDataOpen}>
              <div className="flex items-center justify-between">
                <CollapsibleTrigger className="flex items-center gap-2 hover:underline">
                  {newDataOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  <h3 className="text-lg font-semibold">
                    New Data Being Added ({categorizedDuplicates.newData.length})
                  </h3>
                  <Badge variant="default">Review Recommended</Badge>
                </CollapsibleTrigger>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => applyMergeForCategory(categorizedDuplicates.newData)}
                >
                  Merge All with New Data ({categorizedDuplicates.newData.length})
                </Button>
              </div>
              <CollapsibleContent className="space-y-4 mt-4">
                {categorizedDuplicates.newData.map((dup, index) => renderDuplicateCard(dup, index, true))}
              </CollapsibleContent>
            </Collapsible>
          </div>
        )}

        {/* Section 3: Completely New Players */}
        {categorizedDuplicates.newPlayers.length > 0 && (
          <div className="border rounded-lg p-4 space-y-4">
            <Collapsible open={newPlayersOpen} onOpenChange={setNewPlayersOpen}>
              <div className="flex items-center justify-between">
                <CollapsibleTrigger className="flex items-center gap-2 hover:underline">
                  {newPlayersOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  <h3 className="text-lg font-semibold">
                    New Players ({categorizedDuplicates.newPlayers.length})
                  </h3>
                  <Badge variant="secondary">Auto-selected</Badge>
                </CollapsibleTrigger>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => applyCreateNewForCategory(categorizedDuplicates.newPlayers)}
                >
                  Create All New Players ({categorizedDuplicates.newPlayers.length})
                </Button>
              </div>
              <CollapsibleContent className="space-y-4 mt-4">
                {categorizedDuplicates.newPlayers.map((dup, index) => renderDuplicateCard(dup, index, false))}
              </CollapsibleContent>
            </Collapsible>
          </div>
        )}

        <Button onClick={onResolve} disabled={!allResolved || isResolving} className="w-full">
          {isResolving ? "Resolving..." : "Resolve and Import"}
        </Button>
      </CardContent>
    </Card>
  );
}
