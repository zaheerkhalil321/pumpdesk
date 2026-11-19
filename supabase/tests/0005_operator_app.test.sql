begin;
create extension if not exists pgtap with schema extensions;
select plan(154);

-- Operator app backend (migrations 0019, 0020).
-- Seeded: Midcoast operators Rob a1..01 (+12075550168), Dave a1..02, Tony a1..03, Casey a1..05; Rob has the six
-- seeded jobs ORD-1524..1534 (ORD-1524 finished and submitted). Test Co operator Omar a2..01 (+13125550161).
-- Dispatcher c0..03 and accountant c0..05 are Midcoast office users.

-- Helpers. q() reads anything (runs as the table owner); err() returns "message|detail" of a failing statement.
create function pg_temp.q(stmt text) returns text language plpgsql security definer as $f$
declare r text;
begin execute stmt into r; return r; end $f$;
create function pg_temp.err(stmt text) returns text language plpgsql as $f$
declare m text; d text;
begin
  execute stmt;
  return 'no error';
exception when others then
  get stacked diagnostics m = message_text, d = pg_exception_detail;
  return m || '|' || coalesce(d, '');
end $f$;

-- ── Fixtures (as the table owner) ───────────────────────────────
insert into auth.users (instance_id, id, aud, role, phone, phone_confirmed_at, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change, email_change_token_current,
  reauthentication_token, phone_change, phone_change_token)
select '00000000-0000-0000-0000-000000000000', v.id::uuid, 'authenticated', 'authenticated', v.phone, now(), now(), now(),
  '', '', '', '', '', '', '', ''
from (values
  ('c5000000-0000-4000-8000-000000000001', '12075550168'),  -- Rob
  ('c5000000-0000-4000-8000-000000000002', '12075550169'),  -- Dave
  ('c5000000-0000-4000-8000-000000000003', '12075550170'),  -- Tony (suspended membership)
  ('c5000000-0000-4000-8000-000000000004', '12075550172'),  -- Casey (employee already linked elsewhere)
  ('c5000000-0000-4000-8000-00000000000b', '12075550999'),  -- the other login Casey is linked to
  ('c5000000-0000-4000-8000-000000000009', '19995550009'),  -- stranger, no employee
  ('c5000000-0000-4000-8000-00000000000a', '19995550001'),  -- phone shared by two companies
  ('d5000000-0000-4000-8000-000000000001', '13125550161')   -- Omar (Test Pumping Co)
) as v(id, phone);

insert into public.company_memberships (company_id, user_id, role, status)
values ('a0000000-0000-4000-8000-000000000001', 'c5000000-0000-4000-8000-000000000003', 'operator', 'suspended');
update public.employees set user_id = 'c5000000-0000-4000-8000-00000000000b' where id = 'a1000000-0000-4000-8000-000000000005';
insert into public.employees (company_id, first_name, last_name, phone, is_operator) values
  ('a0000000-0000-4000-8000-000000000001', 'Twin', 'One', '+19995550001', true),
  ('b0000000-0000-4000-8000-000000000002', 'Twin', 'Two', '+19995550001', true);

-- A Midcoast job for Dave, a Test Co job for Omar, an extra only Midcoast and one only Test Co have.
insert into public.jobs (company_id, job_number, customer_id, site_label, scheduled_start, scheduled_end, timezone, estimated_yards, dispatch_status)
values
  ('a0000000-0000-4000-8000-000000000001', 'ORD-9001', 'e1000000-0000-4000-8000-000000000101', 'Dave Town',
   now() + interval '1 day', now() + interval '1 day 3 hours', 'America/New_York', 10, 'dispatched'),
  ('a0000000-0000-4000-8000-000000000001', 'ORD-9003', 'e1000000-0000-4000-8000-000000000101', 'Not sent yet',
   now() + interval '1 day', now() + interval '1 day 3 hours', 'America/New_York', 10, 'assigned'),
  ('b0000000-0000-4000-8000-000000000002', 'ORD-9002', 'e2000000-0000-4000-8000-000000000001', 'Chicago',
   now() + interval '1 day', now() + interval '1 day 3 hours', 'America/Chicago', 10, 'dispatched');
insert into public.job_employee_assignments (company_id, job_id, employee_id)
select j.company_id, j.id, case j.job_number when 'ORD-9001' then 'a1000000-0000-4000-8000-000000000002'::uuid
                                                             when 'ORD-9003' then 'a1000000-0000-4000-8000-000000000001'::uuid
                                                             else 'a2000000-0000-4000-8000-000000000001'::uuid end
  from public.jobs j where j.job_number in ('ORD-9001', 'ORD-9002', 'ORD-9003');
insert into public.ticket_extras (company_id, code, label, sort_order) values
  ('a0000000-0000-4000-8000-000000000001', 'midcoast_only', 'Midcoast only', 100),
  ('b0000000-0000-4000-8000-000000000002', 'testco_only', 'Test Co only', 100);
-- secrets that must never reach the phone
update public.jobs set internal_note = 'SECRET-INTERNAL', customer_notes = 'SECRET-CUSTOMER', purchase_order_number = 'PO-SECRET',
  billing_service = 'BILLING-SECRET' where job_number = 'ORD-1525';

select set_config('app.j1524', pg_temp.q($$select id::text from public.jobs where job_number = 'ORD-1524'$$), true);
select set_config('app.j2', pg_temp.q($$select id::text from public.jobs where job_number = 'ORD-1525'$$), true);
select set_config('app.j3', pg_temp.q($$select id::text from public.jobs where job_number = 'ORD-1526'$$), true);
select set_config('app.j4', pg_temp.q($$select id::text from public.jobs where job_number = 'ORD-1527'$$), true);
select set_config('app.j5', pg_temp.q($$select id::text from public.jobs where job_number = 'ORD-1530'$$), true);
select set_config('app.dave', pg_temp.q($$select id::text from public.jobs where job_number = 'ORD-9001'$$), true);
select set_config('app.unsent', pg_temp.q($$select id::text from public.jobs where job_number = 'ORD-9003'$$), true);
select set_config('app.j6', pg_temp.q($$select id::text from public.jobs where job_number = 'ORD-1534'$$), true);
select set_config('app.omar', pg_temp.q($$select id::text from public.jobs where job_number = 'ORD-9002'$$), true);
select set_config('app.co', 'a0000000-0000-4000-8000-000000000001', true);

-- 1. Phone sign-up gate (the GoTrue hook)
select is(private.hook_before_user_created('{"user": {"phone": "12075550168"}}'::jsonb), '{}'::jsonb, 'hook lets an operator phone sign up');
select is(private.hook_before_user_created('{"user": {"phone": "+12075550168"}}'::jsonb), '{}'::jsonb, 'hook accepts the + form too');
select ok(private.hook_before_user_created('{"user": {"phone": "12075559999"}}'::jsonb) ? 'error', 'hook refuses a phone that is not an operator');
select is(private.hook_before_user_created('{"user": {"email": "x@example.com"}}'::jsonb), '{}'::jsonb,
  'hook leaves users without a phone (office staff added by an admin) alone');
select is(private.hook_before_user_created('{"user": {"email": "x@example.com", "phone": ""}}'::jsonb), '{}'::jsonb,
  'an empty phone counts as no phone');
select is(
  (select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'private' and p.proname = 'hook_before_user_created'
      and has_function_privilege('authenticated', p.oid, 'execute')),
  0::bigint, 'the hook is not callable by API users');

-- 2. Linking a login to an operator
set local role authenticated;
set local request.jwt.claims = '{"sub": "c5000000-0000-4000-8000-000000000009", "role": "authenticated"}';
select throws_ok($$select public.link_operator_login()$$, 'P0001', 'phone_not_found', 'a phone that is not an operator cannot link');
select throws_ok($$select public.operator_me()$$, '42501', 'not_operator', 'a login that is not linked is not an operator');

set local request.jwt.claims = '{"sub": "c5000000-0000-4000-8000-00000000000a", "role": "authenticated"}';
select throws_ok($$select public.link_operator_login()$$, 'P0001', 'ambiguous_phone', 'a phone in two companies is ambiguous');

set local request.jwt.claims = '{"sub": "c5000000-0000-4000-8000-000000000003", "role": "authenticated"}';
select throws_ok($$select public.link_operator_login()$$, 'P0001', 'membership_inactive', 'a suspended membership stays suspended');

set local request.jwt.claims = '{"sub": "c5000000-0000-4000-8000-000000000004", "role": "authenticated"}';
select throws_ok($$select public.link_operator_login()$$, 'P0001', 'phone_already_linked', 'an operator already linked to another login cannot be taken over');

set local request.jwt.claims = '{"sub": "c5000000-0000-4000-8000-000000000001", "role": "authenticated"}';
select is(public.link_operator_login() ->> 'firstName', 'Rob', 'Rob links and gets his profile back');
select is(pg_temp.q($$select user_id::text from public.employees where id = 'a1000000-0000-4000-8000-000000000001'$$),
  'c5000000-0000-4000-8000-000000000001', 'the employee row now points at his login');
select is(pg_temp.q($$select role::text || '/' || status::text from public.company_memberships
  where user_id = 'c5000000-0000-4000-8000-000000000001'$$), 'operator/active', 'and he has an active operator membership');
select is(public.link_operator_login() ->> 'employeeId', 'a1000000-0000-4000-8000-000000000001', 'linking again is harmless');
select is(pg_temp.q($$select count(*)::text from public.company_memberships where user_id = 'c5000000-0000-4000-8000-000000000001'$$),
  '1', 'and adds no second membership');

reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub": "c5000000-0000-4000-8000-000000000002", "role": "authenticated"}';
select public.link_operator_login();
set local request.jwt.claims = '{"sub": "d5000000-0000-4000-8000-000000000001", "role": "authenticated"}';
select is(public.link_operator_login() -> 'company' ->> 'name', 'Test Pumping Co', 'Omar links into his own company');

-- 3. What Rob sees
set local request.jwt.claims = '{"sub": "c5000000-0000-4000-8000-000000000001", "role": "authenticated"}';
select is(public.operator_me() -> 'company' ->> 'name', 'Midcoast Concrete Pumping', 'operator_me: company name');
select is(public.operator_me() -> 'company' ->> 'dispatchPhone', '+12075550100', 'operator_me: dispatch phone');
select is(public.operator_me() -> 'company' ->> 'termsUrl', 'https://midcoastconcrete.com/terms', 'operator_me: terms link');
select is(jsonb_array_length(public.operator_jobs(null, null)), 6, 'Rob sees his six jobs and nobody else''s');
select is(jsonb_array_length(public.operator_jobs(
  ((now() at time zone 'America/New_York')::date)::timestamp at time zone 'America/New_York',
  ((now() at time zone 'America/New_York')::date + 1)::timestamp at time zone 'America/New_York')), 4, 'a day range returns today''s four');
select is(public.operator_jobs(null, null) -> 0 ->> 'jobNumber', 'ORD-1524', 'ordered by start time: first');
select is(public.operator_jobs(null, null) -> 5 ->> 'jobNumber', 'ORD-1534', 'ordered by start time: last');
select is(
  (select array_agg(k order by k) from jsonb_object_keys(public.operator_job(current_setting('app.j2')::uuid)) k),
  array['acknowledgedAt', 'arriveShopBy', 'changedSinceSeen', 'customerName', 'estimatedYards', 'id', 'isCancelled',
        'jobName', 'jobNumber', 'notesForOperator', 'pourStartsAt', 'pump', 'shop', 'site', 'siteContact', 'steps',
        'ticketStatus', 'timezone'],
  'an OperatorJob has exactly the app''s 18 fields');
select ok(public.operator_jobs(null, null)::text not like '%SECRET%', 'no internal notes, customer notes, PO or billing text reaches the phone');
select is(public.operator_job(current_setting('app.j2')::uuid) ->> 'notesForOperator',
  'Call Dave 30 mins before arrival. Soft shoulder near the driveway entrance.', 'notes for the operator are the site instructions');
select is(public.operator_job(current_setting('app.j2')::uuid) -> 'pump', '{"unit": "02", "label": "28m boom"}'::jsonb, 'pump unit and label');
select is(public.operator_job(current_setting('app.j2')::uuid) -> 'siteContact' ->> 'name', 'Dave Stevens', 'site contact name');
select is(public.operator_job(current_setting('app.j2')::uuid) -> 'siteContact' ->> 'role', 'Job Lead', 'site contact role');
select is(public.operator_job(current_setting('app.j2')::uuid) -> 'site' ->> 'town', 'Rockport', 'site town from the job site');
select is(public.operator_job(current_setting('app.j2')::uuid) -> 'shop' ->> 'name', 'Midcoast Concrete Pumping', 'shop is the branch yard');
select is((public.operator_job(current_setting('app.j2')::uuid) -> 'shop' ->> 'lat')::numeric, 44.1181, 'shop coordinates come from the branch');
select is(public.operator_job(current_setting('app.j1524')::uuid) ->> 'ticketStatus', 'submitted', 'finished job shows a submitted ticket');
select isnt(public.operator_job(current_setting('app.j1524')::uuid) -> 'steps' ->> 'departed_site', null, 'and its steps');
select is(public.operator_job(current_setting('app.j2')::uuid) ->> 'ticketStatus', 'not_started', 'no ticket yet is not_started');

-- 4. Other people's jobs
select throws_ok(format($j$select public.operator_job('%s')$j$, current_setting('app.dave')), '42501', 'not_assigned', 'Rob cannot read Dave''s job');
select throws_ok(format($j$select public.operator_job('%s')$j$, current_setting('app.omar')), '42501', 'not_assigned', 'Rob cannot read another company''s job');
select throws_ok(format($j$select public.record_job_step('%s', 'arrived_shop', now())$j$, current_setting('app.dave')), '42501', 'not_assigned', 'Rob cannot write to Dave''s job');
select throws_ok(format($j$select public.get_work_ticket('%s')$j$, current_setting('app.omar')), '42501', 'not_assigned', 'Rob cannot read another company''s ticket');
select throws_ok(format($j$select public.mark_job_seen('%s')$j$, current_setting('app.dave')), '42501', 'not_assigned', 'Rob cannot mark Dave''s job seen');

select throws_ok(format($j$select public.operator_job('%s')$j$, current_setting('app.unsent')), '42501', 'not_assigned', 'a job that is assigned but not dispatched is invisible to the operator');
select throws_ok(format($j$select public.record_job_step('%s', 'departed_shop', now())$j$, current_setting('app.j6')), 'P0001', 'too_early', 'a job on a later day cannot be started');

-- 5. No direct table access for an operator, even inside his own company
select is((select count(*) from public.jobs), 0::bigint, 'an operator reads no jobs directly');
select is((select count(*) from public.customers) + (select count(*) from public.employees) + (select count(*) from public.job_employee_assignments)
  + (select count(*) from public.work_tickets) + (select count(*) from public.job_step_events) + (select count(*) from public.ticket_extras),
  0::bigint, 'nor customers, crew, assignments, tickets, steps or extras');
select throws_ok($$insert into public.job_step_events (job_id, employee_id, step, at)
  values (gen_random_uuid(), 'a1000000-0000-4000-8000-000000000001', 'arrived_shop', now())$$, '42501', null, 'an operator cannot write steps directly');

-- 6. Acknowledge (ORD-1527 is dispatched, not yet acknowledged)
select is(public.acknowledge_assignment(current_setting('app.j4')::uuid, '2026-11-19T10:00:00Z') ->> 'acknowledgedAt', '2026-11-19T10:00:00.000Z',
  'acknowledge stores the moment of the tap');
select is(pg_temp.q(format($q$select dispatch_status::text from public.jobs where id = '%s'$q$, current_setting('app.j4'))), 'acknowledged',
  'the job becomes acknowledged on the dashboard');
select is(public.acknowledge_assignment(current_setting('app.j4')::uuid, '2026-11-19T11:00:00Z') ->> 'acknowledgedAt', '2026-11-19T10:00:00.000Z',
  'a retry keeps the first time');
select is(pg_temp.q(format($q$select count(*)::text from public.job_status_history where job_id = '%s' and dimension = 'dispatch'$q$, current_setting('app.j4'))),
  '2', 'and writes the acknowledged history once (after the seeded dispatched row)');

-- 7. Steps (ORD-1525)
select set_config('app.v0', pg_temp.q(format($q$select version::text from public.jobs where id = '%s'$q$, current_setting('app.j2'))), true);
select is(public.record_job_step(current_setting('app.j2')::uuid, 'arrived_shop', '2026-11-19T10:00:00Z') -> 'steps' ->> 'arrived_shop',
  '2026-11-19T10:00:00.000Z', 'arrived at the shop is stored with the tap time');
select is(pg_temp.q(format($q$select field_status::text from public.jobs where id = '%s'$q$, current_setting('app.j2'))), 'scheduled', 'arrived_shop changes no field status');
select is(public.record_job_step(current_setting('app.j2')::uuid, 'arrived_shop', '2026-11-19T10:05:00Z') -> 'steps' ->> 'arrived_shop',
  '2026-11-19T10:00:00.000Z', 'recording the same step again keeps the first time');
select is(pg_temp.q(format($q$select count(*)::text from public.job_step_events where job_id = '%s' and step = 'arrived_shop'$q$, current_setting('app.j2'))),
  '1', 'and adds no second row');
select public.record_job_step(current_setting('app.j2')::uuid, 'departed_shop', '2026-11-19T10:20:00Z');
select is(pg_temp.q(format($q$select field_status::text from public.jobs where id = '%s'$q$, current_setting('app.j2'))), 'en_route', 'departed_shop -> en_route');
select is(pg_temp.q(format($q$select old_value || '>' || new_value from public.job_status_history where job_id = '%s' and dimension = 'field'$q$, current_setting('app.j2'))),
  'scheduled>en_route', 'and the history says so');
select public.record_job_step(current_setting('app.j2')::uuid, 'arrived_site', '2026-11-19T10:50:00Z');
select is(pg_temp.q(format($q$select field_status::text from public.jobs where id = '%s'$q$, current_setting('app.j2'))), 'on_site', 'arrived_site -> on_site');
select throws_ok(format($j$select public.record_job_step('%s', 'departed_site', '2026-11-19T10:40:00Z')$j$, current_setting('app.j2')),
  'P0001', 'step_out_of_order', 'leaving the site before arriving is refused');
select public.record_job_step(current_setting('app.j2')::uuid, 'departed_site', '2026-11-19T13:00:00Z');
select is(pg_temp.q(format($q$select field_status::text from public.jobs where id = '%s'$q$, current_setting('app.j2'))), 'returning', 'departed_site -> returning');
select is(pg_temp.q(format($q$select version::text from public.jobs where id = '%s'$q$, current_setting('app.j2'))), current_setting('app.v0'),
  'the operator''s taps do not bump the job version (dispatcher edits never conflict)');
select throws_ok(format($j$select public.undo_job_step('%s', 'arrived_site')$j$, current_setting('app.j2')),
  'P0001', 'step_out_of_order', 'only the latest step can be undone');
select public.undo_job_step(current_setting('app.j2')::uuid, 'departed_site');
select is(public.operator_job(current_setting('app.j2')::uuid) -> 'steps' ->> 'departed_site', null, 'undo clears the step');
select is(pg_temp.q(format($q$select field_status::text from public.jobs where id = '%s'$q$, current_setting('app.j2'))), 'on_site', 'and moves the field status back');
select lives_ok(format($j$select public.undo_job_step('%s', 'departed_site')$j$, current_setting('app.j2')), 'undo twice is harmless');
select public.record_job_step(current_setting('app.j2')::uuid, 'departed_site', '2026-11-19T13:00:00Z');
select is(pg_temp.q(format($q$select count(*)::text || '/' || count(*) filter (where undone_at is null)::text
  from public.job_step_events where job_id = '%s' and step = 'departed_site'$q$, current_setting('app.j2'))),
  '2/1', 'undo kept the old row and recording again added one live row');
select throws_ok(format($j$select public.edit_job_step_time('%s', 'arrived_site', '2026-11-19T10:10:00Z')$j$, current_setting('app.j2')),
  'P0001', 'step_out_of_order', 'a time before the previous step is refused');
select throws_ok(format($j$select public.edit_job_step_time('%s', 'arrived_site', '2026-11-19T14:00:00Z')$j$, current_setting('app.j2')),
  'P0001', 'step_out_of_order', 'a time after the next step is refused');
select is(public.edit_job_step_time(current_setting('app.j2')::uuid, 'arrived_site', '2026-11-19T10:45:00Z') -> 'steps' ->> 'arrived_site',
  '2026-11-19T10:45:00.000Z', 'a time between the neighbours is accepted');
select isnt(pg_temp.q(format($q$select edited_at::text from public.job_step_events where job_id = '%s' and step = 'arrived_site' and undone_at is null$q$, current_setting('app.j2'))),
  null, 'and marked as edited');
select lives_ok(format($j$select public.edit_job_step_time('%s', 'arrived_site', '2026-11-19T10:45:00Z')$j$, current_setting('app.j2')), 'editing to the same time is harmless');
select throws_ok(format($j$select public.edit_job_step_time('%s', 'departed_site', '2026-11-19T12:00:00Z')$j$, current_setting('app.j3')),
  'P0001', 'step_not_recorded', 'editing a step that was never recorded is refused');
select throws_ok(format($j$select public.record_job_step('%s', 'arrived_shop', null)$j$, current_setting('app.j3')),
  'P0001', 'invalid_time', 'a missing time is refused');

-- 8. Work ticket (ORD-1525)
select is(public.get_work_ticket(current_setting('app.j2')::uuid), null, 'no ticket yet returns null');
select is(jsonb_array_length(public.ticket_extras()), 4, 'the extras list holds Midcoast''s three standard extras and its own');
select is(public.ticket_extras() -> 0 ->> 'code', 'offsite_washout', 'sorted: Off-site washout first');
select is(pg_temp.err(format($j$select public.save_work_ticket('{"jobId": "%s", "yardsPumped": 5000}'::jsonb)$j$, current_setting('app.j2'))),
  'invalid_ticket|invalid: yardsPumped', 'too many yards is an invalid ticket');
select is(pg_temp.err(format($j$select public.save_work_ticket('{"jobId": "%s", "extras": ["testco_only"]}'::jsonb)$j$, current_setting('app.j2'))),
  'invalid_ticket|invalid: extras:testco_only', 'another company''s extra is not accepted');
select is(pg_temp.err(format($j$select public.save_work_ticket('{"jobId": "%s", "signaturePath": "%s/%s.png"}'::jsonb)$j$,
  current_setting('app.j2'), current_setting('app.co'), current_setting('app.dave'))),
  'invalid_ticket|invalid: signaturePath', 'a signature path for another job is not accepted');

select set_config('app.draft', format($d${"jobId": "%s", "arrivedOnSiteAt": "2026-11-19T10:45:00Z", "startedPourAt": "2026-11-19T11:00:00Z",
  "finishedPourAt": "2026-11-19T12:30:00Z", "departedSiteAt": "2026-11-19T13:00:00Z", "yardsPumped": 40.5, "hose3inFt": 100,
  "hose4inFt": 0, "extras": ["primer_bag", "offsite_washout", "primer_bag"], "comments": "Fine.", "signerName": "Dave Stevens",
  "signaturePng": null, "signaturePath": "%s/%s.png", "signedAt": "2026-11-19T12:50:00Z", "updatedAt": "2026-01-01T00:00:00Z"}$d$,
  current_setting('app.j2'), current_setting('app.co'), current_setting('app.j2')), true);
select is(public.save_work_ticket(current_setting('app.draft')::jsonb) ->> 'yardsPumped', '40.50', 'a valid draft is saved');
select is(public.get_work_ticket(current_setting('app.j2')::uuid) -> 'extras', '["offsite_washout", "primer_bag"]'::jsonb, 'extras are stored once each');
select is(public.get_work_ticket(current_setting('app.j2')::uuid) ->> 'signaturePath', current_setting('app.co') || '/' || current_setting('app.j2') || '.png',
  'the signature is a path in the bucket, not an image');
select is(public.operator_job(current_setting('app.j2')::uuid) ->> 'ticketStatus', 'draft', 'the job now shows a draft ticket');
select lives_ok(format($j$select public.save_work_ticket('%s'::jsonb)$j$, current_setting('app.draft')), 'saving the same draft again is harmless');
select is(pg_temp.q(format($q$select count(*)::text from public.work_tickets where job_id = '%s'$q$, current_setting('app.j2'))), '1', 'still one ticket per job');
select is(pg_temp.q(format($q$select count(*)::text from public.work_ticket_extras e join public.work_tickets t on t.id = e.ticket_id where t.job_id = '%s'$q$, current_setting('app.j2'))),
  '2', 'and two extras rows');

select set_config('app.bad', format('{"jobId": "%s", "startedPourAt": "2026-11-19T12:00:00Z", "finishedPourAt": "2026-11-19T12:00:00Z", "yardsPumped": null}', current_setting('app.j2')), true);
select public.save_work_ticket(current_setting('app.bad')::jsonb);
select is(pg_temp.err(format($j$select public.submit_work_ticket('%s')$j$, current_setting('app.j2'))),
  'invalid_ticket|Finished pour must be after Started pour. Yards pumped is required to submit.', 'submit checks like the app''s schema');
select public.save_work_ticket(current_setting('app.draft')::jsonb);

-- signature files (storage): an operator writes only his own job's path
select lives_ok(format($$insert into storage.objects (bucket_id, name) values ('signatures', '%s/%s.png')$$, current_setting('app.co'), current_setting('app.j3')),
  'Rob can upload the signature of a job he is on');
select throws_ok(format($$insert into storage.objects (bucket_id, name) values ('signatures', '%s/%s.png')$$, current_setting('app.co'), current_setting('app.dave')),
  '42501', null, 'but not the signature of Dave''s job');
select throws_ok(format($$insert into storage.objects (bucket_id, name) values ('signatures', 'b0000000-0000-4000-8000-000000000002/%s.png')$$, current_setting('app.omar')),
  '42501', null, 'nor another company''s');
select throws_ok($$insert into storage.objects (bucket_id, name) values ('signatures', 'anything.png')$$, '42501', null, 'nor an arbitrary path');

select is(public.submit_work_ticket(current_setting('app.j2')::uuid) ->> 'ticketStatus', 'submitted', 'a valid ticket submits');
select is(pg_temp.q(format($q$select field_status::text from public.jobs where id = '%s'$q$, current_setting('app.j2'))), 'done', 'and the job is done, because the site was left');
select isnt(pg_temp.q(format($q$select completed_at::text from public.jobs where id = '%s'$q$, current_setting('app.j2'))), null, 'with a completion time');
select is(pg_temp.q(format($q$select booking_status::text from public.jobs where id = '%s'$q$, current_setting('app.j2'))), 'turned_in', 'submitting turns the order in');
select is(pg_temp.q(format($q$select count(*)::text from public.job_status_history where job_id = '%s' and dimension = 'field' and new_value = 'done'$q$, current_setting('app.j2'))),
  '1', 'and one history row for done');
select set_config('app.submitted_at', pg_temp.q(format($q$select submitted_at::text from public.work_tickets where job_id = '%s'$q$, current_setting('app.j2'))), true);
select lives_ok(format($j$select public.submit_work_ticket('%s')$j$, current_setting('app.j2')), 'submitting twice is harmless');
select is(pg_temp.q(format($q$select submitted_at::text from public.work_tickets where job_id = '%s'$q$, current_setting('app.j2'))), current_setting('app.submitted_at'),
  'and keeps the first submit time');
select throws_ok(format($j$select public.save_work_ticket('%s'::jsonb)$j$, current_setting('app.draft')), 'P0001', 'ticket_locked', 'a submitted ticket cannot be saved');
select throws_ok(format($j$select public.undo_job_step('%s', 'departed_site')$j$, current_setting('app.j2')), 'P0001', 'ticket_locked', 'nor its steps undone');
select throws_ok(format($j$select public.edit_job_step_time('%s', 'arrived_site', '2026-11-19T10:46:00Z')$j$, current_setting('app.j2')), 'P0001', 'ticket_locked', 'nor edited');
select lives_ok(format($j$select public.record_job_step('%s', 'arrived_site', '2026-11-19T10:50:00Z')$j$, current_setting('app.j2')), 'a late retry of a step that is already recorded is a no-op');
select throws_ok(format($$insert into storage.objects (bucket_id, name) values ('signatures', '%s/%s.png')$$, current_setting('app.co'), current_setting('app.j2')),
  '42501', null, 'and the signature file is locked too');

-- 9. Changed since seen (ORD-1526)
select is(public.operator_job(current_setting('app.j3')::uuid) ->> 'changedSinceSeen', 'false', 'a job never opened is not "changed"');
select public.mark_job_seen(current_setting('app.j3')::uuid);

reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub": "c0000000-0000-4000-8000-000000000003", "role": "authenticated"}';
select public.update_job(jsonb_build_object('id', current_setting('app.j3'),
  'version', (select version from public.jobs where id = current_setting('app.j3')::uuid), 'internal_note', 'only internal'));
set local request.jwt.claims = '{"sub": "c5000000-0000-4000-8000-000000000001", "role": "authenticated"}';
select is(public.operator_job(current_setting('app.j3')::uuid) ->> 'changedSinceSeen', 'false', 'an internal note change is not reported to the operator');
set local request.jwt.claims = '{"sub": "c0000000-0000-4000-8000-000000000003", "role": "authenticated"}';
select public.update_job(jsonb_build_object('id', current_setting('app.j3'),
  'version', (select version from public.jobs where id = current_setting('app.j3')::uuid),
  'scheduled_start', now() + interval '3 hours', 'scheduled_end', now() + interval '6 hours'));
set local request.jwt.claims = '{"sub": "c5000000-0000-4000-8000-000000000001", "role": "authenticated"}';
select is(public.operator_job(current_setting('app.j3')::uuid) ->> 'acknowledgedAt', null, 'a new time clears the acknowledgement');
select is(pg_temp.q(format($q$select dispatch_status::text from public.jobs where id = '%s'$q$, current_setting('app.j3'))), 'dispatched', 'and the job goes back to dispatched');
select is(public.operator_job(current_setting('app.j3')::uuid) ->> 'changedSinceSeen', 'true', 'a new time is reported until the operator opens the job');
select public.mark_job_seen(current_setting('app.j3')::uuid);
select is(public.operator_job(current_setting('app.j3')::uuid) ->> 'changedSinceSeen', 'false', 'opening it clears the flag');

-- 10. Dispatcher cancels ORD-1530: the operator still sees it, as cancelled, and can change nothing
set local request.jwt.claims = '{"sub": "c0000000-0000-4000-8000-000000000003", "role": "authenticated"}';
select public.cancel_job(current_setting('app.j5')::uuid, 'Customer called',
  (select version from public.jobs where id = current_setting('app.j5')::uuid));
set local request.jwt.claims = '{"sub": "c5000000-0000-4000-8000-000000000001", "role": "authenticated"}';
select is(public.operator_job(current_setting('app.j5')::uuid) ->> 'isCancelled', 'true', 'a cancelled job stays visible, marked cancelled');
select is(jsonb_array_length(public.operator_jobs(null, null)), 6, 'and stays in the list');
select throws_ok(format($j$select public.record_job_step('%s', 'arrived_shop', now())$j$, current_setting('app.j5')), 'P0001', 'job_cancelled', 'no steps on a cancelled job');
select throws_ok(format($j$select public.acknowledge_assignment('%s', now())$j$, current_setting('app.j5')), 'P0001', 'job_cancelled', 'no acknowledge on a cancelled job');
select throws_ok(format($j$select public.save_work_ticket('{"jobId": "%s"}'::jsonb)$j$, current_setting('app.j5')), 'P0001', 'job_cancelled', 'no ticket on a cancelled job');
select lives_ok(format($j$select public.mark_job_seen('%s')$j$, current_setting('app.j5')), 'but the operator can mark it seen');
set local request.jwt.claims = '{"sub": "c5000000-0000-4000-8000-000000000002", "role": "authenticated"}';
select throws_ok(format($j$select public.operator_job('%s')$j$, current_setting('app.j5')), '42501', 'not_assigned', 'another operator does not see it');
select is(jsonb_array_length(public.operator_jobs(null, null)), 1, 'Dave sees only his own job');

-- 11. Company B cannot see or touch company A (Omar)
set local request.jwt.claims = '{"sub": "d5000000-0000-4000-8000-000000000001", "role": "authenticated"}';
select is(jsonb_array_length(public.operator_jobs(null, null)), 1, 'Omar sees only his one job');
select is(public.operator_jobs(null, null) -> 0 ->> 'jobNumber', 'ORD-9002', 'and it is his');
select is(jsonb_array_length(public.ticket_extras()), 4, 'his extras are his company''s (3 standard + his own)');
select ok(public.ticket_extras()::text not like '%midcoast_only%', 'not Midcoast''s');
select throws_ok(format($j$select public.operator_job('%s')$j$, current_setting('app.j2')), '42501', 'not_assigned', 'Omar cannot read a Midcoast job');
select throws_ok(format($j$select public.record_job_step('%s', 'arrived_shop', now())$j$, current_setting('app.j2')), '42501', 'not_assigned', 'cannot record a step on it');
select throws_ok(format($j$select public.acknowledge_assignment('%s', now())$j$, current_setting('app.j2')), '42501', 'not_assigned', 'cannot acknowledge it');
select throws_ok(format($j$select public.get_work_ticket('%s')$j$, current_setting('app.j2')), '42501', 'not_assigned', 'cannot read its ticket');
select throws_ok(format($j$select public.save_work_ticket('{"jobId": "%s"}'::jsonb)$j$, current_setting('app.j2')), '42501', 'not_assigned', 'cannot save a ticket on it');
select throws_ok(format($j$select public.submit_work_ticket('%s')$j$, current_setting('app.j2')), '42501', 'not_assigned', 'cannot submit one');
select is(pg_temp.err(format($j$select public.save_work_ticket('{"jobId": "%s", "extras": ["midcoast_only"]}'::jsonb)$j$, current_setting('app.omar'))),
  'invalid_ticket|invalid: extras:midcoast_only', 'and cannot use a Midcoast extra on his own ticket');
select throws_ok(format($$insert into storage.objects (bucket_id, name) values ('signatures', '%s/%s.png')$$, current_setting('app.co'), current_setting('app.j3')),
  '42501', null, 'nor upload into Midcoast''s signature folder');
select is((select count(*) from public.jobs) + (select count(*) from public.work_tickets) + (select count(*) from public.job_step_events), 0::bigint,
  'and reads no tables directly');
set local request.jwt.claims = '{"sub": "c5000000-0000-4000-8000-000000000001", "role": "authenticated"}';
select throws_ok(format($j$select public.operator_job('%s')$j$, current_setting('app.omar')), '42501', 'not_assigned', 'and Rob cannot read Omar''s job');

-- 12. Office users are unaffected, and operator functions are not for them
set local request.jwt.claims = '{"sub": "c0000000-0000-4000-8000-000000000003", "role": "authenticated"}';
select ok((select count(*) from public.jobs) >= 7, 'the dispatcher still sees all orders');
select is((select count(*) from public.work_tickets), 2::bigint, 'the dispatcher reads both tickets (the seeded one and the phone-test one)');
select is((select count(*) from public.work_ticket_extras), 3::bigint, 'with its extras (2 from the phone test, 1 seeded)');
select ok((select count(*) from public.job_step_events) >= 8, 'and the step taps');
select lives_ok($$insert into public.ticket_extras (code, label) values ('rental_hose', 'Rental hose')$$, 'a dispatcher can add an extra');
select throws_ok($$select public.operator_me()$$, '42501', 'not_operator', 'a dispatcher is not an operator');
select throws_ok($$select public.operator_jobs(null, null)$$, '42501', 'not_operator', 'and gets no operator job list');
select throws_ok($$select public.link_operator_login()$$, 'P0001', 'phone_not_found', 'and cannot link (no phone login)');
set local request.jwt.claims = '{"sub": "c0000000-0000-4000-8000-000000000005", "role": "authenticated"}';
select throws_ok($$insert into public.ticket_extras (code, label) values ('x_extra', 'X')$$, '42501', null, 'an accountant cannot add extras');
select throws_ok($$update public.work_tickets set comments = 'edited'$$, '42501', null, 'office cannot edit tickets directly (yet)');

-- 13. Signed-out callers get nothing
reset role;
set local role anon;
select throws_ok($$select public.operator_me()$$, '42501', null, 'anon cannot call operator_me');
select throws_ok($$select public.link_operator_login()$$, '42501', null, 'anon cannot link');
select throws_ok($$select public.record_job_step(gen_random_uuid(), 'arrived_shop', now())$$, '42501', null, 'anon cannot record a step');

-- 14. The relations themselves (as the table owner, so only constraints can stop these)
reset role;
select throws_ok(format($$insert into public.job_step_events (company_id, job_id, employee_id, step, at)
  values ('%s', '%s', 'a1000000-0000-4000-8000-000000000001', 'arrived_shop', now())$$, current_setting('app.co'), current_setting('app.omar')),
  '23503', null, 'a step cannot point at another company''s job');
select throws_ok(format($$insert into public.job_step_events (company_id, job_id, employee_id, step, at)
  values ('%s', '%s', 'a2000000-0000-4000-8000-000000000001', 'arrived_shop', now())$$, current_setting('app.co'), current_setting('app.j3')),
  '23503', null, 'nor at another company''s employee');
select throws_ok(format($$insert into public.job_step_events (company_id, job_id, employee_id, step, at)
  values ('%s', '%s', 'a1000000-0000-4000-8000-000000000001', 'arrived_site', now())$$, current_setting('app.co'), current_setting('app.j2')),
  '23505', null, 'only one live row per job and step');
select throws_ok(format($$insert into public.work_tickets (company_id, job_id, employee_id) values ('%s', '%s', 'a1000000-0000-4000-8000-000000000001')$$,
  current_setting('app.co'), current_setting('app.j2')), '23505', null, 'only one ticket per job');
select throws_ok(format($$insert into public.work_tickets (company_id, job_id, employee_id) values ('%s', '%s', 'a2000000-0000-4000-8000-000000000001')$$,
  current_setting('app.co'), current_setting('app.j4')), '23503', null, 'a ticket cannot be started by another company''s employee');
select throws_ok(format($$insert into public.work_tickets (company_id, job_id, employee_id) values ('b0000000-0000-4000-8000-000000000002', '%s', 'a2000000-0000-4000-8000-000000000001')$$,
  current_setting('app.j4')), '23503', null, 'nor on another company''s job');
select throws_ok(format($$update public.work_tickets set signature_path = 'somewhere/else.png' where job_id = '%s'$$, current_setting('app.j2')),
  '23514', null, 'a signature path must be <company>/<job>.png');
select throws_ok(format($$insert into public.work_ticket_extras (company_id, ticket_id, extra_code)
  select company_id, id, 'testco_only' from public.work_tickets where job_id = '%s'$$, current_setting('app.j2')),
  '23503', null, 'a ticket cannot use another company''s extra');
select throws_ok($$insert into public.ticket_extras (company_id, code, label) values ('a0000000-0000-4000-8000-000000000001', 'primer_bag', 'Dup')$$,
  '23505', null, 'extra codes are unique per company');
select throws_ok(format($$delete from public.jobs where id = '%s'$$, current_setting('app.j2')), '23503', null, 'a job with steps and a ticket cannot be hard-deleted');
select throws_ok($$delete from public.employees where id = 'a1000000-0000-4000-8000-000000000001'$$, '23503', null, 'nor an operator with taps');

select * from finish();
rollback;
