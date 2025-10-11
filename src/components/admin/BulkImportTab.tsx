import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { DuplicateResolutionList } from "./DuplicateResolutionList";
import type { DuplicatePlayer, BulkImportResolutions } from "@/types/admin";

interface BulkImportTabProps {
  onImportComplete: () => void;
}

export function BulkImportTab({ onImportComplete }: BulkImportTabProps) {
  const { toast } = useToast();
  const [bulkImportFile, setBulkImportFile] = useState<File | null>(null);
  const [duplicates, setDuplicates] = useState<DuplicatePlayer[]>([]);
  const [resolutions, setResolutions] = useState<BulkImportResolutions>({});
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
      const lines = text.trim().split("\n");
      const headers = lines[0].split(",").map(h => h.trim());
      
      const players = lines.slice(1).map(line => {
        const values = line.split(",").map(v => v.trim());
        const player: any = {};
        headers.forEach((header, index) => {
          player[header] = values[index] || null;
        });
        return player;
      });

      const { data, error } = await supabase.functions.invoke("bulk-import-rankings", {
        body: { players },
      });

      if (error) throw error;

      if (data.duplicates && data.duplicates.length > 0) {
        setDuplicates(data.duplicates);
        toast({
          title: "Duplicates Found",
          description: `Found ${data.duplicates.length} potential duplicates. Please resolve them below.`,
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
      const lines = text.trim().split("\n");
      const headers = lines[0].split(",").map(h => h.trim());
      
      const players = lines.slice(1).map(line => {
        const values = line.split(",").map(v => v.trim());
        const player: any = {};
        headers.forEach((header, index) => {
          player[header] = values[index] || null;
        });
        return player;
      });

      const { data, error } = await supabase.functions.invoke("bulk-import-rankings", {
        body: {
          players,
          resolutions,
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
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Button variant="outline" onClick={downloadCSVTemplate}>
              <Download className="h-4 w-4 mr-2" />
              Download CSV Template
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
    </div>
  );
}
