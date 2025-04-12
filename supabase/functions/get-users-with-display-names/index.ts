
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Create a Supabase client with the admin key
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("Fetching profiles from database...");
    
    // Fetch all profiles first
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*');
    
    if (profilesError) {
      console.error("Error fetching profiles:", profilesError);
      throw profilesError;
    }
    
    console.log(`Fetched ${profiles.length} profiles successfully`);

    // Fetch all auth users to get emails
    const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error("Error fetching auth users:", authError);
      throw authError;
    }

    const users = authData?.users || [];
    console.log(`Fetched ${users.length} auth users successfully`);

    // Also fetch candidates table for additional information
    const { data: candidates, error: candidatesError } = await supabase
      .from('candidates')
      .select('*');
    
    if (candidatesError) {
      console.error("Error fetching candidates:", candidatesError);
      // Continue even if there's an error, as we can still return profiles and auth data
    }
    
    console.log(`Fetched ${candidates?.length || 0} candidates successfully`);

    // Map profiles with emails
    const enhancedProfiles = profiles.map(profile => {
      const user = users.find(u => u.id === profile.id);
      
      // Look for matching candidate
      const candidate = candidates?.find(c => c.user_id === profile.id);
      
      return {
        id: profile.id,
        first_name: profile.first_name,
        last_name: profile.last_name,
        role: profile.role,
        email: user?.email || '',
        approved: profile.approved,
        candidate_id: candidate?.id || null,
        candidate_status: candidate?.status || null,
        display_name: profile.first_name && profile.last_name 
          ? `${profile.first_name} ${profile.last_name}`.trim() 
          : user?.email || 'Unknown User'
      };
    });

    console.log(`Successfully created ${enhancedProfiles.length} enhanced profiles`);

    return new Response(JSON.stringify(enhancedProfiles), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
      status: 200,
    });
  } catch (error) {
    console.error("Error in edge function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
      status: 400,
    });
  }
});
