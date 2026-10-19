begin;
create extension if not exists pgtap with schema extensions;
select plan(33);

create function pg_temp.rows_affected(stmt text) returns bigint language plpgsql as $f$
declare n bigint;
begin
  execute stmt;
  get diagnostics n = row_count;
  return n;
end $f$;


-- 1. RLS on every public table
select is(
  (select count(*) from pg_tables where schemaname = 'public' and not rowsecurity),
  0::bigint, 'every public table has RLS enabled');

-- 2. Midcoast dispatcher sees only Midcoast
set local role authenticated;
set local request.jwt.claims = '{"sub": "c0000000-0000-4000-8000-000000000003", "role": "authenticated"}';
select is((select count(*) from public.companies), 1::bigint, 'dispatcher sees 1 company');
select is((select slug from public.companies), 'midcoast', 'that company is midcoast');
select is((select count(*) from public.branches), 3::bigint, 'dispatcher sees 3 midcoast branches');
select is((select count(*) from public.company_memberships), 7::bigint, 'dispatcher sees 7 midcoast memberships');
select is((select count(*) from public.company_memberships where company_id <> 'a0000000-0000-4000-8000-000000000001'),
  0::bigint, 'no foreign memberships visible');
select is((select count(*) from public.app_users), 7::bigint, 'dispatcher sees only co-members as users');

-- Test Co owner sees only Test Co
set local request.jwt.claims = '{"sub": "d0000000-0000-4000-8000-000000000001", "role": "authenticated"}';
select is((select slug from public.companies), 'test-co', 'test-co owner sees test-co');
select is((select count(*) from public.companies), 1::bigint, 'test-co owner sees 1 company');
select is((select count(*) from public.branches), 1::bigint, 'test-co owner sees 1 branch');
select is((select count(*) from public.company_memberships), 1::bigint, 'test-co owner sees 1 membership');

-- 3. Midcoast admin cannot touch Test Co rows
set local request.jwt.claims = '{"sub": "c0000000-0000-4000-8000-000000000002", "role": "authenticated"}';
select is(pg_temp.rows_affected($q$update public.companies set display_name = 'hacked' where slug = 'test-co'$q$),
  0::bigint, 'admin cannot update test-co company');
select is(pg_temp.rows_affected($q$update public.branches set name = 'hacked' where company_id = 'b0000000-0000-4000-8000-000000000002'$q$),
  0::bigint, 'admin cannot update test-co branches');
select is(pg_temp.rows_affected($q$update public.company_settings set invoice_due_days = 1 where company_id = 'b0000000-0000-4000-8000-000000000002'$q$),
  0::bigint, 'admin cannot update test-co settings');
select is(pg_temp.rows_affected($q$update public.companies set display_name = 'Midcoast Concrete Pumping' where slug = 'midcoast'$q$),
  1::bigint, 'admin can update own company');

-- 4. Suspended dispatcher sees nothing
set local request.jwt.claims = '{"sub": "c0000000-0000-4000-8000-000000000007", "role": "authenticated"}';
select is((select count(*) from public.companies), 0::bigint, 'suspended: 0 companies');
select is((select count(*) from public.branches), 0::bigint, 'suspended: 0 branches');
select is((select count(*) from public.company_memberships), 0::bigint, 'suspended: 0 memberships');
select is((select count(*) from public.company_settings), 0::bigint, 'suspended: 0 settings');
select is((select count(*) from public.activity_log), 0::bigint, 'suspended: 0 activity_log');
select is((select count(*) from public.app_users), 1::bigint, 'suspended: sees only own profile row');

-- 5. anon has no access
reset role;
set local role anon;
select throws_ok('select * from public.companies', '42501', null, 'anon cannot select companies');
select throws_ok('select * from public.company_memberships', '42501', null, 'anon cannot select memberships');
select throws_ok('select * from public.activity_log', '42501', null, 'anon cannot select activity_log');

-- 6. Guard trigger
reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub": "c0000000-0000-4000-8000-000000000002", "role": "authenticated"}';
select throws_ok(
  $$update public.company_memberships set role = 'dispatcher' where user_id = 'c0000000-0000-4000-8000-000000000002'$$,
  'P0001', null, 'admin cannot change own role');
select throws_ok(
  $$update public.company_memberships set role = 'owner' where user_id = 'c0000000-0000-4000-8000-000000000003'$$,
  'P0001', null, 'admin cannot grant owner');
select throws_ok(
  $$update public.company_memberships set role = 'admin' where user_id = 'c0000000-0000-4000-8000-000000000001'$$,
  'P0001', null, 'admin cannot demote the owner');
reset role;
set local request.jwt.claims = '';
select throws_ok(
  $$update public.company_memberships set role = 'admin' where user_id = 'c0000000-0000-4000-8000-000000000001'$$,
  'P0001', 'The last active owner cannot be removed or downgraded', 'last owner cannot be demoted');

-- 7. Function privileges
select is(
  (select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'private' and p.proname not in ('company_id', 'has_role')
     and (has_function_privilege('authenticated', p.oid, 'execute') or has_function_privilege('anon', p.oid, 'execute'))),
  0::bigint, 'authenticated/anon cannot execute private functions except company_id and has_role');
select is(
  (select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'private' and p.proname in ('company_id', 'has_role')
     and has_function_privilege('anon', p.oid, 'execute')),
  0::bigint, 'anon cannot execute company_id or has_role');

-- 8. activity_log is append-only and trigger-written
set local role authenticated;
set local request.jwt.claims = '{"sub": "c0000000-0000-4000-8000-000000000001", "role": "authenticated"}';
select throws_ok(
  $$insert into public.activity_log (company_id, entity_type, entity_id, action) values ('a0000000-0000-4000-8000-000000000001', 'x', gen_random_uuid(), 'created')$$,
  '42501', null, 'authenticated cannot insert into activity_log');
select throws_ok($$update public.activity_log set summary = 'x'$$, '42501', null, 'authenticated cannot update activity_log');
select throws_ok($$delete from public.activity_log$$, '42501', null, 'authenticated cannot delete activity_log');

select * from finish();
rollback;
