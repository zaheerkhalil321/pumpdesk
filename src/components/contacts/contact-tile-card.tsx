'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Phone,
  MessageSquare,
  Mail,
  Building2,
  ChevronRight,
  Copy,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { ContactItem } from '@/lib/contacts-store';

interface ContactTileCardProps {
  contact: ContactItem;
  onClick?: () => void;
}

export function ContactTileCard({ contact, onClick }: ContactTileCardProps) {
  const router = useRouter();
  const isInactive = contact.status === 'Inactive';

  // Prefetch contact details for instant navigation on click
  useEffect(() => {
    router.prefetch(`/contacts/${contact.id}`);
  }, [router, contact.id]);

  const handleCardClick = () => {
    if (onClick) {
      onClick();
    } else {
      router.push(`/contacts/${contact.id}`);
    }
  };

  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const handleCopy = (e: React.MouseEvent, text: string, label: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      toast.success(`${label} copied to clipboard`, { description: text });
    }
  };

  const handleCall = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toast.info(`Calling ${contact.name}`, { description: contact.phone });
  };

  const handleText = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toast.info(`Opening SMS with ${contact.name}`, { description: contact.phone });
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
        {/* Top Header: Avatar + Contact Name + Status Badge */}
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
              {getInitials(contact.name)}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-sm text-slate-900 group-hover:text-brand transition-colors truncate">
                {contact.name}
              </h3>
              <p className="text-xs text-slate-500 truncate mt-0.5">
                {contact.title}
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

        {/* Customer Account & Role Details */}
        <div className="space-y-2 pt-1 text-xs">
          <div className="flex items-center justify-between gap-2 min-w-0">
            <Link
              href={`/customers/${contact.customerId}`}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1.5 text-slate-700 font-medium hover:text-brand hover:underline transition-colors truncate min-w-0"
            >
              <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{contact.company}</span>
            </Link>

            <span className="shrink-0 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200/60">
              {contact.roleDisplay}
            </span>
          </div>

          {/* Phone */}
          <div className="flex items-center justify-between text-xs pt-0.5">
            <div
              className="flex items-center gap-2 text-slate-700 font-mono text-[11.5px] cursor-pointer hover:text-brand transition-colors"
              onClick={(e) => handleCopy(e, contact.phone, 'Phone')}
              title="Click to copy phone"
            >
              <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <span>{contact.phone}</span>
              <Copy className="h-3 w-3 text-slate-400 hover:text-brand" />
            </div>

            <span className="text-[10.5px] text-slate-400 font-medium">
              {contact.phoneType}
            </span>
          </div>

          {/* Email with copy button */}
          <div className="flex items-center justify-between gap-2 text-slate-500 text-[11.5px] group/email">
            <div className="flex items-center gap-2 truncate min-w-0">
              <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <a
                href={`mailto:${contact.email}`}
                className="hover:underline hover:text-brand truncate"
                onClick={(e) => e.stopPropagation()}
                title={`Send email to ${contact.email}`}
              >
                {contact.email}
              </a>
            </div>
            <button
              type="button"
              onClick={(e) => handleCopy(e, contact.email, 'Email')}
              className="p-1 text-slate-400 hover:text-brand hover:bg-slate-100 rounded transition-colors shrink-0 cursor-pointer"
              title="Copy email address"
            >
              <Copy className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Footer Action Bar */}
      <div className="px-4 py-2.5 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCall}
            className="h-7.5 px-2.5 text-xs font-semibold text-slate-700 bg-white hover:bg-brand-light hover:text-brand hover:border-brand/30 border-slate-200 cursor-pointer shadow-2xs gap-1.5 transition-colors"
          >
            <Phone className="h-3 w-3 text-brand" />
            <span>Call</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleText}
            className="h-7.5 px-2.5 text-xs font-semibold text-slate-700 bg-white hover:bg-brand-light hover:text-brand hover:border-brand/30 border-slate-200 cursor-pointer shadow-2xs gap-1.5 transition-colors"
          >
            <MessageSquare className="h-3 w-3 text-brand" />
            <span>Text</span>
          </Button>
        </div>

        <div
          className="h-7.5 w-7.5 rounded-lg flex items-center justify-center text-slate-400 group-hover:text-brand group-hover:bg-brand-light transition-colors"
          title="View contact details"
        >
          <ChevronRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>
    </div>
  );
}
