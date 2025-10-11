import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { DuplicateResolutionList } from "./DuplicateResolutionList";
import type { DuplicatePlayer, BulkImportResolutions } from "@/types/admin";

interface BulkImportMatchesTabProps {
  onImportComplete: () => void;
}

export function BulkImportMatchesTab({ onImportComplete }: BulkImportMatchesTabProps) {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [duplicates, setDuplicates] = useState<DuplicatePlayer[]>([]);
  const [resolutions, setResolutions] = useState<BulkImportResolutions>({});
  const [resolving, setResolving] = useState(false);

  const downloadTemplate = () => {
    const template = `player_name,player_code,country,gender,category,finishing_position,event_date,tournament_name,tier
John Doe,NPL000000001,USA,male,mens_singles,winner,2024-10-01,Spring Championship,tier2
Jane Smith,NPL000000002,Canada,female,womens_singles,second,2024-10-01,Spring Championship,tier2
Mike Johnson,NPL000000003,USA,male,mens_singles,third,2024-10-01,Spring Championship,tier2`;
    
    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'match_import_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setDuplicates([]);
      setResolutions({});
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
        body: { csvText: text, duplicateResolutions: null }
      });

      if (error) throw error;

      if (data.duplicates && data.duplicates.length > 0) {
        setDuplicates(data.duplicates);
        toast({
          title: "Duplicates Detected",
          description: `Found ${data.duplicates.length} potential duplicate players. Please resolve them to continue.`,
        });
      } else {
        toast({
          title: "Import Successful",
          description: `Successfully imported ${data.successful} matches with ${data.failed} failures.`,
        });
        onImportComplete();
        setFile(null);
      }
    } catch (error: any) {
      console.error('Import error:', error);
      toast({
        variant: "destructive",
        title: "Import Failed",
        description: error.message || "Failed to import matches.",
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
        body: { csvText: text, duplicateResolutions: resolutions }
      });

      if (error) throw error;

      toast({
        title: "Import Complete",
        description: `Successfully imported ${data.successful} matches. ${data.failed} failed.`,
      });

      if (data.errors && data.errors.length > 0) {
        console.log('Import errors:', data.errors);
      }

      setDuplicates([]);
      setResolutions({});
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
        <CardTitle>Bulk Import Match Results</CardTitle>
        <CardDescription>
          Upload a CSV file containing match results with player information.
          The system will handle player creation/matching automatically.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertDescription>
            CSV Format: player_name, player_code, country, gender, category, finishing_position, event_date, tournament_name, tier
            <br />
            Categories: mens_singles, womens_singles, mens_doubles, womens_doubles, mixed_doubles
            <br />
            Positions: winner, second, third, fourth, quarterfinalist, round_of_16, event_win
            <br />
            Tiers: tier1, tier2, tier3, tier4
          </AlertDescription>
        </Alert>

        <div className="flex gap-2">
          <Button variant="outline" onClick={downloadTemplate}>
            Download CSV Template
          </Button>
        </div>

        {duplicates.length === 0 ? (
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
              {importing ? "Importing..." : "Import Match Results"}
            </Button>
          </div>
        ) : (
          <DuplicateResolutionList
            duplicates={duplicates}
            resolutions={resolutions}
            onResolutionChange={setResolutions}
            onResolve={handleResolve}
            isResolving={resolving}
          />
        )}
      </CardContent>
    </Card>
  );
}
