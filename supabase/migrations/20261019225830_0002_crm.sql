-- 0002_crm: customers, contacts, customer_contact_links, job_sites.

-- ── Shared function updates ─────────────────────────────────────
-- Timezone check now skips NULL (job_sites.timezone null = use the company timezone).
create or replace function private.check_timezone() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.timezone is not null and not private.is_valid_timezone(new.timezone) then
    raise exception 'Invalid timezone: %', new.timezone;
  end if;
  return new;
end
$$;

-- Audit label also understands contacts (first + last name).
create or replace function private.log_activity() returns trigger
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
    new_j ->> 'business_name', new_j ->> 'display_name', new_j ->> 'full_name', new_j ->> 'name',
    nullif(pg_catalog.btrim(pg_catalog.concat_ws(' ', new_j ->> 'first_name', new_j ->> 'last_name')), ''),
    new_j ->> 'address_line_1', new_j ->> 'order_number', new_j ->> 'id');

  insert into public.activity_log (company_id, actor_id, entity_type, entity_id, action, changes, summary)
  values (
    (new_j ->> 'company_id')::uuid, auth.uid(), tg_table_name, (new_j ->> 'id')::uuid, act, changes,
    pg_catalog.format('%s %s "%s"', pg_catalog.initcap(act), pg_catalog.replace(tg_table_name, '_', ' '), label)
  );
  return new;
end
$$;

-- BEFORE UPDATE: +1 on every write (optimistic locking).
create function private.bump_version() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  new.version = old.version + 1;
  return new;
end
$$;

-- BEFORE UPDATE: archived_at follows is_active.
create function private.set_archived_at() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if old.is_active and not new.is_active then
    new.archived_at = pg_catalog.now();
  elsif not old.is_active and new.is_active then
    new.archived_at = null;
  end if;
  return new;
end
$$;

revoke execute on function private.bump_version(), private.set_archived_at() from public, anon, authenticated;

-- ── Tables ──────────────────────────────────────────────────────
create table public.customers (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) default private.company_id(),
  customer_number text,
  business_name text not null,
  legal_name text,
  status public.customer_status not null default 'active',
  tier text,
  phone text check (phone is null or phone ~ '^\+[1-9][0-9]{6,14}$'),
  email text,
  billing_address_line_1 text,
  billing_city text,
  billing_state text,
  billing_postal_code text,
  payment_terms_days integer,
  tax_exempt boolean not null default false,
  credit_limit numeric(12, 2),
  credit_hold boolean not null default false,
  requires_po boolean not null default false,
  dispatch_note text,
  version integer not null default 1,
  customer_type text,
  website text,
  billing_address_line_2 text,
  billing_country_code char(2) not null default 'US',
  tax_exempt_number text,
  internal_notes text,
  is_active boolean not null default true,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, id)
);
create unique index customers_company_number_uidx on public.customers (company_id, customer_number);
create index customers_company_name_idx on public.customers (company_id, business_name);

create table public.contacts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) default private.company_id(),
  first_name text not null,
  last_name text,
  job_title text,
  email text,
  phone text check (phone is null or phone ~ '^\+[1-9][0-9]{6,14}$'),
  phone_type text,
  notes text,
  is_active boolean not null default true,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, id)
);

create table public.customer_contact_links (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) default private.company_id(),
  customer_id uuid not null,
  contact_id uuid not null,
  roles text[] not null default '{}',
  is_primary boolean not null default false,
  receives_job_confirmations boolean not null default false,
  receives_invoices boolean not null default false,
  created_at timestamptz not null default now(),
  foreign key (company_id, customer_id) references public.customers (company_id, id),
  foreign key (company_id, contact_id) references public.contacts (company_id, id),
  unique (customer_id, contact_id)
);
create index customer_contact_links_customer_idx on public.customer_contact_links (company_id, customer_id);
create index customer_contact_links_contact_idx on public.customer_contact_links (company_id, contact_id);

create table public.job_sites (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) default private.company_id(),
  customer_id uuid,
  name text,
  address_line_1 text not null,
  city text not null,
  state text not null,
  postal_code text,
  latitude numeric(10, 7),
  longitude numeric(10, 7),
  timezone text,
  gate_code text,
  access_notes text,
  washout_notes text,
  hazard_notes text,
  address_line_2 text,
  country_code char(2) not null default 'US',
  setup_notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (company_id, customer_id) references public.customers (company_id, id)
);
create index job_sites_customer_idx on public.job_sites (company_id, customer_id);

-- ── Triggers ────────────────────────────────────────────────────
create trigger customers_updated_at before update on public.customers
  for each row execute function private.set_updated_at();
create trigger contacts_updated_at before update on public.contacts
  for each row execute function private.set_updated_at();
create trigger job_sites_updated_at before update on public.job_sites
  for each row execute function private.set_updated_at();

create trigger customers_version before update on public.customers
  for each row execute function private.bump_version();

create trigger customers_archived_at before update on public.customers
  for each row execute function private.set_archived_at();
create trigger contacts_archived_at before update on public.contacts
  for each row execute function private.set_archived_at();

create trigger job_sites_check_timezone before insert or update of timezone on public.job_sites
  for each row execute function private.check_timezone();

create trigger customers_log_activity after insert or update on public.customers
  for each row execute function private.log_activity();
create trigger contacts_log_activity after insert or update on public.contacts
  for each row execute function private.log_activity();
create trigger customer_contact_links_log_activity after insert or update on public.customer_contact_links
  for each row execute function private.log_activity();
create trigger job_sites_log_activity after insert or update on public.job_sites
  for each row execute function private.log_activity();

-- ── RLS + grants (role matrix 5.4, "CRM edit") ──────────────────
alter table public.customers enable row level security;
alter table public.contacts enable row level security;
alter table public.customer_contact_links enable row level security;
alter table public.job_sites enable row level security;

revoke all on public.customers, public.contacts, public.customer_contact_links, public.job_sites from anon;
revoke all on public.customers, public.contacts, public.customer_contact_links, public.job_sites from authenticated;
grant select on public.customers, public.contacts, public.customer_contact_links, public.job_sites to authenticated;

-- customers: no company_id, version, created_at or archived_at in any grant
grant insert (customer_number, business_name, legal_name, status, tier, phone, email,
  billing_address_line_1, billing_address_line_2, billing_city, billing_state, billing_postal_code,
  billing_country_code, payment_terms_days, tax_exempt, tax_exempt_number, credit_limit, credit_hold,
  requires_po, dispatch_note, customer_type, website, internal_notes, is_active)
  on public.customers to authenticated;
grant update (customer_number, business_name, legal_name, status, tier, phone, email,
  billing_address_line_1, billing_address_line_2, billing_city, billing_state, billing_postal_code,
  billing_country_code, payment_terms_days, tax_exempt, tax_exempt_number, credit_limit, credit_hold,
  requires_po, dispatch_note, customer_type, website, internal_notes, is_active)
  on public.customers to authenticated;

grant insert (first_name, last_name, job_title, email, phone, phone_type, notes, is_active)
  on public.contacts to authenticated;
grant update (first_name, last_name, job_title, email, phone, phone_type, notes, is_active)
  on public.contacts to authenticated;

-- links are join rows: unlinking is allowed (not deleting data)
grant insert (customer_id, contact_id, roles, is_primary, receives_job_confirmations, receives_invoices)
  on public.customer_contact_links to authenticated;
grant update (roles, is_primary, receives_job_confirmations, receives_invoices)
  on public.customer_contact_links to authenticated;
grant delete on public.customer_contact_links to authenticated;

grant insert (customer_id, name, address_line_1, address_line_2, city, state, postal_code, country_code,
  latitude, longitude, timezone, gate_code, access_notes, washout_notes, hazard_notes, setup_notes, is_active)
  on public.job_sites to authenticated;
grant update (customer_id, name, address_line_1, address_line_2, city, state, postal_code, country_code,
  latitude, longitude, timezone, gate_code, access_notes, washout_notes, hazard_notes, setup_notes, is_active)
  on public.job_sites to authenticated;

-- policies: read = any active member, write = owner/admin/dispatcher/office/accountant
create policy customers_read on public.customers for select to authenticated
  using (company_id = (select private.company_id()));
create policy customers_insert on public.customers for insert to authenticated
  with check (company_id = (select private.company_id())
    and (select private.has_role('{owner,admin,dispatcher,office,accountant}')));
create policy customers_update on public.customers for update to authenticated
  using (company_id = (select private.company_id()))
  with check (company_id = (select private.company_id())
    and (select private.has_role('{owner,admin,dispatcher,office,accountant}')));

create policy contacts_read on public.contacts for select to authenticated
  using (company_id = (select private.company_id()));
create policy contacts_insert on public.contacts for insert to authenticated
  with check (company_id = (select private.company_id())
    and (select private.has_role('{owner,admin,dispatcher,office,accountant}')));
create policy contacts_update on public.contacts for update to authenticated
  using (company_id = (select private.company_id()))
  with check (company_id = (select private.company_id())
    and (select private.has_role('{owner,admin,dispatcher,office,accountant}')));

create policy customer_contact_links_read on public.customer_contact_links for select to authenticated
  using (company_id = (select private.company_id()));
create policy customer_contact_links_insert on public.customer_contact_links for insert to authenticated
  with check (company_id = (select private.company_id())
    and (select private.has_role('{owner,admin,dispatcher,office,accountant}')));
create policy customer_contact_links_update on public.customer_contact_links for update to authenticated
  using (company_id = (select private.company_id()))
  with check (company_id = (select private.company_id())
    and (select private.has_role('{owner,admin,dispatcher,office,accountant}')));
create policy customer_contact_links_delete on public.customer_contact_links for delete to authenticated
  using (company_id = (select private.company_id())
    and (select private.has_role('{owner,admin,dispatcher,office,accountant}')));

create policy job_sites_read on public.job_sites for select to authenticated
  using (company_id = (select private.company_id()));
create policy job_sites_insert on public.job_sites for insert to authenticated
  with check (company_id = (select private.company_id())
    and (select private.has_role('{owner,admin,dispatcher,office,accountant}')));
create policy job_sites_update on public.job_sites for update to authenticated
  using (company_id = (select private.company_id()))
  with check (company_id = (select private.company_id())
    and (select private.has_role('{owner,admin,dispatcher,office,accountant}')));
