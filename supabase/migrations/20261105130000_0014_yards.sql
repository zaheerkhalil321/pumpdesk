-- 0014_yards: the places operators start their day from (Settings > Branches > Yards), e.g. the shop
-- or an operator's home. An operator has one home yard; drive time into a job starts there.

create table public.yards (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) default private.company_id(),
  branch_id uuid,
  name text not null check (btrim(name) <> '' and char_length(name) <= 120),
  address text not null check (btrim(address) <> '' and char_length(address) <= 200),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, id),
  foreign key (company_id, branch_id) references public.branches (company_id, id)
);
create unique index yards_company_name_uidx on public.yards (company_id, lower(name)) where is_active;

create trigger yards_updated_at before update on public.yards
  for each row execute function private.set_updated_at();
create trigger yards_log_activity after insert or update on public.yards
  for each row execute function private.log_activity();

alter table public.yards enable row level security;
revoke all on public.yards from anon, authenticated;
grant select on public.yards to authenticated;
grant insert (branch_id, name, address, is_active) on public.yards to authenticated;
grant update (branch_id, name, address, is_active) on public.yards to authenticated;

create policy yards_read on public.yards for select to authenticated
  using (company_id = (select private.company_id()));
create policy yards_insert on public.yards for insert to authenticated
  with check (company_id = (select private.company_id())
    and (select private.has_role('{owner,admin,dispatcher}')));
create policy yards_update on public.yards for update to authenticated
  using (company_id = (select private.company_id()))
  with check (company_id = (select private.company_id())
    and (select private.has_role('{owner,admin,dispatcher}')));

alter table public.employees add column home_yard_id uuid;
alter table public.employees add constraint employees_home_yard_fkey
  foreign key (company_id, home_yard_id) references public.yards (company_id, id);
grant insert (home_yard_id) on public.employees to authenticated;
grant update (home_yard_id) on public.employees to authenticated;
