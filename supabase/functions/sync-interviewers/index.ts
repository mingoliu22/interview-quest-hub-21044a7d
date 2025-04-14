
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

    // Initialize Supabase client with service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("Starting manual interviewer synchronization...");
    
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
    
    console.log(`Found ${interviewerProfiles?.length || 0} approved interviewer profiles for manual sync`);
    
    if (interviewerProfiles && interviewerProfiles.length > 0) {
      // For each interviewer profile, check if they exist in interviewers table
      for (const profile of interviewerProfiles) {
        // Check if interviewer already exists in interviewers table
        const { data: existingInterviewer, error: checkError } = await supabase
          .from("interviewers")
          .select("id")
          .eq("id", profile.id)
          .single();
          
        if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
          console.error(`Error checking interviewer ${profile.id}:`, checkError);
          continue;
        }
        
        // If interviewer doesn't exist in interviewers table, add them
        if (!existingInterviewer) {
          const { error: insertError } = await supabase
            .from("interviewers")
            .insert({
              id: profile.id,
              bio: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || "New Interviewer"
            });
          
          if (insertError) {
            console.error(`Error inserting interviewer ${profile.id}:`, insertError);
          } else {
            console.log(`Successfully added interviewer ${profile.id} to interviewers table`);
          }
        } else {
          console.log(`Interviewer ${profile.id} already exists in interviewers table`);
        }
      }
    }
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: "Manual interviewer synchronization completed" 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error("Error in sync-interviewers function:", error);
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
