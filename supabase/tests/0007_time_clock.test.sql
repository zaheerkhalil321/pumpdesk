begin;
create extension if not exists pgtap with schema extensions;
select plan(37);

-- Operators: Rob a1..01 (login c7..01), Dave a1..02 (c7..02), Omar of Test Co a2..01 (d7..01),
-- Casey a1..05 (c7..03, inactive). Office: dispatcher c0..03 (Midcoast), owner d0..01 (Test Co).
create function pg_temp.q(stmt text) returns text language plpgsql security definer as $f$
declare r text;
begin execute stmt into r; return r; end $f$;

insert into auth.users (instance_id, id, aud, role, phone, phone_confirmed_at, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change, email_change_token_current,
  reauthentication_token, phone_change, phone_change_token)
select '00000000-0000-0000-0000-000000000000', v.id::uuid, 'authenticated', 'authenticated', v.phone, now(), now(), now(),
  '', '', '', '', '', '', '', ''
from (values
  ('c7000000-0000-4000-8000-000000000001', '12075550168'),
  ('c7000000-0000-4000-8000-000000000002', '12075550169'),
  ('c7000000-0000-4000-8000-000000000003', '12075550172'),
  ('d7000000-0000-4000-8000-000000000001', '13125550161')
) as v(id, phone);
-- link the logins directly (operator memberships are what link_operator_login would create)
update public.employees e set user_id = v.uid::uuid
  from (values ('a1000000-0000-4000-8000-000000000001', 'c7000000-0000-4000-8000-000000000001'),
               ('a1000000-0000-4000-8000-000000000002', 'c7000000-0000-4000-8000-000000000002'),
               ('a1000000-0000-4000-8000-000000000005', 'c7000000-0000-4000-8000-000000000003'),
               ('a2000000-0000-4000-8000-000000000001', 'd7000000-0000-4000-8000-000000000001')) v(eid, uid)
 where e.id = v.eid::uuid;
insert into public.company_memberships (company_id, user_id, role, status, joined_at) values
  ('a0000000-0000-4000-8000-000000000001', 'c7000000-0000-4000-8000-000000000001', 'operator', 'active', now()),
  ('a0000000-0000-4000-8000-000000000001', 'c7000000-0000-4000-8000-000000000002', 'operator', 'active', now()),
  ('a0000000-0000-4000-8000-000000000001', 'c7000000-0000-4000-8000-000000000003', 'operator', 'active', now()),
  ('b0000000-0000-4000-8000-000000000002', 'd7000000-0000-4000-8000-000000000001', 'operator', 'active', now());
update public.employees set status = 'inactive' where id = 'a1000000-0000-4000-8000-000000000005';

set local role authenticated;
set local request.jwt.claims = '{"sub": "c7000000-0000-4000-8000-000000000001", "role": "authenticated"}';

-- 1. Clock in
select is(public.clock_in(now() - interval '8 hours') ->> 'clock_out', null, 'clock in opens an entry');
select isnt(public.clock_in(now() - interval '8 hours') ->> 'id', null, 'and returns its id');
select is(public.clock_in(now()) -> 'break_minutes', '0'::jsonb, 'break minutes start at 0');
select is(pg_temp.q($$select count(*)::text from public.employee_time_entries where employee_id = 'a1000000-0000-4000-8000-000000000001'$$), '1',
  'clocking in again adds no second entry');
select is((public.clock_in(now() - interval '1 hour') ->> 'clock_in')::timestamptz, (public.clock_in(now()) ->> 'clock_in')::timestamptz,
  'an open entry is returned unchanged, whatever time is sent');
select throws_ok($$select public.clock_in(null)$$, 'P0001', 'invalid_time', 'a missing time is refused');
select throws_ok($$select public.clock_in(now() + interval '1 hour')$$, 'P0001', 'invalid_time', 'a time in the future is refused');

-- 2. Clock out
select throws_ok($$select public.clock_out(now() - interval '9 hours')$$, 'P0001', 'invalid_time', 'clock out before clock in is refused');
select throws_ok($$select public.clock_out(now() + interval '1 hour')$$, 'P0001', 'invalid_time', 'clock out in the future is refused');
select isnt(public.clock_out(now() - interval '1 hour') ->> 'clock_out', null, 'clock out closes the entry');
select is(pg_temp.q($$select count(*)::text from public.employee_time_entries where employee_id = 'a1000000-0000-4000-8000-000000000001' and clock_out is null$$), '0',
  'and nothing stays open');
select is(public.clock_out(now()) ->> 'clock_out', public.clock_out(now() - interval '2 hours') ->> 'clock_out',
  'clocking out again replays: returns the latest closed entry unchanged');
select throws_ok($$select public.clock_in(now() - interval '2 hours')$$, 'P0001', 'overlaps_previous', 'clock in before the last entry ended is refused');
select lives_ok($$select public.clock_in(now() - interval '30 minutes')$$, 'clock in after the last entry is fine');
select is((select count(*) from jsonb_array_elements(public.operator_time_entries(now() - interval '1 day', now() + interval '1 day'))), 2::bigint,
  'two entries now');

-- 3. A fresh operator with no entries
set local request.jwt.claims = '{"sub": "c7000000-0000-4000-8000-000000000002", "role": "authenticated"}';
select is(public.clock_out(now()), null, 'clock out with nothing at all returns null');
select is(public.operator_time_entries(now() - interval '1 day', now() + interval '1 day'), '[]'::jsonb, 'Dave sees none of Rob''s entries');

-- 4. Range rules (Rob)
set local request.jwt.claims = '{"sub": "c7000000-0000-4000-8000-000000000001", "role": "authenticated"}';
select throws_ok($$select public.operator_time_entries(now(), now() + interval '63 days')$$, 'P0001', 'invalid_range', 'a range over 62 days is refused');
select throws_ok($$select public.operator_time_entries(now(), now() - interval '1 day')$$, 'P0001', 'invalid_range', 'a backwards range is refused');
select throws_ok($$select public.operator_time_entries(null, now())$$, 'P0001', 'invalid_range', 'a missing end is refused');
select lives_ok($$select public.operator_time_entries(now() - interval '62 days', now())$$, 'exactly 62 days is fine');
-- the first entry ran from -8h to -1h, the second is open from -30m
select is((select count(*) from jsonb_array_elements(public.operator_time_entries(now() - interval '4 hours', now() - interval '3 hours'))), 1::bigint,
  'an entry crossing the range edge is included');
select is((select count(*) from jsonb_array_elements(public.operator_time_entries(now() - interval '50 minutes', now() - interval '40 minutes'))), 0::bigint,
  'a gap between entries has none');
select is((select count(*) from jsonb_array_elements(public.operator_time_entries(now() - interval '10 minutes', now() + interval '10 minutes'))), 1::bigint,
  'the open entry counts as running to now');
select is((select count(*) from jsonb_array_elements(public.operator_time_entries(now() - interval '3 days', now() - interval '2 days'))), 0::bigint,
  'an old range is empty');
select is(public.operator_time_entries(now() - interval '1 day', now() + interval '1 day') -> 0 ->> 'job_id', null, 'entries have the job_id key (null when not tied to a job)');

-- 5. Other company, wrong people
set local request.jwt.claims = '{"sub": "d7000000-0000-4000-8000-000000000001", "role": "authenticated"}';
select is(public.operator_time_entries(now() - interval '1 day', now() + interval '1 day'), '[]'::jsonb, 'another company''s operator sees nothing');
select is(public.clock_in(now()) ->> 'clock_out', null, 'and clocks into his own company');
select is(pg_temp.q($$select company_id::text from public.employee_time_entries where employee_id = 'a2000000-0000-4000-8000-000000000001'$$),
  'b0000000-0000-4000-8000-000000000002', 'with his own company on the row');
set local request.jwt.claims = '{"sub": "c7000000-0000-4000-8000-000000000003", "role": "authenticated"}';
select throws_ok($$select public.clock_in(now())$$, '42501', 'not_operator', 'an inactive employee is refused');
set local request.jwt.claims = '{"sub": "c0000000-0000-4000-8000-000000000003", "role": "authenticated"}';
select throws_ok($$select public.clock_in(now())$$, '42501', 'not_operator', 'an office user is not an operator');

-- 6. Table access: office reads, operators do not
select is((select count(*) from public.employee_time_entries), 2::bigint, 'the Midcoast dispatcher reads Midcoast''s entries only');
set local request.jwt.claims = '{"sub": "c7000000-0000-4000-8000-000000000001", "role": "authenticated"}';
select is((select count(*) from public.employee_time_entries), 0::bigint, 'an operator reads no entries directly');

-- 7. Offline replays of a tap the server already has (Rob: -8h..-1h closed, -30m open)
select is((public.clock_out(now() - interval '1 hour') ->> 'clock_in')::timestamptz, now() - interval '8 hours',
  'clock out sent again after a new shift opened returns the closed entry, no error');
select is(public.operator_time_entries(now() - interval '1 day', now() + interval '1 day') -> 1 ->> 'clock_out', null,
  'and the open shift stays open');
select isnt(public.clock_out(now()) ->> 'clock_out', null, 'the open shift closes');
select is((public.clock_in(now() - interval '8 hours') ->> 'clock_out')::timestamptz, now() - interval '1 hour',
  'clock in sent again after that shift closed returns it, no overlaps_previous');

select * from finish();
rollback;
