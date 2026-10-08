import { ContactDetailView } from './contact-detail-view';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ContactDetailPage({ params }: PageProps) {
  const { id } = await params;
  return <ContactDetailView contactId={id} />;
}
