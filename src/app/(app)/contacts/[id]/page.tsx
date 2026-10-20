import { notFound } from 'next/navigation';

import { getContact, listCustomerOptions } from '@/features/crm/server/queries';
import { ContactDetailView } from './contact-detail-view';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ContactDetailPage({ params }: PageProps) {
  const { id } = await params;
  const [contact, customerOptions] = await Promise.all([getContact(id), listCustomerOptions()]);
  if (!contact) notFound();
  return <ContactDetailView contact={contact} customerOptions={customerOptions} />;
}
