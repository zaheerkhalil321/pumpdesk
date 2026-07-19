export interface Customer {
  id: string;

  name: string;

  emails: string[];
  office_phone: string | null;

  address_1: string | null;
  address_2: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;

  billing_same_as_physical: boolean;

  billing_address_1: string | null;
  billing_address_2: string | null;
  billing_city: string | null;
  billing_state: string | null;
  billing_zip: string | null;

  notes: string | null;

  require_po: boolean;

  active: boolean;

  created_at: string;
  updated_at: string;
}

export type CustomerFormData = Omit<
  Customer,
  "id" | "active" | "created_at" | "updated_at"
> & {
  office_phone: string;
  address_1: string;
  address_2: string;
  city: string;
  state: string;
  zip: string;

  billing_address_1: string;
  billing_address_2: string;
  billing_city: string;
  billing_state: string;
  billing_zip: string;

  notes: string;
};