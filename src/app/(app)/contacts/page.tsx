import { ContactsDirectory } from '@/components/contacts/contacts-directory';
import { listContacts, listCustomerOptions } from '@/features/crm/server/queries';

export default async function ContactsPage() {
  const [contacts, customerOptions] = await Promise.all([listContacts(), listCustomerOptions()]);
  return <ContactsDirectory contacts={contacts} customerOptions={customerOptions} />;
}
