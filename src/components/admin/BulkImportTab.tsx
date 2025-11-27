import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { DuplicateResolutionList } from "./DuplicateResolutionList";
import { IncompletePlayersForm } from "./IncompletePlayersForm";
import type { DuplicatePlayer, BulkImportResolutions, IncompletePlayer, NewPlayerCompletions } from "@/types/admin";

interface BulkImportTabProps {
  onImportComplete: () => void;
}

export function BulkImportTab({ onImportComplete }: BulkImportTabProps) {
  const { toast } = useToast();
  const [bulkImportFile, setBulkImportFile] = useState<File | null>(null);
  const [duplicates, setDuplicates] = useState<DuplicatePlayer[]>([]);
  const [resolutions, setResolutions] = useState<BulkImportResolutions>({});
  const [incompletePlayers, setIncompletePlayers] = useState<IncompletePlayer[]>([]);
  const [completions, setCompletions] = useState<NewPlayerCompletions>({});
  const [isImporting, setIsImporting] = useState(false);

  const downloadCSVTemplate = () => {
    const headers = ["name", "country", "gender", "player_code", "email", "date_of_birth", "dupr_id"];
    const csvContent = headers.join(",") + "\n" + "John Doe,USA,male,NPL000000001,john@example.com,1990-01-01,12345678";
    
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "player_import_template.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const downloadHistoricTemplate = () => {
    const headers = [
      "player_name",
      "player_code", 
      "country",
      "gender",
      "category",
      "finishing_position",
      "points",
      "event_date",
      "tournament_name",
      "tier"
    ];
    const exampleRows = [
      "John Doe,NPL000000001,Australia,male,mens_singles,points_awarded,150,2023-06-15,Historic Championship 2023,historic",
      "Jane Smith,NPL000000002,USA,female,womens_singles,points_awarded,200,2023-07-20,Summer Classic 2023,historic",
      "Mike Johnson,,New Zealand,male,mens_doubles,points_awarded,100,2023-08-10,Winter Open 2023,historic"
    ];
    const csvContent = headers.join(",") + "\n" + exampleRows.join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "historic_points_import_template.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleBulkImport = async () => {
    if (!bulkImportFile) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select a CSV file",
      });
      return;
    }

    setIsImporting(true);

    try {
      const text = await bulkImportFile.text();

      const { data, error } = await supabase.functions.invoke("bulk-import-rankings", {
        body: { 
          csvText: text, 
          fileName: bulkImportFile.name,
          duplicateResolutions: null,
          newPlayerCompletions: null
        },
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
          description: `Found ${messages.join(' and ')}. Please resolve them below.`,
        });
      } else {
        toast({
          title: "Success",
          description: `Successfully imported ${data.inserted_count} players`,
        });
        setBulkImportFile(null);
        onImportComplete();
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to import players",
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleResolveDuplicates = async () => {
    if (!bulkImportFile) return;

    setIsImporting(true);

    try {
      const text = await bulkImportFile.text();

      const { data, error } = await supabase.functions.invoke("bulk-import-rankings", {
        body: {
          csvText: text,
          fileName: bulkImportFile.name,
          duplicateResolutions: resolutions,
          newPlayerCompletions: completions,
        },
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: `Successfully imported ${data.inserted_count} players`,
      });

      setBulkImportFile(null);
      setDuplicates([]);
      setResolutions({});
      setIncompletePlayers([]);
      setCompletions({});
      onImportComplete();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to resolve duplicates",
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Bulk Import Players</CardTitle>
          <CardDescription>
            Upload a CSV file with player information. Required fields: name, country, gender. 
            Optional: player_code (auto-generated if not provided), email, date_of_birth, dupr_id.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={downloadCSVTemplate}>
              <Download className="h-4 w-4 mr-2" />
              Player Import Template
            </Button>
            <Button variant="outline" onClick={downloadHistoricTemplate}>
              <Download className="h-4 w-4 mr-2" />
              Historic Points Template
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bulk_import">Upload CSV File</Label>
            <Input
              id="bulk_import"
              type="file"
              accept=".csv"
              onChange={(e) => setBulkImportFile(e.target.files?.[0] || null)}
            />
          </div>

          <Button onClick={handleBulkImport} disabled={!bulkImportFile || isImporting}>
            {isImporting ? "Importing..." : "Import Players"}
          </Button>
        </CardContent>
      </Card>

      {duplicates.length > 0 && (
        <DuplicateResolutionList
          duplicates={duplicates}
          resolutions={resolutions}
          onResolutionChange={setResolutions}
          onResolve={handleResolveDuplicates}
          isResolving={isImporting}
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
  );
}
