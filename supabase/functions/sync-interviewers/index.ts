
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
    
    if (interviewerProfiles && interviewerProfiles.length > 0) {
      console.log(`Found ${interviewerProfiles.length} interviewer profiles to sync`);
      
      for (const profile of interviewerProfiles) {
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
          continue;
        }
        
        // Use insert or update based on whether record exists
        if (!existingInterviewer) {
          console.log(`Creating new interviewer record for ${profile.id}`);
          const { error: insertError } = await supabase
            .from("interviewers")
            .insert({
              id: profile.id,
              bio: defaultBio.trim() || "New Interviewer",
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
            
          if (insertError) {
            console.error(`Error inserting interviewer ${profile.id}:`, insertError);
          }
        } else {
          console.log(`Updating existing interviewer record for ${profile.id}`);
          const { error: updateError } = await supabase
            .from("interviewers")
            .update({
              bio: defaultBio.trim() || "New Interviewer",
              updated_at: new Date().toISOString()
            })
            .eq("id", profile.id);
            
          if (updateError) {
            console.error(`Error updating interviewer ${profile.id}:`, updateError);
          }
        }
      }
    } else {
      console.log("No interviewer profiles found to sync");
    }
    
    return new Response(JSON.stringify({ 
      success: true,
      message: "Sync completed successfully",
      syncedCount: interviewerProfiles?.length || 0
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
