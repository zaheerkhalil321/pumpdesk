-- 0021_operator_rules: four rules decided after review.
--   1. An operator sees a job only once dispatch has sent it (dispatched or acknowledged), or when it was
--      sent and then cancelled.
--   2. Changing the time or address of an acknowledged job clears the acknowledgement and sets it back to
--      "dispatched", so the operator has to confirm again.
--   3. Submitting a ticket turns the order in (booking status turned_in).
--   4. A job cannot be started before its own day (job timezone): too_early.

create or replace function private.operator_assignment(p_job uuid, p_op public.employees)
returns public.job_employee_assignments
language sql stable security definer set search_path = '' as $$
  select a.*
    from public.job_employee_assignments a
    join public.jobs j on j.company_id = a.company_id and j.id = a.job_id
   where a.company_id = p_op.company_id and a.employee_id = p_op.id and a.job_id = p_job
     and ((a.released_at is null and j.dispatch_status in ('dispatched', 'acknowledged'))
          or (j.booking_status = 'cancelled' and j.cancelled_at is not null
              and abs(extract(epoch from (a.released_at - j.cancelled_at))) < 1
              and exists (select 1 from public.job_status_history h
                           where h.job_id = j.id and h.dimension = 'dispatch' and h.new_value = 'dispatched')))
   order by (a.released_at is null) desc, a.assigned_at desc
   limit 1
$$;
create or replace function public.operator_jobs(p_from timestamptz default null, p_to timestamptz default null) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  op public.employees := private.require_operator();
begin
  return coalesce((
    select jsonb_agg(private.operator_job_json(op, x.id) order by x.scheduled_start, x.id)
      from (
        select j.id, j.scheduled_start
          from public.jobs j
         where j.company_id = op.company_id
           and (p_from is null or j.scheduled_start >= p_from)
           and (p_to is null or j.scheduled_start < p_to)
           and exists (
             select 1 from public.job_employee_assignments a
              where a.company_id = j.company_id and a.job_id = j.id and a.employee_id = op.id
                and ((a.released_at is null and j.dispatch_status in ('dispatched', 'acknowledged'))
          or (j.booking_status = 'cancelled' and j.cancelled_at is not null
              and abs(extract(epoch from (a.released_at - j.cancelled_at))) < 1
              and exists (select 1 from public.job_status_history h
                           where h.job_id = j.id and h.dimension = 'dispatch' and h.new_value = 'dispatched'))))
         order by j.scheduled_start, j.id
         limit 500) x), '[]'::jsonb);
end
$$;
create or replace function public.record_job_step(p_job_id uuid, p_step public.job_step, p_at timestamptz) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  op public.employees := private.require_operator();
  j public.jobs;
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
  if private.ticket_is_submitted(j.id) then
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
    perform private.set_field_status(j, private.step_field_status(p_step), p_at, p_step::text);
  end if;
  return private.operator_job_json(op, p_job_id);
end
$$;

-- Rule 2: before-trigger on jobs (no second update, so no version bump or recursion).
create function private.reset_ack_on_reschedule() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if old.dispatch_status = 'acknowledged' and new.dispatch_status = 'acknowledged'
     and (new.scheduled_start, new.arrive_by, new.timezone, new.site_label, new.job_site_id)
         is distinct from
         (old.scheduled_start, old.arrive_by, old.timezone, old.site_label, old.job_site_id) then
    new.dispatch_status := 'dispatched';
    update public.job_employee_assignments set acknowledged_at = null
     where company_id = new.company_id and job_id = new.id and released_at is null;
    insert into public.job_status_history (company_id, job_id, dimension, old_value, new_value, reason, changed_by)
    values (new.company_id, new.id, 'dispatch', 'acknowledged', 'dispatched', 'rescheduled', auth.uid());
  end if;
  return new;
end
$$;
create trigger jobs_reset_ack_on_reschedule before update on public.jobs
  for each row execute function private.reset_ack_on_reschedule();

-- Rule 3: a submitted ticket turns the order in.
create function private.ticket_submitted_turn_in() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  j public.jobs;
begin
  if new.status = 'submitted' and old.status is distinct from 'submitted' then
    select * into j from public.jobs where company_id = new.company_id and id = new.job_id;
    if j.booking_status in ('pending', 'confirmed', 'inspection_pending') then
      perform set_config('pumpdesk.keep_version', 'on', true);
      update public.jobs set booking_status = 'turned_in', updated_by = auth.uid() where id = j.id;
      perform set_config('pumpdesk.keep_version', 'off', true);
      insert into public.job_status_history (company_id, job_id, dimension, old_value, new_value, reason, changed_by)
      values (j.company_id, j.id, 'booking', j.booking_status::text, 'turned_in', 'ticket submitted', auth.uid());
    end if;
  end if;
  return new;
end
$$;
create trigger work_tickets_turn_in after update of status on public.work_tickets
  for each row execute function private.ticket_submitted_turn_in();

revoke execute on function private.reset_ack_on_reschedule(), private.ticket_submitted_turn_in()
  from public, anon, authenticated;
