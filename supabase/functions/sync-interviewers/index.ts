
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    console.log("Starting interviewer sync process");
    
    // Get all profiles with role = interviewer and approved = true
    const { data: interviewerProfiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, first_name, last_name")
      .eq("role", "interviewer")
      .eq("approved", true);
    
    if (profilesError) {
      console.error("Error fetching interviewer profiles:", profilesError);
      throw profilesError;
    }
    
    if (!interviewerProfiles || interviewerProfiles.length === 0) {
      console.log("No interviewer profiles found to sync");
      return new Response(JSON.stringify({ 
        success: true,
        message: "No interviewer profiles found to sync",
        syncedCount: 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }
    
    console.log(`Found ${interviewerProfiles.length} interviewer profiles to sync`);
    const syncResults = [];
    
    for (const profile of interviewerProfiles) {
      try {
        // Create a default bio if first_name and last_name are available
        const defaultBio = profile.first_name && profile.last_name 
          ? `${profile.first_name} ${profile.last_name}` 
          : "New Interviewer";
        
        // Check if interviewer record already exists
        const { data: existingInterviewer, error: checkError } = await supabase
          .from("interviewers")
          .select("id")
          .eq("id", profile.id)
          .maybeSingle();
        
        if (checkError) {
          console.error(`Error checking existing interviewer ${profile.id}:`, checkError);
          syncResults.push({ id: profile.id, success: false, error: checkError.message });
          continue;
        }
        
        // For debugging - check table structure
        if (!existingInterviewer) {
          console.log(`Creating new interviewer record for profile ${profile.id}`);
          
          // Minimal data insertion - only required fields
          const { error: upsertError } = await supabase
            .from("interviewers")
            .insert({
              id: profile.id,
              bio: defaultBio
            });
              
          if (upsertError) {
            console.error(`Error inserting interviewer ${profile.id}:`, upsertError);
            syncResults.push({ id: profile.id, success: false, error: upsertError.message });
          } else {
            console.log(`Successfully created interviewer ${profile.id}`);
            syncResults.push({ id: profile.id, success: true });
          }
        } else {
          console.log(`Interviewer ${profile.id} already exists, skipping`);
          syncResults.push({ id: profile.id, success: true, message: "Already exists" });
        }
      } catch (profileError) {
        console.error(`Error processing interviewer ${profile.id}:`, profileError);
        syncResults.push({ id: profile.id, success: false, error: String(profileError) });
      }
    }
    
    return new Response(JSON.stringify({ 
      success: true,
      message: "Sync completed",
      syncedCount: syncResults.filter(r => r.success).length,
      results: syncResults
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error("Error in sync-interviewers function:", error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message,
      details: String(error)
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
