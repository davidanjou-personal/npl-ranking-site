import { useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";

interface ExpiringPoint {
  player_id: string;
  name: string;
  country: string;
  category: string;
  expiring_points: number;
  expiry_date: string;
  days_until_expiry: number;
}

interface ExpiringPointsWarningProps {
  playerId?: string;
  showAllPlayers?: boolean;
}

export function ExpiringPointsWarning({ playerId, showAllPlayers = false }: ExpiringPointsWarningProps) {
  const [expiringPoints, setExpiringPoints] = useState<ExpiringPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExpiringPoints();
  }, [playerId, showAllPlayers]);

  const fetchExpiringPoints = async () => {
    setLoading(true);
    
    let query = supabase
      .from("expiring_points_soon" as any)
      .select("*")
      .order("expiry_date", { ascending: true });

    if (playerId && !showAllPlayers) {
      query = query.eq("player_id", playerId);
    }

    const { data, error } = await query;

    if (!error && data) {
      setExpiringPoints(data as any);
    }
    
    setLoading(false);
  };

  if (loading) {
    return null;
  }

  if (expiringPoints.length === 0) {
    return null;
  }

  const categoryLabels: Record<string, string> = {
    mens_singles: "Men's Singles",
    womens_singles: "Women's Singles",
    mens_doubles: "Men's Doubles",
    womens_doubles: "Women's Doubles",
    mens_mixed_doubles: "Men's Mixed Doubles",
    womens_mixed_doubles: "Women's Mixed Doubles",
  };

  const getUrgencyColor = (days: number) => {
    if (days <= 7) return "border-red-500 bg-red-50 dark:bg-red-950";
    if (days <= 14) return "border-orange-500 bg-orange-50 dark:bg-orange-950";
    return "border-yellow-500 bg-yellow-50 dark:bg-yellow-950";
  };

  return (
    <div className="space-y-4">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Points Expiring Soon</AlertTitle>
        <AlertDescription>
          The following points will expire within 30 days. Record new event results to maintain your ranking.
        </AlertDescription>
      </Alert>

      <div className="space-y-3">
        {expiringPoints.map((point, index) => (
          <Card 
            key={index} 
            className={`p-4 ${getUrgencyColor(point.days_until_expiry)}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                {showAllPlayers && (
                  <h4 className="font-semibold text-foreground mb-1">
                    {point.name} ({point.country})
                  </h4>
                )}
                <p className="text-sm text-muted-foreground mb-2">
                  {categoryLabels[point.category] || point.category}
                </p>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4" />
                  <span className="font-medium">
                    {point.expiring_points} points expiring in {point.days_until_expiry} day{point.days_until_expiry !== 1 ? 's' : ''}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Expiry date: {new Date(point.expiry_date).toLocaleDateString()}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
