import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Loader2, Upload, Edit, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface PlayerAccount {
  id: string;
  player_id: string;
  verified_at: string | null;
  players: {
    id: string;
    name: string;
    country: string;
    player_code: string;
    avatar_url: string | null;
    gender: string;
    date_of_birth: string | null;
    dupr_id: string | null;
  };
}

interface PendingClaim {
  id: string;
  status: string;
  created_at: string;
  players: {
    name: string;
    player_code: string;
  };
}

export default function PlayerProfile() {
  const [loading, setLoading] = useState(true);
  const [playerAccount, setPlayerAccount] = useState<PlayerAccount | null>(null);
  const [pendingClaims, setPendingClaims] = useState<PendingClaim[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    date_of_birth: "",
    dupr_id: "",
    country: "",
  });
  const [emailPrefs, setEmailPrefs] = useState({
    marketing_emails: false,
  });
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchPlayerData();
  }, []);

  const fetchPlayerData = async () => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) {
        navigate("/auth");
        return;
      }

      // Fetch player account
      const { data: account, error: accountError } = await supabase
        .from("player_accounts")
        .select(`
          *,
          players (*)
        `)
        .eq("user_id", session.session.user.id)
        .single();

      if (accountError && accountError.code !== "PGRST116") {
        throw accountError;
      }

      if (account) {
        setPlayerAccount(account as PlayerAccount);
        setFormData({
          date_of_birth: account.players.date_of_birth || "",
          dupr_id: account.players.dupr_id || "",
          country: account.players.country || "",
        });
      }

      // Fetch pending claims
      const { data: claims, error: claimsError } = await supabase
        .from("player_claims")
        .select(`
          *,
          players (name, player_code)
        `)
        .eq("user_id", session.session.user.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (claimsError) throw claimsError;
      setPendingClaims(claims || []);

      // Fetch email preferences
      const { data: prefs } = await supabase
        .from("email_preferences")
        .select("*")
        .eq("user_id", session.session.user.id)
        .single();

      if (prefs) {
        setEmailPrefs({ marketing_emails: prefs.marketing_emails });
      }
    } catch (error) {
      console.error("Error fetching player data:", error);
      toast({
        title: "Error",
        description: "Could not load profile data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEdits = async () => {
    if (!playerAccount) return;

    try {
      const { error } = await supabase
        .from("players")
        .update({
          date_of_birth: formData.date_of_birth || null,
          dupr_id: formData.dupr_id || null,
          country: formData.country,
        })
        .eq("id", playerAccount.player_id);

      if (error) throw error;

      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
      setEditMode(false);
      fetchPlayerData();
    } catch (error) {
      console.error("Update error:", error);
      toast({
        title: "Update failed",
        description: "Could not update profile. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !playerAccount) return;

    const file = e.target.files[0];
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Avatar must be less than 5MB.",
        variant: "destructive",
      });
      return;
    }

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${playerAccount.player_id}.${fileExt}`;
      const filePath = `${playerAccount.player_id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("player-avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("player-avatars")
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from("players")
        .update({ avatar_url: publicUrl })
        .eq("id", playerAccount.player_id);

      if (updateError) throw updateError;

      toast({
        title: "Avatar updated",
        description: "Your avatar has been uploaded successfully.",
      });
      fetchPlayerData();
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: "Could not upload avatar. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEmailPrefsUpdate = async (marketing: boolean) => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) return;

      const { error } = await supabase
        .from("email_preferences")
        .upsert({
          user_id: session.session.user.id,
          marketing_emails: marketing,
          account_notifications: true,
        });

      if (error) throw error;

      setEmailPrefs({ marketing_emails: marketing });
      toast({
        title: "Preferences updated",
        description: "Your email preferences have been saved.",
      });
    } catch (error) {
      console.error("Preferences error:", error);
      toast({
        title: "Update failed",
        description: "Could not update preferences.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!playerAccount && pendingClaims.length === 0) {
    return (
      <div className="min-h-screen bg-background py-12 px-4">
        <div className="container max-w-2xl mx-auto text-center">
          <h1 className="text-4xl font-bold mb-4">No Profile Found</h1>
          <p className="text-muted-foreground mb-8">
            You haven't claimed a player profile yet.
          </p>
          <Button onClick={() => navigate("/player/claim")}>
            Claim Your Profile
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="container max-w-4xl mx-auto">
        {pendingClaims.length > 0 && !playerAccount && (
          <Card className="mb-6 border-yellow-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Pending Claims
              </CardTitle>
              <CardDescription>
                Your claim requests are under review by an admin
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingClaims.map((claim) => (
                <div key={claim.id} className="flex justify-between items-center py-2">
                  <div>
                    <p className="font-medium">{claim.players.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {claim.players.player_code}
                    </p>
                  </div>
                  <Badge variant="outline">Pending</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {playerAccount && (
          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>Your Profile</CardTitle>
                      <CardDescription>
                        Update your profile information
                      </CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditMode(!editMode)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      {editMode ? "Cancel" : "Edit"}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center gap-6">
                    <div className="relative">
                      <Avatar className="h-24 w-24">
                        <AvatarImage src={playerAccount.players.avatar_url || ""} />
                        <AvatarFallback>
                          {playerAccount.players.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <label htmlFor="avatar-upload" className="absolute bottom-0 right-0 cursor-pointer">
                        <div className="bg-primary text-primary-foreground rounded-full p-2">
                          <Upload className="h-4 w-4" />
                        </div>
                        <input
                          id="avatar-upload"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleAvatarUpload}
                        />
                      </label>
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold">{playerAccount.players.name}</h3>
                      <Badge variant="outline" className="mt-1">
                        {playerAccount.players.player_code}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid gap-4">
                    <div>
                      <Label>Country</Label>
                      {editMode ? (
                        <Input
                          value={formData.country}
                          onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                        />
                      ) : (
                        <p className="text-sm text-muted-foreground mt-1">{playerAccount.players.country}</p>
                      )}
                    </div>

                    <div>
                      <Label>Gender</Label>
                      <p className="text-sm text-muted-foreground mt-1 capitalize">
                        {playerAccount.players.gender}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Contact admin to change
                      </p>
                    </div>

                    <div>
                      <Label>Date of Birth</Label>
                      {editMode ? (
                        <Input
                          type="date"
                          value={formData.date_of_birth}
                          onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                        />
                      ) : (
                        <p className="text-sm text-muted-foreground mt-1">
                          {playerAccount.players.date_of_birth
                            ? format(new Date(playerAccount.players.date_of_birth), "PPP")
                            : "Not set"}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label>DUPR ID</Label>
                      {editMode ? (
                        <Input
                          value={formData.dupr_id}
                          onChange={(e) => setFormData({ ...formData, dupr_id: e.target.value })}
                          placeholder="Your DUPR ID"
                        />
                      ) : (
                        <p className="text-sm text-muted-foreground mt-1">
                          {playerAccount.players.dupr_id || "Not set"}
                        </p>
                      )}
                    </div>
                  </div>

                  {editMode && (
                    <Button onClick={handleSaveEdits} className="w-full">
                      Save Changes
                    </Button>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings">
              <Card>
                <CardHeader>
                  <CardTitle>Email Preferences</CardTitle>
                  <CardDescription>
                    Manage your email notification preferences
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Account Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Required notifications about your account
                      </p>
                    </div>
                    <Switch checked disabled />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Marketing Emails</Label>
                      <p className="text-sm text-muted-foreground">
                        Optional updates and promotional content
                      </p>
                    </div>
                    <Switch
                      checked={emailPrefs.marketing_emails}
                      onCheckedChange={handleEmailPrefsUpdate}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
