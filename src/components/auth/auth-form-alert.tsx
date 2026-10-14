import { AlertCircle } from 'lucide-react';

export function AuthFormAlert({ message }: { message?: string | null }) {
  if (!message) return null;

  return (
    <div
      role="alert"
      className="flex items-start gap-2.5 rounded-lg border border-destructive/20 bg-destructive/5 px-3.5 py-3 text-sm text-destructive animate-in fade-in slide-in-from-top-1 duration-200"
    >
      <AlertCircle className="mt-0.5 size-4 shrink-0" />
      <span className="font-medium">{message}</span>
    </div>
  );
}
