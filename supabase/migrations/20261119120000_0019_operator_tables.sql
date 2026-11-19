-- 0019_operator_tables: what the operator phone app needs to store.
--   * who may sign up by phone (before_user_created hook, phone sign-ups only) and phone digits helper
--   * step taps (job_step_events), work tickets (+ the extras they use), the extras catalogue
--   * seen_at and changed_at on an assignment, a terms link in company settings
--   * operators get NO direct table access (restrictive policies); they use the functions in 0020
--   * private storage bucket `signatures`
-- Every new table carries company_id and composite foreign keys, so a row can never point at another
-- company's job or employee. Nothing here is ever hard-deleted (foreign keys are RESTRICT).

-- ── Types ───────────────────────────────────────────────────────
create type public.job_step as enum ('arrived_shop', 'departed_shop', 'arrived_site', 'departed_site');
create type public.work_ticket_status as enum ('draft', 'submitted');

-- ── Small additions to existing tables ──────────────────────────
-- seen_at: when the operator last opened the job. changed_at: when dispatch last changed something the
-- operator cares about (time, address, notes). "Changed since seen" = changed_at is later than seen_at.
alter table public.job_employee_assignments add column seen_at timestamptz;
alter table public.job_employee_assignments add column changed_at timestamptz;
create index job_employee_employee_job_idx on public.job_employee_assignments (company_id, employee_id, job_id);

create function private.touch_assignment_changed_at() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if (new.scheduled_start, new.arrive_by, new.timezone, new.site_label, new.job_site_id, new.site_instructions)
     is distinct from
     (old.scheduled_start, old.arrive_by, old.timezone, old.site_label, old.job_site_id, old.site_instructions) then
    update public.job_employee_assignments set changed_at = clock_timestamp()
     where company_id = new.company_id and job_id = new.id and released_at is null;
  end if;
  return new;
end
$$;
create trigger jobs_touch_assignment_changed_at after update on public.jobs
  for each row execute function private.touch_assignment_changed_at();

-- An operator's own taps (field status, acknowledge, ticket) must not bump jobs.version, or a dispatcher who
-- has the order open would get "order changed" on save. The 0020 functions set pumpdesk.keep_version = on.
create function private.bump_job_version() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if pg_catalog.current_setting('pumpdesk.keep_version', true) = 'on' then
    return new;
  end if;
  new.version = old.version + 1;
  return new;
end
$$;
drop trigger jobs_version on public.jobs;
create trigger jobs_version before update on public.jobs
  for each row execute function private.bump_job_version();

-- Link shown on the ticket the customer signs.
alter table public.company_settings add column terms_url text check (terms_url is null or terms_url ~ '^https?://');
grant update (terms_url) on public.company_settings to authenticated;

-- One login per employee per company (the login link is written only by link_operator_login).
create unique index employees_user_company_uidx on public.employees (user_id, company_id) where user_id is not null;
create index employees_operator_phone_idx on public.employees (phone) where is_operator and phone is not null;

-- ── Step taps ───────────────────────────────────────────────────
-- One live row per job and step. Undo keeps the row and sets undone_at (audit); recording again adds a new row.
create table public.job_step_events (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) default private.company_id(),
  job_id uuid not null,
  employee_id uuid not null,
  step public.job_step not null,
  at timestamptz not null,
  recorded_at timestamptz not null default now(),
  edited_at timestamptz,
  undone_at timestamptz,
  unique (company_id, id),
  foreign key (company_id, job_id) references public.jobs (company_id, id) on delete restrict,
  foreign key (company_id, employee_id) references public.employees (company_id, id) on delete restrict
);
create unique index job_step_events_live_uidx on public.job_step_events (job_id, step) where undone_at is null;
create index job_step_events_job_idx on public.job_step_events (company_id, job_id, at);
create index job_step_events_employee_idx on public.job_step_events (company_id, employee_id, at);

-- ── Extras catalogue (Off-site washout, Primer bag, ...) ────────
create table public.ticket_extras (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) default private.company_id(),
  code text not null check (code ~ '^[a-z][a-z0-9_]{1,39}$'),
  label text not null check (btrim(label) <> '' and char_length(label) <= 80),
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, id),
  unique (company_id, code)
);

create function private.seed_ticket_extras(p_company uuid) returns void
language sql security definer set search_path = '' as $$
  insert into public.ticket_extras (company_id, code, label, sort_order)
  values (p_company, 'offsite_washout', 'Off-site washout', 10),
         (p_company, 'primer_bag', 'Primer bag', 20),
         (p_company, 'extra_operator', 'Extra operator', 30)
  on conflict (company_id, code) do nothing
$$;

create function private.companies_seed_ticket_extras() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  perform private.seed_ticket_extras(new.id);
  return new;
end
$$;
create trigger companies_seed_ticket_extras after insert on public.companies
  for each row execute function private.companies_seed_ticket_extras();

select private.seed_ticket_extras(id) from public.companies;

-- ── Work tickets ────────────────────────────────────────────────
create table public.work_tickets (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) default private.company_id(),
  job_id uuid not null,
  employee_id uuid not null, -- the operator who started the ticket
  status public.work_ticket_status not null default 'draft',
  arrived_on_site_at timestamptz,
  started_pour_at timestamptz,
  finished_pour_at timestamptz,
  departed_site_at timestamptz,
  yards_pumped numeric(10, 2) check (yards_pumped is null or (yards_pumped >= 0 and yards_pumped <= 1000)),
  hose_3in_ft numeric(8, 2) check (hose_3in_ft is null or (hose_3in_ft >= 0 and hose_3in_ft <= 2000)),
  hose_4in_ft numeric(8, 2) check (hose_4in_ft is null or (hose_4in_ft >= 0 and hose_4in_ft <= 2000)),
  comments text not null default '' check (char_length(comments) <= 5000),
  signer_name text check (signer_name is null or (btrim(signer_name) <> '' and char_length(signer_name) <= 120)),
  signature_path text,
  signed_at timestamptz,
  submitted_at timestamptz,
  submitted_by uuid references public.app_users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, id),
  unique (job_id),
  foreign key (company_id, job_id) references public.jobs (company_id, id) on delete restrict,
  foreign key (company_id, employee_id) references public.employees (company_id, id) on delete restrict,
  -- the signature file always lives at <company>/<job>.png
  check (signature_path is null or signature_path = company_id::text || '/' || job_id::text || '.png'),
  check (status = 'draft' or submitted_at is not null)
);
create index work_tickets_company_status_idx on public.work_tickets (company_id, status, updated_at desc);
create index work_tickets_employee_idx on public.work_tickets (company_id, employee_id);

-- Which extras a ticket used. Both ends are composite tenant foreign keys.
create table public.work_ticket_extras (
  company_id uuid not null references public.companies (id) default private.company_id(),
  ticket_id uuid not null,
  extra_code text not null,
  primary key (ticket_id, extra_code),
  foreign key (company_id, ticket_id) references public.work_tickets (company_id, id) on delete cascade,
  foreign key (company_id, extra_code) references public.ticket_extras (company_id, code) on delete restrict
);
create index work_ticket_extras_company_ticket_idx on public.work_ticket_extras (company_id, ticket_id);

create trigger ticket_extras_updated_at before update on public.ticket_extras
  for each row execute function private.set_updated_at();
create trigger work_tickets_updated_at before update on public.work_tickets
  for each row execute function private.set_updated_at();

revoke execute on function private.touch_assignment_changed_at(), private.bump_job_version(),
  private.seed_ticket_extras(uuid), private.companies_seed_ticket_extras() from public, anon, authenticated;

-- ── RLS ─────────────────────────────────────────────────────────
alter table public.job_step_events enable row level security;
alter table public.ticket_extras enable row level security;
alter table public.work_tickets enable row level security;
alter table public.work_ticket_extras enable row level security;

revoke all on public.job_step_events, public.ticket_extras, public.work_tickets, public.work_ticket_extras
  from anon, authenticated;
grant select on public.job_step_events, public.ticket_extras, public.work_tickets, public.work_ticket_extras
  to authenticated;
-- Office staff read steps and tickets. Writes to steps and tickets go through the operator functions only.
grant insert (code, label, sort_order, is_active) on public.ticket_extras to authenticated;
grant update (code, label, sort_order, is_active) on public.ticket_extras to authenticated;

create policy job_step_events_read on public.job_step_events for select to authenticated
  using (company_id = (select private.company_id()));
create policy work_tickets_read on public.work_tickets for select to authenticated
  using (company_id = (select private.company_id()));
create policy work_ticket_extras_read on public.work_ticket_extras for select to authenticated
  using (company_id = (select private.company_id()));
create policy ticket_extras_read on public.ticket_extras for select to authenticated
  using (company_id = (select private.company_id()));
create policy ticket_extras_insert on public.ticket_extras for insert to authenticated
  with check (company_id = (select private.company_id())
    and (select private.has_role('{owner,admin,dispatcher}')));
create policy ticket_extras_update on public.ticket_extras for update to authenticated
  using (company_id = (select private.company_id()))
  with check (company_id = (select private.company_id())
    and (select private.has_role('{owner,admin,dispatcher}')));

-- Operators never read or write business tables directly. A restrictive policy is ANDed with every other
-- policy, so even though an operator is an active member of the company, these tables stay closed to them.
do $$
declare
  t text;
begin
  foreach t in array array[
    'branches', 'company_settings', 'activity_log', 'customers', 'contacts', 'customer_contact_links',
    'job_sites', 'employees', 'equipment', 'jobs', 'job_contacts', 'job_equipment_assignments',
    'job_employee_assignments', 'job_status_history', 'concrete_suppliers', 'yards', 'sms_messages',
    'call_logs', 'job_step_events', 'ticket_extras', 'work_tickets', 'work_ticket_extras']
  loop
    execute format(
      'create policy operator_no_direct_access on public.%I as restrictive for all to authenticated '
      'using (not (select private.has_role(''{operator}'')))', t);
  end loop;
end
$$;

-- ── Phone sign-up: operators only ───────────────────────────────
-- Phone sign-up is open in GoTrue (a phone user is created when the code is sent), so this hook is the gate
-- for phones: a phone user is created only when the number belongs to an active operator.
-- Users without a phone (office staff added by an admin with an email) pass through untouched: public email
-- sign-up is switched off in GoTrue itself ([auth.email] enable_signup = false), so the only way an email
-- user is created is an admin adding them. Wired up in config.toml ([auth.hook.before_user_created]).
create function private.phone_digits(p text) returns text
language sql immutable set search_path = '' as $$
  select regexp_replace(coalesce(p, ''), '\D', '', 'g')
$$;

create function private.hook_before_user_created(event jsonb) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  digits text := private.phone_digits(event -> 'user' ->> 'phone');
begin
  -- not a phone sign-up (e.g. an admin adding an office user by email): not this hook's business
  if digits = '' then
    return '{}'::jsonb;
  end if;
  if exists (
       select 1 from public.employees e
        where e.is_operator and e.status = 'active' and e.phone = '+' || digits) then
    return '{}'::jsonb;
  end if;
  return jsonb_build_object('error', jsonb_build_object('http_code', 403, 'message', 'phone_not_found'));
end
$$;

revoke execute on function private.phone_digits(text), private.hook_before_user_created(jsonb)
  from public, anon, authenticated;
grant usage on schema private to supabase_auth_admin;
grant execute on function private.hook_before_user_created(jsonb) to supabase_auth_admin;

-- ── Signature images ────────────────────────────────────────────
-- Private bucket, PNG only, 1 MB. Path: <company_id>/<job_id>.png.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('signatures', 'signatures', false, 1048576, array['image/png'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- An operator may write (and read back) only <their company>/<a job they are on>.png, and not after the
-- ticket is submitted. Lives in public because the storage policy runs as the caller (like company_id()).
create function public.operator_can_use_signature(p_name text, p_write boolean) returns boolean
language plpgsql stable security definer set search_path = '' as $$
declare
  m text[] := regexp_match(coalesce(p_name, ''),
    '^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\.png$');
  emp public.employees;
begin
  if m is null then
    return false;
  end if;
  select e.* into emp
    from public.employees e
    join public.company_memberships cm
      on cm.company_id = e.company_id and cm.user_id = e.user_id and cm.status = 'active'
   where e.user_id = auth.uid() and e.is_operator and e.status = 'active' and e.company_id = m[1]::uuid;
  if emp.id is null then
    return false;
  end if;
  if not exists (
       select 1 from public.job_employee_assignments a
         join public.jobs j on j.company_id = a.company_id and j.id = a.job_id
        where a.company_id = emp.company_id and a.employee_id = emp.id and a.job_id = m[2]::uuid
          and a.released_at is null and j.booking_status <> 'cancelled') then
    return false;
  end if;
  if p_write and exists (
       select 1 from public.work_tickets t
        where t.company_id = emp.company_id and t.job_id = m[2]::uuid and t.status = 'submitted') then
    return false;
  end if;
  return true;
end
$$;
revoke execute on function public.operator_can_use_signature(text, boolean) from public, anon;
grant execute on function public.operator_can_use_signature(text, boolean) to authenticated;

create policy signatures_operator_read on storage.objects for select to authenticated
  using (bucket_id = 'signatures' and (select public.operator_can_use_signature(name, false)));
create policy signatures_operator_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'signatures' and (select public.operator_can_use_signature(name, true)));
create policy signatures_operator_update on storage.objects for update to authenticated
  using (bucket_id = 'signatures' and (select public.operator_can_use_signature(name, true)))
  with check (bucket_id = 'signatures' and (select public.operator_can_use_signature(name, true)));
-- Office roles read signatures of their own company.
create policy signatures_office_read on storage.objects for select to authenticated
  using (bucket_id = 'signatures'
    and (storage.foldername(name))[1] = (select private.company_id())::text
    and not (select private.has_role('{operator}')));
