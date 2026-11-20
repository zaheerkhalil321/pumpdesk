-- 0022_depart_after_ticket: an operator may turn in the work ticket while still on site (the app offers
-- "Complete work ticket" there) and then tap "Depart job site". Until now every step was refused once the
-- ticket was submitted, so that last tap was lost. Now:
--   * departed_site is allowed after the ticket is submitted, and the job goes straight to `done`
--     (ticket turned in + site left = done, the same rule submit_work_ticket uses);
--   * every other step is still refused once the ticket is in (`ticket_locked`).
-- Built on the 0021 version of record_job_step (keeps its too_early rule).

create or replace function public.record_job_step(p_job_id uuid, p_step public.job_step, p_at timestamptz) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  op public.employees := private.require_operator();
  j public.jobs;
  submitted boolean;
begin
  if p_at is null or p_step is null then
    raise exception 'invalid_time' using errcode = 'P0001';
  end if;
  j := private.lock_operator_job(op, p_job_id);

  -- already recorded: first tap wins
  if exists (select 1 from public.job_step_events
              where job_id = j.id and step = p_step and undone_at is null) then
    return private.operator_job_json(op, p_job_id);
  end if;
  submitted := private.ticket_is_submitted(j.id);
  if submitted and p_step <> 'departed_site' then
    raise exception 'ticket_locked' using errcode = 'P0001';
  end if;

  if not exists (select 1 from public.job_step_events where job_id = j.id and undone_at is null)
     and (now() at time zone j.timezone)::date < j.service_date then
    raise exception 'too_early' using errcode = 'P0001';
  end if;

  -- steps may be skipped, but never go backwards: no later step yet, no earlier step with a later time
  if exists (select 1 from public.job_step_events
              where job_id = j.id and undone_at is null
                and (private.step_rank(step) > private.step_rank(p_step)
                     or (private.step_rank(step) < private.step_rank(p_step) and at > p_at))) then
    raise exception 'step_out_of_order' using errcode = 'P0001';
  end if;

  insert into public.job_step_events (company_id, job_id, employee_id, step, at)
  values (j.company_id, j.id, op.id, p_step, p_at);

  if p_step <> 'arrived_shop' then
    perform private.set_field_status(j,
      case when submitted then 'done'::public.field_status else private.step_field_status(p_step) end,
      p_at,
      case when submitted then 'departed site, ticket already submitted' else p_step::text end);
  end if;
  return private.operator_job_json(op, p_job_id);
end
$$;

revoke execute on function public.record_job_step(uuid, public.job_step, timestamptz) from public, anon;
grant execute on function public.record_job_step(uuid, public.job_step, timestamptz) to authenticated;
