begin;
create extension if not exists pgtap with schema extensions;
select plan(40);

-- Midcoast: owner c..01, admin c..02, dispatcher c..03, office c..04, accountant c..05. Test Co owner d..01.
-- Customer e1..101 (phone), contact Alex f1..001 (phone), operator Rob a1..01.
-- Triggers on jobs are deferred to the end of the transaction, so each step ends with "set constraints all immediate".

create function pg_temp.cnt(p_job uuid, p_event text) returns bigint language sql as $$
  select count(*) from public.notification_deliveries where job_id = p_job and event = p_event
$$;
create function pg_temp.mkjob(p_id uuid, p_customer uuid, p_status text, p_contact uuid default null) returns void
language plpgsql as $$
begin
  insert into public.jobs (id, company_id, job_number, customer_id, site_label, scheduled_start, scheduled_end, timezone,
    service_date, estimated_yards, booking_status)
  values (p_id, 'a0000000-0000-4000-8000-000000000001', 'NT-' || right(p_id::text, 4), p_customer, 'Rockland',
    now() + interval '1 day', now() + interval '1 day 3 hours', 'America/New_York', current_date, 10, p_status::public.booking_status);
  if p_contact is not null then
    insert into public.job_contacts (company_id, job_id, contact_id)
    values ('a0000000-0000-4000-8000-000000000001', p_id, p_contact);
  end if;
  set constraints all immediate;
  set constraints all deferred;
end $$;

insert into public.customers (id, company_id, business_name, status) values
  ('e1000000-0000-4000-8000-0000000009a1', 'a0000000-0000-4000-8000-000000000001', 'No Phone Builders', 'active');

-- 1. Defaults
select is(private.notification_rule_enabled('a0000000-0000-4000-8000-000000000001', 'order_confirmation'), true, 'order confirmation is on by default');
select is(private.notification_rule_enabled('a0000000-0000-4000-8000-000000000001', 'pre_work_authorization'), false, 'pre-work authorization is off by default');
select is(private.notification_rule_enabled('a0000000-0000-4000-8000-000000000001', 'work_ticket_review'), true, 'work ticket review is on by default');

-- 2. Order confirmation: from pending, to the job contact
select pg_temp.mkjob('10000000-0000-4000-8000-000000000001', 'e1000000-0000-4000-8000-000000000101', 'pending', 'f1000000-0000-4000-8000-000000000001');
select is(pg_temp.cnt('10000000-0000-4000-8000-000000000001', 'order_confirmation'), 0::bigint, 'a pending order queues nothing');
update public.jobs set booking_status = 'confirmed' where id = '10000000-0000-4000-8000-000000000001';
set constraints all immediate; set constraints all deferred;
select is(pg_temp.cnt('10000000-0000-4000-8000-000000000001', 'order_confirmation'), 1::bigint, 'confirming queues one text');
select is((select to_phone from public.notification_deliveries where job_id = '10000000-0000-4000-8000-000000000001' and event = 'order_confirmation'),
  '+12075550110', 'it goes to the job contact''s phone');
select is((select status from public.notification_deliveries where job_id = '10000000-0000-4000-8000-000000000001' and event = 'order_confirmation'),
  'pending', 'and waits for the sender');

-- 3. No duplicates
update public.jobs set booking_status = 'pending' where id = '10000000-0000-4000-8000-000000000001';
update public.jobs set booking_status = 'confirmed' where id = '10000000-0000-4000-8000-000000000001';
set constraints all immediate; set constraints all deferred;
select is(pg_temp.cnt('10000000-0000-4000-8000-000000000001', 'order_confirmation'), 1::bigint, 'confirming again adds no second text');
update public.jobs set site_label = 'Camden' where id = '10000000-0000-4000-8000-000000000001';
set constraints all immediate; set constraints all deferred;
select is(pg_temp.cnt('10000000-0000-4000-8000-000000000001', 'order_confirmation'), 1::bigint, 'editing the order adds none');

-- 4. Inserted already confirmed (the contact is added after the order row, as book_job does)
select pg_temp.mkjob('10000000-0000-4000-8000-000000000007', 'e1000000-0000-4000-8000-000000000101', 'confirmed', 'f1000000-0000-4000-8000-000000000001');
select is((select to_phone from public.notification_deliveries where job_id = '10000000-0000-4000-8000-000000000007'), '+12075550110',
  'an order booked as confirmed texts its job contact, not the fallback');

-- 5. Main-phone fallback and no_phone
select pg_temp.mkjob('10000000-0000-4000-8000-000000000002', 'e1000000-0000-4000-8000-000000000101', 'confirmed');
select is((select to_phone from public.notification_deliveries where job_id = '10000000-0000-4000-8000-000000000002'), '+12075550101',
  'no job contact: the customer''s main phone is used');
select is((select customer_id from public.notification_deliveries where job_id = '10000000-0000-4000-8000-000000000002'),
  'e1000000-0000-4000-8000-000000000101'::uuid, 'and the row points at the customer');
select pg_temp.mkjob('10000000-0000-4000-8000-000000000003', 'e1000000-0000-4000-8000-0000000009a1', 'confirmed');
select is((select status || '/' || skip_reason from public.notification_deliveries where job_id = '10000000-0000-4000-8000-000000000003'),
  'skipped/no_phone', 'no phone anywhere: recorded as skipped (no_phone)');

-- 6. Operator details on dispatch
update public.jobs set dispatch_status = 'dispatched' where id = '10000000-0000-4000-8000-000000000001';
set constraints all immediate; set constraints all deferred;
select is(pg_temp.cnt('10000000-0000-4000-8000-000000000001', 'operator_details'), 1::bigint, 'dispatching queues operator details');
update public.jobs set dispatch_status = 'acknowledged' where id = '10000000-0000-4000-8000-000000000001';
update public.jobs set dispatch_status = 'dispatched' where id = '10000000-0000-4000-8000-000000000001';
set constraints all immediate; set constraints all deferred;
select is(pg_temp.cnt('10000000-0000-4000-8000-000000000001', 'operator_details'), 1::bigint, 'dispatching again adds none');

-- 7. Pump en route from the phone app's step
insert into public.job_step_events (company_id, job_id, employee_id, step, at)
values ('a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000001', 'arrived_shop', now());
select is(pg_temp.cnt('10000000-0000-4000-8000-000000000001', 'pump_en_route'), 0::bigint, 'other steps queue nothing');
insert into public.job_step_events (company_id, job_id, employee_id, step, at)
values ('a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000001', 'departed_shop', now());
select is(pg_temp.cnt('10000000-0000-4000-8000-000000000001', 'pump_en_route'), 1::bigint, 'leaving the shop queues pump en route');
update public.job_step_events set undone_at = now() where job_id = '10000000-0000-4000-8000-000000000001' and step = 'departed_shop';
insert into public.job_step_events (company_id, job_id, employee_id, step, at)
values ('a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000001', 'departed_shop', now());
select is(pg_temp.cnt('10000000-0000-4000-8000-000000000001', 'pump_en_route'), 1::bigint, 'undo and tap again adds none');

-- 8. Work ticket review
insert into public.work_tickets (company_id, job_id, employee_id) values ('a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000001');
select is(pg_temp.cnt('10000000-0000-4000-8000-000000000001', 'work_ticket_review'), 0::bigint, 'a draft ticket queues nothing');
update public.work_tickets set status = 'submitted', submitted_at = now(), yards_pumped = 36.5 where job_id = '10000000-0000-4000-8000-000000000001';
select is(pg_temp.cnt('10000000-0000-4000-8000-000000000001', 'work_ticket_review'), 1::bigint, 'submitting queues the work ticket review');

-- 9. Company rule off
insert into public.notification_rules (company_id, event, enabled) values ('a0000000-0000-4000-8000-000000000001', 'order_confirmation', false);
select is(private.notification_rule_enabled('a0000000-0000-4000-8000-000000000001', 'order_confirmation'), false, 'a saved rule beats the default');
select pg_temp.mkjob('10000000-0000-4000-8000-000000000004', 'e1000000-0000-4000-8000-000000000101', 'confirmed', 'f1000000-0000-4000-8000-000000000001');
select is(pg_temp.cnt('10000000-0000-4000-8000-000000000004', 'order_confirmation'), 0::bigint, 'company rule off: nothing is queued');
delete from public.notification_rules;

-- 10. Customer preference off (only that event, only that customer)
insert into public.customer_notification_prefs (company_id, customer_id, event, enabled)
values ('a0000000-0000-4000-8000-000000000001', 'e1000000-0000-4000-8000-000000000101', 'operator_details', false);
update public.jobs set dispatch_status = 'dispatched' where id = '10000000-0000-4000-8000-000000000004';
set constraints all immediate; set constraints all deferred;
select is(pg_temp.cnt('10000000-0000-4000-8000-000000000004', 'operator_details'), 0::bigint, 'customer pref off: nothing is queued');
insert into public.job_step_events (company_id, job_id, employee_id, step, at)
values ('a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000004', 'a1000000-0000-4000-8000-000000000001', 'departed_shop', now());
select is(pg_temp.cnt('10000000-0000-4000-8000-000000000004', 'pump_en_route'), 1::bigint, 'other messages still go for that customer');
delete from public.customer_notification_prefs;

-- 11. Cancelled order
select pg_temp.mkjob('10000000-0000-4000-8000-000000000005', 'e1000000-0000-4000-8000-000000000101', 'pending', 'f1000000-0000-4000-8000-000000000001');
update public.jobs set booking_status = 'cancelled', cancelled_at = now() where id = '10000000-0000-4000-8000-000000000005';
update public.jobs set dispatch_status = 'dispatched' where id = '10000000-0000-4000-8000-000000000005';
set constraints all immediate; set constraints all deferred;
insert into public.job_step_events (company_id, job_id, employee_id, step, at)
values ('a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000005', 'a1000000-0000-4000-8000-000000000001', 'departed_shop', now());
select is((select count(*) from public.notification_deliveries where job_id = '10000000-0000-4000-8000-000000000005'), 0::bigint,
  'a cancelled order queues nothing');

-- 12. Row security
set local role authenticated;
set local request.jwt.claims = '{"sub": "c0000000-0000-4000-8000-000000000003", "role": "authenticated"}';
select cmp_ok((select count(*) from public.notification_deliveries), '>', 0::bigint, 'a dispatcher reads the deliveries');
select lives_ok($$insert into public.customer_notification_prefs (company_id, customer_id, event, enabled)
  values ('a0000000-0000-4000-8000-000000000001', 'e1000000-0000-4000-8000-000000000101', 'pump_en_route', false)$$,
  'a dispatcher may set a customer preference');
select throws_ok($$insert into public.notification_rules (company_id, event, enabled)
  values ('a0000000-0000-4000-8000-000000000001', 'pump_en_route', false)$$, '42501', null, 'a dispatcher may not change company rules');
select throws_ok($$insert into public.notification_deliveries (job_id, event, customer_id, to_phone)
  values ('10000000-0000-4000-8000-000000000001', 'pump_en_route', 'e1000000-0000-4000-8000-000000000101', '+12075550101')$$,
  '42501', null, 'nobody writes the outbox directly');
select throws_ok($$select public.claim_notification_deliveries(5)$$, '42501', null, 'claim is refused to signed-in users');
select throws_ok($$select public.finish_notification_delivery(gen_random_uuid(), 'sent', null, null)$$, '42501', null, 'finish is refused to signed-in users');

set local request.jwt.claims = '{"sub": "c0000000-0000-4000-8000-000000000002", "role": "authenticated"}';
select lives_ok($$insert into public.notification_rules (company_id, event, enabled)
  values ('a0000000-0000-4000-8000-000000000001', 'pump_en_route', false)$$, 'an admin may change company rules');

set local request.jwt.claims = '{"sub": "c0000000-0000-4000-8000-000000000005", "role": "authenticated"}';
select is((select count(*) from public.notification_deliveries), 0::bigint, 'an accountant cannot read deliveries');
select throws_ok($$insert into public.customer_notification_prefs (company_id, customer_id, event, enabled)
  values ('a0000000-0000-4000-8000-000000000001', 'e1000000-0000-4000-8000-000000000101', 'order_confirmation', false)$$,
  '42501', null, 'an accountant may not set customer preferences');

set local request.jwt.claims = '{"sub": "d0000000-0000-4000-8000-000000000001", "role": "authenticated"}';
select is((select count(*) from public.notification_deliveries) + (select count(*) from public.notification_rules)
  + (select count(*) from public.customer_notification_prefs), 0::bigint, 'another company sees nothing');
select throws_ok($$insert into public.notification_rules (company_id, event, enabled)
  values ('a0000000-0000-4000-8000-000000000001', 'order_confirmation', false)$$, '42501', null, 'another company cannot write our rules');

-- 13. The sender's doors, as service_role
reset role;
set local role service_role;
select is(jsonb_array_length(public.claim_notification_deliveries(2)), 2, 'claim returns up to the limit');
select is((select count(*) from public.notification_deliveries where status = 'sending'), 2::bigint, 'and marks those rows as sending');
select is((public.claim_notification_deliveries(50) -> 0 ->> 'company_name'), 'Midcoast Concrete Pumping', 'claim carries the company name for the text');
reset role;
-- a failed first try goes back to pending, a failed third try stays failed
select public.finish_notification_delivery((select id from public.notification_deliveries where status = 'sending' and attempts = 1 limit 1), 'failed', null, 'twilio_error');
select is((select count(*) from public.notification_deliveries where status = 'pending' and skip_reason = 'twilio_error' and next_attempt_at > now()),
  1::bigint, 'a failed text is retried later');

select * from finish();
rollback;
