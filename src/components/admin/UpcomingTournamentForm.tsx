import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useOrganization } from "@/contexts/OrganizationContext";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  tournament_name: z.string().min(1, "Tournament name is required").max(200),
  tournament_date: z.date({
    required_error: "Tournament date is required",
  }),
  registration_url: z.string().url("Must be a valid URL"),
  location: z.string().max(200).optional(),
  description: z.string().max(1000).optional(),
  is_featured: z.boolean().default(false),
});

interface UpcomingTournamentFormProps {
  onSuccess?: () => void;
  editData?: {
    id: string;
    tournament_name: string;
    tournament_date: string;
    registration_url: string;
    location?: string;
    description?: string;
    is_featured: boolean;
  };
}

export const UpcomingTournamentForm = ({ onSuccess, editData }: UpcomingTournamentFormProps) => {
  const { toast } = useToast();
  const { currentOrg } = useOrganization();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: editData ? {
      tournament_name: editData.tournament_name,
      tournament_date: new Date(editData.tournament_date),
      registration_url: editData.registration_url,
      location: editData.location || "",
      description: editData.description || "",
      is_featured: editData.is_featured,
    } : {
      tournament_name: "",
      tournament_date: new Date(),
      registration_url: "",
      location: "",
      description: "",
      is_featured: false,
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);

    try {
      if (!currentOrg) {
        throw new Error("No organization selected");
      }

      const tournamentData = {
        tournament_name: values.tournament_name,
        tournament_date: format(values.tournament_date, "yyyy-MM-dd"),
        registration_url: values.registration_url,
        location: values.location || null,
        description: values.description || null,
        is_featured: values.is_featured,
        organization_id: currentOrg.id,
      };

      if (editData) {
        const { error } = await supabase
          .from("upcoming_tournaments")
          .update(tournamentData)
          .eq("id", editData.id);

        if (error) throw error;

        toast({
          title: "Tournament updated",
          description: "The tournament has been successfully updated.",
        });
      } else {
        const { error } = await supabase
          .from("upcoming_tournaments")
          .insert([tournamentData]);

        if (error) throw error;

        toast({
          title: "Tournament added",
          description: "The upcoming tournament has been successfully added.",
        });

        form.reset();
      }

      onSuccess?.();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="tournament_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tournament Name *</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Sydney Open 2025" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="tournament_date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Tournament Date *</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) => date < new Date()}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="registration_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Registration URL *</FormLabel>
              <FormControl>
                <Input placeholder="https://example.com/register" {...field} />
              </FormControl>
              <FormDescription>
                External link where players can register for the tournament
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Location</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Sydney Olympic Park" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Brief description of the tournament..."
                  className="resize-none"
                  rows={4}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="is_featured"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Featured Tournament</FormLabel>
                <FormDescription>
                  Display this tournament prominently with a badge
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : editData ? "Update Tournament" : "Add Tournament"}
        </Button>
      </form>
    </Form>
  );
};
