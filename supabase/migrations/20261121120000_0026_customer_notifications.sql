-- 0026_customer_notifications: automatic texts to the customer side of an order.
--   * notification_rules (company level) and customer_notification_prefs (per customer), both with defaults
--   * notification_deliveries: the outbox and the log of automatic texts (written only by the functions below)
--   * triggers that queue a text when an order is confirmed, dispatched, the pump leaves the shop, or the
--     work ticket is submitted. A queueing error never breaks the action that caused it.
--   * claim_/finish_notification_delivery: the only way the server-side sender touches the outbox (service_role)
--   * a pg_cron job that calls the sender every minute (URL and secret live in Supabase Vault)
-- Nothing is sent from the database. The Node sender checks everything again before it texts.

-- ── Company rules ───────────────────────────────────────────────
create table public.notification_rules (
  company_id uuid not null references public.companies (id) default private.company_id(),
  event text not null check (event in ('order_confirmation', 'operator_details', 'pump_en_route', 'work_ticket_review', 'pre_work_authorization', 'missing_job_details')),
  enabled boolean not null,
  updated_at timestamptz not null default now(),
  primary key (company_id, event)
);

-- No saved rule = the default: the four automatic messages on, the two not-yet-sent ones off.
create function private.notification_rule_enabled(p_company_id uuid, p_event text) returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce(
    (select r.enabled from public.notification_rules r where r.company_id = p_company_id and r.event = p_event),
    p_event in ('order_confirmation', 'operator_details', 'pump_en_route', 'work_ticket_review'))
$$;

-- ── Customer preferences ────────────────────────────────────────
create table public.customer_notification_prefs (
  company_id uuid not null references public.companies (id) default private.company_id(),
  customer_id uuid not null,
  event text not null check (event in ('order_confirmation', 'operator_details', 'pump_en_route', 'work_ticket_review', 'pre_work_authorization', 'missing_job_details')),
  enabled boolean not null,
  updated_at timestamptz not null default now(),
  primary key (customer_id, event),
  foreign key (company_id, customer_id) references public.customers (company_id, id)
);
create index customer_notification_prefs_company_idx on public.customer_notification_prefs (company_id);

-- ── Outbox ──────────────────────────────────────────────────────
alter table public.sms_messages add column notification_event text
  check (notification_event is null or notification_event in ('order_confirmation', 'operator_details', 'pump_en_route', 'work_ticket_review', 'pre_work_authorization', 'missing_job_details'));

create table public.notification_deliveries (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) default private.company_id(),
  job_id uuid not null,
  event text not null check (event in ('order_confirmation', 'operator_details', 'pump_en_route', 'work_ticket_review', 'pre_work_authorization', 'missing_job_details')),
  contact_id uuid,
  customer_id uuid, -- set when the text goes to the customer's main phone (or when there is no phone at all)
  to_phone text check (to_phone is null or to_phone ~ '^\+[1-9][0-9]{6,14}$'),
  status text not null default 'pending' check (status in ('pending', 'sending', 'sent', 'failed', 'skipped')),
  skip_reason text,
  attempts integer not null default 0,
  next_attempt_at timestamptz not null default now(),
  claimed_at timestamptz,
  sms_message_id uuid references public.sms_messages (id),
  created_at timestamptz not null default now(),
  processed_at timestamptz,
  foreign key (company_id, job_id) references public.jobs (company_id, id),
  foreign key (company_id, contact_id) references public.contacts (company_id, id),
  foreign key (company_id, customer_id) references public.customers (company_id, id),
  check (contact_id is not null or customer_id is not null)
);
-- A message goes once per order, event and recipient, however often the order changes.
create unique index notification_deliveries_once_uidx
  on public.notification_deliveries (job_id, event, (coalesce(contact_id, customer_id)));
create index notification_deliveries_job_idx on public.notification_deliveries (company_id, job_id, created_at);
create index notification_deliveries_due_idx on public.notification_deliveries (next_attempt_at) where status in ('pending', 'sending');

create trigger notification_rules_updated_at before update on public.notification_rules
  for each row execute function private.set_updated_at();
create trigger customer_notification_prefs_updated_at before update on public.customer_notification_prefs
  for each row execute function private.set_updated_at();
-- (No activity-log trigger: log_activity needs a single "id" column, and these tables have composite keys.)

-- ── RLS ─────────────────────────────────────────────────────────
alter table public.notification_rules enable row level security;
alter table public.customer_notification_prefs enable row level security;
alter table public.notification_deliveries enable row level security;

revoke all on public.notification_rules, public.customer_notification_prefs, public.notification_deliveries
  from anon, authenticated;
grant select on public.notification_rules, public.customer_notification_prefs, public.notification_deliveries
  to authenticated;
grant insert (company_id, event, enabled), update (enabled) on public.notification_rules to authenticated;
grant insert (company_id, customer_id, event, enabled), update (enabled) on public.customer_notification_prefs to authenticated;

create policy notification_rules_read on public.notification_rules for select to authenticated
  using (company_id = (select private.company_id()));
create policy notification_rules_insert on public.notification_rules for insert to authenticated
  with check (company_id = (select private.company_id()) and (select private.has_role('{owner,admin}')));
create policy notification_rules_update on public.notification_rules for update to authenticated
  using (company_id = (select private.company_id()) and (select private.has_role('{owner,admin}')))
  with check (company_id = (select private.company_id()) and (select private.has_role('{owner,admin}')));

create policy customer_notification_prefs_read on public.customer_notification_prefs for select to authenticated
  using (company_id = (select private.company_id()));
create policy customer_notification_prefs_insert on public.customer_notification_prefs for insert to authenticated
  with check (company_id = (select private.company_id())
    and (select private.has_role('{owner,admin,dispatcher,office}')));
create policy customer_notification_prefs_update on public.customer_notification_prefs for update to authenticated
  using (company_id = (select private.company_id()) and (select private.has_role('{owner,admin,dispatcher,office}')))
  with check (company_id = (select private.company_id()) and (select private.has_role('{owner,admin,dispatcher,office}')));

create policy notification_deliveries_read on public.notification_deliveries for select to authenticated
  using (company_id = (select private.company_id()) and (select private.has_role('{owner,admin,dispatcher,office}')));

-- ── Queueing ────────────────────────────────────────────────────
create function private.enqueue_customer_notification(p_job_id uuid, p_event text) returns void
language plpgsql security definer set search_path = '' as $$
declare
  j public.jobs;
  customer_phone text;
begin
  select * into j from public.jobs where id = p_job_id;
  if j.id is null or j.booking_status = 'cancelled' then return; end if;
  if not private.notification_rule_enabled(j.company_id, p_event) then return; end if;
  -- A customer with no choice of its own follows the company rule.
  if exists (select 1 from public.customer_notification_prefs p
              where p.customer_id = j.customer_id and p.event = p_event and not p.enabled) then
    return;
  end if;

  insert into public.notification_deliveries (company_id, job_id, event, contact_id, to_phone)
  select j.company_id, j.id, p_event, c.id, c.phone
    from public.job_contacts jc
    join public.contacts c on c.company_id = jc.company_id and c.id = jc.contact_id
   where jc.job_id = j.id and jc.role = 'job_contact' and c.is_active and c.phone is not null
  on conflict do nothing;
  if exists (select 1 from public.notification_deliveries d
              where d.job_id = j.id and d.event = p_event and d.contact_id is not null) then
    return;
  end if;

  -- No job contact with a phone: the customer's main phone, or a recorded skip.
  select cu.phone into customer_phone from public.customers cu where cu.id = j.customer_id;
  if customer_phone is not null then
    insert into public.notification_deliveries (company_id, job_id, event, customer_id, to_phone)
    values (j.company_id, j.id, p_event, j.customer_id, customer_phone)
    on conflict do nothing;
  else
    insert into public.notification_deliveries (company_id, job_id, event, customer_id, status, skip_reason, processed_at)
    values (j.company_id, j.id, p_event, j.customer_id, 'skipped', 'no_phone', now())
    on conflict do nothing;
  end if;
end
$$;

-- Trigger functions. Whatever goes wrong here must never undo the dispatcher's or operator's action.
create function private.notify_on_job_change() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  begin
    if tg_op = 'INSERT' then
      if new.booking_status = 'confirmed' then
        perform private.enqueue_customer_notification(new.id, 'order_confirmation');
      end if;
    else
      if new.booking_status = 'confirmed' and old.booking_status is distinct from 'confirmed' then
        perform private.enqueue_customer_notification(new.id, 'order_confirmation');
      end if;
      if new.dispatch_status = 'dispatched' and old.dispatch_status is distinct from 'dispatched' then
        perform private.enqueue_customer_notification(new.id, 'operator_details');
      end if;
    end if;
  exception when others then
    null;
  end;
  return null;
end
$$;

create function private.notify_on_step_event() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  begin
    if new.step = 'departed_shop' and new.undone_at is null then
      perform private.enqueue_customer_notification(new.job_id, 'pump_en_route');
    end if;
  exception when others then
    null;
  end;
  return null;
end
$$;

create function private.notify_on_work_ticket() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  begin
    if new.status = 'submitted' and (tg_op = 'INSERT' or old.status is distinct from 'submitted') then
      perform private.enqueue_customer_notification(new.job_id, 'work_ticket_review');
    end if;
  exception when others then
    null;
  end;
  return null;
end
$$;

-- Deferred to the end of the transaction: book_job and update_job add the job contacts after the job row,
-- and the text must find them.
create constraint trigger jobs_notify after insert or update of booking_status, dispatch_status on public.jobs
  deferrable initially deferred for each row execute function private.notify_on_job_change();
create trigger job_step_events_notify after insert on public.job_step_events
  for each row execute function private.notify_on_step_event();
create trigger work_tickets_notify after insert or update of status on public.work_tickets
  for each row execute function private.notify_on_work_ticket();

-- ── The sender's two doors (service_role only) ──────────────────
-- Takes due rows (and rows stuck in "sending" for 10+ minutes), marks them "sending" and returns what the
-- sender needs, including the current state so it can check again before texting.
create function public.claim_notification_deliveries(p_limit integer default 25) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  result jsonb;
begin
  -- A row stuck in "sending" that has used up its tries is a failure.
  update public.notification_deliveries
     set status = 'failed', processed_at = now(), skip_reason = 'stuck'
   where status = 'sending' and claimed_at < now() - interval '10 minutes' and attempts >= 3;

  with due as (
    select d.id from public.notification_deliveries d
     where ((d.status = 'pending' and d.next_attempt_at <= now())
         or (d.status = 'sending' and d.claimed_at < now() - interval '10 minutes'))
       and d.attempts < 3
     order by d.next_attempt_at
     limit greatest(coalesce(p_limit, 25), 1)
     for update skip locked
  ), claimed as (
    update public.notification_deliveries d
       set status = 'sending', attempts = d.attempts + 1, claimed_at = now()
      from due where d.id = due.id
    returning d.*
  )
  select coalesce(jsonb_agg(jsonb_build_object(
      'id', c.id,
      'event', c.event,
      'company_id', c.company_id,
      'job_id', c.job_id,
      'contact_id', c.contact_id,
      'customer_id', c.customer_id,
      'to_phone', c.to_phone,
      'attempts', c.attempts,
      'company_name', co.display_name,
      'job_number', j.job_number,
      'booking_status', j.booking_status,
      'dispatch_status', j.dispatch_status,
      'timezone', j.timezone,
      'service_date', j.service_date,
      'scheduled_start', j.scheduled_start,
      'site_label', j.site_label,
      'customer_name', cu.business_name,
      'recipient_name', coalesce(ct.first_name, cu.business_name),
      'current_phone', coalesce(ct.phone, case when c.contact_id is null then cu.phone end),
      'rule_enabled', private.notification_rule_enabled(c.company_id, c.event),
      'pref_enabled', coalesce((select p.enabled from public.customer_notification_prefs p
                                 where p.customer_id = j.customer_id and p.event = c.event), true),
      'operator_name', op.name,
      'operator_phone', op.phone,
      'pump_code', pump.equipment_number,
      'yards_pumped', wt.yards_pumped,
      'pump_hours', case when wt.started_pour_at is not null and wt.finished_pour_at > wt.started_pour_at
                         then round((extract(epoch from wt.finished_pour_at - wt.started_pour_at) / 3600)::numeric, 1) end
    )), '[]'::jsonb)
    into result
    from claimed c
    join public.jobs j on j.company_id = c.company_id and j.id = c.job_id
    join public.companies co on co.id = c.company_id
    join public.customers cu on cu.company_id = j.company_id and cu.id = j.customer_id
    left join public.contacts ct on ct.company_id = c.company_id and ct.id = c.contact_id
    left join lateral (
      select btrim(coalesce(e.preferred_name, e.first_name) || ' ' || e.last_name) as name, e.phone
        from public.job_employee_assignments a
        join public.employees e on e.company_id = a.company_id and e.id = a.employee_id
       where a.job_id = j.id and a.assignment_type = 'primary_operator' and a.released_at is null
       limit 1) op on true
    left join lateral (
      select q.equipment_number
        from public.job_equipment_assignments a
        join public.equipment q on q.company_id = a.company_id and q.id = a.equipment_id
       where a.job_id = j.id and a.released_at is null
       limit 1) pump on true
    left join public.work_tickets wt on wt.job_id = j.id;
  return result;
end
$$;

-- Sets the final state. A failed text goes back to "pending" for another try (5, then 10 minutes later)
-- until it has been tried 3 times.
create function public.finish_notification_delivery(p_id uuid, p_status text, p_sms_message_id uuid default null, p_reason text default null)
returns void
language plpgsql security definer set search_path = '' as $$
begin
  if p_status not in ('sent', 'failed', 'skipped') then
    raise exception 'invalid_status' using errcode = 'P0001';
  end if;
  update public.notification_deliveries d
     set status = case when p_status = 'failed' and d.attempts < 3 then 'pending' else p_status end,
         next_attempt_at = case when p_status = 'failed' and d.attempts < 3
                                then now() + d.attempts * interval '5 minutes' else d.next_attempt_at end,
         sms_message_id = coalesce(p_sms_message_id, d.sms_message_id),
         skip_reason = p_reason,
         processed_at = case when p_status = 'failed' and d.attempts < 3 then null else now() end
   where d.id = p_id and d.status = 'sending';
end
$$;

revoke execute on function
  private.notification_rule_enabled(uuid, text),
  private.enqueue_customer_notification(uuid, text), private.notify_on_job_change(),
  private.notify_on_step_event(), private.notify_on_work_ticket()
  from public, anon, authenticated;
revoke execute on function public.claim_notification_deliveries(integer),
  public.finish_notification_delivery(uuid, text, uuid, text) from public, anon, authenticated;
grant execute on function public.claim_notification_deliveries(integer),
  public.finish_notification_delivery(uuid, text, uuid, text) to service_role;

-- ── Schedule: every minute ──────────────────────────────────────
-- The sender is a Next.js route. Where it lives (URL) and its password are stored in Supabase Vault as
-- `notifications_run_url` and `notifications_run_secret`. Until both exist the job does nothing.
create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

create function private.run_notification_sender() returns void
language plpgsql security definer set search_path = '' as $$
declare
  run_url text;
  run_secret text;
begin
  select s.decrypted_secret into run_url from vault.decrypted_secrets s where s.name = 'notifications_run_url';
  select s.decrypted_secret into run_secret from vault.decrypted_secrets s where s.name = 'notifications_run_secret';
  if coalesce(run_url, '') = '' or coalesce(run_secret, '') = '' then return; end if;
  perform net.http_post(
    url := run_url,
    headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || run_secret),
    body := '{}'::jsonb,
    timeout_milliseconds := 20000);
end
$$;
revoke execute on function private.run_notification_sender() from public, anon, authenticated;

select cron.schedule('customer-notifications-run', '* * * * *', 'select private.run_notification_sender()');
