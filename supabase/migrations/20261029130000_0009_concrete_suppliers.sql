-- 0009_concrete_suppliers: the ready-mix plants a company orders from (Settings > Lists).
-- Orders keep the supplier name as text (jobs.supplier_name), so renaming or deleting a supplier
-- never rewrites past orders.

create table public.concrete_suppliers (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) default private.company_id(),
  name text not null check (btrim(name) <> '' and char_length(name) <= 120),
  phone text check (phone is null or phone ~ '^\+[1-9][0-9]{6,14}$'),
  dispatch_phone text check (dispatch_phone is null or dispatch_phone ~ '^\+[1-9][0-9]{6,14}$'),
  email text,
  address_line_1 text,
  city text,
  state text,
  postal_code text,
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, id)
);
create unique index concrete_suppliers_company_name_uidx
  on public.concrete_suppliers (company_id, lower(name)) where is_active;

create trigger concrete_suppliers_updated_at before update on public.concrete_suppliers
  for each row execute function private.set_updated_at();
create trigger concrete_suppliers_log_activity after insert or update on public.concrete_suppliers
  for each row execute function private.log_activity();

alter table public.concrete_suppliers enable row level security;
revoke all on public.concrete_suppliers from anon, authenticated;
grant select on public.concrete_suppliers to authenticated;
grant insert (name, phone, dispatch_phone, email, is_active) on public.concrete_suppliers to authenticated;
grant update (name, phone, dispatch_phone, email, is_active) on public.concrete_suppliers to authenticated;

-- Read: any active member. Write: whoever books orders, since a new supplier can be added from the order form.
create policy concrete_suppliers_read on public.concrete_suppliers for select to authenticated
  using (company_id = (select private.company_id()));
create policy concrete_suppliers_insert on public.concrete_suppliers for insert to authenticated
  with check (company_id = (select private.company_id())
    and (select private.has_role('{owner,admin,dispatcher,office}')));
create policy concrete_suppliers_update on public.concrete_suppliers for update to authenticated
  using (company_id = (select private.company_id()))
  with check (company_id = (select private.company_id())
    and (select private.has_role('{owner,admin,dispatcher,office}')));
