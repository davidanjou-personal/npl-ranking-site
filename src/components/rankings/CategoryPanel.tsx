import { Card } from "@/components/ui/card";
import { PlayerRankingCard } from "@/components/rankings/PlayerRankingCard";
import { useAllTimeRankingsByCategory, useCurrentRankingsByCategory, calculateNationalRanks, recalculateRanks, type RankingData } from "@/hooks/useRankings";

export type ViewMode = 'current' | 'lifetime';

interface Props {
  category: string;
  viewMode: ViewMode;
  selectedCountry: string;
  selectedGender: string;
}

export function CategoryPanel({ category, viewMode, selectedCountry, selectedGender }: Props) {
  const { data: currentData, isLoading: loadingCurrent } = useCurrentRankingsByCategory(category);
  const { data: lifetimeData, isLoading: loadingLifetime } = useAllTimeRankingsByCategory(category);

  const data: RankingData[] | undefined = viewMode === 'current' ? currentData : lifetimeData;
  const loading = viewMode === 'current' ? loadingCurrent : loadingLifetime;

  // Filter by country and gender
  let filtered = (data || [])
    .filter((p) => selectedCountry === 'all' || (p.country || '').toLowerCase() === selectedCountry.toLowerCase())
    .filter((p) => category !== 'mixed_doubles' || selectedGender === 'all' || (p.gender || '').toLowerCase() === selectedGender.toLowerCase());

  // Recalculate ranks if gender filter is active for mixed doubles
  const isGenderFiltered = category === 'mixed_doubles' && selectedGender !== 'all';
  if (isGenderFiltered) {
    filtered = recalculateRanks(filtered);
  }

  // Calculate national ranks if country filter is active
  const isNationalView = selectedCountry !== 'all';
  if (isNationalView && selectedCountry) {
    filtered = calculateNationalRanks(filtered, selectedCountry);
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Loading rankings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {filtered.length > 0 ? (
        filtered.map((player) => (
          <PlayerRankingCard
            key={`${player.player_id}-${player.category}`}
            playerId={player.player_id}
            rank={player.rank}
            name={player.name}
            country={player.country || undefined}
            totalPoints={player.total_points}
            nationalRank={player.nationalRank}
            showNationalRank={isNationalView}
          />
        ))
      ) : (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">No players ranked in this category yet.</p>
        </Card>
      )}
    </div>
  );
}
