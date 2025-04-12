
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import AdminLayout from "@/components/layouts/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { InterviewFormDialog } from "@/components/interviews/InterviewFormDialog";
import { InterviewsListCard } from "@/components/interviews/InterviewsListCard";
import { Interview, Candidate, Interviewer, Exam } from "@/components/interviews/InterviewsTable";

const InterviewManagement = () => {
  const { user, isAdmin, isHR } = useAuth();
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [interviewers, setInterviewers] = useState<Interviewer[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    try {
      setIsLoading(true);

      // Fetch jobs
      const { data: jobsData, error: jobsError } = await supabase
        .from("jobs")
        .select("id, title, company");

      if (jobsError) throw jobsError;

      // Fetch interviews - fixed to avoid joining with interviewer_id directly
      const { data: interviewsData, error: interviewsError } = await supabase
        .from("interviews")
        .select(`
          *,
          candidates:candidate_id (id, name, email, user_id)
        `)
        .order("date", { ascending: false });

      if (interviewsError) throw interviewsError;

      // Fetch all job seekers directly from profiles table
      const { data: jobSeekerProfiles, error: jobSeekerProfilesError } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, role")
        .eq("role", "job_seeker");

      if (jobSeekerProfilesError) {
        console.error("Error fetching job seeker profiles:", jobSeekerProfilesError);
      }

      // Fetch emails for job seekers
      const { data: authData } = await supabase.functions.invoke('get-users-with-display-names');
      const usersWithEmails = authData || [];

      // Create candidates from job seeker profiles
      const allCandidates: Candidate[] = [];
      
      if (jobSeekerProfiles) {
        jobSeekerProfiles.forEach(profile => {
          // Find the email for this user from the users data
          const userWithEmail = usersWithEmails.find(u => u.id === profile.id);
          
          allCandidates.push({
            id: profile.id,
            name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Unnamed',
            email: userWithEmail?.email || '',
            user_id: profile.id,
            first_name: profile.first_name,
            last_name: profile.last_name
          });
        });
      }

      // Also fetch legacy candidates table for backward compatibility
      const { data: candidatesData, error: candidatesError } = await supabase
        .from("candidates")
        .select("id, name, email, user_id");

      if (!candidatesError && candidatesData) {
        // Add legacy candidates that are not already in the profiles-based candidates list
        candidatesData.forEach(candidate => {
          const existingCandidate = allCandidates.find(c => 
            c.id === candidate.id || c.user_id === candidate.user_id
          );
          
          if (!existingCandidate && candidate.user_id) {
            // If this candidate has a user_id, find the corresponding profile and email
            const userWithEmail = usersWithEmails.find(u => u.id === candidate.user_id);
            
            allCandidates.push({
              id: candidate.id,
              name: candidate.name,
              email: candidate.email || userWithEmail?.email || '',
              user_id: candidate.user_id,
              first_name: null,
              last_name: null
            });
          }
        });
      }

      // Fetch potential interviewers (HR, admin and interviewer users)
      const { data: interviewerProfiles, error: interviewerProfilesError } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, role")
        .or("role.eq.hr,role.eq.admin,role.eq.interviewer")
        .eq("approved", true);

      if (interviewerProfilesError) {
        console.error("Error fetching interviewer profiles:", interviewerProfilesError);
        setInterviewers([]);
      } else {
        const formattedInterviewers: Interviewer[] = (interviewerProfiles || []).map(profile => {
          // Find the email for this user from the users data
          const userWithEmail = usersWithEmails.find(u => u.id === profile.id);
          
          return {
            id: profile.id,
            first_name: profile.first_name,
            last_name: profile.last_name,
            email: userWithEmail?.email || "",
            name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || "Unnamed Interviewer"
          };
        });
        setInterviewers(formattedInterviewers);
      }

      // Fetch all available exams
      const { data: examsData, error: examsError } = await supabase
        .from("exam_bank")
        .select("id, title, difficulty, category");

      if (examsError) throw examsError;

      // Format the interviews data with proper relationship handling
      const formattedInterviews: Interview[] = (interviewsData || []).map((interview: any) => {
        const candidate = interview.candidates;
        
        // Find interviewer based on interviewer_id instead of trying to use a join
        const interviewer = interviewerProfiles?.find(p => p.id === interview.interviewer_id);
        
        return {
          id: interview.id,
          date: interview.date,
          candidate_id: candidate?.id || "",
          candidate_name: candidate?.name || interview.candidate_name || "Unknown",
          interviewer_id: interviewer?.id || null,
          interviewer_name: interviewer ? 
            `${interviewer.first_name || ""} ${interviewer.last_name || ""}`.trim() || "Unnamed Interviewer" : 
            null,
          position: interview.position,
          status: interview.status,
          user_id: interview.user_id || candidate?.user_id || null,
          settings: interview.settings || {}
        };
      });

      setJobs(jobsData || []);
      setInterviews(formattedInterviews);
      setCandidates(allCandidates);
      setExams(examsData || []);
      
      // Attempt to synchronize candidates with job seeker profiles
      await syncCandidatesWithProfiles(allCandidates, usersWithEmails);
      
    } catch (error: any) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load interview data");
    } finally {
      setIsLoading(false);
    }
  };

  // Function to synchronize candidates with profiles
  const syncCandidatesWithProfiles = async (candidatesList: Candidate[], usersWithEmails: any[]) => {
    try {
      for (const user of usersWithEmails) {
        if (user.role === 'job_seeker') {
          // Check if this job seeker exists in candidates table
          const { data: existingCandidate } = await supabase
            .from('candidates')
            .select('id, user_id')
            .eq('user_id', user.id)
            .maybeSingle();
          
          if (!existingCandidate) {
            // Create a candidate record for this job seeker
            await supabase.from('candidates').insert({
              name: user.display_name,
              email: user.email,
              user_id: user.id,
              status: 'Active'
            });
            console.log(`Created candidate record for job seeker: ${user.display_name}`);
          }
        }
      }
    } catch (error) {
      console.error('Error synchronizing candidates:', error);
    }
  };

  useEffect(() => {
    if (!(isAdmin() || isHR())) {
      return;
    }
    fetchData();
  }, [isAdmin, isHR, user?.id]);

  // Create a formatted candidates array with combined name property for InterviewFormDialog
  const formattedCandidates = candidates.map(candidate => {
    const fullName = candidate.first_name || candidate.last_name ? 
      `${candidate.first_name || ''} ${candidate.last_name || ''}`.trim() : 
      candidate.name;
      
    return {
      id: candidate.id,
      name: fullName || candidate.email,
      email: candidate.email,
      user_id: candidate.user_id,
      first_name: candidate.first_name,
      last_name: candidate.last_name
    };
  });

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Interview Management</h1>
          <InterviewFormDialog 
            candidates={formattedCandidates}
            interviewers={interviewers}
            onInterviewCreated={fetchData}
          />
        </div>

        <InterviewsListCard 
          isLoading={isLoading}
          interviews={interviews}
          candidates={formattedCandidates}
          interviewers={interviewers}
          exams={exams}
          onRefresh={fetchData}
        />
      </div>
    </AdminLayout>
  );
};

export default InterviewManagement;
