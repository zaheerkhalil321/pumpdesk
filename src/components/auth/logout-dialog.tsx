'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogClose,
  ModalCloseButton,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { LogOut, ShieldCheck } from 'lucide-react';
import { signOut } from '@/lib/auth/auth-service';
import { toast } from 'sonner';
import { Spinner } from '@/components/ui/loader';

interface LogoutDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LogoutDialog({ isOpen, onOpenChange }: LogoutDialogProps) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);

  const handleConfirmLogout = async () => {
    setIsLoggingOut(true);
    try {
      await signOut();
      toast.success('Signed Out Successfully', {
        description:
          'You have been safely logged out of Midcoast Pumping workspace.',
      });
      onOpenChange(false);
      router.push('/login');
    } catch {
      toast.error('Failed to log out. Please try again.');
      setIsLoggingOut(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-[420px] p-6 rounded-2xl bg-white gap-5 border border-slate-200/90 shadow-2xl overflow-hidden"
      >
        {/* Top Header with LogOut Icon & Close Button */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="h-11 w-11 rounded-2xl bg-rose-50 border border-rose-200/70 flex items-center justify-center shrink-0 text-rose-600 shadow-2xs">
              <LogOut className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-slate-900 tracking-tight leading-tight">
                Log Out Of PumpDesk?
              </DialogTitle>
              <p className="text-xs text-slate-500 mt-0.5">
                You will need to sign in again to access the dispatch board.
              </p>
            </div>
          </div>

          <DialogClose render={<ModalCloseButton size="sm" />} />
        </div>

        {/* Current User Session Context Card */}
        <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-2.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-500 text-[11px]  tracking-wider">
              Active Session
            </span>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60 shadow-2xs">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Online
            </span>
          </div>

          <div className="flex items-center gap-3 pt-0.5">
            <div className="relative shrink-0">
              <div className="h-9 w-9 rounded-full bg-brand text-white font-bold text-xs flex items-center justify-center tracking-wider shadow-2xs">
                JB
              </div>
            </div>
            <div className="min-w-0">
              <p className="font-bold text-xs text-slate-900 truncate">
                Jessie Black
              </p>
              <p className="text-[11px] text-slate-500 truncate">
                jessie@midcoastpumping.com &bull; Dispatcher
              </p>
            </div>
          </div>
        </div>

        {/* Audit Reassurance Note */}
        <div className="flex items-center gap-2 px-1 text-[11.5px] text-slate-500">
          <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>All schedule bookings and pump assignments remain saved.</span>
        </div>

        {/* Modal Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isLoggingOut}
            onClick={() => onOpenChange(false)}
            className="h-9 px-4 text-xs font-semibold rounded-lg text-slate-700 hover:bg-slate-100 cursor-pointer"
          >
            Cancel
          </Button>

          <Button
            type="button"
            variant="destructive"
            size="sm"
            disabled={isLoggingOut}
            onClick={handleConfirmLogout}
            className="h-9 px-4 text-xs font-semibold rounded-lg gap-2 cursor-pointer shadow-xs"
          >
            {isLoggingOut ? (
              <>
                <Spinner size="sm" label={null} />
                <span>Signing Out...</span>
              </>
            ) : (
              <>
                <LogOut className="h-3.5 w-3.5" />
                <span>Log Out</span>
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
