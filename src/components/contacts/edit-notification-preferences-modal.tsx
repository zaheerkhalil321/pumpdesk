'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { NotificationPreference } from '@/features/crm/types';

interface EditNotificationPreferencesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contactName: string;
  preferences: NotificationPreference[];
  onSave: (preferences: NotificationPreference[]) => void;
}

export function EditNotificationPreferencesModal({
  open,
  onOpenChange,
  contactName,
  preferences: initialPreferences,
  onSave,
}: EditNotificationPreferencesModalProps) {
  const [preferences, setPreferences] = useState<NotificationPreference[]>(initialPreferences);

  const handleChannelChange = (id: string, channel: 'Email' | 'Text' | 'Off') => {
    setPreferences((prev) =>
      prev.map((p) => (p.id === id ? { ...p, channel } : p))
    );
  };

  const handleSave = () => {
    onSave(preferences);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-6 rounded-2xl bg-white shadow-xl border-slate-200">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-slate-900 tracking-tight">
            Notification Preferences
          </DialogTitle>
          <p className="text-xs text-slate-500 mt-1">
            Choose how dispatch updates and pour notifications are delivered to {contactName}.
          </p>
        </DialogHeader>

        <div className="space-y-3 pt-2 max-h-[60vh] overflow-y-auto">
          {preferences.map((pref) => (
            <div
              key={pref.id}
              className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
            >
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900">{pref.title}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">{pref.description}</p>
              </div>

              <div className="inline-flex items-center rounded-lg border border-slate-200 bg-white p-0.5 shadow-2xs shrink-0 self-start sm:self-auto">
                {(['Email', 'Text', 'Off'] as const).map((channel) => (
                  <button
                    key={channel}
                    type="button"
                    onClick={() => handleChannelChange(pref.id, channel)}
                    className={cn(
                      'px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer',
                      pref.channel === channel
                        ? 'bg-brand text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    )}
                  >
                    {channel}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="h-9 px-4 text-xs font-semibold cursor-pointer border-slate-200 text-slate-700"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="brand"
            size="sm"
            onClick={handleSave}
            className="h-9 px-4 text-xs font-semibold cursor-pointer shadow-xs"
          >
            Save preferences
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
