-- LOCAL TEST DATA ONLY. Never run against a hosted project.
-- Shared test password for every seeded user: PumpDeskTest#2026

insert into public.companies (id, legal_name, display_name, slug, timezone, phone, email, address_line_1, city, state, postal_code, logo_text)
values
  ('a0000000-0000-4000-8000-000000000001', 'Midcoast Concrete Pumping LLC', 'Midcoast Concrete Pumping', 'midcoast',
   'America/New_York', '+12075550100', 'office@midcoast.test', '100 Yard Rd', 'Warren', 'ME', '04864', 'MC'),
  ('b0000000-0000-4000-8000-000000000002', 'Test Pumping Co', 'Test Pumping Co', 'test-co',
   'America/Chicago', '+13125550100', 'office@test-co.test', '1 Test St', 'Chicago', 'IL', '60601', 'TP');

insert into public.company_settings (company_id) values
  ('a0000000-0000-4000-8000-000000000001'),
  ('b0000000-0000-4000-8000-000000000002');

insert into public.document_sequences (company_id, doc_type, prefix, next_value) values
  ('a0000000-0000-4000-8000-000000000001', 'job', 'ORD-', 1001),
  ('b0000000-0000-4000-8000-000000000002', 'job', 'ORD-', 1001);

insert into public.branches (company_id, name, code, city, state, is_hq) values
  ('a0000000-0000-4000-8000-000000000001', 'Warren HQ', 'WAR', 'Warren', 'ME', true),
  ('a0000000-0000-4000-8000-000000000001', 'Portland', 'POR', 'Portland', 'ME', false),
  ('a0000000-0000-4000-8000-000000000001', 'Bangor', 'BAN', 'Bangor', 'ME', false),
  ('b0000000-0000-4000-8000-000000000002', 'Test HQ', 'HQ', 'Chicago', 'IL', true);

-- Users: auth.users + auth.identities (empty-string tokens, NULL breaks GoTrue login)
do $seed$
declare
  u record;
begin
  for u in
    select * from (values
      ('c0000000-0000-4000-8000-000000000001'::uuid, 'owner@midcoast.test',      'Olivia Owner',      'a0000000-0000-4000-8000-000000000001'::uuid, 'owner'::public.membership_role,      'active'::public.membership_status),
      ('c0000000-0000-4000-8000-000000000002', 'admin@midcoast.test',      'Adam Admin',        'a0000000-0000-4000-8000-000000000001', 'admin',      'active'),
      ('c0000000-0000-4000-8000-000000000003', 'dispatcher@midcoast.test', 'Jessie Dispatcher', 'a0000000-0000-4000-8000-000000000001', 'dispatcher', 'active'),
      ('c0000000-0000-4000-8000-000000000004', 'office@midcoast.test',     'Oscar Office',      'a0000000-0000-4000-8000-000000000001', 'office',     'active'),
      ('c0000000-0000-4000-8000-000000000005', 'accountant@midcoast.test', 'Alma Accountant',   'a0000000-0000-4000-8000-000000000001', 'accountant', 'active'),
      ('c0000000-0000-4000-8000-000000000006', 'readonly@midcoast.test',   'Rita ReadOnly',     'a0000000-0000-4000-8000-000000000001', 'read_only',  'active'),
      ('c0000000-0000-4000-8000-000000000007', 'suspended@midcoast.test',  'Sam Suspended',     'a0000000-0000-4000-8000-000000000001', 'dispatcher', 'suspended'),
      ('d0000000-0000-4000-8000-000000000001', 'owner@test-co.test',       'Tina TestOwner',    'b0000000-0000-4000-8000-000000000002', 'owner',      'active')
    ) as t(id, email, full_name, company_id, role, status)
  loop
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      email_change_token_current, reauthentication_token, phone_change, phone_change_token
    ) values (
      '00000000-0000-0000-0000-000000000000', u.id, 'authenticated', 'authenticated', u.email,
      extensions.crypt('PumpDeskTest#2026', extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb, jsonb_build_object('full_name', u.full_name), now(), now(),
      '', '', '', '', '', '', '', ''
    );
    insert into auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), u.id, u.id::text, 'email',
      jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true), now(), now(), now());
    insert into public.company_memberships (company_id, user_id, role, status, joined_at)
    values (u.company_id, u.id, u.role, u.status, now());
  end loop;
end
$seed$;

-- ── CRM sample data (Step 1) ────────────────────────────────────
-- Midcoast customers (from the old UI sample data). Phones are E.164.
insert into public.customers (id, company_id, customer_number, business_name, status, tier, phone, email,
  billing_address_line_1, billing_city, billing_state, billing_postal_code, requires_po, dispatch_note, created_at)
values
  ('e1000000-0000-4000-8000-000000000101', 'a0000000-0000-4000-8000-000000000001', 'CUST-101', 'Accurate Concrete', 'active', 'VIP Partner',
   '+12075550101', 'office@accurate.example', '318 Main Street', 'Winthrop', 'ME', '04364', true,
   'Confirm PO before scheduling.', timestamp '2026-01-14 09:22' at time zone 'America/New_York'),
  ('e1000000-0000-4000-8000-000000000102', 'a0000000-0000-4000-8000-000000000001', 'CUST-102', 'Advanced Concrete Solutions', 'inactive', 'Commercial Tier 2',
   '+12075550102', 'office@advanced.example', null, null, null, null, false,
   null, timestamp '2025-11-03 14:15' at time zone 'America/New_York'),
  ('e1000000-0000-4000-8000-000000000103', 'a0000000-0000-4000-8000-000000000001', 'CUST-103', 'Berube''s Excavation & Lawn', 'active', 'Residential & Civil',
   '+12075550103', 'office@berube.example', null, null, null, null, false,
   null, timestamp '2025-08-27 11:10' at time zone 'America/New_York'),
  ('e1000000-0000-4000-8000-000000000104', 'a0000000-0000-4000-8000-000000000001', 'CUST-104', 'Coastal Foundations', 'active', 'Commercial Tier 1',
   '+12075550104', 'office@coastal.example', '18 Main Street', 'Rockland', 'ME', '04841', false,
   'Call Dave 30 mins before arrival on site.', timestamp '2026-09-18 08:00' at time zone 'America/New_York'),
  ('e1000000-0000-4000-8000-000000000105', 'a0000000-0000-4000-8000-000000000001', 'CUST-105', 'Granite State Builders', 'active', 'Commercial Tier 1',
   '+12075550105', 'office@granite.example', null, null, null, null, false,
   'PPE required: Hard hat and high-vis safety vest mandatory on site.', timestamp '2026-09-14 10:00' at time zone 'America/New_York'),
  ('e1000000-0000-4000-8000-000000000106', 'a0000000-0000-4000-8000-000000000001', 'CUST-106', 'Harbor Builders', 'active', 'VIP Partner',
   '+12075550106', 'office@harbor.example', null, null, null, null, true,
   'PO must match job site name before order completion.', timestamp '2026-09-16 09:30' at time zone 'America/New_York'),
  ('e1000000-0000-4000-8000-000000000107', 'a0000000-0000-4000-8000-000000000001', 'CUST-107', 'Pine Tree Concrete', 'active', 'Municipal',
   '+12075550107', 'office@pinetree.example', null, null, null, null, false,
   null, timestamp '2026-09-17 07:00' at time zone 'America/New_York'),
  ('e1000000-0000-4000-8000-000000000108', 'a0000000-0000-4000-8000-000000000001', 'CUST-108', 'Turner Construction', 'active', 'Commercial Tier 1',
   '+12075550108', 'billing@turner.example', '24 Bay View Street', 'Camden', 'ME', '04843', true,
   'Confirm PO before scheduling.', timestamp '2026-09-12 07:30' at time zone 'America/New_York');

insert into public.contacts (id, company_id, first_name, last_name, job_title, email, phone, phone_type, is_active, archived_at, created_at)
values
  ('f1000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'Alex', 'Morgan', 'Project manager', 'alex@accurate.example', '+12075550110', 'Mobile', true, null, timestamp '2026-09-10 08:00' at time zone 'America/New_York'),
  ('f1000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000001', 'Casey', 'Brooks', 'Owner', 'casey@harbor.example', '+12075550113', 'Mobile', true, null, timestamp '2026-08-14 08:00' at time zone 'America/New_York'),
  ('f1000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000001', 'Dana', 'Reed', 'Accounts payable', 'dana@coastal.example', '+12075550114', 'Office', true, null, timestamp '2026-07-19 08:00' at time zone 'America/New_York'),
  ('f1000000-0000-4000-8000-000000000004', 'a0000000-0000-4000-8000-000000000001', 'Jamie', 'Lee', 'Accounts payable', 'billing@accurate.example', '+12075550111', 'Office', true, null, timestamp '2026-01-14 08:00' at time zone 'America/New_York'),
  ('f1000000-0000-4000-8000-000000000005', 'a0000000-0000-4000-8000-000000000001', 'Jordan', 'Ellis', 'Project manager', 'jordan@pinetree.example', '+12075550115', 'Mobile', false, timestamp '2026-08-01 08:00' at time zone 'America/New_York', timestamp '2026-05-22 08:00' at time zone 'America/New_York'),
  ('f1000000-0000-4000-8000-000000000006', 'a0000000-0000-4000-8000-000000000001', 'Mike', 'Vance', 'Superintendent', 'mike@turner.example', '+12075550142', 'Mobile', true, null, timestamp '2026-06-03 08:00' at time zone 'America/New_York'),
  ('f1000000-0000-4000-8000-000000000007', 'a0000000-0000-4000-8000-000000000001', 'Sam', 'Taylor', 'Superintendent', 'sam@accurate.example', '+12075550112', 'Mobile', true, null, timestamp '2026-03-11 08:00' at time zone 'America/New_York'),
  ('f1000000-0000-4000-8000-000000000008', 'a0000000-0000-4000-8000-000000000001', 'Taylor', 'Green', 'Office manager', 'taylor@granite.example', '+12075550116', 'Office', true, null, timestamp '2026-04-09 08:00' at time zone 'America/New_York'),
  ('f1000000-0000-4000-8000-000000000009', 'a0000000-0000-4000-8000-000000000001', 'Jim', 'Harris', 'Project Manager', 'jim@advanced.example', '+12075550120', 'Office', true, null, timestamp '2025-11-03 14:15' at time zone 'America/New_York'),
  ('f1000000-0000-4000-8000-00000000000a', 'a0000000-0000-4000-8000-000000000001', 'Marc', 'Berube', 'Owner & Operator', 'marc@berube.example', '+12075550121', 'Mobile', true, null, timestamp '2025-08-27 11:10' at time zone 'America/New_York'),
  ('f1000000-0000-4000-8000-00000000000b', 'a0000000-0000-4000-8000-000000000001', 'Dave', 'Miller', 'Lead Superintendent', 'dave@coastal.example', '+12075550199', 'Mobile', true, null, timestamp '2026-09-18 08:00' at time zone 'America/New_York'),
  ('f1000000-0000-4000-8000-00000000000c', 'a0000000-0000-4000-8000-000000000001', 'Paul', 'White', 'Operations Director', 'paul@pinetree.example', '+12075550122', 'Office', true, null, timestamp '2026-09-17 07:00' at time zone 'America/New_York');

insert into public.customer_contact_links (company_id, customer_id, contact_id, roles, is_primary, receives_job_confirmations, receives_invoices)
values
  ('a0000000-0000-4000-8000-000000000001', 'e1000000-0000-4000-8000-000000000101', 'f1000000-0000-4000-8000-000000000001', '{"Primary contact","Site contact"}', true, true, false),
  ('a0000000-0000-4000-8000-000000000001', 'e1000000-0000-4000-8000-000000000101', 'f1000000-0000-4000-8000-000000000004', '{"Invoicing"}', false, false, true),
  ('a0000000-0000-4000-8000-000000000001', 'e1000000-0000-4000-8000-000000000101', 'f1000000-0000-4000-8000-000000000007', '{"Site contact"}', false, false, false),
  ('a0000000-0000-4000-8000-000000000001', 'e1000000-0000-4000-8000-000000000102', 'f1000000-0000-4000-8000-000000000009', '{"Primary contact"}', true, true, false),
  ('a0000000-0000-4000-8000-000000000001', 'e1000000-0000-4000-8000-000000000103', 'f1000000-0000-4000-8000-00000000000a', '{"Primary contact"}', true, true, false),
  ('a0000000-0000-4000-8000-000000000001', 'e1000000-0000-4000-8000-000000000104', 'f1000000-0000-4000-8000-00000000000b', '{"Primary contact","Site contact"}', true, true, false),
  ('a0000000-0000-4000-8000-000000000001', 'e1000000-0000-4000-8000-000000000104', 'f1000000-0000-4000-8000-000000000003', '{"Invoicing"}', false, false, true),
  ('a0000000-0000-4000-8000-000000000001', 'e1000000-0000-4000-8000-000000000105', 'f1000000-0000-4000-8000-000000000008', '{"Primary contact"}', true, true, false),
  ('a0000000-0000-4000-8000-000000000001', 'e1000000-0000-4000-8000-000000000106', 'f1000000-0000-4000-8000-000000000002', '{"Primary contact"}', true, true, false),
  ('a0000000-0000-4000-8000-000000000001', 'e1000000-0000-4000-8000-000000000107', 'f1000000-0000-4000-8000-00000000000c', '{"Primary contact"}', true, true, false),
  ('a0000000-0000-4000-8000-000000000001', 'e1000000-0000-4000-8000-000000000107', 'f1000000-0000-4000-8000-000000000005', '{"Site contact"}', false, false, false),
  ('a0000000-0000-4000-8000-000000000001', 'e1000000-0000-4000-8000-000000000108', 'f1000000-0000-4000-8000-000000000006', '{"Primary contact","Site contact"}', true, true, false);

insert into public.job_sites (company_id, customer_id, name, address_line_1, city, state, postal_code) values
  ('a0000000-0000-4000-8000-000000000001', 'e1000000-0000-4000-8000-000000000101', 'Appleton', '14 Ridge Road', 'Appleton', 'ME', '04862'),
  ('a0000000-0000-4000-8000-000000000001', 'e1000000-0000-4000-8000-000000000101', 'Main Street Winthrop', '318 Main Street', 'Winthrop', 'ME', '04364'),
  ('a0000000-0000-4000-8000-000000000001', 'e1000000-0000-4000-8000-000000000101', 'Elm Street Rockport', '61 Elm Street', 'Rockport', 'ME', '04856'),
  ('a0000000-0000-4000-8000-000000000001', 'e1000000-0000-4000-8000-000000000104', 'Rockland Pier', '18 Main Street', 'Rockland', 'ME', '04841'),
  ('a0000000-0000-4000-8000-000000000001', 'e1000000-0000-4000-8000-000000000105', 'Knox Street Thomaston', '12 Knox Street', 'Thomaston', 'ME', '04861'),
  ('a0000000-0000-4000-8000-000000000001', 'e1000000-0000-4000-8000-000000000106', 'Water Street Belfast', '9 Water Street', 'Belfast', 'ME', '04915'),
  ('a0000000-0000-4000-8000-000000000001', 'e1000000-0000-4000-8000-000000000106', 'Bay Road Camden', '27 Bay Road', 'Camden', 'ME', '04843'),
  ('a0000000-0000-4000-8000-000000000001', 'e1000000-0000-4000-8000-000000000107', 'Union Street Camden', '42 Union Street', 'Camden', 'ME', '04843'),
  ('a0000000-0000-4000-8000-000000000001', 'e1000000-0000-4000-8000-000000000108', 'Bay View Tower', '24 Bay View Street', 'Camden', 'ME', '04843');

-- Test Pumping Co: 2 customers, each with a contact and a site (for isolation tests)
insert into public.customers (id, company_id, business_name, status, phone, email) values
  ('e2000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000002', 'Lakeshore Builders', 'active', '+13125550141', 'office@lakeshore.test'),
  ('e2000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000002', 'Prairie Concrete', 'active', '+13125550142', 'office@prairie.test');
insert into public.contacts (id, company_id, first_name, last_name, job_title, email, phone, phone_type) values
  ('f2000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000002', 'Lena', 'Shore', 'Superintendent', 'lena@lakeshore.test', '+13125550151', 'Mobile'),
  ('f2000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000002', 'Pat', 'Prairie', 'Owner', 'pat@prairie.test', '+13125550152', 'Mobile');
insert into public.customer_contact_links (company_id, customer_id, contact_id, roles, is_primary) values
  ('b0000000-0000-4000-8000-000000000002', 'e2000000-0000-4000-8000-000000000001', 'f2000000-0000-4000-8000-000000000001', '{"Primary contact"}', true),
  ('b0000000-0000-4000-8000-000000000002', 'e2000000-0000-4000-8000-000000000002', 'f2000000-0000-4000-8000-000000000002', '{"Primary contact"}', true);
insert into public.job_sites (company_id, customer_id, name, address_line_1, city, state, postal_code) values
  ('b0000000-0000-4000-8000-000000000002', 'e2000000-0000-4000-8000-000000000001', 'Lakeshore Tower', '500 Lake Shore Dr', 'Chicago', 'IL', '60611'),
  ('b0000000-0000-4000-8000-000000000002', 'e2000000-0000-4000-8000-000000000002', 'Prairie Yard', '77 Prairie Ave', 'Chicago', 'IL', '60616');
