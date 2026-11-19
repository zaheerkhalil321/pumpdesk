-- 0020_operator_functions: everything the operator phone app calls. Reads and writes both go through
-- these functions (security definer), never through tables.
--
-- Rules every function follows:
--   * The company and the operator come from the login (auth.uid() -> employees.user_id), never from input.
--   * "On this job" means a live assignment of that employee (released_at is null). A job cancelled by the
--   office has its assignments released at the same moment; those stay readable so the app can show
--   "cancelled", but nothing can be written to them.
--   * Writes are idempotent (the phone retries): same call twice = same result, first tap wins.
--   * Errors: message = a short code, so the app can map it. 42501 not_operator, not_assigned;
--     P0001 job_cancelled, step_out_of_order, step_not_recorded, ticket_locked, invalid_ticket (detail says why),
--     invalid_time, phone_not_found, ambiguous_phone, phone_already_linked, membership_inactive.

-- ── Helpers (private) ───────────────────────────────────────────
create function private.iso(ts timestamptz) returns text
language sql immutable set search_path = '' as $$
  select case when ts is null then null else to_char(ts at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') end
$$;

create function private.step_rank(s public.job_step) returns integer
language sql immutable set search_path = '' as $$
  select case s when 'arrived_shop' then 1 when 'departed_shop' then 2 when 'arrived_site' then 3 else 4 end
$$;

-- The field status a step implies (decision 3). arrived_shop changes nothing, so it maps to "scheduled".
create function private.step_field_status(s public.job_step) returns public.field_status
language sql immutable set search_path = '' as $$
  select case s
    when 'departed_shop' then 'en_route'::public.field_status
    when 'arrived_site' then 'on_site'::public.field_status
    when 'departed_site' then 'returning'::public.field_status
    else 'scheduled'::public.field_status end
$$;

-- The caller as an operator: an active, linked employee with an active membership. Null row when none.
create function private.find_operator() returns public.employees
language sql stable security definer set search_path = '' as $$
  select e.*
    from public.employees e
    join public.company_memberships m
      on m.company_id = e.company_id and m.user_id = e.user_id and m.status = 'active'
   where e.user_id = auth.uid() and e.is_operator and e.status = 'active'
   order by (e.company_id = private.company_id()) desc nulls last, e.created_at
   limit 1
$$;

create function private.require_operator() returns public.employees
language plpgsql stable security definer set search_path = '' as $$
declare
  op public.employees := private.find_operator();
begin
  if op.id is null then
    raise exception 'not_operator' using errcode = '42501';
  end if;
  return op;
end
$$;

-- The operator's assignment on a job, if they may see it: live, or released by the cancellation.
create function private.operator_assignment(p_job uuid, p_op public.employees)
returns public.job_employee_assignments
language sql stable security definer set search_path = '' as $$
  select a.*
    from public.job_employee_assignments a
    join public.jobs j on j.company_id = a.company_id and j.id = a.job_id
   where a.company_id = p_op.company_id and a.employee_id = p_op.id and a.job_id = p_job
     and (a.released_at is null
          or (j.booking_status = 'cancelled' and j.cancelled_at is not null
              and abs(extract(epoch from (a.released_at - j.cancelled_at))) < 1))
   order by (a.released_at is null) desc, a.assigned_at desc
   limit 1
$$;

-- Write access: assigned, job locked for update, not cancelled. Returns the locked job.
create function private.lock_operator_job(p_op public.employees, p_job uuid) returns public.jobs
language plpgsql security definer set search_path = '' as $$
declare
  a public.job_employee_assignments := private.operator_assignment(p_job, p_op);
  j public.jobs;
begin
  if a.id is null then
    raise exception 'not_assigned' using errcode = '42501';
  end if;
  select * into j from public.jobs where company_id = p_op.company_id and id = p_job for update;
  if j.booking_status = 'cancelled' or a.released_at is not null then
    raise exception 'job_cancelled' using errcode = 'P0001';
  end if;
  return j;
end
$$;

create function private.ticket_is_submitted(p_job uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.work_tickets t where t.job_id = p_job and t.status = 'submitted')
$$;

-- Change field status on a job and write the history row. Does not bump jobs.version.
create function private.set_field_status(p_job public.jobs, p_new public.field_status, p_at timestamptz,
  p_reason text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if p_job.field_status = p_new then
    return;
  end if;
  perform set_config('pumpdesk.keep_version', 'on', true);
  update public.jobs
     set field_status = p_new,
         completed_at = case when p_new = 'done' then coalesce(completed_at, p_at) else completed_at end,
         updated_by = auth.uid()
   where id = p_job.id;
  perform set_config('pumpdesk.keep_version', 'off', true);
  insert into public.job_status_history (company_id, job_id, dimension, old_value, new_value, reason, changed_by, changed_at)
  values (p_job.company_id, p_job.id, 'field', p_job.field_status::text, p_new::text, p_reason, auth.uid(), p_at);
end
$$;

-- ── JSON builders (the app's shapes, camelCase) ─────────────────
create function private.operator_json(p_op public.employees) returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'employeeId', p_op.id,
    'firstName', p_op.first_name,
    'lastName', p_op.last_name,
    'phone', p_op.phone,
    'company', jsonb_build_object(
      'id', c.id,
      'name', c.display_name,
      'town', nullif(concat_ws(', ', nullif(btrim(c.city), ''), nullif(btrim(c.state), '')), ''),
      'dispatchPhone', coalesce(c.phone, ''),
      'termsUrl', s.terms_url))
  from public.companies c
  left join public.company_settings s on s.company_id = c.id
  where c.id = p_op.company_id
$$;

create function private.operator_job_json(p_op public.employees, p_job uuid) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  j public.jobs;
  a public.job_employee_assignments := private.operator_assignment(p_job, p_op);
  cust text;
  js public.job_sites;
  site jsonb;
  shop jsonb;
  yard record;
  comp public.companies;
  pump jsonb;
  contact jsonb;
  steps jsonb;
  tstatus text;
begin
  select * into j from public.jobs where company_id = p_op.company_id and id = p_job;
  select business_name into cust from public.customers where company_id = j.company_id and id = j.customer_id;

  -- Site: the typed label always; street, town and coordinates when a saved job site is linked.
  select * into js from public.job_sites where company_id = j.company_id and id = j.job_site_id;
  site := jsonb_build_object(
    'label', j.site_label,
    'street', js.address_line_1,
    'town', js.city,
    'lat', js.latitude,
    'lng', js.longitude);

  -- Shop: the operator's branch yard, else the company's first yard, else the company address.
  select y.name, y.address, b.latitude, b.longitude into yard
    from public.yards y
    left join public.branches b on b.company_id = y.company_id and b.id = y.branch_id
   where y.company_id = p_op.company_id and y.is_active
   order by (p_op.branch_id is not null and y.branch_id = p_op.branch_id) desc, y.created_at, y.id
   limit 1;
  if yard.name is not null then
    shop := jsonb_build_object('name', yard.name, 'label', yard.name || ' · ' || yard.address,
      'street', yard.address, 'town', null, 'lat', yard.latitude, 'lng', yard.longitude);
  else
    select * into comp from public.companies where id = p_op.company_id;
    shop := jsonb_build_object('name', comp.display_name,
      'label', concat_ws(' · ', comp.display_name, nullif(concat_ws(', ', comp.city, comp.state), '')),
      'street', comp.address_line_1, 'town', comp.city, 'lat', null, 'lng', null);
  end if;

  select jsonb_build_object('unit', e.equipment_number,
           'label', case
             when e.boom_length_m is not null then trim_scale(e.boom_length_m)::text || 'm boom'
             else initcap(replace(e.type::text, '_', ' ')) end)
    into pump
    from public.job_equipment_assignments ea
    join public.equipment e on e.company_id = ea.company_id and e.id = ea.equipment_id
   where ea.company_id = j.company_id and ea.job_id = j.id and ea.released_at is null;

  select jsonb_build_object(
           'name', btrim(concat_ws(' ', c.first_name, c.last_name)),
           'role', c.job_title,
           'phone', c.phone)
    into contact
    from public.job_contacts jc
    join public.contacts c on c.company_id = jc.company_id and c.id = jc.contact_id
   where jc.company_id = j.company_id and jc.job_id = j.id
   order by jc.created_at, jc.id
   limit 1;

  select jsonb_build_object(
           'arrived_shop', max(case when step = 'arrived_shop' then private.iso(at) end),
           'departed_shop', max(case when step = 'departed_shop' then private.iso(at) end),
           'arrived_site', max(case when step = 'arrived_site' then private.iso(at) end),
           'departed_site', max(case when step = 'departed_site' then private.iso(at) end))
    into steps
    from public.job_step_events
   where company_id = j.company_id and job_id = j.id and undone_at is null;

  select t.status::text into tstatus from public.work_tickets t where t.job_id = j.id;

  return jsonb_build_object(
    'id', j.id,
    'jobNumber', j.job_number,
    'jobName', nullif(btrim(j.job_name), ''),
    'customerName', coalesce(cust, ''),
    'site', site,
    'shop', shop,
    'timezone', j.timezone,
    'arriveShopBy', private.iso(j.arrive_by),
    'pourStartsAt', private.iso(j.scheduled_start),
    'pump', pump,
    'estimatedYards', j.estimated_yards,
    'notesForOperator', nullif(btrim(j.site_instructions), ''),
    'siteContact', contact,
    'isCancelled', j.booking_status = 'cancelled',
    'changedSinceSeen', (a.seen_at is not null and a.changed_at is not null and a.changed_at > a.seen_at),
    'acknowledgedAt', private.iso(a.acknowledged_at),
    'steps', steps,
    'ticketStatus', coalesce(tstatus, 'not_started'));
end
$$;

create function private.ticket_json(t public.work_tickets) returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'jobId', t.job_id,
    'arrivedOnSiteAt', private.iso(t.arrived_on_site_at),
    'startedPourAt', private.iso(t.started_pour_at),
    'finishedPourAt', private.iso(t.finished_pour_at),
    'departedSiteAt', private.iso(t.departed_site_at),
    'yardsPumped', t.yards_pumped,
    'hose3inFt', t.hose_3in_ft,
    'hose4inFt', t.hose_4in_ft,
    'extras', coalesce((select jsonb_agg(x.extra_code order by x.extra_code)
                          from public.work_ticket_extras x where x.ticket_id = t.id), '[]'::jsonb),
    'comments', t.comments,
    'signerName', t.signer_name,
    -- The image itself is in the private bucket; the phone downloads it from signaturePath.
    'signaturePng', null,
    'signaturePath', t.signature_path,
    'signedAt', private.iso(t.signed_at),
    'updatedAt', private.iso(t.updated_at))
$$;

-- ── Link a phone login to an operator ───────────────────────────
-- Call right after the code is verified. Safe to call again.
create function public.link_operator_login() returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  digits text;
  hits public.employees[];
  emp public.employees;
  mem public.company_memberships;
begin
  if uid is null then
    raise exception 'not_operator' using errcode = '42501';
  end if;
  select private.phone_digits(u.phone) into digits from auth.users u where u.id = uid;
  if coalesce(digits, '') = '' then
    raise exception 'phone_not_found' using errcode = 'P0001';
  end if;

  select array_agg(e order by e.created_at) into hits
    from public.employees e
   where e.is_operator and e.status = 'active' and e.phone = '+' || digits;
  if hits is null then
    raise exception 'phone_not_found' using errcode = 'P0001';
  end if;
  if array_length(hits, 1) > 1 then
    raise exception 'ambiguous_phone' using errcode = 'P0001';
  end if;
  emp := hits[1];
  if emp.user_id is not null and emp.user_id <> uid then
    raise exception 'phone_already_linked' using errcode = 'P0001';
  end if;

  select * into mem from public.company_memberships where company_id = emp.company_id and user_id = uid;
  if mem.id is null then
    insert into public.company_memberships (company_id, user_id, role, status, joined_at)
    values (emp.company_id, uid, 'operator', 'active', now());
  elsif mem.status <> 'active' then
    -- suspended or still invited: an admin decides, not the phone
    raise exception 'membership_inactive' using errcode = 'P0001';
  end if;

  if emp.user_id is null then
    update public.employees set user_id = uid where id = emp.id returning * into emp;
  end if;

  update public.app_users
     set phone = coalesce(phone, emp.phone),
         full_name = coalesce(full_name, btrim(emp.first_name || ' ' || emp.last_name))
   where id = uid;

  return private.operator_json(emp);
end
$$;

-- ── Reads ───────────────────────────────────────────────────────
create function public.operator_me() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  return private.operator_json(private.require_operator());
end
$$;

-- Jobs whose pour starts in [p_from, p_to) (either end may be null = open). Live assignments, plus jobs the
-- office cancelled on this operator. Ordered by start time.
create function public.operator_jobs(p_from timestamptz default null, p_to timestamptz default null) returns jsonb
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
                and (a.released_at is null
                     or (j.booking_status = 'cancelled' and j.cancelled_at is not null
                         and abs(extract(epoch from (a.released_at - j.cancelled_at))) < 1)))
         order by j.scheduled_start, j.id
         limit 500) x), '[]'::jsonb);
end
$$;

create function public.operator_job(p_job_id uuid) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  op public.employees := private.require_operator();
begin
  if (private.operator_assignment(p_job_id, op)).id is null then
    raise exception 'not_assigned' using errcode = '42501';
  end if;
  return private.operator_job_json(op, p_job_id);
end
$$;

-- Opened the job: clears "changed since seen". Allowed on cancelled jobs too.
create function public.mark_job_seen(p_job_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  op public.employees := private.require_operator();
  a public.job_employee_assignments := private.operator_assignment(p_job_id, op);
begin
  if a.id is null then
    raise exception 'not_assigned' using errcode = '42501';
  end if;
  update public.job_employee_assignments set seen_at = clock_timestamp() where id = a.id;
end
$$;

-- ── Acknowledge and steps ───────────────────────────────────────
create function public.acknowledge_assignment(p_job_id uuid, p_at timestamptz) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  op public.employees := private.require_operator();
  j public.jobs;
  a public.job_employee_assignments;
begin
  if p_at is null then
    raise exception 'invalid_time' using errcode = 'P0001';
  end if;
  j := private.lock_operator_job(op, p_job_id);
  a := private.operator_assignment(p_job_id, op);

  -- first tap wins; a retry changes nothing
  update public.job_employee_assignments set acknowledged_at = p_at
   where id = a.id and acknowledged_at is null;

  if a.assignment_type = 'primary_operator' and j.dispatch_status in ('assigned', 'dispatched') then
    perform set_config('pumpdesk.keep_version', 'on', true);
    update public.jobs set dispatch_status = 'acknowledged', updated_by = auth.uid() where id = j.id;
    perform set_config('pumpdesk.keep_version', 'off', true);
    insert into public.job_status_history (company_id, job_id, dimension, old_value, new_value, changed_by, changed_at)
    values (j.company_id, j.id, 'dispatch', j.dispatch_status::text, 'acknowledged', auth.uid(), p_at);
  end if;
  return private.operator_job_json(op, p_job_id);
end
$$;

create function public.record_job_step(p_job_id uuid, p_step public.job_step, p_at timestamptz) returns jsonb
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

-- Only the latest live step can be undone.
create function public.undo_job_step(p_job_id uuid, p_step public.job_step) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  op public.employees := private.require_operator();
  j public.jobs;
  prev public.job_step;
begin
  j := private.lock_operator_job(op, p_job_id);

  if not exists (select 1 from public.job_step_events
                  where job_id = j.id and step = p_step and undone_at is null) then
    return private.operator_job_json(op, p_job_id); -- nothing to undo
  end if;
  if private.ticket_is_submitted(j.id) then
    raise exception 'ticket_locked' using errcode = 'P0001';
  end if;
  if exists (select 1 from public.job_step_events
              where job_id = j.id and undone_at is null and private.step_rank(step) > private.step_rank(p_step)) then
    raise exception 'step_out_of_order' using errcode = 'P0001';
  end if;

  update public.job_step_events set undone_at = now()
   where job_id = j.id and step = p_step and undone_at is null;

  -- Back to what the step before it implies, but only if the status is still the one this step set.
  if j.field_status = private.step_field_status(p_step) and p_step <> 'arrived_shop' then
    select e.step into prev from public.job_step_events e
     where e.job_id = j.id and e.undone_at is null order by private.step_rank(e.step) desc limit 1;
    perform private.set_field_status(j,
      case when prev is null then 'scheduled'::public.field_status else private.step_field_status(prev) end,
      now(), 'undo ' || p_step::text);
  end if;
  return private.operator_job_json(op, p_job_id);
end
$$;

-- Change the time of a recorded step. Stays between its neighbours.
create function public.edit_job_step_time(p_job_id uuid, p_step public.job_step, p_at timestamptz) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  op public.employees := private.require_operator();
  j public.jobs;
  cur public.job_step_events;
begin
  if p_at is null then
    raise exception 'invalid_time' using errcode = 'P0001';
  end if;
  j := private.lock_operator_job(op, p_job_id);

  select * into cur from public.job_step_events where job_id = j.id and step = p_step and undone_at is null;
  if cur.id is null then
    raise exception 'step_not_recorded' using errcode = 'P0001';
  end if;
  if cur.at = p_at then
    return private.operator_job_json(op, p_job_id);
  end if;
  if private.ticket_is_submitted(j.id) then
    raise exception 'ticket_locked' using errcode = 'P0001';
  end if;
  if exists (select 1 from public.job_step_events
              where job_id = j.id and undone_at is null
                and ((private.step_rank(step) < private.step_rank(p_step) and at > p_at)
                     or (private.step_rank(step) > private.step_rank(p_step) and at < p_at))) then
    raise exception 'step_out_of_order' using errcode = 'P0001';
  end if;

  update public.job_step_events set at = p_at, edited_at = now() where id = cur.id;
  return private.operator_job_json(op, p_job_id);
end
$$;

-- ── Work ticket ─────────────────────────────────────────────────
create function public.ticket_extras() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  op public.employees := private.require_operator();
begin
  return coalesce((
    select jsonb_agg(jsonb_build_object('code', x.code, 'label', x.label) order by x.sort_order, x.label)
      from public.ticket_extras x
     where x.company_id = op.company_id and x.is_active), '[]'::jsonb);
end
$$;

-- null when no ticket was started
create function public.get_work_ticket(p_job_id uuid) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  op public.employees := private.require_operator();
  t public.work_tickets;
begin
  if (private.operator_assignment(p_job_id, op)).id is null then
    raise exception 'not_assigned' using errcode = '42501';
  end if;
  select * into t from public.work_tickets where company_id = op.company_id and job_id = p_job_id;
  if t.id is null then
    return null;
  end if;
  return private.ticket_json(t);
end
$$;

-- Saves the whole draft (what the form holds). Needs: p_draft.jobId and the form fields; signaturePath is
-- the file already uploaded to the signatures bucket (<company>/<job>.png). signaturePng and updatedAt are ignored.
create function public.save_work_ticket(p_draft jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  op public.employees := private.require_operator();
  j public.jobs;
  jid uuid;
  t public.work_tickets;
  bad text[] := '{}';
  v_arrived timestamptz; v_started timestamptz; v_finished timestamptz; v_departed timestamptz; v_signed timestamptz;
  v_yards numeric; v_h3 numeric; v_h4 numeric;
  v_comments text; v_signer text; v_sigpath text;
  v_extras text[];
  v_code text;
begin
  if jsonb_typeof(p_draft) is distinct from 'object' then
    raise exception 'invalid_ticket' using errcode = 'P0001', detail = 'draft must be an object';
  end if;
  begin
    jid := (p_draft ->> 'jobId')::uuid;
  exception when data_exception then
    raise exception 'invalid_ticket' using errcode = 'P0001', detail = 'jobId is not valid';
  end;
  j := private.lock_operator_job(op, jid);

  select * into t from public.work_tickets where job_id = j.id;
  if t.status = 'submitted' then
    raise exception 'ticket_locked' using errcode = 'P0001';
  end if;

  begin
    v_arrived := nullif(p_draft ->> 'arrivedOnSiteAt', '')::timestamptz;
    v_started := nullif(p_draft ->> 'startedPourAt', '')::timestamptz;
    v_finished := nullif(p_draft ->> 'finishedPourAt', '')::timestamptz;
    v_departed := nullif(p_draft ->> 'departedSiteAt', '')::timestamptz;
    v_signed := nullif(p_draft ->> 'signedAt', '')::timestamptz;
  exception when data_exception then
    raise exception 'invalid_ticket' using errcode = 'P0001', detail = 'a time is not valid';
  end;
  begin
    v_yards := nullif(p_draft ->> 'yardsPumped', '')::numeric;
    v_h3 := nullif(p_draft ->> 'hose3inFt', '')::numeric;
    v_h4 := nullif(p_draft ->> 'hose4inFt', '')::numeric;
  exception when data_exception then
    raise exception 'invalid_ticket' using errcode = 'P0001', detail = 'a number is not valid';
  end;

  if v_yards is not null and (v_yards < 0 or v_yards > 1000) then bad := array_append(bad, 'yardsPumped'); end if;
  if v_h3 is not null and (v_h3 < 0 or v_h3 > 2000) then bad := array_append(bad, 'hose3inFt'); end if;
  if v_h4 is not null and (v_h4 < 0 or v_h4 > 2000) then bad := array_append(bad, 'hose4inFt'); end if;

  v_comments := coalesce(p_draft ->> 'comments', '');
  if char_length(v_comments) > 5000 then bad := array_append(bad, 'comments'); end if;
  v_signer := nullif(btrim(p_draft ->> 'signerName'), '');
  if v_signer is not null and char_length(v_signer) > 120 then bad := array_append(bad, 'signerName'); end if;
  v_sigpath := nullif(p_draft ->> 'signaturePath', '');
  if v_sigpath is not null and v_sigpath <> j.company_id::text || '/' || j.id::text || '.png' then
    bad := array_append(bad, 'signaturePath');
  end if;

  if jsonb_typeof(coalesce(p_draft -> 'extras', '[]'::jsonb)) <> 'array' then
    bad := array_append(bad, 'extras');
    v_extras := '{}';
  else
    select coalesce(array_agg(distinct x), '{}') into v_extras
      from jsonb_array_elements_text(coalesce(p_draft -> 'extras', '[]'::jsonb)) x;
    foreach v_code in array v_extras loop
      if not exists (select 1 from public.ticket_extras e where e.company_id = j.company_id and e.code = v_code) then
        bad := array_append(bad, ('extras:' || v_code));
      end if;
    end loop;
  end if;

  if array_length(bad, 1) > 0 then
    raise exception 'invalid_ticket' using errcode = 'P0001',
      detail = 'invalid: ' || array_to_string(bad, ', '), hint = array_to_string(bad, ',');
  end if;

  insert into public.work_tickets as w (company_id, job_id, employee_id, arrived_on_site_at, started_pour_at,
    finished_pour_at, departed_site_at, yards_pumped, hose_3in_ft, hose_4in_ft, comments, signer_name,
    signature_path, signed_at)
  values (j.company_id, j.id, op.id, v_arrived, v_started, v_finished, v_departed, v_yards, v_h3, v_h4,
    v_comments, v_signer, v_sigpath, v_signed)
  on conflict (job_id) do update
    set arrived_on_site_at = excluded.arrived_on_site_at,
        started_pour_at = excluded.started_pour_at,
        finished_pour_at = excluded.finished_pour_at,
        departed_site_at = excluded.departed_site_at,
        yards_pumped = excluded.yards_pumped,
        hose_3in_ft = excluded.hose_3in_ft,
        hose_4in_ft = excluded.hose_4in_ft,
        comments = excluded.comments,
        signer_name = excluded.signer_name,
        signature_path = excluded.signature_path,
        signed_at = excluded.signed_at
    where w.status = 'draft'
  returning * into t;

  delete from public.work_ticket_extras where ticket_id = t.id;
  insert into public.work_ticket_extras (company_id, ticket_id, extra_code)
  select t.company_id, t.id, x from unnest(v_extras) x;

  select * into t from public.work_tickets where id = t.id;
  return private.ticket_json(t);
end
$$;

-- Validates like the app's workTicketSubmitSchema, locks the ticket, and finishes the job when the site was left.
create function public.submit_work_ticket(p_job_id uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  op public.employees := private.require_operator();
  j public.jobs;
  t public.work_tickets;
  msgs text[] := '{}';
  fields text[] := '{}';
  need_sig boolean;
begin
  j := private.lock_operator_job(op, p_job_id);
  select * into t from public.work_tickets where job_id = j.id for update;
  if t.id is null then
    raise exception 'invalid_ticket' using errcode = 'P0001', detail = 'There is no ticket to submit.';
  end if;
  if t.status = 'submitted' then
    return private.operator_job_json(op, p_job_id); -- already done: retry is a no-op
  end if;

  if t.started_pour_at is null then
    msgs := array_append(msgs, 'Started pour time is required to submit.'); fields := array_append(fields, 'startedPourAt');
  end if;
  if t.finished_pour_at is null then
    msgs := array_append(msgs, 'Finished pour time is required to submit.'); fields := array_append(fields, 'finishedPourAt');
  end if;
  if t.started_pour_at is not null and t.finished_pour_at is not null and t.finished_pour_at <= t.started_pour_at then
    msgs := array_append(msgs, 'Finished pour must be after Started pour.'); fields := array_append(fields, 'finishedPourAt');
  end if;
  if t.yards_pumped is null then
    msgs := array_append(msgs, 'Yards pumped is required to submit.'); fields := array_append(fields, 'yardsPumped');
  end if;
  select s.require_ticket_signature into need_sig from public.company_settings s where s.company_id = j.company_id;
  if coalesce(need_sig, false) and (t.signature_path is null or t.signer_name is null) then
    msgs := array_append(msgs, 'A customer signature is required to submit.'); fields := array_append(fields, 'signaturePath');
  end if;
  if array_length(msgs, 1) > 0 then
    raise exception 'invalid_ticket' using errcode = 'P0001',
      detail = array_to_string(msgs, ' '), hint = array_to_string(fields, ',');
  end if;

  update public.work_tickets
     set status = 'submitted', submitted_at = now(), submitted_by = auth.uid()
   where id = t.id;

  if exists (select 1 from public.job_step_events where job_id = j.id and step = 'departed_site' and undone_at is null) then
    perform private.set_field_status(j, 'done', now(), 'ticket submitted');
  end if;
  return private.operator_job_json(op, p_job_id);
end
$$;

-- ── Privileges ──────────────────────────────────────────────────
revoke execute on function
  private.iso(timestamptz), private.step_rank(public.job_step), private.step_field_status(public.job_step),
  private.find_operator(), private.require_operator(),
  private.operator_assignment(uuid, public.employees), private.lock_operator_job(public.employees, uuid),
  private.ticket_is_submitted(uuid),
  private.set_field_status(public.jobs, public.field_status, timestamptz, text),
  private.operator_json(public.employees), private.operator_job_json(public.employees, uuid),
  private.ticket_json(public.work_tickets)
  from public, anon, authenticated;

revoke execute on function
  public.link_operator_login(), public.operator_me(), public.operator_jobs(timestamptz, timestamptz),
  public.operator_job(uuid), public.mark_job_seen(uuid), public.acknowledge_assignment(uuid, timestamptz),
  public.record_job_step(uuid, public.job_step, timestamptz), public.undo_job_step(uuid, public.job_step),
  public.edit_job_step_time(uuid, public.job_step, timestamptz), public.ticket_extras(),
  public.get_work_ticket(uuid), public.save_work_ticket(jsonb), public.submit_work_ticket(uuid)
  from public, anon;
grant execute on function
  public.link_operator_login(), public.operator_me(), public.operator_jobs(timestamptz, timestamptz),
  public.operator_job(uuid), public.mark_job_seen(uuid), public.acknowledge_assignment(uuid, timestamptz),
  public.record_job_step(uuid, public.job_step, timestamptz), public.undo_job_step(uuid, public.job_step),
  public.edit_job_step_time(uuid, public.job_step, timestamptz), public.ticket_extras(),
  public.get_work_ticket(uuid), public.save_work_ticket(jsonb), public.submit_work_ticket(uuid)
  to authenticated;
