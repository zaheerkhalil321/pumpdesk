begin;
create extension if not exists pgtap with schema extensions;
select plan(30);

create function pg_temp.rows_affected(stmt text) returns bigint language plpgsql as $f$
declare n bigint;
begin
  execute stmt;
  get diagnostics n = row_count;
  return n;
end $f$;

-- 1. Test Co cannot see, update or link Midcoast data
set local role authenticated;
set local request.jwt.claims = '{"sub": "d0000000-0000-4000-8000-000000000001", "role": "authenticated"}';
select is((select count(*) from public.customers), 2::bigint, 'test-co sees only its 2 customers');
select is((select count(*) from public.contacts), 2::bigint, 'test-co sees only its 2 contacts');
select is((select count(*) from public.job_sites), 2::bigint, 'test-co sees only its 2 job sites');
select is((select count(*) from public.customer_contact_links), 2::bigint, 'test-co sees only its 2 links');
select is(pg_temp.rows_affected($q$update public.customers set tier = 'x' where id = 'e1000000-0000-4000-8000-000000000101'$q$),
  0::bigint, 'test-co cannot update a midcoast customer');
select is(pg_temp.rows_affected($q$update public.contacts set job_title = 'x' where id = 'f1000000-0000-4000-8000-000000000001'$q$),
  0::bigint, 'test-co cannot update a midcoast contact');
select is(pg_temp.rows_affected($q$update public.job_sites set name = 'x' where customer_id = 'e1000000-0000-4000-8000-000000000101'$q$),
  0::bigint, 'test-co cannot update a midcoast site');
select throws_ok(
  $$insert into public.customer_contact_links (customer_id, contact_id) values ('e1000000-0000-4000-8000-000000000101', 'f2000000-0000-4000-8000-000000000001')$$,
  '23503', null, 'test-co cannot link a midcoast customer');

-- 2. Composite FK blocks cross-tenant job site
select throws_ok(
  $$insert into public.job_sites (customer_id, address_line_1, city, state) values ('e1000000-0000-4000-8000-000000000101', '1 Evil St', 'Chicago', 'IL')$$,
  '23503', null, 'job site cannot point at another company''s customer');

-- 3. read_only can read, not write
set local request.jwt.claims = '{"sub": "c0000000-0000-4000-8000-000000000006", "role": "authenticated"}';
select is((select count(*) from public.customers), 8::bigint, 'read_only can read customers');
select throws_ok($$insert into public.customers (business_name) values ('Nope')$$, '42501', null, 'read_only cannot insert');
select throws_ok($$update public.customers set tier = 'x' where id = 'e1000000-0000-4000-8000-000000000101'$$,
  '42501', null, 'read_only cannot update');

-- 4. No deletes on core tables, for anyone
set local request.jwt.claims = '{"sub": "c0000000-0000-4000-8000-000000000001", "role": "authenticated"}';
select throws_ok($$delete from public.customers$$, '42501', null, 'owner cannot delete customers');
select throws_ok($$delete from public.contacts$$, '42501', null, 'owner cannot delete contacts');
select throws_ok($$delete from public.job_sites$$, '42501', null, 'owner cannot delete job sites');
select lives_ok($$delete from public.customer_contact_links where contact_id = 'f1000000-0000-4000-8000-000000000007'$$,
  'owner can unlink a contact');

-- 5. Version check
set local request.jwt.claims = '{"sub": "c0000000-0000-4000-8000-000000000003", "role": "authenticated"}';
select is(pg_temp.rows_affected($q$update public.customers set tier = 'Stale' where id = 'e1000000-0000-4000-8000-000000000101' and version = 99$q$),
  0::bigint, 'stale version updates 0 rows');
select is(pg_temp.rows_affected($q$update public.customers set tier = 'Gold' where id = 'e1000000-0000-4000-8000-000000000101' and version = 1$q$),
  1::bigint, 'good version updates 1 row');
select is((select version from public.customers where id = 'e1000000-0000-4000-8000-000000000101'), 2, 'version incremented by 1');

-- 6. Protected columns cannot be set by the client
select throws_ok($$insert into public.customers (business_name, company_id) values ('X', 'a0000000-0000-4000-8000-000000000001')$$,
  '42501', null, 'client cannot set company_id');
select throws_ok($$update public.customers set version = 50 where id = 'e1000000-0000-4000-8000-000000000101'$$,
  '42501', null, 'client cannot set version');
select throws_ok($$update public.customers set created_at = now() where id = 'e1000000-0000-4000-8000-000000000101'$$,
  '42501', null, 'client cannot set created_at');
select throws_ok($$update public.customers set archived_at = now() where id = 'e1000000-0000-4000-8000-000000000101'$$,
  '42501', null, 'client cannot set archived_at');

-- 7. Activity log: one row per write, with the right changes
select lives_ok($$insert into public.customers (business_name) values ('Log Test Co')$$, 'dispatcher can insert a customer');
select is((select count(*) from public.activity_log where entity_type = 'customers' and action = 'created'
  and changes -> 'business_name' = '[null, "Log Test Co"]'::jsonb), 1::bigint, 'insert wrote one activity row');
select is((select changes from public.activity_log
  where entity_type = 'customers' and entity_id = 'e1000000-0000-4000-8000-000000000101' and action = 'updated'),
  '{"tier": ["VIP Partner", "Gold"]}'::jsonb, 'update logged only the changed column');
select is(pg_temp.rows_affected($q$update public.customers set is_active = false where business_name = 'Log Test Co'$q$),
  1::bigint, 'dispatcher can archive');
select is((select count(*) from public.customers where business_name = 'Log Test Co' and archived_at is not null),
  1::bigint, 'archive set archived_at');

-- 8. Timezone validation on job sites
select throws_ok(
  $$insert into public.job_sites (customer_id, address_line_1, city, state, timezone) values ('e1000000-0000-4000-8000-000000000101', '1 A St', 'X', 'ME', 'EST+5')$$,
  'P0001', null, 'invalid job site timezone is rejected');
select lives_ok(
  $$insert into public.job_sites (customer_id, address_line_1, city, state, timezone) values ('e1000000-0000-4000-8000-000000000101', '2 B St', 'X', 'ME', 'America/Chicago')$$,
  'valid job site timezone is accepted');

select * from finish();
rollback;
