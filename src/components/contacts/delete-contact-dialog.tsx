'use client';

import React, { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, Trash2 } from 'lucide-react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { deleteContact } from '@/features/crm/server/actions';
import { reportAction } from '@/lib/action-feedback';

type DeleteContactDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contactId: string;
  contactName: string;
};

/** Asks before deleting a contact (soft delete), then goes back to the contacts list. */
export function DeleteContactDialog({ open, onOpenChange, contactId, contactName }: DeleteContactDialogProps) {
  const router = useRouter();
  const [isDeleting, startDeleting] = useTransition();

  const handleDelete = () => {
    startDeleting(async () => {
      const result = await deleteContact({ id: contactId });
      if (!reportAction(result, { entity: 'contact' })) return;
      toast.success('Contact deleted', { description: `${contactName} was removed from your contacts.` });
      onOpenChange(false);
      router.push('/contacts');
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={(next) => !isDeleting && onOpenChange(next)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-red-50 text-red-600">
            <Trash2 />
          </AlertDialogMedia>
          <AlertDialogTitle>Delete {contactName}?</AlertDialogTitle>
          <AlertDialogDescription>
            They will be removed from your contacts and customers, and won&apos;t get any texts. Past orders keep
            their name.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={handleDelete} disabled={isDeleting}>
            {isDeleting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Delete contact
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
