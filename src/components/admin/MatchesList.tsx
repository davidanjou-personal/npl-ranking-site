import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Eye, EyeOff, ChevronDown, ChevronUp } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { MatchEditor } from "./MatchEditor";
import type { MatchWithResults } from "@/types/admin";

interface MatchesListProps {
  matches: MatchWithResults[];
  onRefresh?: () => void;
}

interface TournamentGroup {
  tournament_name: string;
  match_date: string;
  tier: string;
  categories: string[];
  is_public: boolean;
  matches: MatchWithResults[];
}

const categoryLabels: Record<string, string> = {
  mens_singles: "Men's Singles",
  womens_singles: "Women's Singles",
  mens_doubles: "Men's Doubles",
  womens_doubles: "Women's Doubles",
  mens_mixed_doubles: "Men's Mixed Doubles",
  womens_mixed_doubles: "Women's Mixed Doubles",
};

const positionLabels: Record<string, string> = {
  winner: "Winner",
  second: "2nd Place",
  third: "3rd Place",
  fourth: "4th Place",
  quarterfinalist: "Quarter Finalist",
  round_of_16: "Round of 16",
  points_awarded: "Points Awarded",
};

export function MatchesList({ matches, onRefresh }: MatchesListProps) {
  const { toast } = useToast();
  const [editingMatch, setEditingMatch] = useState<MatchWithResults | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [togglingVisibility, setTogglingVisibility] = useState<string | null>(null);
  const [expandedTournaments, setExpandedTournaments] = useState<Set<string>>(new Set());

  const toggleExpanded = (key: string) => {
    const newExpanded = new Set(expandedTournaments);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedTournaments(newExpanded);
  };

  // Group matches by tournament name and date
  const tournamentGroups = matches.reduce((groups, match) => {
    const key = `${match.tournament_name}-${match.match_date}`;
    if (!groups[key]) {
      groups[key] = {
        tournament_name: match.tournament_name,
        match_date: match.match_date,
        tier: match.tier,
        categories: [match.category],
        is_public: match.is_public,
        matches: [match],
      };
    } else {
      groups[key].categories.push(match.category);
      groups[key].matches.push(match);
    }
    return groups;
  }, {} as Record<string, TournamentGroup>);

  const groupedTournaments = Object.values(tournamentGroups);

  const handleToggleVisibility = async (tournamentName: string, matchDate: string, currentlyPublic: boolean) => {
    const key = `${tournamentName}-${matchDate}`;
    setTogglingVisibility(key);
    try {
      // Update all events in this tournament group
      const { error } = await supabase
        .from('events')
        .update({ is_public: !currentlyPublic })
        .eq('tournament_name', tournamentName)
        .eq('match_date', matchDate);

      if (error) throw error;

      toast({
        title: currentlyPublic ? "Tournament hidden" : "Tournament made public",
        description: currentlyPublic 
          ? "This tournament is now hidden from the tournaments page." 
          : "This tournament is now visible on the tournaments page.",
      });

      onRefresh?.();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Update failed",
        description: error.message,
      });
    } finally {
      setTogglingVisibility(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    setDeleting(true);
    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', deleteId);

      if (error) throw error;

      toast({
        title: "Event deleted",
        description: "The event and its results have been removed.",
      });

      onRefresh?.();
      setDeleteId(null);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Delete failed",
        description: error.message,
      });
    } finally {
      setDeleting(false);
    }
  };

  if (matches.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">No event results recorded yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {groupedTournaments.map((group) => {
          const key = `${group.tournament_name}-${group.match_date}`;
          const isExpanded = expandedTournaments.has(key);
          return (
            <Collapsible
              key={key}
              open={isExpanded}
              onOpenChange={() => toggleExpanded(key)}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span>{group.tournament_name}</span>
                      {!group.is_public && (
                        <Badge variant="outline" className="text-xs">
                          <EyeOff className="h-3 w-3 mr-1" />
                          Hidden
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleVisibility(group.tournament_name, group.match_date, group.is_public);
                        }}
                        disabled={togglingVisibility === key}
                        title={group.is_public ? "Hide tournament from public" : "Show tournament to public"}
                      >
                        {group.is_public ? (
                          <Eye className="h-4 w-4" />
                        ) : (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                      <CollapsibleTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          title={isExpanded ? "Collapse tournament" : "Expand tournament"}
                        >
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </CollapsibleTrigger>
                    </div>
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {new Date(group.match_date).toLocaleDateString()}
                    {group.tier !== 'historic' && ` • ${group.tier.toUpperCase()}`}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {group.categories.map((cat, idx) => (
                      <Badge key={`${cat}-${idx}`} variant="outline">
                        {categoryLabels[cat]}
                      </Badge>
                    ))}
                  </div>
                </CardHeader>
                <CollapsibleContent>
                  <CardContent>
                    <div className="space-y-3">
                      {group.matches.map((match) => (
                        <div key={match.id} className="border rounded-lg p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <Badge variant="secondary">{categoryLabels[match.category]}</Badge>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setEditingMatch(match)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeleteId(match.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <h4 className="font-semibold text-sm">Results:</h4>
                            <ul className="space-y-1">
                              {match.event_results?.map((result) => (
                                <li key={result.id} className="text-sm flex items-center justify-between">
                                  <span>
                                    {result.players?.name} -{" "}
                                    <span className="text-muted-foreground">
                                      {positionLabels[result.finishing_position]}
                                    </span>
                                  </span>
                                  <Badge variant="secondary">{result.points_awarded} pts</Badge>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          );
        })}
      </div>

      {editingMatch && (
        <MatchEditor
          match={editingMatch}
          open={!!editingMatch}
          onOpenChange={(open) => !open && setEditingMatch(null)}
          onSaved={() => {
            onRefresh?.();
            setEditingMatch(null);
          }}
        />
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Event?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this event and all its results.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Deleting..." : "Delete Event"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
