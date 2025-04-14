
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
      throw profilesError;
    }
    
    if (interviewerProfiles && interviewerProfiles.length > 0) {
      for (const profile of interviewerProfiles) {
        const { error: upsertError } = await supabase
          .from("interviewers")
          .upsert({
            id: profile.id,
            bio: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || "New Interviewer"
          });
          
        if (upsertError) {
          console.error(`Error upserting interviewer ${profile.id}:`, upsertError);
        }
      }
    }
    
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error("Error in sync-interviewers function:", error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
