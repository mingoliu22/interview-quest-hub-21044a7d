
// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://xktshufylnozgpgyzeaj.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrdHNodWZ5bG5vemdwZ3l6ZWFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQzNTAwMTYsImV4cCI6MjA1OTkyNjAxNn0._U_7ErV32DYAchNTN0otL1EDjBTcASP86_zsrFBVVHI";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true
  }
});
