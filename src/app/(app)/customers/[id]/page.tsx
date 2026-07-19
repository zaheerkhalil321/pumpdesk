import { notFound } from "next/navigation";

import { getCustomer } from "@/features/customers/api/customers.api";

import { CustomerPageClient } from "@/features/customers/components";

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

  return <CustomerPageClient customer={customer} />;
}