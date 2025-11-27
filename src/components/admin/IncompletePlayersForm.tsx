import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Search, UserCheck } from "lucide-react";
import { PlayerSearchDialog } from "./PlayerSearchDialog";
import type { IncompletePlayer, NewPlayerCompletions, Player } from "@/types/admin";

interface IncompletePlayersFormProps {
  incompletePlayers: IncompletePlayer[];
  completions: NewPlayerCompletions;
  onCompletionsChange: (completions: NewPlayerCompletions) => void;
  onConvertToMerge?: (rowKey: string, playerId: string, playerName: string) => void;
}

export function IncompletePlayersForm({
  incompletePlayers,
  completions,
  onCompletionsChange,
  onConvertToMerge,
}: IncompletePlayersFormProps) {
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);
  const [searchingForRow, setSearchingForRow] = useState<string | null>(null);
  const [searchingForName, setSearchingForName] = useState<string>("");
  const [convertedRows, setConvertedRows] = useState<Record<string, { playerId: string; playerName: string }>>({});

  const updateCompletion = (rowKey: string, field: string, value: string) => {
    onCompletionsChange({
      ...completions,
      [rowKey]: {
        ...completions[rowKey],
        [field]: value,
      },
    });
  };

  const applyGenderToAll = (gender: 'male' | 'female') => {
    const newCompletions = { ...completions };
    incompletePlayers
      .filter(p => p.missing_fields.includes('gender') && !convertedRows[`row_${p.csv_row - 2}`])
      .forEach(player => {
        const rowKey = `row_${player.csv_row - 2}`;
        newCompletions[rowKey] = {
          ...newCompletions[rowKey],
          gender,
        };
      });
    onCompletionsChange(newCompletions);
  };

  const isComplete = (player: IncompletePlayer): boolean => {
    const rowKey = `row_${player.csv_row - 2}`;
    
    // If converted to merge, it's complete
    if (convertedRows[rowKey]) return true;
    
    const completion = completions[rowKey] || {};
    const existingData = player.existing_data;
    
    return player.missing_fields.every(field => {
      const value = completion[field as keyof typeof completion] || existingData[field as keyof typeof existingData];
      return value && value.toString().trim() !== '';
    });
  };

  const handleOpenSearch = (player: IncompletePlayer) => {
    const rowKey = `row_${player.csv_row - 2}`;
    setSearchingForRow(rowKey);
    setSearchingForName(player.player_name || '');
    setSearchDialogOpen(true);
  };

  const handleSelectPlayer = (selectedPlayer: Player) => {
    if (searchingForRow && onConvertToMerge) {
      onConvertToMerge(searchingForRow, selectedPlayer.id, selectedPlayer.name);
      setConvertedRows(prev => ({
        ...prev,
        [searchingForRow]: { playerId: selectedPlayer.id, playerName: selectedPlayer.name }
      }));
    }
    setSearchDialogOpen(false);
    setSearchingForRow(null);
    setSearchingForName("");
  };

  const handleUndoConversion = (rowKey: string) => {
    setConvertedRows(prev => {
      const updated = { ...prev };
      delete updated[rowKey];
      return updated;
    });
  };

  const activeIncompletePlayers = incompletePlayers.filter(p => !convertedRows[`row_${p.csv_row - 2}`]);
  const allComplete = incompletePlayers.every(isComplete);
  const genderMissingCount = activeIncompletePlayers.filter(p => p.missing_fields.includes('gender')).length;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>New Players Need Additional Information</CardTitle>
          <CardDescription>
            {incompletePlayers.length} new player{incompletePlayers.length !== 1 ? 's' : ''} will be created. 
            Please provide the missing information below, or search for existing players to merge with.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              These players don't exist in the database and are missing required information.
              Fill in the missing fields, or use "Search for Existing Player" if this player already exists.
            </AlertDescription>
          </Alert>

          {genderMissingCount > 0 && (
            <div className="flex gap-2 items-center p-3 bg-muted rounded-lg">
              <span className="text-sm">Quick Action:</span>
              <Button size="sm" variant="outline" onClick={() => applyGenderToAll('male')}>
                Set All to Male ({genderMissingCount})
              </Button>
              <Button size="sm" variant="outline" onClick={() => applyGenderToAll('female')}>
                Set All to Female ({genderMissingCount})
              </Button>
            </div>
          )}

          <div className="space-y-4">
            {incompletePlayers.map((player) => {
              const rowKey = `row_${player.csv_row - 2}`;
              const completion = completions[rowKey] || {};
              const complete = isComplete(player);
              const converted = convertedRows[rowKey];

              return (
                <Card key={player.csv_row} className={complete ? "border-primary" : "border-destructive"}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center justify-between">
                      <span>
                        Row {player.csv_row}: {player.player_name || '[No Name]'}
                      </span>
                      {converted ? (
                        <span className="text-xs font-normal text-primary bg-primary/10 px-2 py-1 rounded flex items-center gap-1">
                          <UserCheck className="h-3 w-3" />
                          Will merge with: {converted.playerName}
                        </span>
                      ) : complete ? (
                        <span className="text-xs font-normal text-primary bg-primary/10 px-2 py-1 rounded">
                          ✓ Complete
                        </span>
                      ) : null}
                    </CardTitle>
                    {!converted && (
                      <CardDescription className="text-xs">
                        Missing: {player.missing_fields.join(', ')}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {converted ? (
                      <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <span className="text-sm">
                          Points will be added to <strong>{converted.playerName}</strong>
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleUndoConversion(rowKey)}
                        >
                          Undo
                        </Button>
                      </div>
                    ) : (
                      <>
                        {onConvertToMerge && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full mb-3"
                            onClick={() => handleOpenSearch(player)}
                          >
                            <Search className="h-4 w-4 mr-2" />
                            Search for Existing Player
                          </Button>
                        )}
                        
                        <div className="grid grid-cols-2 gap-3">
                          {player.missing_fields.includes('player_name') && (
                            <div className="col-span-2">
                              <Label htmlFor={`${rowKey}-name`} className="text-destructive">
                                Player Name *
                              </Label>
                              <Input
                                id={`${rowKey}-name`}
                                value={completion.player_name || ''}
                                onChange={(e) => updateCompletion(rowKey, 'player_name', e.target.value)}
                                placeholder="Enter player name"
                                className="border-destructive"
                              />
                            </div>
                          )}

                          {player.missing_fields.includes('gender') && (
                            <div>
                              <Label htmlFor={`${rowKey}-gender`} className="text-destructive">
                                Gender *
                              </Label>
                              <Select
                                value={completion.gender || player.existing_data.gender || ''}
                                onValueChange={(value) => updateCompletion(rowKey, 'gender', value)}
                              >
                                <SelectTrigger id={`${rowKey}-gender`} className="border-destructive">
                                  <SelectValue placeholder="Select gender" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="male">Male</SelectItem>
                                  <SelectItem value="female">Female</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          )}

                          {player.missing_fields.includes('country') && (
                            <div>
                              <Label htmlFor={`${rowKey}-country`} className="text-destructive">
                                Country *
                              </Label>
                              <Input
                                id={`${rowKey}-country`}
                                value={completion.country || player.existing_data.country || ''}
                                onChange={(e) => updateCompletion(rowKey, 'country', e.target.value)}
                                placeholder="e.g., USA"
                                className="border-destructive"
                              />
                            </div>
                          )}

                          {/* Show existing data for reference */}
                          {player.existing_data.player_code && !player.missing_fields.includes('player_code') && (
                            <div className="col-span-2 text-xs text-muted-foreground">
                              Player Code: {player.existing_data.player_code}
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {!allComplete && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Please complete all missing fields before proceeding with the import.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <PlayerSearchDialog
        open={searchDialogOpen}
        onOpenChange={setSearchDialogOpen}
        onSelectPlayer={handleSelectPlayer}
        csvPlayerName={searchingForName}
      />
    </>
  );
}
