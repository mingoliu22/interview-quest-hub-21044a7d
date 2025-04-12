
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InterviewsTable } from "./InterviewsTable";
import { EmptyInterviewState } from "./EmptyInterviewState";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { InterviewFormDialog } from "./InterviewFormDialog";

interface InterviewsListCardProps {
  isLoading: boolean;
  interviews: any[];
  candidates: any[];
  interviewers: any[];
  exams: any[];
  onRefresh: () => void;
}

export const InterviewsListCard = ({
  isLoading,
  interviews,
  candidates,
  interviewers,
  exams,
  onRefresh,
}: InterviewsListCardProps) => {
  const { isAdmin, isHR } = useAuth();

  const handleStartInterview = () => {
    if (isAdmin() || isHR()) {
      // For admin/HR, use the InterviewFormDialog component through the parent
      toast.info("Use the 'Schedule Interview' button at the top of the page");
    } else {
      // For job seekers and interviewers, navigate to preparation
      toast.info("Prepare for your interview");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>All Interviews</CardTitle>
        <CardDescription>
          View and manage all scheduled interviews
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center p-8">
            <div className="w-8 h-8 border-t-2 border-b-2 border-gray-900 rounded-full animate-spin"></div>
          </div>
        ) : interviews.length === 0 ? (
          <EmptyInterviewState 
            onSuccess={onRefresh}
            onStart={handleStartInterview}
          />
        ) : (
          <InterviewsTable 
            interviews={interviews}
            candidates={candidates}
            interviewers={interviewers}
            exams={exams}
            onRefresh={onRefresh}
          />
        )}
      </CardContent>
    </Card>
  );
};
