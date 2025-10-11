import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Edit, Trash2, X, Check } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

interface Player {
  id: string;
  name: string;
  country: string;
  gender: string;
  player_code: string;
  email?: string;
  date_of_birth?: string;
  dupr_id?: string;
}

interface PlayersTableProps {
  players: Player[];
  onRefresh: () => void;
}

export function PlayersTable({ players, onRefresh }: PlayersTableProps) {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [playerToDelete, setPlayerToDelete] = useState<Player | null>(null);
  const [editForm, setEditForm] = useState<Partial<Player>>({});

  const filteredPlayers = players.filter(player =>
    player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    player.player_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    player.country?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEditClick = (player: Player) => {
    setEditingId(player.id);
    setEditForm(player);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;

    const { error } = await supabase
      .from("players")
      .update({
        name: editForm.name,
        country: editForm.country,
        gender: editForm.gender,
        email: editForm.email || null,
        date_of_birth: editForm.date_of_birth || null,
        dupr_id: editForm.dupr_id || null,
      })
      .eq("id", editingId);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } else {
      toast({
        title: "Success",
        description: "Player updated successfully!",
      });
      setEditingId(null);
      setEditForm({});
      onRefresh();
    }
  };

  const handleDeleteClick = (player: Player) => {
    setPlayerToDelete(player);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!playerToDelete) return;

    const { error } = await supabase
      .from("players")
      .delete()
      .eq("id", playerToDelete.id);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } else {
      toast({
        title: "Success",
        description: "Player deleted successfully!",
      });
      onRefresh();
    }
    setDeleteDialogOpen(false);
    setPlayerToDelete(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, player code, or country..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          {filteredPlayers.length} player{filteredPlayers.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Country</TableHead>
              <TableHead>Gender</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>DOB</TableHead>
              <TableHead>DUPR ID</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPlayers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground">
                  No players found
                </TableCell>
              </TableRow>
            ) : (
              filteredPlayers.map((player) => (
                <TableRow key={player.id}>
                  <TableCell>
                    {editingId === player.id ? (
                      <Input
                        value={editForm.name || ""}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="h-8"
                      />
                    ) : (
                      player.name
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-sm">{player.player_code}</TableCell>
                  <TableCell>
                    {editingId === player.id ? (
                      <Input
                        value={editForm.country || ""}
                        onChange={(e) => setEditForm({ ...editForm, country: e.target.value })}
                        className="h-8"
                      />
                    ) : (
                      player.country
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === player.id ? (
                      <Select
                        value={editForm.gender}
                        onValueChange={(value) => setEditForm({ ...editForm, gender: value })}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <span className="capitalize">{player.gender}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === player.id ? (
                      <Input
                        type="email"
                        value={editForm.email || ""}
                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                        className="h-8"
                        placeholder="email@example.com"
                      />
                    ) : (
                      <span className="text-muted-foreground">{player.email || "—"}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === player.id ? (
                      <Input
                        type="date"
                        value={editForm.date_of_birth || ""}
                        onChange={(e) => setEditForm({ ...editForm, date_of_birth: e.target.value })}
                        className="h-8"
                      />
                    ) : (
                      <span className="text-muted-foreground">{player.date_of_birth || "—"}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === player.id ? (
                      <Input
                        value={editForm.dupr_id || ""}
                        onChange={(e) => setEditForm({ ...editForm, dupr_id: e.target.value })}
                        className="h-8"
                        placeholder="12345"
                      />
                    ) : (
                      <span className="text-muted-foreground">{player.dupr_id || "—"}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {editingId === player.id ? (
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="ghost" onClick={handleSaveEdit}>
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={handleCancelEdit}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditClick(player)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteClick(player)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Player</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{playerToDelete?.name}</strong>? This will also delete all their match results and rankings. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
