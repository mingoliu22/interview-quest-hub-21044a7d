
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * System function used for internal synchronization if needed.
 * Not exposed to the UI.
 */
export const syncInterviewers = async () => {
  try {
    const { data, error } = await supabase.functions.invoke('sync-interviewers');
    
    if (error) {
      console.error("Error syncing interviewers:", error);
      return false;
    }
    
    return true;
  } catch (e) {
    console.error("Exception in syncInterviewers:", e);
    return false;
  }
};
