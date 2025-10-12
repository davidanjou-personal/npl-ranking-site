import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Textarea } from "@/components/ui/textarea";

interface ProfileUpdate {
  id: string;
  player_account_id: string;
  field_name: string;
  old_value: string;
  new_value: string;
  status: string;
  created_at: string;
  user_email?: string;
  player_accounts: {
    user_id: string;
    players: {
      name: string;
      player_code: string;
    };
  };
}

export const ProfileUpdateRequestsTab = () => {
  const [updates, setUpdates] = useState<ProfileUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState<{ [key: string]: string }>({});
  const { toast } = useToast();

  useEffect(() => {
    fetchUpdates();
  }, []);

  const fetchUpdates = async () => {
    try {
      const { data, error } = await supabase
        .from("player_profile_updates")
        .select(`
          *,
          player_accounts (
            user_id,
            players (name, player_code)
          )
        `)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch user emails separately
      const updatesWithEmails = await Promise.all(
        (data || []).map(async (update) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("email")
            .eq("id", update.player_accounts.user_id)
            .single();
          
          return {
            ...update,
            user_email: profile?.email || "Unknown",
          };
        })
      );

      setUpdates(updatesWithEmails);
    } catch (error) {
      console.error("Error fetching updates:", error);
      toast({
        title: "Error",
        description: "Could not load profile update requests.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApproveUpdate = async (update: ProfileUpdate) => {
    setProcessing(update.id);
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) return;

      // Get player_id from player_account
      const { data: account } = await supabase
        .from("player_accounts")
        .select("player_id")
        .eq("id", update.player_account_id)
        .single();

      if (!account) throw new Error("Player account not found");

      // Update player field
      const { error: updateError } = await supabase
        .from("players")
        .update({ [update.field_name]: update.new_value })
        .eq("id", account.player_id);

      if (updateError) throw updateError;

      // Update request status
      const { error: statusError } = await supabase
        .from("player_profile_updates")
        .update({
          status: "approved",
          reviewed_by: session.session.user.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", update.id);

      if (statusError) throw statusError;

      toast({
        title: "Update approved",
        description: `${update.field_name} has been updated.`,
      });

      fetchUpdates();
    } catch (error) {
      console.error("Approval error:", error);
      toast({
        title: "Approval failed",
        description: "Could not approve update. Please try again.",
        variant: "destructive",
      });
    } finally {
      setProcessing(null);
    }
  };

  const handleRejectUpdate = async (updateId: string) => {
    setProcessing(updateId);
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) return;

      const { error } = await supabase
        .from("player_profile_updates")
        .update({
          status: "rejected",
          rejection_reason: rejectionReason[updateId] || null,
          reviewed_by: session.session.user.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", updateId);

      if (error) throw error;

      toast({
        title: "Update rejected",
        description: "The update request has been rejected.",
      });

      setRejectionReason((prev) => {
        const newState = { ...prev };
        delete newState[updateId];
        return newState;
      });

      fetchUpdates();
    } catch (error) {
      console.error("Rejection error:", error);
      toast({
        title: "Rejection failed",
        description: "Could not reject update. Please try again.",
        variant: "destructive",
      });
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (updates.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">No pending profile update requests</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {updates.map((update) => (
        <Card key={update.id}>
          <CardHeader>
            <CardTitle className="text-xl">
              {update.player_accounts.players.name}
            </CardTitle>
            <CardDescription>
              <div className="space-y-1">
                <div>Email: {update.user_email}</div>
                <div>
                  Player Code:{" "}
                  <Badge variant="outline">
                    {update.player_accounts.players.player_code}
                  </Badge>
                </div>
                <div className="text-xs">
                  Submitted: {format(new Date(update.created_at), "PPp")}
                </div>
              </div>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="font-medium mb-1">Field</p>
                  <Badge variant="outline" className="capitalize">
                    {update.field_name.replace("_", " ")}
                  </Badge>
                </div>
                <div>
                  <p className="font-medium mb-1">Current Value</p>
                  <p className="text-muted-foreground">{update.old_value}</p>
                </div>
                <div>
                  <p className="font-medium mb-1">Requested Value</p>
                  <p className="text-foreground font-medium">{update.new_value}</p>
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Rejection Reason (Optional)
              </label>
              <Textarea
                placeholder="Provide a reason if rejecting..."
                value={rejectionReason[update.id] || ""}
                onChange={(e) =>
                  setRejectionReason((prev) => ({
                    ...prev,
                    [update.id]: e.target.value,
                  }))
                }
                rows={2}
              />
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => handleApproveUpdate(update)}
                disabled={processing === update.id}
                className="flex-1"
              >
                {processing === update.id ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                Approve
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleRejectUpdate(update.id)}
                disabled={processing === update.id}
                className="flex-1"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reject
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
