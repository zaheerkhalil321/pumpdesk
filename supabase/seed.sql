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
