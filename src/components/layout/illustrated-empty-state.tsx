import Image from 'next/image';
import { Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';

interface IllustratedEmptyStateProps {
  /** Illustration under /public. It has a white background, so it is blended onto the page. */
  imageSrc: string;
  imageAlt: string;
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
}

/** Full-page empty state for a directory that has no records yet (pumps, operators, ...). */
export function IllustratedEmptyState({
  imageSrc,
  imageAlt,
  title,
  description,
  actionLabel,
  onAction,
}: IllustratedEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 sm:py-20 px-4">
      <div className="relative">
        <div className="absolute inset-x-8 inset-y-0 rounded-full bg-brand-light/70" aria-hidden />
        <Image
          src={imageSrc}
          alt={imageAlt}
          width={1660}
          height={948}
          priority
          className="relative w-full max-w-md h-auto mix-blend-multiply"
        />
      </div>
      <h2 className="mt-6 text-xl font-bold text-slate-900 tracking-tight">{title}</h2>
      <p className="mt-2 text-sm text-slate-500 max-w-sm">{description}</p>
      <Button
        type="button"
        variant="brand"
        onClick={onAction}
        className="mt-6 h-10 px-5 text-sm font-semibold gap-1.5 cursor-pointer shadow-xs"
      >
        <Plus className="h-4 w-4" />
        <span>{actionLabel}</span>
      </Button>
    </div>
  );
}
