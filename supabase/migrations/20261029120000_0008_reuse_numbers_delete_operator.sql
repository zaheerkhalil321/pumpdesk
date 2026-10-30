-- 0008: reuse a pump number or operator number after a delete, and delete operators.
--   Deleted pumps and operators are kept (soft delete), so their numbers must stop blocking new ones.
--   delete_operator: marks the operator terminated, takes them off upcoming jobs and off pump defaults.

alter table public.equipment drop constraint equipment_company_id_equipment_number_key;
create unique index equipment_company_number_uidx
  on public.equipment (company_id, equipment_number) where is_active;

drop index public.employees_company_number_uidx;
create unique index employees_company_number_uidx
  on public.employees (company_id, employee_number) where status <> 'terminated';

create function public.delete_operator(p_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  cid uuid := private.company_id();
begin
  if cid is null or not private.has_role('{owner,admin,dispatcher}') then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if not exists (select 1 from public.employees where id = p_id and company_id = cid) then
    raise exception 'operator not found' using errcode = 'P0002';
  end if;

  -- Upcoming and open jobs lose this operator and show "needs operator". Finished jobs keep theirs.
  with released as (
    update public.job_employee_assignments a set released_at = now()
      from public.jobs j
     where a.employee_id = p_id and a.company_id = cid and a.released_at is null
       and j.id = a.job_id and j.booking_status <> 'cancelled' and j.field_status <> 'done'
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
