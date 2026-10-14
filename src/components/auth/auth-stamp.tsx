import { cn } from '@/lib/utils';

interface AuthStampProps {
  children: React.ReactNode;
  tone?: 'brand' | 'success';
  className?: string;
}

/** Rubber-stamp mark that lands on the ticket when a step is complete. */
export function AuthStamp({ children, tone = 'brand', className }: AuthStampProps) {
  return (
    <span
      className={cn(
        'inline-flex w-fit -rotate-[5deg] select-none rounded-[3px] border-2 px-2.5 py-1 font-mono text-xs font-bold tracking-[0.22em] opacity-90',
        'animate-in fade-in zoom-in-150 duration-300 ease-out',
        tone === 'success' ? 'border-emerald-600 text-emerald-600' : 'border-brand text-brand',
        className
      )}
    >
      {children}
    </span>
  );
}
