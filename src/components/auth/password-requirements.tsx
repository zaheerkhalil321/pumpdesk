import { Check } from 'lucide-react';
import { PASSWORD_REQUIREMENTS } from '@/lib/auth/schemas';
import { cn } from '@/lib/utils';

export function PasswordRequirements({ value }: { value: string }) {
  return (
    <ul className="flex flex-col gap-2" aria-label="Password requirements">
      {PASSWORD_REQUIREMENTS.map((req) => {
        const met = req.test(value);
        return (
          <li
            key={req.id}
            className={cn(
              'flex items-center gap-2.5 text-xs transition-colors',
              met ? 'text-foreground' : 'text-muted-foreground'
            )}
          >
            <span
              className={cn(
                'flex size-3.5 items-center justify-center rounded-[3px] border transition-colors duration-150',
                met ? 'border-foreground bg-foreground text-background' : 'border-border bg-card'
              )}
            >
              {met && <Check className="size-2.5 stroke-[3.5]" />}
            </span>
            {req.label}
            <span className="sr-only">{met ? '(met)' : '(not met)'}</span>
          </li>
        );
      })}
    </ul>
  );
}
