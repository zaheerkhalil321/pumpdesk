"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import {
    archiveCustomer,
    restoreCustomer,
} from "../api/customers.api";

import type { Customer } from "../types";

type Props = {
    customer: Customer;
};

export function CustomerDangerZone({ customer }: Props) {
    const router = useRouter();

    const [open, setOpen] = useState(false);
    const [pending, startTransition] = useTransition();

    function handleConfirm() {
        startTransition(async () => {
            if (customer.active) {
                const result = await archiveCustomer(customer.id);

                console.log(result);
            } else {
                await restoreCustomer(customer.id);
            }

            router.refresh();
            setOpen(false);
        });
    }

    return (
        <section className="mt-12 inline-block rounded-lg p-6">
            <h2 className="text-lg font-semibold text-destructive">
                Danger Zone
            </h2>

            <p className="mt-2 text-sm text-muted-foreground">
                {customer.active
                    ? "Archive this customer. Jobs, invoices, notes, and files will be preserved."
                    : "Restore this customer to your active customer list."}
            </p>

            <AlertDialog open={open} onOpenChange={setOpen}>

                <AlertDialogTrigger
                    render={
                        <Button
                            className="mt-6"
                            variant={customer.active ? "destructive" : "default"}
                        />
                    }
                >
                    {customer.active ? "Archive Customer" : "Restore Customer"}
                </AlertDialogTrigger>

                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {customer.active
                                ? "Archive Customer?"
                                : "Restore Customer?"}
                        </AlertDialogTitle>

                        <AlertDialogDescription>
                            {customer.active
                                ? "This customer will no longer appear in your active customer list. All jobs, invoices, notes, and files will be preserved."
                                : "This customer will become active again and appear in your customer list."}
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    <AlertDialogFooter>
                        <AlertDialogCancel>
                            Cancel
                        </AlertDialogCancel>

                        <AlertDialogAction
                            disabled={pending}
                            onClick={handleConfirm}
                        >
                            {customer.active
                                ? "Archive"
                                : "Restore"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </section>
    );
}