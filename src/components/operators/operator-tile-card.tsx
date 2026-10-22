'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Truck,
  Phone,
  MessageSquare,
  Copy,
  ChevronRight,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { OperatorItem } from '@/features/fleet/types';

interface OperatorTileCardProps {
  operator: OperatorItem;
  onClick?: () => void;
}

export function OperatorTileCard({ operator, onClick }: OperatorTileCardProps) {
  const router = useRouter();
  const isInactive = operator.status === 'Inactive';

  // Prefetch for zero-lag instant navigation
  useEffect(() => {
    router.prefetch(`/operators/${operator.id}`);
  }, [router, operator.id]);

  const handleCardClick = () => {
    if (onClick) {
      onClick();
    } else {
      router.push(`/operators/${operator.id}`);
    }
  };

  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const handleCopyPhone = (e: React.MouseEvent, phone: string, name: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(phone);
      toast.success('Phone copied to clipboard', { description: `${name}: ${phone}` });
    }
  };

  const handleCall = (e: React.MouseEvent, phone: string, name: string) => {
    e.preventDefault();
    e.stopPropagation();
    toast.info(`Calling ${name}`, { description: phone });
  };

  const handleText = (e: React.MouseEvent, phone: string, name: string) => {
    e.preventDefault();
    e.stopPropagation();
    toast.info(`Opening SMS with ${name}`, { description: phone });
  };

  return (
    <div
      onClick={handleCardClick}
      className={cn(
        'group relative bg-white rounded-2xl border transition-all duration-200 flex flex-col justify-between shadow-2xs hover:shadow-md hover:border-brand/40 cursor-pointer overflow-hidden active:scale-[0.99]',
        isInactive
          ? 'border-slate-200/60 bg-slate-50/40 opacity-90'
          : 'border-slate-200/90'
      )}
    >
      <div className="p-4 sm:p-4.5 space-y-3">
        {/* Top Header: Initials Monogram + Name + Status Badge */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div
              className={cn(
                'h-10 w-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 transition-colors shadow-2xs',
                isInactive
                  ? 'bg-slate-100 text-slate-500 border border-slate-200'
                  : 'bg-slate-100 border border-slate-200/90 text-slate-800 group-hover:bg-brand-light group-hover:border-brand/40 group-hover:text-brand'
              )}
            >
              {getInitials(operator.name)}
            </div>

            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-sm text-slate-900 group-hover:text-brand transition-colors truncate">
                {operator.name}
              </h3>
              <p className="text-xs text-slate-500 truncate mt-0.5">
                {operator.role}
              </p>
            </div>
          </div>

          {/* Status Badge */}
          <div className="shrink-0">
            {!isInactive ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <span>Active</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                <span>Inactive</span>
              </span>
            )}
          </div>
        </div>

        {/* Details: Assigned Pump, Branch, Today Status, Phone */}
        <div className="space-y-2 pt-1 text-xs">
          {/* Assigned Rig / Pump & Yard */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-slate-700 font-medium truncate min-w-0">
              <Truck className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <span className="truncate">
                {operator.defaultPump && operator.defaultPump !== 'None' && operator.defaultPump !== 'No default pump'
                  ? operator.defaultPump
                  : 'No default pump'}
              </span>
            </div>
            <span className="shrink-0 px-2 py-0.5 rounded-full text-[10.5px] font-medium bg-slate-100 text-slate-600 border border-slate-200/60">
              {operator.branch}
            </span>
          </div>

          {/* Today's Availability / Shift */}
          <div className="flex items-center gap-1.5 text-[11.5px] text-slate-600 truncate pt-0.5">
            <Clock className="h-3.5 w-3.5 text-brand shrink-0" />
            <span className="truncate">{operator.todayStatus.label}</span>
          </div>

          {/* Phone with copy-on-click */}
{operator.phone && (
            <div className="flex items-center justify-between text-xs pt-0.5">
              <div
                className="flex items-center gap-2 text-slate-700 font-mono text-[11.5px] cursor-pointer hover:text-brand transition-colors"
                onClick={(e) => handleCopyPhone(e, operator.phone, operator.name)}
                title="Click to copy phone"
              >
                <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span>{operator.phone}</span>
                <Copy className="h-3 w-3 text-slate-400 hover:text-brand" />
              </div>
            </div>
)}

          {/* Credential Alert (if present) */}
          {operator.credentialAlert && (
            <div className="flex items-center gap-1.5 text-[11px] text-amber-800 bg-amber-50/80 border border-amber-200/70 px-2 py-1 rounded-lg">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
              <span className="truncate font-medium">{operator.credentialAlert.title}</span>
            </div>
          )}
        </div>
      </div>

      {/* Footer Action Bar */}
      <div className="px-4 py-2.5 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          {operator.phone && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={(e) => handleCall(e, operator.phone, operator.name)}
              className="h-7.5 px-2.5 text-xs font-semibold text-slate-700 bg-white hover:bg-brand-light hover:text-brand hover:border-brand/30 border-slate-200 cursor-pointer shadow-2xs gap-1.5 transition-colors"
            >
              <Phone className="h-3 w-3 text-brand" />
              <span>Call</span>
            </Button>
          )}

          {operator.phone && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={(e) => handleText(e, operator.phone, operator.name)}
              className="h-7.5 px-2.5 text-xs font-semibold text-slate-700 bg-white hover:bg-brand-light hover:text-brand hover:border-brand/30 border-slate-200 cursor-pointer shadow-2xs gap-1.5 transition-colors"
            >
              <MessageSquare className="h-3 w-3 text-brand" />
              <span>Text</span>
            </Button>
          )}
        </div>

        <div className="ml-auto h-7.5 w-7.5 rounded-lg flex items-center justify-center text-slate-400 group-hover:text-brand group-hover:bg-brand-light transition-colors">
          <ChevronRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>
    </div>
  );
}
