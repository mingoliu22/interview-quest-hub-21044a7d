
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";

type RoleInfoProps = {
  role: string;
}

const RoleInfo = ({ role }: RoleInfoProps) => {
  if (role === "job_seeker") {
    return null;
  }

  return (
    <Alert variant="default" className="bg-amber-50 text-amber-800 border-amber-200">
      <InfoIcon className="h-4 w-4 mr-2" />
      <AlertDescription>
        {role === "admin" 
          ? "Admin accounts require approval before login is allowed." 
          : role === "hr"
          ? "HR Professional accounts require approval before login is allowed."
          : "Interviewer accounts are automatically approved. After login, please complete your profile information."}
      </AlertDescription>
    </Alert>
  );
};

export default RoleInfo;
