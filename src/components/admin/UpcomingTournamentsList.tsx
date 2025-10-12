import { useState } from "react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useUpcomingTournaments } from "@/hooks/useUpcomingTournaments";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Star, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { UpcomingTournamentForm } from "./UpcomingTournamentForm";

export const UpcomingTournamentsList = () => {
  const { toast } = useToast();
  const { data: tournaments, isLoading, refetch } = useUpcomingTournaments();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editTournament, setEditTournament] = useState<any | null>(null);

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const { error } = await supabase
        .from("upcoming_tournaments")
        .delete()
        .eq("id", deleteId);

      if (error) throw error;

      toast({
        title: "Tournament deleted",
        description: "The tournament has been successfully deleted.",
      });

      refetch();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error deleting tournament",
        description: error.message,
      });
    } finally {
      setDeleteId(null);
    }
  };

  const handleToggleFeatured = async (id: string, currentValue: boolean) => {
    try {
      const { error } = await supabase
        .from("upcoming_tournaments")
        .update({ is_featured: !currentValue })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Tournament updated",
        description: `Tournament ${!currentValue ? "marked" : "unmarked"} as featured.`,
      });

      refetch();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error updating tournament",
        description: error.message,
      });
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading tournaments...</div>;
  }

  if (!tournaments || tournaments.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No upcoming tournaments. Add one using the form above.
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tournament Name</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Registration</TableHead>
              <TableHead>Featured</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tournaments.map((tournament) => (
              <TableRow key={tournament.id}>
                <TableCell className="font-medium">
                  {tournament.tournament_name}
                </TableCell>
                <TableCell>
                  {format(new Date(tournament.tournament_date), "MMM d, yyyy")}
                </TableCell>
                <TableCell>{tournament.location || "-"}</TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(tournament.registration_url, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </TableCell>
                <TableCell>
                  {tournament.is_featured ? (
                    <Badge variant="default">
                      <Star className="h-3 w-3 mr-1" />
                      Featured
                    </Badge>
                  ) : (
                    <Badge variant="outline">Not Featured</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleFeatured(tournament.id, tournament.is_featured)}
                    >
                      <Star className={tournament.is_featured ? "h-4 w-4 fill-current" : "h-4 w-4"} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditTournament(tournament)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteId(tournament.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this tournament. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!editTournament} onOpenChange={() => setEditTournament(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Tournament</DialogTitle>
          </DialogHeader>
          {editTournament && (
            <UpcomingTournamentForm
              editData={editTournament}
              onSuccess={() => {
                setEditTournament(null);
                refetch();
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
