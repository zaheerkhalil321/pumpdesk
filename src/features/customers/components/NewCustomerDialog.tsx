"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { createCustomer } from "@/features/customers/api/customers.api";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function NewCustomerDialog({
  open,
  onOpenChange,
}: Props) {
  const router = useRouter();

  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleCreateCustomer() {
    if (!name.trim()) return;

    setSaving(true);

    const { error } = await createCustomer(name);

    setSaving(false);

    if (error) {
      alert(error.message);
      return;
    }

    setName("");
    onOpenChange(false);

    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            New Customer
          </DialogTitle>
        </DialogHeader>

        <Input
          placeholder="Customer name..."
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <DialogFooter>
          <Button
            onClick={handleCreateCustomer}
            disabled={!name.trim() || saving}
          >
            {saving ? "Saving..." : "Create Customer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}