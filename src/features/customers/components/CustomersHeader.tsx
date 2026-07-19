"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";

import { NewCustomerDialog } from "@/features/customers/components/NewCustomerDialog";

export function CustomersHeader() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Customers
          </h1>

          <p className="text-muted-foreground">
            Manage your customers and job sites.
          </p>
        </div>

        <Button onClick={() => setOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Customer
        </Button>
      </div>

      <NewCustomerDialog
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}