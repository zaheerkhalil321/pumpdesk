import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export function AuthBackLink({ href = '/login', label = 'Back To Sign In' }: { href?: string; label?: string }) {
  return (
    <Link
      href={href}
      className="group inline-flex w-fit items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
    >
      <ArrowLeft className="size-4 transition-transform duration-200 group-hover:-translate-x-0.5" />
      {label}
    </Link>
  );
}
