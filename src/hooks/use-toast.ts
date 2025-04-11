
// This file is a wrapper around the shadcn toast component
// Re-exporting from here allows us to maintain consistent toast usage
import { type ToastActionElement, type ToastProps } from "@/components/ui/toast";
import { toast as toastOriginal } from "sonner";

export type ToastProps = ToastProps;
export type ToastActionElement = ToastActionElement;

// Create a simple useToast hook that returns toast functions
export const useToast = () => {
  return {
    toast: toastOriginal,
    dismiss: toastOriginal.dismiss,
    error: toastOriginal.error,
    success: toastOriginal.success,
    info: toastOriginal.info
  };
};

// Re-export the toast functions
export const toast = toastOriginal;

export type Toast = {
  id: string;
  title?: string;
  description?: React.ReactNode;
  action?: ToastActionElement;
};

export type ToasterToast = ToastProps & {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: ToastActionElement;
};
