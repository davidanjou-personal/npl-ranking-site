import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, AlertCircle, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ImportHistory {
  id: string;
  file_name: string;
  imported_by: string;
  created_at: string;
  total_rows: number;
  successful_rows: number;
  failed_rows: number;
  error_log: any;
}

interface ImportHistoryListProps {
  imports: ImportHistory[];
  onRefresh: () => void;
}

export function ImportHistoryList({ imports, onRefresh }: ImportHistoryListProps) {
  const { toast } = useToast();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!deleteId) return;

    setDeleting(true);
    try {
      // First, delete all events associated with this import
      // This will cascade delete event_results automatically
      const { error: eventsError } = await supabase
        .from('events')
        .delete()
        .eq('import_id', deleteId);

      if (eventsError) throw eventsError;

      // Then delete the import history record
      const { error: historyError } = await supabase
        .from('import_history')
        .delete()
        .eq('id', deleteId);

      if (historyError) throw historyError;

      toast({
        title: "Import deleted",
        description: "All events and results from this import have been removed.",
      });

      onRefresh();
      setDeleteId(null);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Delete failed",
        description: error.message,
      });
    } finally {
      setDeleting(false);
    }
  };

  if (imports.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">No imports found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {imports.map((importRecord) => {
          const successRate = importRecord.total_rows > 0
            ? Math.round((importRecord.successful_rows / importRecord.total_rows) * 100)
            : 0;

          return (
            <Card key={importRecord.id}>
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  <span className="truncate">{importRecord.file_name}</span>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setDeleteId(importRecord.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {new Date(importRecord.created_at).toLocaleString()}
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-4 flex-wrap">
                  <Badge variant="outline">
                    Total: {importRecord.total_rows} rows
                  </Badge>
                  <Badge variant="default" className="bg-primary">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Success: {importRecord.successful_rows}
                  </Badge>
                  {importRecord.failed_rows > 0 && (
                    <Badge variant="destructive">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Failed: {importRecord.failed_rows}
                    </Badge>
                  )}
                  <Badge variant="secondary">
                    {successRate}% success rate
                  </Badge>
                </div>

                {importRecord.error_log && importRecord.error_log.length > 0 && (
                  <details className="text-sm">
                    <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                      View errors ({importRecord.error_log.length})
                    </summary>
                    <div className="mt-2 space-y-1 pl-4">
                      {importRecord.error_log.slice(0, 5).map((err: any, idx: number) => (
                        <div key={idx} className="text-xs">
                          Row {err.row}: <span className="text-destructive">{err.error}</span>
                        </div>
                      ))}
                      {importRecord.error_log.length > 5 && (
                        <p className="text-xs text-muted-foreground">
                          ...and {importRecord.error_log.length - 5} more errors
                        </p>
                      )}
                    </div>
                  </details>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Import?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all events and results created by this import.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Deleting..." : "Delete Import"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}