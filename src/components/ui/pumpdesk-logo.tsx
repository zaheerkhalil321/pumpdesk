'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface PumpDeskLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showWordmark?: boolean;
  showBadge?: boolean;
  badgeText?: string;
  className?: string;
}

/**
 * Precision-crafted vector logo mark for PumpDesk:
 * Features a modern geometric squircle with an articulated concrete pump boom arm
 * forming the letter 'P' with a dynamic hydraulic knuckle and pour line.
 */
export function PumpDeskLogoMark({
  size = 'md',
  className,
}: {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const sizeMap = {
    sm: 'h-7 w-7 rounded-[7px]',
    md: 'h-8.5 w-8.5 rounded-[9px]',
    lg: 'h-10 w-10 rounded-[11px]',
  };

  return (
    <div
      className={cn(
        'relative shrink-0 flex items-center justify-center bg-gradient-to-br from-brand to-orange-600 shadow-xs border border-white/20 select-none overflow-hidden transition-transform duration-200 group-hover:scale-[1.02]',
        sizeMap[size],
        className
      )}
    >
      <svg
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full p-1"
        aria-hidden="true"
      >
        {/* Subtle inner depth shadow */}
        <path
          d="M6 5.5C6 4.67 6.67 4 7.5 4H16C20.42 4 24 7.58 24 12C24 16.42 20.42 20 16 20H10V27.5C10 28.33 9.33 29 8.5 29C7.67 29 7 28.33 7 27.5V7C7 6.17 6.55 5.5 6 5.5Z"
          fill="black"
          fillOpacity="0.08"
        />

        {/* Mast / Base Tower of Pump Truck */}
        <rect
          x="6.5"
          y="5"
          width="3.5"
          height="22"
          rx="1.75"
          fill="white"
        />

        {/* Articulated Boom Arm Loop forming 'P' */}
        <path
          d="M8.5 7H16C19.87 7 23 10.13 23 14C23 17.87 19.87 21 16 21H8.5"
          stroke="white"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Inner Boom Joint & Placement Delivery Line */}
        <path
          d="M19 21V24.5C19 25.05 18.55 25.5 18 25.5C17.45 25.5 17 25.05 17 24.5V21"
          stroke="white"
          strokeWidth="2.2"
          strokeLinecap="round"
        />

        {/* Concrete Pour Drop / Target Node */}
        <circle cx="18" cy="27.5" r="1.3" fill="white" />
      </svg>
    </div>
  );
}

export function PumpDeskLogo({
  size = 'md',
  showWordmark = true,
  showBadge = true,
  badgeText = 'PRO',
  className,
}: PumpDeskLogoProps) {
  const textSizes = {
    sm: 'text-[15px]',
    md: 'text-[17px]',
    lg: 'text-[20px]',
  };

  const badgeSizes = {
    sm: 'text-[8.5px] px-1 py-0.2',
    md: 'text-[9px] px-1.5 py-0.5',
    lg: 'text-[10px] px-2 py-0.5',
  };

  return (
    <div className={cn('flex items-center gap-2.5 select-none min-w-0', className)}>
      <PumpDeskLogoMark size={size} />

      {showWordmark && (
        <div className="flex items-center gap-1.5 min-w-0">
          <span
            className={cn(
              'font-extrabold tracking-tight text-slate-900 truncate flex items-center',
              textSizes[size]
            )}
          >
            <span>Pump</span>
            <span className="text-slate-900">Desk</span>
            <span className="h-1.5 w-1.5 rounded-full bg-brand ml-0.5 -mt-2 inline-block" />
          </span>

          {showBadge && (
            <span
              className={cn(
                'font-bold tracking-wider text-slate-500 bg-slate-100 border border-slate-200/70 rounded uppercase shrink-0 shadow-2xs',
                badgeSizes[size]
              )}
            >
              {badgeText}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
