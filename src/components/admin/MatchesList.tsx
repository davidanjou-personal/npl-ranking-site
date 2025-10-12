import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
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

const categoryLabels: Record<string, string> = {
  mens_singles: "Men's Singles",
  womens_singles: "Women's Singles",
  mens_doubles: "Men's Doubles",
  womens_doubles: "Women's Doubles",
  mixed_doubles: "Mixed Doubles",
};

const positionLabels: Record<string, string> = {
  winner: "Winner",
  second: "2nd Place",
  third: "3rd Place",
  fourth: "4th Place",
  quarterfinalist: "Quarter Finalist",
  round_of_16: "Round of 16",
  event_win: "Points Awarded",
};

export function MatchesList({ matches, onRefresh }: MatchesListProps) {
  const { toast } = useToast();
  const [editingMatch, setEditingMatch] = useState<MatchWithResults | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!deleteId) return;

    setDeleting(true);
    try {
      const { error } = await supabase
        .from('matches')
        .delete()
        .eq('id', deleteId);

      if (error) throw error;

      toast({
        title: "Match deleted",
        description: "The match and its results have been removed.",
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
        {matches.map((match) => (
          <Card key={match.id}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                <span>{match.tournament_name}</span>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{categoryLabels[match.category]}</Badge>
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
              </CardTitle>
            <p className="text-sm text-muted-foreground">
              {new Date(match.match_date).toLocaleDateString()}
              {match.tier !== 'historic' && ` • ${match.tier.toUpperCase()}`}
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Results:</h4>
              <ul className="space-y-1">
                {match.match_results?.map((result) => (
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
            </CardContent>
          </Card>
        ))}
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
            <AlertDialogTitle>Delete Match?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this match and all its results.
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
              {deleting ? "Deleting..." : "Delete Match"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
