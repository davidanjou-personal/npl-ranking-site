// CSV Export Utilities

export function downloadCSV(data: any[], filename: string) {
  if (data.length === 0) {
    throw new Error("No data to export");
  }

  // Get all unique keys from all objects
  const allKeys = new Set<string>();
  data.forEach(item => {
    Object.keys(item).forEach(key => allKeys.add(key));
  });
  
  const headers = Array.from(allKeys);
  
  // Create CSV content
  const csvRows = [];
  
  // Add header row
  csvRows.push(headers.map(header => `"${header}"`).join(','));
  
  // Add data rows
  data.forEach(item => {
    const values = headers.map(header => {
      const value = item[header];
      
      // Handle different data types
      if (value === null || value === undefined) {
        return '""';
      }
      
      if (typeof value === 'object') {
        return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
      }
      
      // Escape quotes and wrap in quotes
      return `"${String(value).replace(/"/g, '""')}"`;
    });
    
    csvRows.push(values.join(','));
  });
  
  const csvContent = csvRows.join('\n');
  
  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

// Specific export functions
export function exportPlayers(players: any[]) {
  const formattedData = players.map(player => ({
    Name: player.name,
    Country: player.country,
    Gender: player.gender,
    'Player Code': player.player_code,
    Email: player.email || '',
    'Date of Birth': player.date_of_birth || '',
    'DUPR ID': player.dupr_id || '',
    'Created At': player.created_at ? new Date(player.created_at).toLocaleDateString() : '',
  }));
  
  downloadCSV(formattedData, `players_export_${new Date().toISOString().split('T')[0]}.csv`);
}

export function exportRankings(rankings: any[], viewMode: 'current' | 'lifetime') {
  const formattedData = rankings.map(ranking => ({
    Rank: ranking.rank,
    Name: ranking.name,
    Country: ranking.country,
    Gender: ranking.gender,
    Category: ranking.category,
    'Total Points': ranking.total_points,
    'Player Code': ranking.player_code || '',
  }));
  
  downloadCSV(
    formattedData,
    `${viewMode}_rankings_export_${new Date().toISOString().split('T')[0]}.csv`
  );
}

export function exportTournaments(events: any[]) {
  const formattedData = events.map(event => ({
    'Tournament Name': event.tournament_name,
    Date: new Date(event.match_date).toLocaleDateString(),
    Tier: event.tier,
    Category: event.category,
    'Number of Results': event.event_results?.length || 0,
    'Created At': event.created_at ? new Date(event.created_at).toLocaleDateString() : '',
  }));
  
  downloadCSV(formattedData, `tournaments_export_${new Date().toISOString().split('T')[0]}.csv`);
}

export function exportEventResults(results: any[]) {
  const formattedData = results.map(result => ({
    'Player Name': result.player_name,
    'Tournament Name': result.tournament_name,
    Date: new Date(result.match_date).toLocaleDateString(),
    Category: result.category,
    'Finishing Position': result.finishing_position,
    'Points Awarded': result.points_awarded,
    Tier: result.tier,
  }));
  
  downloadCSV(formattedData, `event_results_export_${new Date().toISOString().split('T')[0]}.csv`);
}
