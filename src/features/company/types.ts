/** The company profile as the Settings form shows it. */
export interface CompanyProfile {
  companyName: string;
  legalBusinessName: string;
  /** Shown as (207) 555-0100. */
  phone: string;
  email: string;
  website: string;
  logoText: string;
  streetAddress: string;
  suiteUnit: string;
  city: string;
  /** Two-letter code, e.g. "ME". */
  state: string;
  zipCode: string;
  useAddressOnInvoices: boolean;
}
