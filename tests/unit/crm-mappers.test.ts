import { describe, expect, it } from "vitest";

import {
  formatAddress,
  mapContactItem,
  mapCustomerDetail,
  mapCustomerListItem,
  roleDisplay,
  type ContactRow,
  type CustomerRow,
  type LinkRow,
} from "@/features/crm/mappers";

const customer: CustomerRow = {
  id: "c-1",
  customer_number: "CUST-101",
  business_name: "Accurate Concrete",
  status: "active",
  phone: "+12075550101",
  email: "office@accurate.example",
  billing_address_line_1: "318 Main Street",
  billing_city: "Winthrop",
  billing_state: "ME",
  billing_postal_code: "04364",
  dispatch_note: null,
  version: 3,
  created_at: "2026-01-14T14:22:00+00:00",
};

const contact: ContactRow = {
  id: "p-1",
  first_name: "Alex",
  last_name: "Morgan",
  job_title: "Project manager",
  email: "alex@accurate.example",
  phone: "+12075550110",
  phone_type: "Mobile",
  is_active: true,
  created_at: "2026-09-10T12:00:00+00:00",
};

const link: LinkRow = {
  id: "l-1",
  customer_id: "c-1",
  contact_id: "p-1",
  roles: ["Primary contact", "Site contact"],
  is_primary: true,
  receives_job_confirmations: true,
  receives_invoices: false,
};

describe("roleDisplay", () => {
  it("summarises roles", () => {
    expect(roleDisplay(["Primary contact", "Site contact"])).toBe("Primary + Site");
    expect(roleDisplay(["Primary contact"])).toBe("Primary");
    expect(roleDisplay(["Invoicing"])).toBe("Invoicing");
    expect(roleDisplay(["Site contact"])).toBe("Site");
    expect(roleDisplay([])).toBe("Contact");
  });
});

describe("formatAddress", () => {
  it("joins the parts that exist", () => {
    expect(formatAddress({ line1: "1 A St", city: "Camden", state: "ME", postalCode: "04843" })).toBe(
      "1 A St, Camden, ME 04843",
    );
    expect(formatAddress({ city: "Camden", state: "ME" })).toBe("Camden, ME");
  });
});

describe("mapCustomerListItem", () => {
  it("uses the primary contact, formats the phone and shows dates in the company timezone", () => {
    const item = mapCustomerListItem(customer, [link], new Map([[contact.id, contact]]), 2, "America/New_York");
    expect(item.contactName).toBe("Alex Morgan");
    expect(item.contactRole).toBe("Project manager");
    expect(item.phone).toBe("(207) 555-0101");
    expect(item.activeSites).toBe(2);
    expect(item.createdDate).toBe("Jan 14, 2026");
    expect(item.createdTime).toBe("9:22 AM");
    expect(item.status).toBe("Active");
  });

  it("handles a customer with no contact", () => {
    const item = mapCustomerListItem(customer, [], new Map(), 0, "America/New_York");
    expect(item.contactName).toBe("No contact yet");
  });
});

describe("mapCustomerDetail", () => {
  it("puts the primary contact first and falls back to the customer email for invoices", () => {
    const detail = mapCustomerDetail(customer, [link], new Map([[contact.id, contact]]), [], "America/New_York");
    expect(detail.contacts[0]?.name).toBe("Alex Morgan");
    expect(detail.version).toBe(3);
    expect(detail.location).toBe("Winthrop, Maine");
    expect(detail.defaultInvoiceRecipient).toBe("Accounting · office@accurate.example");
  });
});

describe("mapContactItem", () => {
  it("builds linked accounts and shows the first one", () => {
    const item = mapContactItem(contact, [link], new Map([["c-1", { id: "c-1", business_name: "Accurate Concrete" }]]), "America/New_York");
    expect(item.company).toBe("Accurate Concrete");
    expect(item.roleDisplay).toBe("Primary + Site");
    expect(item.phone).toBe("(207) 555-0110");
    expect(item.status).toBe("Active");
    expect(item.createdAt).toBe("September 10, 2026");
  });

  it("handles a contact with no links", () => {
    const item = mapContactItem({ ...contact, is_active: false }, [], new Map(), "America/New_York");
    expect(item.customerId).toBe("");
    expect(item.status).toBe("Inactive");
  });
});
