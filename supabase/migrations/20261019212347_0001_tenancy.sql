-- 0001_tenancy: companies, memberships, settings, branches, document sequences, activity log.
-- Company and role are read LIVE from company_memberships (never from JWT claims).

create schema if not exists private;
grant usage on schema private to authenticated;

-- ── Enums ───────────────────────────────────────────────────────
create type public.membership_role as enum
  ('owner', 'admin', 'dispatcher', 'office', 'operator', 'mechanic', 'accountant', 'read_only');
create type public.membership_status as enum ('invited', 'active', 'suspended');
create type public.customer_status as enum ('lead', 'active', 'inactive', 'blocked');
create type public.doc_type as enum ('job', 'ticket', 'invoice', 'work_order');

-- ── Tables ──────────────────────────────────────────────────────
create table public.companies (
  id uuid primary key default gen_random_uuid(),
  legal_name text not null,
  display_name text not null,
  slug text not null unique,
  timezone text not null,
  currency char(3) not null default 'USD',
  phone text,
  email text,
  website text,
  address_line_1 text,
  city text,
  state text,
  postal_code text,
  country_code char(2) not null default 'US',
  logo_path text,
  address_line_2 text,
  logo_text text,
  tax_id_last4 text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.branches (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id),
  name text not null,
  code text not null,
  address_line_1 text,
  city text,
  state text,
  postal_code text,
  latitude numeric(10, 7),
  longitude numeric(10, 7),
  phone text,
  is_hq boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, code)
);

create table public.app_users (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  phone text,
  avatar_path text,
  last_active_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.company_memberships (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id),
  user_id uuid not null references public.app_users (id),
  role public.membership_role not null,
  status public.membership_status not null default 'invited',
  invited_by uuid references public.app_users (id),
  joined_at timestamptz,
  invited_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index company_memberships_company_user_uidx on public.company_memberships (company_id, user_id);
create index company_memberships_user_status_idx on public.company_memberships (user_id, status);

create table public.company_settings (
  company_id uuid primary key references public.companies (id),
  default_job_minutes integer not null default 240,
  default_minimum_hours numeric(6, 2) not null default 4.00,
  default_tax_rate numeric(7, 4) not null default 0.0550,
  invoice_due_days integer not null default 30,
  remit_to text,
  require_ticket_signature boolean not null default false,
  default_cancellation_fee numeric(12, 2),
  require_operator_ticket_approval boolean not null default false,
  use_address_on_invoices boolean not null default false,
  billing_email text,
  accepted_payment_methods text,
  updated_at timestamptz not null default now()
);

create table public.document_sequences (
  company_id uuid not null references public.companies (id),
  doc_type public.doc_type not null,
  prefix text not null,
  next_value bigint not null,
  primary key (company_id, doc_type)
);

-- Not partitioned in V1 (architecture 6.7: partition after ~10M rows). Order by created_at.
create table public.activity_log (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id),
  actor_id uuid references public.app_users (id),
  entity_type text not null,
  entity_id uuid not null,
  action text not null,
  changes jsonb,
  summary text,
  created_at timestamptz not null default now()
);
create index activity_log_company_created_idx on public.activity_log (company_id, created_at);
create index activity_log_company_entity_idx on public.activity_log (company_id, entity_type, entity_id, created_at);
create index activity_log_company_actor_idx on public.activity_log (company_id, actor_id, created_at);

create index branches_company_idx on public.branches (company_id);

-- ── Helper functions (private schema) ───────────────────────────
-- The caller's active company (architecture 5.2).
create function private.company_id() returns uuid
language sql stable security definer set search_path = '' as $$
  select m.company_id
  from public.company_memberships m
  where m.user_id = auth.uid()
    and m.status = 'active'
  order by (m.company_id = nullif(auth.jwt() -> 'app_metadata' ->> 'active_company_id', '')::uuid) desc nulls last,
           m.joined_at
  limit 1
$$;

create function private.has_role(roles public.membership_role[]) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.company_memberships m
    where m.user_id = auth.uid()
      and m.status = 'active'
      and m.company_id = private.company_id()
      and m.role = any (roles)
  )
$$;

create function private.set_updated_at() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  new.updated_at = pg_catalog.now();
  return new;
end
$$;

create function private.is_valid_timezone(tz text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from pg_catalog.pg_timezone_names where name = tz)
$$;

create function private.check_timezone() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if not private.is_valid_timezone(new.timezone) then
    raise exception 'Invalid timezone: %', new.timezone;
  end if;
  return new;
end
$$;

-- Membership guard: no self role/status change, only an owner grants or touches owner,
-- the last active owner can't be removed or downgraded.
create function private.guard_membership() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  caller uuid := auth.uid();
begin
  if tg_op = 'INSERT' then
    if caller is not null and new.role = 'owner' and not private.has_role('{owner}') then
      raise exception 'Only an owner can grant the owner role';
    end if;
    return new;
  end if;

  if caller is not null then
    if old.user_id = caller and (new.role <> old.role or new.status <> old.status) then
      raise exception 'You cannot change your own role or status';
    end if;
    if (new.role = 'owner' and old.role <> 'owner' or old.role = 'owner' and new.role <> 'owner'
        or old.role = 'owner' and new.status <> old.status)
       and not private.has_role('{owner}') then
      raise exception 'Only an owner can grant or change the owner role';
    end if;
  end if;

  if old.role = 'owner' and old.status = 'active'
     and (new.role <> 'owner' or new.status <> 'active')
     and not exists (
       select 1 from public.company_memberships m
       where m.company_id = old.company_id and m.id <> old.id
         and m.role = 'owner' and m.status = 'active'
     ) then
    raise exception 'The last active owner cannot be removed or downgraded';
  end if;
  return new;
end
$$;

-- Generic audit trigger (attached to tables from Step 1 on).
create function private.log_activity() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  new_j jsonb := pg_catalog.to_jsonb(new);
  old_j jsonb := case when tg_op = 'UPDATE' then pg_catalog.to_jsonb(old) end;
  changes jsonb := '{}'::jsonb;
  k text;
  v jsonb;
  act text;
  label text;
begin
  for k, v in select * from pg_catalog.jsonb_each(new_j) loop
    continue when k in ('updated_at', 'version');
    if tg_op = 'INSERT' then
      if v <> 'null'::jsonb then
        changes := changes || pg_catalog.jsonb_build_object(k, pg_catalog.jsonb_build_array(null, v));
      end if;
    elsif v is distinct from old_j -> k then
      changes := changes || pg_catalog.jsonb_build_object(k, pg_catalog.jsonb_build_array(old_j -> k, v));
    end if;
  end loop;

  if tg_op = 'UPDATE' and changes = '{}'::jsonb then
    return new;
  end if;

  act := case
    when tg_op = 'INSERT' then 'created'
    when old_j ->> 'is_active' = 'true' and new_j ->> 'is_active' = 'false' then 'archived'
    else 'updated'
  end;

  label := coalesce(
    new_j ->> 'business_name', new_j ->> 'display_name', new_j ->> 'full_name',
    new_j ->> 'name', new_j ->> 'order_number', new_j ->> 'id');

  insert into public.activity_log (company_id, actor_id, entity_type, entity_id, action, changes, summary)
  values (
    (new_j ->> 'company_id')::uuid, auth.uid(), tg_table_name, (new_j ->> 'id')::uuid, act, changes,
    pg_catalog.format('%s %s "%s"', pg_catalog.initcap(act), pg_catalog.replace(tg_table_name, '_', ' '), label)
  );
  return new;
end
$$;

-- New auth user -> profile row.
create function private.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.app_users (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name')
  on conflict (id) do nothing;
  return new;
end
$$;

-- Defaults need company_id(), which needs company_memberships, hence set afterwards.
alter table public.branches alter column company_id set default private.company_id();
alter table public.company_memberships alter column company_id set default private.company_id();

-- Lock down every function: only company_id() and has_role() are callable by the API role.
revoke execute on function
  private.company_id(), private.has_role(public.membership_role[]), private.set_updated_at(),
  private.is_valid_timezone(text), private.check_timezone(), private.guard_membership(),
  private.log_activity(), private.handle_new_user()
  from public, anon, authenticated;
grant execute on function private.company_id(), private.has_role(public.membership_role[]) to authenticated;

-- ── Triggers ────────────────────────────────────────────────────
create trigger on_auth_user_created after insert on auth.users
  for each row execute function private.handle_new_user();

create trigger companies_updated_at before update on public.companies
  for each row execute function private.set_updated_at();
create trigger branches_updated_at before update on public.branches
  for each row execute function private.set_updated_at();
create trigger app_users_updated_at before update on public.app_users
  for each row execute function private.set_updated_at();
create trigger company_memberships_updated_at before update on public.company_memberships
  for each row execute function private.set_updated_at();
create trigger company_settings_updated_at before update on public.company_settings
  for each row execute function private.set_updated_at();

create trigger companies_check_timezone before insert or update of timezone on public.companies
  for each row execute function private.check_timezone();
create trigger company_memberships_guard before insert or update on public.company_memberships
  for each row execute function private.guard_membership();

-- ── Row level security + grants ─────────────────────────────────
alter table public.companies enable row level security;
alter table public.branches enable row level security;
alter table public.app_users enable row level security;
alter table public.company_memberships enable row level security;
alter table public.company_settings enable row level security;
alter table public.document_sequences enable row level security;
alter table public.activity_log enable row level security;

revoke all on public.companies, public.branches, public.app_users, public.company_memberships,
  public.company_settings, public.document_sequences, public.activity_log from anon;
revoke all on public.companies, public.branches, public.app_users, public.company_memberships,
  public.company_settings, public.document_sequences, public.activity_log from authenticated;

-- companies
grant select on public.companies to authenticated;
grant update (legal_name, display_name, timezone, phone, email, website, address_line_1, address_line_2,
  city, state, postal_code, logo_path, logo_text, tax_id_last4) on public.companies to authenticated;
create policy companies_read on public.companies for select to authenticated
  using (id = (select private.company_id()));
create policy companies_update on public.companies for update to authenticated
  using (id = (select private.company_id()))
  with check (id = (select private.company_id()) and (select private.has_role('{owner,admin}')));

-- company_settings
grant select on public.company_settings to authenticated;
grant update (default_job_minutes, default_minimum_hours, default_tax_rate, invoice_due_days, remit_to,
  require_ticket_signature, default_cancellation_fee, require_operator_ticket_approval,
  use_address_on_invoices, billing_email, accepted_payment_methods) on public.company_settings to authenticated;
create policy company_settings_read on public.company_settings for select to authenticated
  using (company_id = (select private.company_id()));
create policy company_settings_update on public.company_settings for update to authenticated
  using (company_id = (select private.company_id()))
  with check (company_id = (select private.company_id()) and (select private.has_role('{owner,admin}')));

-- branches (company_id comes from the column default, never from the client)
grant select on public.branches to authenticated;
grant insert (name, code, address_line_1, city, state, postal_code, latitude, longitude, phone, is_hq, is_active)
  on public.branches to authenticated;
grant update (name, code, address_line_1, city, state, postal_code, latitude, longitude, phone, is_hq, is_active)
  on public.branches to authenticated;
create policy branches_read on public.branches for select to authenticated
  using (company_id = (select private.company_id()));
create policy branches_insert on public.branches for insert to authenticated
  with check (company_id = (select private.company_id()) and (select private.has_role('{owner,admin}')));
create policy branches_update on public.branches for update to authenticated
  using (company_id = (select private.company_id()))
  with check (company_id = (select private.company_id()) and (select private.has_role('{owner,admin}')));

-- app_users: yourself, plus people who share your company
grant select on public.app_users to authenticated;
grant update (full_name, phone, avatar_path) on public.app_users to authenticated;
create policy app_users_read on public.app_users for select to authenticated
  using (
    id = (select auth.uid())
    or id in (
      select m.user_id from public.company_memberships m
      where m.company_id = (select private.company_id())
    )
  );
create policy app_users_update on public.app_users for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- company_memberships
grant select on public.company_memberships to authenticated;
grant insert (user_id, role, status, invited_by, joined_at, invited_at) on public.company_memberships to authenticated;
grant update (role, status, joined_at, invited_at) on public.company_memberships to authenticated;
create policy company_memberships_read on public.company_memberships for select to authenticated
  using (company_id = (select private.company_id()));
create policy company_memberships_insert on public.company_memberships for insert to authenticated
  with check (company_id = (select private.company_id()) and (select private.has_role('{owner,admin}')));
create policy company_memberships_update on public.company_memberships for update to authenticated
  using (company_id = (select private.company_id()))
  with check (company_id = (select private.company_id()) and (select private.has_role('{owner,admin}')));

-- document_sequences: no API access at all (used by a definer function from Step 3)

-- activity_log: read only; only the trigger writes
grant select on public.activity_log to authenticated;
create policy activity_log_read on public.activity_log for select to authenticated
  using (company_id = (select private.company_id()));
