-- 0018_call_logs: a record of every call placed from the app. PumpDesk rings the dispatcher first
-- (from_phone), then connects them to the customer, contact or operator (to_phone).

create table public.call_logs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) default private.company_id(),
  job_id uuid,
  customer_id uuid,
  contact_id uuid,
  employee_id uuid,
  recipient_kind text not null check (recipient_kind in ('customer', 'contact', 'operator')),
  from_phone text not null check (from_phone ~ '^\+[1-9][0-9]{6,14}$'),
  to_phone text not null check (to_phone ~ '^\+[1-9][0-9]{6,14}$'),
  status text not null check (status in ('queued', 'failed', 'dry_run')),
  provider_sid text,
  error_code text,
  error_message text,
  placed_by uuid references public.app_users (id) default auth.uid(),
  created_at timestamptz not null default now(),
  foreign key (company_id, job_id) references public.jobs (company_id, id),
  foreign key (company_id, customer_id) references public.customers (company_id, id),
  foreign key (company_id, contact_id) references public.contacts (company_id, id),
  foreign key (company_id, employee_id) references public.employees (company_id, id)
);
create index call_logs_job_idx on public.call_logs (company_id, job_id, created_at desc);

alter table public.call_logs enable row level security;
revoke all on public.call_logs from anon, authenticated;
grant select on public.call_logs to authenticated;
grant insert (job_id, customer_id, contact_id, employee_id, recipient_kind, from_phone, to_phone,
  status, provider_sid, error_code, error_message) on public.call_logs to authenticated;

create policy call_logs_read on public.call_logs for select to authenticated
  using (company_id = (select private.company_id()));
create policy call_logs_insert on public.call_logs for insert to authenticated
  with check (company_id = (select private.company_id())
    and (select private.has_role('{owner,admin,dispatcher,office}')));
