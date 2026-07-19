import { notFound } from "next/navigation";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { getCustomer } from "@/features/customers/api/customers.api";

import { CustomerDangerZone } from "@/features/customers/components/CustomerDangerZone";

import {
  CustomerHeader,
  CustomerOverviewTab,
  CustomerJobsTab,
  CustomerInvoicesTab,
  CustomerContactsTab,
  CustomerNotesTab,
  CustomerFilesTab,
} from "@/features/customers/components";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function CustomerPage({ params }: Props) {
  const { id } = await params;

  const { data: customer, error } = await getCustomer(id);

  if (error || !customer) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <CustomerHeader customer={customer} />

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="jobs">Jobs</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="contacts">Contacts</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
          <TabsTrigger value="files">Files</TabsTrigger>
        </TabsList>

        <CustomerOverviewTab customer={customer} />
        <CustomerJobsTab />
        <CustomerInvoicesTab />
        <CustomerContactsTab />
        <CustomerNotesTab />
        <CustomerFilesTab />
      </Tabs>

      <CustomerDangerZone customer={customer} />
    </div>
  );
}