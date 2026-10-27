begin;
create extension if not exists pgtap with schema extensions;
select plan(39);

-- Users: dispatcher c..03, office c..04, accountant c..05, read_only c..06, test-co owner d..01.
-- Midcoast: customer e1..101, contact f1..001, pumps b1..01/02, operators a1..01/02. Test Co: customer e2..001, pump b2..01.

-- 1. A dispatcher books two orders; numbers come from the company counter
set local role authenticated;
set local request.jwt.claims = '{"sub": "c0000000-0000-4000-8000-000000000003", "role": "authenticated"}';

select set_config('app.job1', (public.book_job($j$
  {"customer_id": "e1000000-0000-4000-8000-000000000101", "site_label": "Rockland", "estimated_yards": 60,
   "scheduled_start": "2026-09-12T11:00:00Z", "scheduled_end": "2026-09-12T15:00:00Z",
   "contact_id": "f1000000-0000-4000-8000-000000000001", "pour_type": "Footings"}
$j$::jsonb)) ->> 'id', true);
select is((select job_number from public.jobs where id = current_setting('app.job1')::uuid), 'ORD-1001', 'first order gets ORD-1001');

select set_config('app.job2', (public.book_job($j$
  {"customer_id": "e1000000-0000-4000-8000-000000000101", "site_label": "Camden", "estimated_yards": 20,
   "scheduled_start": "2026-09-13T02:00:00Z", "scheduled_end": "2026-09-13T05:00:00Z", "booking_status": "confirmed"}
$j$::jsonb)) ->> 'id', true);
select is((select job_number from public.jobs where id = current_setting('app.job2')::uuid), 'ORD-1002', 'second order gets ORD-1002');
select is((select service_date from public.jobs where id = current_setting('app.job2')::uuid), '2026-09-12'::date,
  'service date is the local day (10 PM Eastern on Sep 12)');
select is((select booking_status::text || '/' || dispatch_status::text from public.jobs where id = current_setting('app.job1')::uuid),
  'pending/unassigned', 'a new order is pending and unassigned');
select isnt((select confirmed_at from public.jobs where id = current_setting('app.job2')::uuid), null, 'a confirmed order records when');
select is((select count(*) from public.job_status_history where job_id = current_setting('app.job1')::uuid), 1::bigint, 'booking writes a history row');
select is((select count(*) from public.job_contacts where job_id = current_setting('app.job1')::uuid), 1::bigint, 'the job contact is saved');
select is((select count(*) from public.activity_log where entity_type = 'jobs' and summary = 'Created jobs "ORD-1001"'), 1::bigint,
  'the audit log names the order by its number');

-- 2. Writes only go through the functions
select throws_ok($$insert into public.jobs (customer_id, site_label, scheduled_start, scheduled_end, timezone, estimated_yards)
  values ('e1000000-0000-4000-8000-000000000101', 'x', now(), now() + interval '1 hour', 'America/New_York', 10)$$,
  '42501', null, 'a client cannot insert a job directly');
select throws_ok($$update public.jobs set site_label = 'x'$$, '42501', null, 'a client cannot update jobs directly');
select throws_ok($$delete from public.jobs$$, '42501', null, 'a client cannot delete jobs');

-- 3. Bad input is refused
select throws_ok($j$select public.book_job('{"customer_id": "e1000000-0000-4000-8000-000000000101", "site_label": "x", "estimated_yards": 5,
  "scheduled_start": "2026-09-12T11:00:00Z", "scheduled_end": "2026-09-12T10:00:00Z"}'::jsonb)$j$,
  '23514', null, 'an order cannot end before it starts');
select throws_ok($j$select public.book_job('{"customer_id": "e2000000-0000-4000-8000-000000000001", "site_label": "x", "estimated_yards": 5,
  "scheduled_start": "2026-09-12T11:00:00Z", "scheduled_end": "2026-09-12T15:00:00Z"}'::jsonb)$j$,
  '23503', null, 'an order cannot use another company''s customer');
select throws_ok($j$select public.book_job('{"customer_id": "e1000000-0000-4000-8000-000000000101", "site_label": "x", "estimated_yards": 5,
  "scheduled_start": "2026-09-12T11:00:00Z", "scheduled_end": "2026-09-12T15:00:00Z", "equipment_id": "b2000000-0000-4000-8000-000000000001"}'::jsonb)$j$,
  '23503', null, 'an order cannot use another company''s pump');

-- 4. Assign a pump and an operator, then dispatch
select public.update_job(jsonb_build_object('id', current_setting('app.job1'), 'version', (select version from public.jobs where id = current_setting('app.job1')::uuid),
  'equipment_id', 'b1000000-0000-4000-8000-000000000001', 'employee_id', 'a1000000-0000-4000-8000-000000000001'));
select is((select dispatch_status::text from public.jobs where id = current_setting('app.job1')::uuid), 'assigned', 'an operator makes the order assigned');
select is((select count(*) from public.job_equipment_assignments where job_id = current_setting('app.job1')::uuid and released_at is null), 1::bigint, 'one active pump');

select public.update_job(jsonb_build_object('id', current_setting('app.job1'), 'version', (select version from public.jobs where id = current_setting('app.job1')::uuid),
  'equipment_id', 'b1000000-0000-4000-8000-000000000002'));
select is((select count(*) from public.job_equipment_assignments where job_id = current_setting('app.job1')::uuid), 2::bigint, 'moving the pump keeps the old row');
select is((select count(*) from public.job_equipment_assignments where job_id = current_setting('app.job1')::uuid and released_at is null), 1::bigint, 'and releases it');

select public.update_job(jsonb_build_object('id', current_setting('app.job1'), 'version', (select version from public.jobs where id = current_setting('app.job1')::uuid),
  'dispatch', true));
select is((select dispatch_status::text from public.jobs where id = current_setting('app.job1')::uuid), 'dispatched', 'dispatch tells the operator');
select isnt((select dispatched_at from public.jobs where id = current_setting('app.job1')::uuid), null, 'and records when');

select public.update_job(jsonb_build_object('id', current_setting('app.job1'), 'version', (select version from public.jobs where id = current_setting('app.job1')::uuid),
  'employee_id', null));
select is((select dispatch_status::text from public.jobs where id = current_setting('app.job1')::uuid), 'unassigned', 'removing the operator makes it unassigned again');

select throws_ok(format($j$select public.update_job('{"id": "%s", "version": %s, "dispatch": true}'::jsonb)$j$,
  current_setting('app.job1'), (select version from public.jobs where id = current_setting('app.job1')::uuid)),
  'P0001', null, 'dispatch needs an operator');

-- 4b. Extras: maximum pump size, extra items, an additional operator
select public.update_job(jsonb_build_object('id', current_setting('app.job2'), 'version', (select version from public.jobs where id = current_setting('app.job2')::uuid),
  'max_pump_size', '34 m', 'extra_items', '[{"name": "Extra hose", "quantity": 2}]'::jsonb,
  'employee_id', 'a1000000-0000-4000-8000-000000000001', 'second_employee_id', 'a1000000-0000-4000-8000-000000000002'));
select is((select max_pump_size from public.jobs where id = current_setting('app.job2')::uuid), '34 m', 'the maximum pump size is saved');
select is((select extra_items -> 0 ->> 'name' from public.jobs where id = current_setting('app.job2')::uuid), 'Extra hose', 'extra items are saved');
select is((select count(*) from public.job_employee_assignments where job_id = current_setting('app.job2')::uuid
  and assignment_type = 'second_operator' and released_at is null), 1::bigint, 'an additional operator is assigned');
select is((select dispatch_status::text from public.jobs where id = current_setting('app.job2')::uuid), 'assigned',
  'the additional operator does not change dispatch');
select throws_ok(format($j$select public.update_job('{"id": "%s", "version": %s, "second_employee_id": "a1000000-0000-4000-8000-000000000001"}'::jsonb)$j$,
  current_setting('app.job2'), (select version from public.jobs where id = current_setting('app.job2')::uuid)),
  'P0001', null, 'the additional operator must be a different person');
select public.update_job(jsonb_build_object('id', current_setting('app.job2'), 'version', (select version from public.jobs where id = current_setting('app.job2')::uuid),
  'second_employee_id', null));
select is((select count(*) from public.job_employee_assignments where job_id = current_setting('app.job2')::uuid
  and assignment_type = 'second_operator' and released_at is null), 0::bigint, 'the additional operator can be removed');

-- 5. Optimistic locking
select throws_ok(format($j$select public.update_job('{"id": "%s", "version": 1, "job_name": "late"}'::jsonb)$j$, current_setting('app.job1')),
  'P0409', null, 'an old version is refused');

-- 6. Cancel frees the pump and operator and locks the order
select public.update_job(jsonb_build_object('id', current_setting('app.job1'), 'version', (select version from public.jobs where id = current_setting('app.job1')::uuid),
  'employee_id', 'a1000000-0000-4000-8000-000000000002'));
select public.cancel_job(current_setting('app.job1')::uuid, 'Customer called', (select version from public.jobs where id = current_setting('app.job1')::uuid));
select is((select booking_status::text from public.jobs where id = current_setting('app.job1')::uuid), 'cancelled', 'cancel works');
select is((select count(*) from public.job_equipment_assignments where job_id = current_setting('app.job1')::uuid and released_at is null)
  + (select count(*) from public.job_employee_assignments where job_id = current_setting('app.job1')::uuid and released_at is null),
  0::bigint, 'cancel frees the pump and operator');
select throws_ok(format($j$select public.update_job('{"id": "%s", "version": %s, "job_name": "x"}'::jsonb)$j$,
  current_setting('app.job1'), (select version from public.jobs where id = current_setting('app.job1')::uuid)),
  'P0001', null, 'a cancelled order cannot be edited');

-- 7. Roles: office books, accountant and read_only cannot
set local request.jwt.claims = '{"sub": "c0000000-0000-4000-8000-000000000004", "role": "authenticated"}';
select lives_ok($j$select public.book_job('{"customer_id": "e1000000-0000-4000-8000-000000000101", "site_label": "Bath", "estimated_yards": 5,
  "scheduled_start": "2026-09-12T11:00:00Z", "scheduled_end": "2026-09-12T15:00:00Z"}'::jsonb)$j$, 'office can book an order');
set local request.jwt.claims = '{"sub": "c0000000-0000-4000-8000-000000000005", "role": "authenticated"}';
select throws_ok($j$select public.book_job('{"customer_id": "e1000000-0000-4000-8000-000000000101", "site_label": "x", "estimated_yards": 5,
  "scheduled_start": "2026-09-12T11:00:00Z", "scheduled_end": "2026-09-12T15:00:00Z"}'::jsonb)$j$, '42501', null, 'accountant cannot book');
set local request.jwt.claims = '{"sub": "c0000000-0000-4000-8000-000000000006", "role": "authenticated"}';
select throws_ok($j$select public.book_job('{"customer_id": "e1000000-0000-4000-8000-000000000101", "site_label": "x", "estimated_yards": 5,
  "scheduled_start": "2026-09-12T11:00:00Z", "scheduled_end": "2026-09-12T15:00:00Z"}'::jsonb)$j$, '42501', null, 'read_only cannot book');
select ok((select count(*) from public.jobs) >= 3, 'read_only can read orders');

-- 8. Tenant isolation
set local request.jwt.claims = '{"sub": "d0000000-0000-4000-8000-000000000001", "role": "authenticated"}';
select is((select count(*) from public.jobs), 0::bigint, 'test-co sees none of midcoast''s orders');
select throws_ok(format($j$select public.cancel_job('%s', 'x', 1)$j$, current_setting('app.job2')),
  'P0002', null, 'test-co cannot cancel a midcoast order');

-- 9. Signed-out callers get nothing
reset role;
set local role anon;
select throws_ok($j$select public.book_job('{}'::jsonb)$j$, '42501', null, 'anon cannot book');

select * from finish();
rollback;
