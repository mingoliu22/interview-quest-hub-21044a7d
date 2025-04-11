
// This file is a wrapper around the shadcn toast component
// Re-exporting from here allows us to maintain consistent toast usage
import { useToast as useToastOriginal } from "@/components/ui/toast";
import { toast as toastOriginal } from "sonner";

// Re-export the toast functions
export const useToast = useToastOriginal;
export const toast = toastOriginal;

export type { Toast, ToasterToast } from "@/components/ui/toast";
