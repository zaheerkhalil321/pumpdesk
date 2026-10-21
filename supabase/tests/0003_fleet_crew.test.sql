begin;
create extension if not exists pgtap with schema extensions;
select plan(22);

create function pg_temp.rows_affected(stmt text) returns bigint language plpgsql as $f$
declare n bigint;
begin
  execute stmt;
  get diagnostics n = row_count;
  return n;
end $f$;

select set_config('app.mc_branch', (select id::text from public.branches where code = 'WAR' and company_id = 'a0000000-0000-4000-8000-000000000001'), true);

-- 1. Each company sees only its own fleet and crew
set local role authenticated;
set local request.jwt.claims = '{"sub": "c0000000-0000-4000-8000-000000000003", "role": "authenticated"}';
select is((select count(*) from public.equipment where id::text like 'b1000000-%'), 4::bigint, 'midcoast dispatcher sees the 4 seeded pumps');
select is((select count(*) from public.equipment where company_id <> 'a0000000-0000-4000-8000-000000000001')
  + (select count(*) from public.employees where company_id <> 'a0000000-0000-4000-8000-000000000001'),
  0::bigint, 'midcoast dispatcher sees no other company''s fleet or crew');
set local request.jwt.claims = '{"sub": "d0000000-0000-4000-8000-000000000001", "role": "authenticated"}';
select is((select count(*) from public.equipment), 1::bigint, 'test-co sees only its pump');
select is((select count(*) from public.employees), 1::bigint, 'test-co sees only its crew');

-- 2. Test Co cannot change Midcoast rows
select is(pg_temp.rows_affected($q$update public.equipment set make = 'x' where id = 'b1000000-0000-4000-8000-000000000001'$q$),
  0::bigint, 'test-co cannot update a midcoast pump');
select is(pg_temp.rows_affected($q$update public.employees set job_title = 'x' where id = 'a1000000-0000-4000-8000-000000000001'$q$),
  0::bigint, 'test-co cannot update a midcoast operator');

-- 3. Composite FKs block cross-tenant references
select throws_ok(
  $$update public.equipment set default_operator_id = 'a1000000-0000-4000-8000-000000000001' where id = 'b2000000-0000-4000-8000-000000000001'$$,
  '23503', null, 'a pump cannot point at another company''s operator');
select throws_ok(
  $$update public.equipment set branch_id = current_setting('app.mc_branch')::uuid where id = 'b2000000-0000-4000-8000-000000000001'$$,
  '23503', null, 'a pump cannot point at another company''s branch');

-- 4. read_only reads, cannot write
set local request.jwt.claims = '{"sub": "c0000000-0000-4000-8000-000000000006", "role": "authenticated"}';
select is((select count(*) from public.equipment where id::text like 'b1000000-%'), 4::bigint, 'read_only can read pumps');
select throws_ok($$insert into public.equipment (equipment_number, type) values ('99', 'boom_pump')$$,
  '42501', null, 'read_only cannot insert a pump');
select throws_ok($$update public.employees set job_title = 'x'$$, '42501', null, 'read_only cannot update crew');

-- 5. office cannot edit the fleet (role matrix)
set local request.jwt.claims = '{"sub": "c0000000-0000-4000-8000-000000000004", "role": "authenticated"}';
select throws_ok($$insert into public.equipment (equipment_number, type) values ('98', 'boom_pump')$$,
  '42501', null, 'office cannot add a pump');

-- 6. No deletes, for anyone
set local request.jwt.claims = '{"sub": "c0000000-0000-4000-8000-000000000001", "role": "authenticated"}';
select throws_ok($$delete from public.equipment$$, '42501', null, 'owner cannot delete pumps');
select throws_ok($$delete from public.employees$$, '42501', null, 'owner cannot delete crew');

-- 7. Protected columns
select throws_ok($$insert into public.employees (first_name, last_name, user_id) values ('A', 'B', 'c0000000-0000-4000-8000-000000000001')$$,
  '42501', null, 'client cannot link a login to a crew record');
select throws_ok($$update public.equipment set company_id = 'b0000000-0000-4000-8000-000000000002' where id = 'b1000000-0000-4000-8000-000000000001'$$,
  '42501', null, 'client cannot change company_id');

-- 8. Activity log records the change
set local request.jwt.claims = '{"sub": "c0000000-0000-4000-8000-000000000003", "role": "authenticated"}';
select is(pg_temp.rows_affected($q$update public.equipment set status = 'maintenance' where id = 'b1000000-0000-4000-8000-000000000001'$q$),
  1::bigint, 'dispatcher can change a pump status');
select is((select changes from public.activity_log
  where entity_type = 'equipment' and entity_id = 'b1000000-0000-4000-8000-000000000001' and action = 'updated'),
  '{"status": ["available", "maintenance"]}'::jsonb, 'status change was logged');

-- 9. Value checks
select throws_ok($$update public.equipment set boom_length_m = 150 where id = 'b1000000-0000-4000-8000-000000000002'$$,
  '23514', null, 'boom length over 100 m is rejected');
select throws_ok($$update public.equipment set hourly_rate_override = 6000 where id = 'b1000000-0000-4000-8000-000000000002'$$,
  '23514', null, 'hourly rate over 5000 is rejected');
select throws_ok($$update public.employees set phone = '555-0100' where id = 'a1000000-0000-4000-8000-000000000001'$$,
  '23514', null, 'a phone that is not E.164 is rejected');
select throws_ok($$insert into public.equipment (equipment_number, type) values ('01', 'boom_pump')$$,
  '23505', null, 'pump numbers are unique within a company');

select * from finish();
rollback;
