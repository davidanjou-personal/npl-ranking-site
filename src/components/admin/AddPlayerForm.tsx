import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import type { PlayerFormData } from "@/types/admin";

const playerSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  country: z.string().min(1, "Country is required").max(100),
  gender: z.enum(["male", "female"]),
  player_code: z.string().optional(),
});

interface AddPlayerFormProps {
  onPlayerAdded: () => void;
}

export function AddPlayerForm({ onPlayerAdded }: AddPlayerFormProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState<PlayerFormData>({
    name: "",
    country: "",
    gender: "male",
    player_code: "",
    email: "",
    date_of_birth: "",
    dupr_id: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const validatedData = playerSchema.parse(formData);

      const insertData: any = {
        name: validatedData.name,
        country: validatedData.country,
        gender: validatedData.gender,
        email: formData.email || null,
        date_of_birth: formData.date_of_birth || null,
        dupr_id: formData.dupr_id || null,
      };
      
      if (validatedData.player_code) {
        insertData.player_code = validatedData.player_code;
      }

      const { error } = await supabase.from("players").insert([insertData]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Player added successfully",
      });

      setFormData({
        name: "",
        country: "",
        gender: "male",
        player_code: "",
        email: "",
        date_of_birth: "",
        dupr_id: "",
      });

      onPlayerAdded();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to add player",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add New Player</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Player Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">Country *</Label>
              <Input
                id="country"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gender">Gender *</Label>
              <Select
                value={formData.gender}
                onValueChange={(value: "male" | "female") =>
                  setFormData({ ...formData, gender: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="player_code">Player Code (optional)</Label>
              <Input
                id="player_code"
                value={formData.player_code}
                onChange={(e) => setFormData({ ...formData, player_code: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email (optional)</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date_of_birth">Date of Birth (optional)</Label>
              <Input
                id="date_of_birth"
                type="date"
                value={formData.date_of_birth}
                onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dupr_id">DUPR ID (optional)</Label>
              <Input
                id="dupr_id"
                value={formData.dupr_id}
                onChange={(e) => setFormData({ ...formData, dupr_id: e.target.value })}
              />
            </div>
          </div>
          <Button type="submit">Add Player</Button>
        </form>
      </CardContent>
    </Card>
  );
}
