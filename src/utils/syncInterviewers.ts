
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Manual sync function to force synchronization of interviewer data.
 * This can be used if automatic synchronization via database triggers fails.
 */
export const syncInterviewers = async () => {
  try {
    const { data, error } = await supabase.functions.invoke('sync-interviewers');
    
    if (error) {
      console.error("Error syncing interviewers:", error);
      toast.error("Failed to sync interviewers");
      return false;
    }
    
    console.log("Sync interviewers response:", data);
    toast.success("Interviewers synchronized successfully");
    return true;
  } catch (e) {
    console.error("Exception in syncInterviewers:", e);
    toast.error("Error syncing interviewers");
    return false;
  }
};
