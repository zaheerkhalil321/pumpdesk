'use client';

import React from 'react';
import Link from 'next/link';
import {
  Phone,
  MessageSquare,
  ArrowRight,
  MapPin,
  Mail,
  User,
  Copy,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { CustomerItem } from '@/features/crm/types';

interface CustomerTileCardProps {
  customer: CustomerItem;
  onClick: () => void;
  onCall: (name: string, phone: string) => void;
  onText: (name: string, phone: string) => void;
  onCopyPhone: (phone: string, company: string) => void;
  onCopyEmail?: (email: string, company: string) => void;
}

export function CustomerTileCard({
  customer,
  onClick,
  onCall,
  onText,
  onCopyPhone,
  onCopyEmail,
}: CustomerTileCardProps) {
  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const isActive = customer.status === 'Active';

  return (
    <div
      onClick={onClick}
      className={cn(
        'group relative bg-white rounded-2xl border transition-all duration-200 cursor-pointer overflow-hidden flex flex-col justify-between shadow-2xs hover:shadow-md hover:border-brand/40',
        isActive ? 'border-slate-200/90' : 'border-slate-200/60 bg-slate-50/40 opacity-90'
      )}
    >
      {/* ── 1. Top Header Row: Monogram + Company + Status Badge ── */}
      <div className="p-4 sm:p-4.5 space-y-3.5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {/* Monogram Avatar */}
            <div
              className={cn(
                'h-10 w-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 transition-colors shadow-2xs',
                isActive
                  ? 'bg-slate-100 border border-slate-200/90 text-slate-800 group-hover:bg-brand-light group-hover:border-brand/40 group-hover:text-brand'
                  : 'bg-slate-100 text-slate-500 border border-slate-200'
              )}
            >
              {getInitials(customer.name)}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                {customer.number && (
                  <span className="font-mono text-[10.5px] font-bold text-slate-400 bg-slate-100/90 px-1.5 py-0.5 rounded">
                    #{customer.number}
                  </span>
                )}
                {customer.tier && (
                  <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full truncate max-w-[120px]">
                    {customer.tier}
                  </span>
                )}
              </div>
              <h3 className="font-bold text-sm text-slate-900 group-hover:text-brand transition-colors truncate mt-0.5">
                {customer.name}
              </h3>
            </div>
          </div>

          {/* Status Badge */}
          <div className="shrink-0">
            {isActive ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-brand-light text-brand border border-brand/25 shadow-2xs">
                <span className="h-1.5 w-1.5 rounded-full bg-brand animate-pulse" />
                <span>Active</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                <span>Inactive</span>
              </span>
            )}
          </div>
        </div>

        {/* ── 2. Contact & CRM Details ── */}
        <div className="space-y-2 pt-0.5 text-xs">
          {/* Primary Contact */}
          <div className="flex items-center gap-2 text-slate-600 min-w-0">
            <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <span className="font-semibold text-slate-800 truncate">
              {customer.contactName}
            </span>
            {customer.contactRole && (
              <>
                <span className="text-slate-300 shrink-0">•</span>
                <span className="text-slate-500 text-[11px] truncate">
                  {customer.contactRole}
                </span>
              </>
            )}
          </div>

          {/* Phone with copy-on-click */}
          <div className="flex items-center justify-between text-xs">
            <div
              className="flex items-center gap-2 text-slate-600 font-mono text-[11.5px] cursor-pointer hover:text-brand transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                onCopyPhone(customer.phone, customer.name);
              }}
              title="Click to copy phone"
            >
              <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <span>{customer.phone}</span>
              <Copy className="h-3 w-3 text-slate-400 hover:text-brand" />
            </div>

            {/* Active Sites Badge */}
            <div className="flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200/60">
              <MapPin className="h-3 w-3 text-brand shrink-0" />
              <span>{customer.activeSites} {customer.activeSites === 1 ? 'site' : 'sites'}</span>
            </div>
          </div>

          {/* Email with copy-on-click */}
          <div className="flex items-center justify-between text-slate-500 text-[11.5px] group/email">
            <div className="flex items-center gap-2 min-w-0 truncate">
              <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <a
                href={`mailto:${customer.email}`}
                onClick={(e) => e.stopPropagation()}
                className="hover:underline hover:text-brand truncate"
                title={`Send email to ${customer.email}`}
              >
                {customer.email}
              </a>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (onCopyEmail) {
                  onCopyEmail(customer.email, customer.name);
                } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
                  navigator.clipboard.writeText(customer.email);
                }
              }}
              className="text-slate-400 hover:text-brand cursor-pointer opacity-0 group-hover/email:opacity-100 transition-opacity shrink-0 ml-1 p-0.5"
              title="Click to copy email"
            >
              <Copy className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>

      {/* ── 3. Footer Action Bar: Call / Text & View Customer Link ── */}
      <div className="px-4 py-2.5 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between gap-2">
        {/* Quick Communications */}
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onCall(customer.contactName, customer.phone)}
            className="h-7.5 px-2.5 text-xs font-semibold text-slate-700 bg-white hover:bg-brand-light hover:text-brand hover:border-brand/30 border-slate-200 cursor-pointer shadow-2xs gap-1.5 transition-colors"
          >
            <Phone className="h-3 w-3 text-brand" />
            <span>Call</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onText(customer.contactName, customer.phone)}
            className="h-7.5 px-2.5 text-xs font-semibold text-slate-700 bg-white hover:bg-brand-light hover:text-brand hover:border-brand/30 border-slate-200 cursor-pointer shadow-2xs gap-1.5 transition-colors"
          >
            <MessageSquare className="h-3 w-3 text-brand" />
            <span>Text</span>
          </Button>
        </div>

        {/* View Customer Link */}
        <Link
          href={`/customers/${customer.id}`}
          onClick={(e) => e.stopPropagation()}
          className="text-xs font-bold text-slate-700 group-hover:text-brand transition-colors inline-flex items-center gap-1 hover:underline cursor-pointer"
        >
          <span>View Profile</span>
          <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>
    </div>
  );
}
