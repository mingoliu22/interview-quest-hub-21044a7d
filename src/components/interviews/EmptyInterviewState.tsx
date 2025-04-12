
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Video, CalendarPlus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface EmptyInterviewStateProps {
  onStart: () => void;
  onSuccess?: () => void; // Added onSuccess as optional prop
}

export const EmptyInterviewState: React.FC<EmptyInterviewStateProps> = ({ onStart, onSuccess }) => {
  const { userRole } = useAuth();
  const isAdminOrHR = userRole === 'admin' || userRole === 'hr';

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Interview</CardTitle>
        <CardDescription>
          {isAdminOrHR 
            ? "Schedule interviews for candidates and manage the interview process"
            : "Complete your interview preparation to start the AI interview"}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center py-8">
        {isAdminOrHR ? (
          <>
            <CalendarPlus className="w-16 h-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium mb-2">Schedule New Interviews</h3>
            <p className="text-gray-500 text-center mb-6 max-w-md">
              No interviews have been scheduled yet. Create new interviews for candidates and assign interviewers.
            </p>
            <Button onClick={onStart}>
              Schedule Interview
            </Button>
          </>
        ) : (
          <>
            <Video className="w-16 h-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium mb-2">Your AI Interview is Ready</h3>
            <p className="text-gray-500 text-center mb-6 max-w-md">
              Set your preferences and prepare for the interview before starting. This 
              will allow you to practice and receive feedback in a simulated interview environment.
            </p>
            <Button onClick={onStart}>
              Prepare for Interview
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
};
