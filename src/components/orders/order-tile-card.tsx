'use client';

import React from 'react';
import {
  Truck,
  Clock,
  MapPin,
  Phone,
  ArrowRight,
  AlertCircle,
  Layers,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { OrderItem } from '@/lib/orders-store';
import { toast } from 'sonner';

interface OrderTileCardProps {
  order: OrderItem;
  onClick: () => void;
}

const OPERATOR_PHONES: Record<string, string> = {
  'Rob Black': '(207) 555-0142',
  'Dave Smith': '(207) 555-0188',
  'Tony Perez': '(207) 555-0193',
  'Marcus Brody': '(207) 555-0115',
  'Sam Higgins': '(207) 555-0129',
};

export function OrderTileCard({ order, onClick }: OrderTileCardProps) {
  const isUnassigned = order.isUnassigned || order.pump === 'Unassigned';
  const hasOperator = order.operator && order.operator !== 'Operator needed' && !isUnassigned;
  const operatorPhone = hasOperator ? OPERATOR_PHONES[order.operator] || '(207) 555-0100' : null;
  const volume = order.volumeYards || 85;

  // Extract clean boom label (e.g. "34M", "28M", "47M", "Line")
  const boomMatch = order.pump.match(/(\d+M|Line)/i);
  const boomLabel = boomMatch ? boomMatch[1] : (order.pumpModel || 'Pump');

  return (
    <div
      onClick={onClick}
      className="rounded-2xl border border-slate-200/90 bg-white hover:border-brand/40 shadow-2xs hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col justify-between group cursor-pointer active:scale-99"
    >
      {/* ── 1. Top Header Row: Order # | Customer Name + Status Pill ── */}
      <div className="p-3.5 pb-3 border-b border-slate-100 flex items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="font-mono text-[11px] font-bold text-slate-700 bg-slate-100 border border-slate-200/80 px-2 py-0.5 rounded-md shrink-0 shadow-2xs">
            #{order.id}
          </span>
          <span className="text-slate-300 font-light shrink-0">|</span>
          <h3 className="font-bold text-sm text-slate-900 group-hover:text-brand transition-colors truncate">
            {order.customer}
          </h3>
        </div>

        {/* Status Badge */}
        <span
          className={cn(
            'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border shrink-0',
            order.status === 'Confirmed' && 'bg-emerald-50 text-emerald-800 border-emerald-200/80',
            order.status === 'Pending' && 'bg-amber-50 text-amber-800 border-amber-200/80',
            order.status === 'Completed' && 'bg-slate-100 text-slate-700 border-slate-200/80',
            order.status === 'Cancelled' && 'bg-rose-50 text-rose-700 border-rose-200',
          )}
        >
          <span
            className={cn(
              'h-1.5 w-1.5 rounded-full shrink-0',
              order.status === 'Confirmed' && 'bg-emerald-500 animate-pulse',
              order.status === 'Pending' && 'bg-amber-500',
              order.status === 'Completed' && 'bg-slate-500',
              order.status === 'Cancelled' && 'bg-rose-500',
            )}
          />
          <span>{order.status}</span>
        </span>
      </div>

      {/* ── 2. Body: Rig Hero Block + Spec Badges ── */}
      <div className="p-3.5 flex items-stretch gap-3">
        {/* Left Rig Hero Block */}
        <div
          className={cn(
            'rounded-xl border p-2.5 flex flex-col items-center justify-center min-w-[88px] max-w-[96px] text-center shrink-0 shadow-2xs transition-colors',
            isUnassigned
              ? 'bg-amber-50/70 border-amber-200 text-amber-800'
              : 'bg-slate-50 border-slate-200/80 text-slate-800 group-hover:border-brand/30',
          )}
        >
          <div className="h-6 w-6 rounded-lg bg-white border border-slate-200/80 flex items-center justify-center shrink-0 mb-1 shadow-2xs">
            {isUnassigned ? (
              <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
            ) : (
              <Truck className="h-3.5 w-3.5 text-brand" />
            )}
          </div>
          <span className="font-extrabold text-sm text-slate-900 leading-tight tracking-tight">
            {isUnassigned ? 'Unassigned' : boomLabel}
          </span>
          <span className="text-[10px] text-slate-500 font-medium truncate max-w-[76px] mt-0.5">
            {isUnassigned ? 'Rig Needed' : order.pumpModel}
          </span>
        </div>

        {/* Right Details Grid */}
        <div className="flex-1 flex flex-col justify-between gap-1.5 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Concrete Volume */}
            <div className="bg-slate-50 border border-slate-200/70 rounded-lg px-2.5 py-1 flex items-center gap-1.5 text-xs font-bold text-slate-800 shadow-2xs shrink-0">
              <Layers className="h-3 w-3 text-brand shrink-0" />
              <span>{volume} yd³</span>
            </div>

            {/* Pour Time */}
            <div className="bg-slate-50 border border-slate-200/70 rounded-lg px-2.5 py-1 flex items-center gap-1.5 text-xs font-semibold text-slate-700 shadow-2xs shrink-0">
              <Clock className="h-3 w-3 text-slate-400 shrink-0" />
              <span>{order.pourTime}</span>
            </div>
          </div>

          {/* Job Site Location */}
          <div
            className="bg-slate-50 border border-slate-200/70 rounded-lg px-2.5 py-1 flex items-center gap-1.5 text-xs text-slate-600 shadow-2xs min-w-0"
            title={order.jobSite}
          >
            <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
            <span className="truncate">{order.jobSite}</span>
          </div>
        </div>
      </div>

      {/* ── 3. Footer Action Dock ── */}
      <div className="border-t border-slate-100 bg-slate-50/70 px-3.5 py-2.5 flex items-center justify-between">
        {/* Left: Call Operator action */}
        {hasOperator ? (
          <a
            href={`tel:${operatorPhone}`}
            onClick={(e) => {
              e.stopPropagation();
              toast.info(`Calling ${order.operator}`, {
                description: `${operatorPhone} • Assigned to ${order.pump}`,
              });
            }}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-brand hover:underline transition-colors group/call py-0.5"
            title={`Call operator ${order.operator}`}
          >
            <Phone className="h-3.5 w-3.5 text-slate-400 group-hover/call:text-brand transition-colors shrink-0" />
            <span>Call {order.operator}</span>
          </a>
        ) : (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
            <AlertCircle className="h-3 w-3 text-amber-600 shrink-0" />
            <span>Operator Needed</span>
          </span>
        )}

        {/* Right: View Order action */}
        <div className="inline-flex items-center gap-1 text-xs font-bold text-slate-800 group-hover:text-brand transition-colors">
          <span>View Order</span>
          <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform shrink-0" />
        </div>
      </div>
    </div>
  );
}
