import { toast as sonnerToast } from 'sonner';

type ToastType = 'success' | 'error' | 'info' | 'warning';

export function useToast() {
  const toast = (message: string, type: ToastType = 'info') => {
    sonnerToast[type](message);
  };

  return {
    toast,
    success: (message: string) => toast(message, 'success'),
    error: (message: string) => toast(message, 'error'),
    info: (message: string) => toast(message, 'info'),
    warning: (message: string) => toast(message, 'warning'),
  };
}