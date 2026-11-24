-- 0027: client feedback on operators.
--   * delete_operator: only today's and later jobs lose the operator. Past jobs keep their name,
--     even when nobody marked them done.
--   * One phone number and one email per person in a company. The operator app signs in by phone,
--     so two people on one number would block that sign-in. Deleted (terminated) people free their number.
--
-- Before running: fix any people who already share a phone or email, or the indexes below fail.
-- Find them with:
--   select company_id, phone, count(*) from public.employees
--    where status <> 'terminated' and phone is not null group by 1, 2 having count(*) > 1;

create or replace function public.delete_operator(p_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  cid uuid := private.company_id();
  today date;
begin
  if cid is null or not private.has_role('{owner,admin,dispatcher}') then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if not exists (select 1 from public.employees where id = p_id and company_id = cid) then
    raise exception 'operator not found' using errcode = 'P0002';
  end if;

  select (now() at time zone c.timezone)::date into today from public.companies c where c.id = cid;

  -- Today's and upcoming jobs lose this operator and show "needs operator". Past and finished jobs keep theirs.
  with released as (
    update public.job_employee_assignments a set released_at = now()
      from public.jobs j
     where a.employee_id = p_id and a.company_id = cid and a.released_at is null
       and j.id = a.job_id and j.booking_status <> 'cancelled' and j.field_status <> 'done'
       and j.service_date >= today
    returning a.job_id, a.assignment_type
  )
  update public.jobs set dispatch_status = 'unassigned', dispatched_at = null
   where id in (select job_id from released where assignment_type = 'primary_operator')
     and dispatch_status <> 'unassigned';

  update public.equipment set default_operator_id = null
   where company_id = cid and default_operator_id = p_id;

  update public.employees set status = 'terminated', termination_date = current_date
   where id = p_id and company_id = cid;
end
$$;
revoke execute on function public.delete_operator(uuid) from public, anon;
grant execute on function public.delete_operator(uuid) to authenticated;

create unique index employees_company_phone_uidx
  on public.employees (company_id, phone) where status <> 'terminated' and phone is not null;
create unique index employees_company_email_uidx
  on public.employees (company_id, lower(email)) where status <> 'terminated' and email is not null;
