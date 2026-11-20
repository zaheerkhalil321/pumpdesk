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

insert into public.contacts (id, company_id, first_name, last_name, job_title, email, phone, phone_type, is_active, created_at)
values
  ('f1000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'Alex', 'Morgan', 'Project manager', 'alex@accurate.example', '+12075550110', 'Mobile', true, timestamp '2026-09-10 08:00' at time zone 'America/New_York'),
  ('f1000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000001', 'Casey', 'Brooks', 'Owner', 'casey@harbor.example', '+12075550113', 'Mobile', true, timestamp '2026-08-14 08:00' at time zone 'America/New_York'),
  ('f1000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000001', 'Dana', 'Reed', 'Accounts payable', 'dana@coastal.example', '+12075550114', 'Office', true, timestamp '2026-07-19 08:00' at time zone 'America/New_York'),
  ('f1000000-0000-4000-8000-000000000004', 'a0000000-0000-4000-8000-000000000001', 'Jamie', 'Lee', 'Accounts payable', 'billing@accurate.example', '+12075550111', 'Office', true, timestamp '2026-01-14 08:00' at time zone 'America/New_York'),
  ('f1000000-0000-4000-8000-000000000005', 'a0000000-0000-4000-8000-000000000001', 'Jordan', 'Ellis', 'Project manager', 'jordan@pinetree.example', '+12075550115', 'Mobile', false, timestamp '2026-05-22 08:00' at time zone 'America/New_York'),
  ('f1000000-0000-4000-8000-000000000006', 'a0000000-0000-4000-8000-000000000001', 'Mike', 'Vance', 'Superintendent', 'mike@turner.example', '+12075550142', 'Mobile', true, timestamp '2026-06-03 08:00' at time zone 'America/New_York'),
  ('f1000000-0000-4000-8000-000000000007', 'a0000000-0000-4000-8000-000000000001', 'Sam', 'Taylor', 'Superintendent', 'sam@accurate.example', '+12075550112', 'Mobile', true, timestamp '2026-03-11 08:00' at time zone 'America/New_York'),
  ('f1000000-0000-4000-8000-000000000008', 'a0000000-0000-4000-8000-000000000001', 'Taylor', 'Green', 'Office manager', 'taylor@granite.example', '+12075550116', 'Office', true, timestamp '2026-04-09 08:00' at time zone 'America/New_York'),
  ('f1000000-0000-4000-8000-000000000009', 'a0000000-0000-4000-8000-000000000001', 'Jim', 'Harris', 'Project Manager', 'jim@advanced.example', '+12075550120', 'Office', true, timestamp '2025-11-03 14:15' at time zone 'America/New_York'),
  ('f1000000-0000-4000-8000-00000000000a', 'a0000000-0000-4000-8000-000000000001', 'Marc', 'Berube', 'Owner & Operator', 'marc@berube.example', '+12075550121', 'Mobile', true, timestamp '2025-08-27 11:10' at time zone 'America/New_York'),
  ('f1000000-0000-4000-8000-00000000000b', 'a0000000-0000-4000-8000-000000000001', 'Dave', 'Miller', 'Lead Superintendent', 'dave@coastal.example', '+12075550199', 'Mobile', true, timestamp '2026-09-18 08:00' at time zone 'America/New_York'),
  ('f1000000-0000-4000-8000-00000000000c', 'a0000000-0000-4000-8000-000000000001', 'Paul', 'White', 'Operations Director', 'paul@pinetree.example', '+12075550122', 'Office', true, timestamp '2026-09-17 07:00' at time zone 'America/New_York');

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

-- ── Fleet and crew sample data (Step 2) ─────────────────────────
insert into public.employees (id, company_id, branch_id, first_name, last_name, email, phone, status, is_operator, job_title, cdl_expires_on, medical_cert_expires_on)
select v.id::uuid, 'a0000000-0000-4000-8000-000000000001', b.id, v.first_name, v.last_name, v.email, v.phone, 'active', true, v.job_title, v.cdl::date, v.med::date
from (values
  ('a1000000-0000-4000-8000-000000000001', 'Rob',    'Black', 'rob@midcoast.example',    '+12075550168', 'Lead operator',   '2026-11-10', null),
  ('a1000000-0000-4000-8000-000000000002', 'Dave',   'Smith', 'dave@midcoast.example',   '+12075550169', 'Operator',        null,         null),
  ('a1000000-0000-4000-8000-000000000003', 'Tony',   'Perez', 'tony@midcoast.example',   '+12075550170', 'Operator',        null,         null),
  ('a1000000-0000-4000-8000-000000000004', 'Jordan', 'Miles', 'jordan@midcoast.example', '+12075550171', 'Operator',        null,         '2026-12-05'),
  ('a1000000-0000-4000-8000-000000000005', 'Casey',  'Reed',  'casey@midcoast.example',  '+12075550172', 'Relief operator', null,         null)
) as v(id, first_name, last_name, email, phone, job_title, cdl, med)
cross join public.branches b
where b.company_id = 'a0000000-0000-4000-8000-000000000001' and b.code = 'WAR';

insert into public.equipment (id, company_id, branch_id, equipment_number, type, status, make, model, model_year, boom_length_m, horizontal_reach_ft, hourly_rate_override, min_hours_override, default_operator_id, next_inspection_due, notes)
select v.id::uuid, 'a0000000-0000-4000-8000-000000000001', b.id, v.num, v.type::public.equipment_type, v.status::public.equipment_status,
  v.make, v.model, v.year, v.boom, v.reach, v.rate, 4.0, v.op::uuid, v.insp::date, v.notes
from (values
  ('b1000000-0000-4000-8000-000000000001', '01', 'boom_pump', 'available',   'Putzmeister', '34Z',     2023::smallint, 34::numeric, 111::numeric, 195::numeric, 'a1000000-0000-4000-8000-000000000001', '2026-11-12', null),
  ('b1000000-0000-4000-8000-000000000002', '02', 'boom_pump', 'available',   'Putzmeister', '28Z',     2021::smallint, 28::numeric,  91::numeric, 175::numeric, 'a1000000-0000-4000-8000-000000000004', '2026-10-28', null),
  ('b1000000-0000-4000-8000-000000000003', '03', 'boom_pump', 'maintenance', 'Schwing',     'S 47 SX', 2024::smallint, 47::numeric, 154::numeric, 245::numeric, 'a1000000-0000-4000-8000-000000000002', '2026-12-08', 'Scheduled service: hydraulic pump and boom inspection'),
  ('b1000000-0000-4000-8000-000000000004', '04', 'line_pump', 'available',   'Trailer rig', 'Reed B50', 2022::smallint, null,         500::numeric, 145::numeric, 'a1000000-0000-4000-8000-000000000003', '2026-11-20', null)
) as v(id, num, type, status, make, model, year, boom, reach, rate, op, insp, notes)
cross join public.branches b
where b.company_id = 'a0000000-0000-4000-8000-000000000001' and b.code = 'WAR';

-- Test Pumping Co: one operator and one pump (isolation tests)
insert into public.employees (id, company_id, first_name, last_name, phone, status, is_operator, job_title) values
  ('a2000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000002', 'Omar', 'Test', '+13125550161', 'active', true, 'Operator');
insert into public.equipment (id, company_id, equipment_number, type, status, make, model, boom_length_m, default_operator_id) values
  ('b2000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000002', 'T1', 'boom_pump', 'available', 'Schwing', 'S 36', 36, 'a2000000-0000-4000-8000-000000000001');

-- ── Operator app sample data (mirrors mobile/src/api/mock-seed.ts) ──
-- Rob Black (a1..01, +12075550168, test code 123456) is NOT linked to a login here: he links himself when he
-- signs in with his phone. Jobs are "today" and "+2/+4 days" in New York time, relative to when you reset.
update public.branches set latitude = 44.1181, longitude = -69.2414
 where company_id = 'a0000000-0000-4000-8000-000000000001' and code = 'WAR';

update public.company_settings set terms_url = 'https://midcoastconcrete.com/terms'
 where company_id = 'a0000000-0000-4000-8000-000000000001';

insert into public.yards (company_id, branch_id, name, address)
select 'a0000000-0000-4000-8000-000000000001', b.id, 'Midcoast Concrete Pumping', '142 Main St, Warren, ME'
  from public.branches b where b.company_id = 'a0000000-0000-4000-8000-000000000001' and b.code = 'WAR';

-- Customers reuse the ones above (the demo names differ: Coastal Foundations, Granite State, Harbor Builders...).
insert into public.contacts (id, company_id, first_name, last_name, job_title, phone, phone_type) values
  ('f1000000-0000-4000-8000-000000000101', 'a0000000-0000-4000-8000-000000000001', 'Dave', 'Miller', 'Superintendent', '+12075550211', 'Mobile'),
  ('f1000000-0000-4000-8000-000000000102', 'a0000000-0000-4000-8000-000000000001', 'Dave', 'Stevens', 'Job Lead', '+12075550214', 'Mobile'),
  ('f1000000-0000-4000-8000-000000000103', 'a0000000-0000-4000-8000-000000000001', 'Mike', 'Ross', 'Site Manager', '+12075550299', 'Mobile'),
  ('f1000000-0000-4000-8000-000000000104', 'a0000000-0000-4000-8000-000000000001', 'Karen', 'Doyle', 'Homeowner', '+12075550377', 'Mobile'),
  ('f1000000-0000-4000-8000-000000000105', 'a0000000-0000-4000-8000-000000000001', 'Sarah', 'King', 'Project Manager', '+12075550341', 'Mobile'),
  ('f1000000-0000-4000-8000-000000000106', 'a0000000-0000-4000-8000-000000000001', 'Tom', 'Vance', 'Superintendent', '+12075550412', 'Mobile');

insert into public.job_sites (id, company_id, customer_id, name, address_line_1, city, state, latitude, longitude) values
  ('a4000000-0000-4000-8000-000000000101', 'a0000000-0000-4000-8000-000000000001', 'e1000000-0000-4000-8000-000000000104', 'Main St Footings', '24 Main St', 'Rockland', 'ME', 44.1037, -69.1089),
  ('a4000000-0000-4000-8000-000000000102', 'a0000000-0000-4000-8000-000000000001', 'e1000000-0000-4000-8000-000000000101', 'Camden St Slab', '18 Camden St', 'Rockport', 'ME', 44.1856, -69.0764),
  ('a4000000-0000-4000-8000-000000000103', 'a0000000-0000-4000-8000-000000000001', 'e1000000-0000-4000-8000-000000000106', 'Atlantic Ave Pour', '65 Atlantic Ave', 'Camden', 'ME', 44.2098, -69.0648),
  ('a4000000-0000-4000-8000-000000000104', 'a0000000-0000-4000-8000-000000000001', 'e1000000-0000-4000-8000-000000000107', 'Union St Garage', '31 Union St', 'Rockland', 'ME', 44.1019, -69.1076),
  ('a4000000-0000-4000-8000-000000000105', 'a0000000-0000-4000-8000-000000000001', 'e1000000-0000-4000-8000-000000000105', 'Thomaston Pier', '10 Industrial Way', 'Thomaston', 'ME', 44.0792, -69.1834);

do $seed$
declare
  co constant uuid := 'a0000000-0000-4000-8000-000000000001';
  rob constant uuid := 'a1000000-0000-4000-8000-000000000001';
  pump constant uuid := 'b1000000-0000-4000-8000-000000000002';
  tz constant text := 'America/New_York';
  d0 date := (now() at time zone tz)::date;
  j record;
  jid uuid;
  tid uuid;
begin
  for j in
    select * from (values
      -- n, number, customer, site, name, label, day, arrive_by h:m, start h:m, end h, yards, notes, contact, dispatch, field, ack h:m
      (1, 'ORD-1524', 'e1000000-0000-4000-8000-000000000104'::uuid, 'a4000000-0000-4000-8000-000000000101'::uuid, 'Main St Footings', '24 Main St, Rockland, ME', 0, '06:00', '07:00', 11, 35, 'Pour footings behind main garage. Watch out for overhead tree branches.', 'f1000000-0000-4000-8000-000000000101'::uuid, 'acknowledged'::public.dispatch_status, 'done'::public.field_status, '05:30'),
      (2, 'ORD-1525', 'e1000000-0000-4000-8000-000000000101', 'a4000000-0000-4000-8000-000000000102', 'Camden St Slab', '18 Camden St, Rockport, ME', 0, '08:00', '10:30', 14, 45, 'Call Dave 30 mins before arrival. Soft shoulder near the driveway entrance.', 'f1000000-0000-4000-8000-000000000102', 'acknowledged', 'scheduled', '07:45'),
      (3, 'ORD-1526', 'e1000000-0000-4000-8000-000000000106', 'a4000000-0000-4000-8000-000000000103', 'Atlantic Ave Pour', '65 Atlantic Ave, Camden, ME', 0, null, '14:00', 17, 28, 'Interior basement slab pour. Have 100ft 3in hose ready.', 'f1000000-0000-4000-8000-000000000103', 'acknowledged', 'scheduled', '09:15'),
      (4, 'ORD-1527', 'e1000000-0000-4000-8000-000000000107', 'a4000000-0000-4000-8000-000000000104', 'Union St Garage Slab', '31 Union St, Rockland, ME', 0, '11:00', '12:15', 15, 22, 'Residential garage slab. Narrow driveway, back the truck in.', 'f1000000-0000-4000-8000-000000000104', 'dispatched', 'scheduled', null),
      (5, 'ORD-1530', 'e1000000-0000-4000-8000-000000000106', 'a4000000-0000-4000-8000-000000000103', 'Camden Harbor Retaining Wall', '65 Atlantic Ave, Camden, ME', 2, '12:30', '14:00', 18, 60, 'Tight parking lot. Flagman will meet you at entrance.', 'f1000000-0000-4000-8000-000000000105', 'dispatched', 'scheduled', null),
      (6, 'ORD-1534', 'e1000000-0000-4000-8000-000000000105', 'a4000000-0000-4000-8000-000000000105', 'Thomaston Commercial Pier', '10 Industrial Way, Thomaston, ME', 4, '07:30', '09:00', 14, 85, 'High strength commercial mix. Two washouts on site.', 'f1000000-0000-4000-8000-000000000106', 'dispatched', 'scheduled', null)
    ) as t(n, num, cust, site, name, label, day, arrive, start_t, end_h, yards, notes, contact, dispatch, field, ack)
  loop
    insert into public.jobs (company_id, job_number, customer_id, job_site_id, site_label, job_name, scheduled_start,
      scheduled_end, arrive_by, timezone, service_date, estimated_yards, site_instructions, booking_status,
      dispatch_status, field_status, confirmed_at, dispatched_at, completed_at)
    values (co, j.num, j.cust, j.site, j.label, j.name,
      ((d0 + j.day) + j.start_t::time) at time zone tz,
      ((d0 + j.day) + make_time(j.end_h, 0, 0)) at time zone tz,
      case when j.arrive is null then null else ((d0 + j.day) + j.arrive::time) at time zone tz end,
      tz, d0 + j.day, j.yards, j.notes, 'confirmed', j.dispatch, j.field, now(), now(),
      case when j.field = 'done' then ((d0 + j.day) + time '09:45') at time zone tz end)
    returning id into jid;

    insert into public.job_contacts (company_id, job_id, contact_id) values (co, jid, j.contact);
    insert into public.job_equipment_assignments (company_id, job_id, equipment_id) values (co, jid, pump);
    insert into public.job_employee_assignments (company_id, job_id, employee_id, acknowledged_at)
    values (co, jid, rob, case when j.ack is null then null else ((d0 + j.day) + j.ack::time) at time zone tz end);
    insert into public.job_status_history (company_id, job_id, dimension, old_value, new_value)
    values (co, jid, 'booking', null, 'confirmed');
    insert into public.job_status_history (company_id, job_id, dimension, old_value, new_value)
    values (co, jid, 'dispatch', 'assigned', 'dispatched');

    if j.n = 1 then
      -- the finished job: all four steps, a submitted ticket with a washout extra
      insert into public.job_step_events (company_id, job_id, employee_id, step, at)
      select co, jid, rob, s.step::public.job_step, ((d0) + s.t::time) at time zone tz
        from (values ('arrived_shop', '06:02'), ('departed_shop', '06:25'), ('arrived_site', '06:50'), ('departed_site', '09:45')) as s(step, t);
      insert into public.work_tickets (company_id, job_id, employee_id, status, arrived_on_site_at, started_pour_at,
        finished_pour_at, departed_site_at, yards_pumped, hose_3in_ft, hose_4in_ft, comments, signer_name,
        signature_path, signed_at, submitted_at)
      values (co, jid, rob, 'submitted',
        (d0 + time '06:50') at time zone tz, (d0 + time '07:10') at time zone tz,
        (d0 + time '09:20') at time zone tz, (d0 + time '09:45') at time zone tz,
        36.5, 50, 0, 'Clean pour, no delays.', 'Dave Miller',
        co::text || '/' || jid::text || '.png', (d0 + time '09:40') at time zone tz, (d0 + time '09:42') at time zone tz)
      returning id into tid;
      insert into public.work_ticket_extras (company_id, ticket_id, extra_code) values (co, tid, 'offsite_washout');
    end if;
  end loop;
end
$seed$;

-- The sample orders above fire the customer-notification triggers. Close those rows so a local reset never
-- leaves texts waiting to go out (the sample phone numbers are not real). The order triggers are deferred to
-- the end of the transaction, so they are fired first.
set constraints all immediate;
update public.notification_deliveries
   set status = 'skipped', skip_reason = 'seed', processed_at = now()
 where status = 'pending';
