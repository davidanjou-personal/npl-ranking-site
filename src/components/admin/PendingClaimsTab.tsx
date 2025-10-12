import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Loader2, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface PendingClaim {
  id: string;
  user_id: string;
  player_id: string;
  status: string;
  claim_message: string | null;
  created_at: string;
  user_email?: string;
  players: {
    id: string;
    name: string;
    country: string;
    player_code: string;
    avatar_url: string | null;
  };
}

export const PendingClaimsTab = () => {
  const [claims, setClaims] = useState<PendingClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchClaims();
  }, []);

  const fetchClaims = async () => {
    try {
      const { data, error } = await supabase
        .from("player_claims")
        .select(`
          *,
          players (*)
        `)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch user emails separately
      const claimsWithEmails = await Promise.all(
        (data || []).map(async (claim) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("email")
            .eq("id", claim.user_id)
            .single();
          
          return {
            ...claim,
            user_email: profile?.email || "Unknown",
          };
        })
      );

      setClaims(claimsWithEmails);
    } catch (error) {
      console.error("Error fetching claims:", error);
      toast({
        title: "Error",
        description: "Could not load pending claims.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApproveClaim = async (claim: PendingClaim) => {
    setProcessing(claim.id);
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) return;

      // Check if player is already claimed
      const { data: existingAccount } = await supabase
        .from("player_accounts")
        .select("*")
        .eq("player_id", claim.player_id)
        .single();

      if (existingAccount) {
        toast({
          title: "Already claimed",
          description: "This player profile is already linked to another account.",
          variant: "destructive",
        });
        setProcessing(null);
        return;
      }

      // Create player account
      const { error: accountError } = await supabase
        .from("player_accounts")
        .insert({
          user_id: claim.user_id,
          player_id: claim.player_id,
          verified_at: new Date().toISOString(),
          verified_by: session.session.user.id,
        });

      if (accountError) throw accountError;

      // Update claim status
      const { error: claimError } = await supabase
        .from("player_claims")
        .update({
          status: "approved",
          reviewed_by: session.session.user.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", claim.id);

      if (claimError) throw claimError;

      toast({
        title: "Claim approved",
        description: `${claim.players.name} has been linked to the user's account.`,
      });

      fetchClaims();
    } catch (error) {
      console.error("Approval error:", error);
      toast({
        title: "Approval failed",
        description: "Could not approve claim. Please try again.",
        variant: "destructive",
      });
    } finally {
      setProcessing(null);
    }
  };

  const handleRejectClaim = async (claimId: string) => {
    setProcessing(claimId);
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) return;

      const { error } = await supabase
        .from("player_claims")
        .update({
          status: "rejected",
          reviewed_by: session.session.user.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", claimId);

      if (error) throw error;

      toast({
        title: "Claim rejected",
        description: "The claim has been rejected.",
      });

      fetchClaims();
    } catch (error) {
      console.error("Rejection error:", error);
      toast({
        title: "Rejection failed",
        description: "Could not reject claim. Please try again.",
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

  if (claims.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">No pending claims</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {claims.map((claim) => (
        <Card key={claim.id}>
          <CardHeader>
            <div className="flex items-start gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={claim.players.avatar_url || ""} />
                <AvatarFallback>
                  {claim.players.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <CardTitle className="text-xl">{claim.players.name}</CardTitle>
                <CardDescription>
                  <div className="flex items-center gap-2 mt-1">
                    <Mail className="h-3 w-3" />
                    {claim.user_email}
                  </div>
                  <div className="mt-1">
                    Player Code: <Badge variant="outline">{claim.players.player_code}</Badge>
                  </div>
                  <div className="mt-1 text-xs">
                    Submitted: {format(new Date(claim.created_at), "PPp")}
                  </div>
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {claim.claim_message && (
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm font-medium mb-1">Message from user:</p>
                <p className="text-sm text-muted-foreground">{claim.claim_message}</p>
              </div>
            )}
            <div className="flex gap-3">
              <Button
                onClick={() => handleApproveClaim(claim)}
                disabled={processing === claim.id}
                className="flex-1"
              >
                {processing === claim.id ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                Approve
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleRejectClaim(claim.id)}
                disabled={processing === claim.id}
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
