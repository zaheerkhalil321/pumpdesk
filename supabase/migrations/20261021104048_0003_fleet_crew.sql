-- 0003_fleet_crew: equipment (pumps and trucks) and employees (operators and crew).

create type public.equipment_type as enum
  ('boom_pump', 'line_pump', 'trailer_pump', 'placing_boom', 'service_truck', 'support_vehicle', 'other');
create type public.equipment_status as enum ('available', 'maintenance', 'out_of_service', 'retired');
create type public.employee_status as enum ('active', 'inactive', 'leave', 'terminated');

-- Target for composite tenant FKs from equipment and employees.
alter table public.branches add constraint branches_company_id_id_key unique (company_id, id);

create table public.employees (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) default private.company_id(),
  branch_id uuid,
  user_id uuid references public.app_users (id),
  employee_number text,
  first_name text not null,
  last_name text not null,
  preferred_name text,
  email text,
  phone text check (phone is null or phone ~ '^\+[1-9][0-9]{6,14}$'),
  status public.employee_status not null default 'active',
  is_operator boolean not null default false,
  is_mechanic boolean not null default false,
  hire_date date,
  cdl_class text,
  cdl_expires_on date,
  medical_cert_expires_on date,
  job_title text,
  is_dispatcher boolean not null default false,
  termination_date date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, id),
  foreign key (company_id, branch_id) references public.branches (company_id, id)
);
create unique index employees_company_number_uidx on public.employees (company_id, employee_number);
create index employees_company_name_idx on public.employees (company_id, last_name, first_name);
create index employees_company_user_idx on public.employees (company_id, user_id);

create table public.equipment (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) default private.company_id(),
  branch_id uuid,
  equipment_number text not null,
  type public.equipment_type not null,
  status public.equipment_status not null default 'available',
  make text,
  model text,
  model_year smallint check (model_year is null or model_year between 1950 and 2100),
  vin text,
  license_plate text,
  boom_length_m numeric(6, 2) check (boom_length_m is null or (boom_length_m >= 1 and boom_length_m <= 100)),
  horizontal_reach_ft numeric(8, 2) check (horizontal_reach_ft is null or (horizontal_reach_ft >= 0 and horizontal_reach_ft <= 500)),
  vertical_reach_ft numeric(8, 2),
  engine_hours numeric(12, 2),
  hourly_rate_override numeric(12, 2) check (hourly_rate_override is null or (hourly_rate_override >= 0 and hourly_rate_override <= 5000)),
  min_hours_override numeric(6, 2) check (min_hours_override is null or (min_hours_override >= 1 and min_hours_override <= 24)),
  default_operator_id uuid,
  serial_number text,
  current_mileage numeric(12, 2),
  purchase_date date,
  in_service_date date,
  retired_date date,
  next_inspection_due date,
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, id),
  unique (company_id, equipment_number),
  foreign key (company_id, branch_id) references public.branches (company_id, id),
  foreign key (company_id, default_operator_id) references public.employees (company_id, id)
);
create index equipment_company_status_idx on public.equipment (company_id, status);
create index equipment_company_operator_idx on public.equipment (company_id, default_operator_id);

-- Triggers
create trigger employees_updated_at before update on public.employees
  for each row execute function private.set_updated_at();
create trigger equipment_updated_at before update on public.equipment
  for each row execute function private.set_updated_at();
create trigger employees_log_activity after insert or update on public.employees
  for each row execute function private.log_activity();
create trigger equipment_log_activity after insert or update on public.equipment
  for each row execute function private.log_activity();

-- Audit labels: equipment is shown by its number.
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
    new_j ->> 'equipment_number', new_j ->> 'address_line_1', new_j ->> 'order_number', new_j ->> 'id');

  insert into public.activity_log (company_id, actor_id, entity_type, entity_id, action, changes, summary)
  values (
    (new_j ->> 'company_id')::uuid, auth.uid(), tg_table_name, (new_j ->> 'id')::uuid, act, changes,
    pg_catalog.format('%s %s "%s"', pg_catalog.initcap(act), pg_catalog.replace(tg_table_name, '_', ' '), label)
  );
  return new;
end
$$;

-- RLS and grants. Read: any active member. Write (matrix "Fleet edit"): owner, admin, dispatcher, mechanic.
-- Crew records: owner, admin, dispatcher.
alter table public.employees enable row level security;
alter table public.equipment enable row level security;

revoke all on public.employees, public.equipment from anon;
revoke all on public.employees, public.equipment from authenticated;
grant select on public.employees, public.equipment to authenticated;

-- user_id (the login link), company_id and timestamps are never writable from the API.
grant insert (branch_id, employee_number, first_name, last_name, preferred_name, email, phone, status,
  is_operator, is_mechanic, is_dispatcher, job_title, cdl_class, cdl_expires_on, medical_cert_expires_on, notes)
  on public.employees to authenticated;
grant update (branch_id, employee_number, first_name, last_name, preferred_name, email, phone, status,
  is_operator, is_mechanic, is_dispatcher, job_title, cdl_class, cdl_expires_on, medical_cert_expires_on, notes)
  on public.employees to authenticated;

grant insert (branch_id, equipment_number, type, status, make, model, model_year, boom_length_m,
  horizontal_reach_ft, hourly_rate_override, min_hours_override, default_operator_id, next_inspection_due,
  notes, is_active)
  on public.equipment to authenticated;
grant update (branch_id, equipment_number, type, status, make, model, model_year, boom_length_m,
  horizontal_reach_ft, hourly_rate_override, min_hours_override, default_operator_id, next_inspection_due,
  notes, is_active)
  on public.equipment to authenticated;

create policy employees_read on public.employees for select to authenticated
  using (company_id = (select private.company_id()));
create policy employees_insert on public.employees for insert to authenticated
  with check (company_id = (select private.company_id())
    and (select private.has_role('{owner,admin,dispatcher}')));
create policy employees_update on public.employees for update to authenticated
  using (company_id = (select private.company_id()))
  with check (company_id = (select private.company_id())
    and (select private.has_role('{owner,admin,dispatcher}')));

create policy equipment_read on public.equipment for select to authenticated
  using (company_id = (select private.company_id()));
create policy equipment_insert on public.equipment for insert to authenticated
  with check (company_id = (select private.company_id())
    and (select private.has_role('{owner,admin,dispatcher,mechanic}')));
create policy equipment_update on public.equipment for update to authenticated
  using (company_id = (select private.company_id()))
  with check (company_id = (select private.company_id())
    and (select private.has_role('{owner,admin,dispatcher,mechanic}')));
