import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { DuplicateResolutionList } from "./DuplicateResolutionList";
import { IncompletePlayersForm } from "./IncompletePlayersForm";
import type { DuplicatePlayer, BulkImportResolutions, IncompletePlayer, NewPlayerCompletions } from "@/types/admin";

interface BulkImportMatchesTabProps {
  onImportComplete: () => void;
}

export function BulkImportMatchesTab({ onImportComplete }: BulkImportMatchesTabProps) {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [duplicates, setDuplicates] = useState<DuplicatePlayer[]>([]);
  const [resolutions, setResolutions] = useState<BulkImportResolutions>({});
  const [incompletePlayers, setIncompletePlayers] = useState<IncompletePlayer[]>([]);
  const [completions, setCompletions] = useState<NewPlayerCompletions>({});
  const [resolving, setResolving] = useState(false);

  const downloadTemplate = () => {
    const template = `player_name,player_code,country,gender,category,finishing_position,event_date,tournament_name,tier
John Doe,NPL000000001,USA,male,mens_singles,winner,2024-10-01,Spring Championship,tier2
Jane Smith,NPL000000002,Canada,female,womens_singles,second,2024-10-01,Spring Championship,tier2
Mike Johnson,NPL000000003,USA,male,mens_singles,quarterfinalist,2024-10-01,Spring Championship,tier2
Sarah Lee,NPL000000004,Canada,female,womens_doubles,round_of_16,2024-10-01,Spring Championship,tier2`;
    
    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'event_results_import_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setDuplicates([]);
      setResolutions({});
      setIncompletePlayers([]);
      setCompletions({});
    }
  };

  const handleImport = async () => {
    if (!file) {
      toast({
        variant: "destructive",
        title: "No file selected",
        description: "Please select a CSV file to import.",
      });
      return;
    }

    setImporting(true);
    try {
      const text = await file.text();
      
      const { data, error } = await supabase.functions.invoke('bulk-import-rankings', {
        body: { csvText: text, fileName: file.name, duplicateResolutions: null, newPlayerCompletions: null }
      });

      if (error) throw error;

      const hasDuplicates = data.duplicates && data.duplicates.length > 0;
      const hasIncomplete = data.incomplete_new_players && data.incomplete_new_players.length > 0;

      if (hasDuplicates) {
        setDuplicates(data.duplicates);
      }
      
      if (hasIncomplete) {
        setIncompletePlayers(data.incomplete_new_players);
      }

      if (hasDuplicates || hasIncomplete) {
        const messages = [];
        if (hasDuplicates) messages.push(`${data.duplicates.length} potential duplicates`);
        if (hasIncomplete) messages.push(`${data.incomplete_new_players.length} incomplete new players`);
        
        toast({
          title: "Action Required",
          description: `Found ${messages.join(' and ')}. Please resolve them to continue.`,
        });
      } else {
        toast({
          title: "Import Successful",
          description: `Successfully imported ${data.successful} events with ${data.failed} failures.`,
        });
        onImportComplete();
        setFile(null);
      }
    } catch (error: any) {
      console.error('Import error:', error);
      toast({
        variant: "destructive",
        title: "Import Failed",
        description: error.message || "Failed to import event results.",
      });
    } finally {
      setImporting(false);
    }
  };

  const handleResolve = async () => {
    if (!file) return;

    setResolving(true);
    try {
      const text = await file.text();
      
      const { data, error } = await supabase.functions.invoke('bulk-import-rankings', {
        body: { 
          csvText: text, 
          fileName: file.name, 
          duplicateResolutions: resolutions,
          newPlayerCompletions: completions
        }
      });

      if (error) throw error;

      toast({
        title: "Import Complete",
        description: `Successfully imported ${data.successful} events. ${data.failed} failed.`,
      });

      if (data.errors && data.errors.length > 0) {
        console.log('Import errors:', data.errors);
      }

      setDuplicates([]);
      setResolutions({});
      setIncompletePlayers([]);
      setCompletions({});
      setFile(null);
      onImportComplete();
    } catch (error: any) {
      console.error('Resolution error:', error);
      toast({
        variant: "destructive",
        title: "Import Failed",
        description: error.message || "Failed to complete import.",
      });
    } finally {
      setResolving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bulk Import Event Results</CardTitle>
        <CardDescription>
          Upload a CSV file containing event results with player information.
          The system will automatically match players by code, email, or DUPR ID, and create new players when needed.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertDescription>
            <strong>CSV Format:</strong> player_name, player_code, country, gender, category, finishing_position, event_date, tournament_name, tier
            <br /><br />
            <strong>Categories:</strong> mens_singles, womens_singles, mens_doubles, womens_doubles, mixed_doubles
            <br />
            <strong>Tiers:</strong> tier1, tier2, tier3, tier4, historic
            <br />
            <strong>Finishing Positions:</strong> winner, second, third, fourth, quarterfinalist, round_of_16, event_win
            <br /><br />
            <strong>Tip:</strong> Download the template below for the correct format with examples.
          </AlertDescription>
        </Alert>

        <div className="flex gap-2">
          <Button variant="outline" onClick={downloadTemplate}>
            Download CSV Template
          </Button>
        </div>

        {duplicates.length === 0 && incompletePlayers.length === 0 ? (
          <div className="space-y-4">
            <Input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              disabled={importing}
            />
            <Button 
              onClick={handleImport} 
              disabled={!file || importing}
              className="w-full"
            >
              {importing ? "Importing..." : "Import Event Results"}
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {duplicates.length > 0 && (
              <DuplicateResolutionList
                duplicates={duplicates}
                resolutions={resolutions}
                onResolutionChange={setResolutions}
                onResolve={handleResolve}
                isResolving={resolving}
              />
            )}

            {incompletePlayers.length > 0 && (
              <IncompletePlayersForm
                incompletePlayers={incompletePlayers}
                completions={completions}
                onCompletionsChange={setCompletions}
              />
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
