import { cn } from '@/lib/utils';

interface AuthHeaderProps {
  title: string;
  description?: React.ReactNode;
  className?: string;
}

export function AuthHeader({ title, description, className }: AuthHeaderProps) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <h1 className="text-[1.65rem] font-bold leading-tight tracking-tight text-foreground">
        {title}
      </h1>
      {description && (
        <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
      )}
    </div>
  );
}
