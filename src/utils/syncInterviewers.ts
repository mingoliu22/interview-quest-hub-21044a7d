
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * System function used for internal synchronization of interviewer records.
 * Not exposed to the UI.
 */
export const syncInterviewers = async () => {
  try {
    console.log("Syncing interviewers...");
    const { data, error } = await supabase.functions.invoke('sync-interviewers');
    
    if (error) {
      console.error("Error syncing interviewers:", error);
      toast.error("Failed to create interviewer profile");
      return { success: false, error };
    }
    
    console.log("Sync interviewers result:", data);
    
    if (data && data.success) {
      if (data.syncedCount > 0) {
        toast.success("Interviewer profile created successfully");
      } else {
        console.log("No interviewers were synced");
      }
      return { success: true, data };
    } else {
      console.error("Sync unsuccessful:", data);
      toast.error("Failed to create interviewer profile");
      return { success: false, error: data };
    }
  } catch (e) {
    console.error("Exception in syncInterviewers:", e);
    toast.error("An error occurred while creating your interviewer profile");
    return { success: false, error: e };
  }
};
