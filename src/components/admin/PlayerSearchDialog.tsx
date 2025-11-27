import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, User } from "lucide-react";
import { usePlayerSearch } from "@/hooks/usePlayerSearch";
import type { Player } from "@/types/admin";

interface PlayerSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectPlayer: (player: Player) => void;
  csvPlayerName: string;
}

export function PlayerSearchDialog({
  open,
  onOpenChange,
  onSelectPlayer,
  csvPlayerName,
}: PlayerSearchDialogProps) {
  const [searchTerm, setSearchTerm] = useState(csvPlayerName);
  const { data: searchResults, isLoading } = usePlayerSearch(searchTerm, open);

  const handleSelect = (result: any) => {
    // Transform the search result to match Player type
    const player: Player = {
      id: result.player_id || result.id,
      name: result.name,
      country: result.country || "",
      gender: result.gender || "",
      player_code: result.player_code || "",
      email: result.email || null,
      date_of_birth: result.date_of_birth || null,
      dupr_id: result.dupr_id || null,
    };
    onSelectPlayer(player);
    onOpenChange(false);
    setSearchTerm("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Search for Player to Merge</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, code, or country..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              autoFocus
            />
          </div>

          <ScrollArea className="h-[300px] border rounded-md">
            {isLoading ? (
              <div className="p-4 text-center text-muted-foreground">
                Searching...
              </div>
            ) : searchResults && searchResults.length > 0 ? (
              <div className="divide-y">
                {searchResults.map((result: any) => (
                  <div
                    key={result.player_id || result.id}
                    className="p-3 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{result.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {result.player_code || "No code"} • {result.country || "Unknown"}
                            {result.total_points && ` • ${result.total_points} pts`}
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSelect(result)}
                      >
                        Select
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : searchTerm.trim() ? (
              <div className="p-4 text-center text-muted-foreground">
                No players found matching "{searchTerm}"
              </div>
            ) : (
              <div className="p-4 text-center text-muted-foreground">
                Enter a search term to find players
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
