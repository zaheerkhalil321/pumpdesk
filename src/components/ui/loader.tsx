import { PumpDeskLogoMark } from '@/components/ui/pumpdesk-logo';
import { cn } from '@/lib/utils';

/* -------------------------------------------------------------------------- */
/* Spinner — inline, inherits text color (buttons, table cells, badges)       */
/* -------------------------------------------------------------------------- */

const SPINNER_SIZES = {
  xs: 'size-3.5',
  sm: 'size-4',
  md: 'size-6',
  lg: 'size-9',
} as const;

interface SpinnerProps {
  size?: keyof typeof SPINNER_SIZES;
  /** Screen-reader text. Pass null when a visible label already describes the state. */
  label?: string | null;
  className?: string;
}

export function Spinner({ size = 'sm', label = 'Loading', className }: SpinnerProps) {
  return (
    <span
      role={label ? 'status' : undefined}
      className={cn('inline-flex shrink-0', SPINNER_SIZES[size], className)}
    >
      <svg viewBox="0 0 24 24" fill="none" className="size-full animate-loader-orbit" aria-hidden="true">
        <circle cx="12" cy="12" r="9.5" stroke="currentColor" strokeWidth="2.5" className="opacity-20" />
        <circle
          cx="12"
          cy="12"
          r="9.5"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray="18 60"
        />
      </svg>
      {label && <span className="sr-only">{label}</span>}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* BrandLoader — logo mark with orbiting arc, halo and progress sweep         */
/* -------------------------------------------------------------------------- */

interface BrandLoaderProps {
  message?: string;
  description?: string;
  size?: 'md' | 'lg';
  className?: string;
}

export function BrandLoader({
  message = 'Loading',
  description,
  size = 'lg',
  className,
}: BrandLoaderProps) {
  const isLarge = size === 'lg';

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn('flex flex-col items-center gap-6 text-center', className)}
    >
      <div className={cn('relative flex items-center justify-center', isLarge ? 'size-24' : 'size-16')}>
        <span className="absolute inset-2 rounded-full bg-brand/25 animate-loader-halo" />
        <svg viewBox="0 0 96 96" fill="none" className="absolute inset-0 size-full animate-loader-orbit" aria-hidden="true">
          <circle cx="48" cy="48" r="44" strokeWidth="3" className="stroke-border" />
          <circle
            cx="48"
            cy="48"
            r="44"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray="70 210"
            className="stroke-brand"
          />
        </svg>
        <PumpDeskLogoMark size={isLarge ? 'lg' : 'sm'} className="relative shadow-md" />
      </div>

      <div className="flex flex-col items-center gap-1.5">
        <p className={cn('font-semibold tracking-tight text-foreground', isLarge ? 'text-base' : 'text-sm')}>
          {message}
        </p>
        {description && <p className="max-w-xs text-xs text-muted-foreground">{description}</p>}
      </div>

      <div className="h-1 w-36 overflow-hidden rounded-full bg-border" aria-hidden="true">
        <div className="h-full w-1/3 rounded-full bg-brand animate-loader-slide" />
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* LoadingOverlay — full-screen or container-filling blocking state            */
/* -------------------------------------------------------------------------- */

interface LoadingOverlayProps extends BrandLoaderProps {
  /** 'screen' covers the viewport; 'container' fills the nearest relative parent */
  cover?: 'screen' | 'container';
}

export function LoadingOverlay({ cover = 'screen', className, ...loaderProps }: LoadingOverlayProps) {
  return (
    <div
      className={cn(
        'z-50 flex items-center justify-center bg-background/85 backdrop-blur-md animate-in fade-in duration-300',
        cover === 'screen' ? 'fixed inset-0' : 'absolute inset-0',
        className
      )}
    >
      <BrandLoader {...loaderProps} />
    </div>
  );
}
