-- 0007_order_extras: what the order form's extra buttons save.
--   max_pump_size: the biggest pump the site can take ("Maximum size restriction")
--   extra_items:   extra equipment or supplies, a list of {name, quantity} ("Add item")
--   second operator: an additional operator on the job ("Additional operator")

alter table public.jobs
  add column max_pump_size text,
  add column extra_items jsonb not null default '[]'::jsonb
    check (jsonb_typeof(extra_items) = 'array' and jsonb_array_length(extra_items) <= 20);

create or replace function private.apply_job_assignments(p_job public.jobs, p jsonb) returns void
language plpgsql security definer set search_path = '' as $$
declare
  cur_eq uuid;
  cur_emp uuid;
  new_eq uuid;
  new_emp uuid;
  cur_emp2 uuid;
  new_emp2 uuid;
  primary_emp uuid;
  new_dispatch public.dispatch_status;
begin
  if p ? 'equipment_id' then
    new_eq := nullif(p ->> 'equipment_id', '')::uuid;
    select equipment_id into cur_eq from public.job_equipment_assignments
     where job_id = p_job.id and released_at is null;
    if cur_eq is distinct from new_eq then
      update public.job_equipment_assignments set released_at = now()
       where job_id = p_job.id and released_at is null;
      if new_eq is not null then
        insert into public.job_equipment_assignments (company_id, job_id, equipment_id, assigned_by)
        values (p_job.company_id, p_job.id, new_eq, auth.uid());
      end if;
    end if;
  end if;

  if p ? 'employee_id' then
    new_emp := nullif(p ->> 'employee_id', '')::uuid;
    select employee_id into cur_emp from public.job_employee_assignments
     where job_id = p_job.id and assignment_type = 'primary_operator' and released_at is null;
    if cur_emp is distinct from new_emp then
      update public.job_employee_assignments set released_at = now()
       where job_id = p_job.id and assignment_type = 'primary_operator' and released_at is null;
      if new_emp is not null then
        insert into public.job_employee_assignments (company_id, job_id, employee_id, assigned_by)
        values (p_job.company_id, p_job.id, new_emp, auth.uid());
      end if;
      -- A new operator is "assigned" (not yet told). No operator means unassigned.
      new_dispatch := case when new_emp is null then 'unassigned' else 'assigned' end;
      update public.jobs
         set dispatch_status = new_dispatch,
             dispatched_at = null
       where id = p_job.id and dispatch_status is distinct from new_dispatch;
      if p_job.dispatch_status is distinct from new_dispatch then
        insert into public.job_status_history (company_id, job_id, dimension, old_value, new_value, changed_by)
        values (p_job.company_id, p_job.id, 'dispatch', p_job.dispatch_status::text, new_dispatch::text, auth.uid());
      end if;
    end if;
  end if;

  -- Additional operator: a second person on the job. It never changes the dispatch status.
  if p ? 'second_employee_id' then
    new_emp2 := nullif(p ->> 'second_employee_id', '')::uuid;
    select employee_id into primary_emp from public.job_employee_assignments
     where job_id = p_job.id and assignment_type = 'primary_operator' and released_at is null;
    if new_emp2 is not null and new_emp2 is not distinct from primary_emp then
      raise exception 'the additional operator must be a different person' using errcode = 'P0001';
    end if;
    select employee_id into cur_emp2 from public.job_employee_assignments
     where job_id = p_job.id and assignment_type = 'second_operator' and released_at is null;
    if cur_emp2 is distinct from new_emp2 then
      update public.job_employee_assignments set released_at = now()
       where job_id = p_job.id and assignment_type = 'second_operator' and released_at is null;
      if new_emp2 is not null then
        insert into public.job_employee_assignments (company_id, job_id, employee_id, assignment_type, assigned_by)
        values (p_job.company_id, p_job.id, new_emp2, 'second_operator', auth.uid());
      end if;
    end if;
  end if;
end
$$;

create or replace function public.book_job(p jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  cid uuid := private.require_booking_role();
  tz text := coalesce(nullif(p ->> 'timezone', ''), (select c.timezone from public.companies c where c.id = cid));
  j public.jobs;
  status_value public.booking_status := coalesce(nullif(p ->> 'booking_status', ''), 'pending')::public.booking_status;
begin
  if status_value not in ('pending', 'confirmed') then
    raise exception 'new orders are pending or confirmed' using errcode = 'P0001';
  end if;

  insert into public.jobs (
    company_id, job_number, customer_id, job_site_id, site_label, job_name, pour_type, supplier_name,
    scheduled_start, scheduled_end, arrive_by, timezone, service_date,
    travel_minutes, prep_minutes, pump_minutes, cleanup_minutes, estimated_yards, min_pump_size,
    lines_on_site, purchase_order_number, collect_on_delivery, customer_notes, site_instructions,
    internal_note, billing_service, max_pump_size, extra_items, booking_status, confirmed_at, created_by, updated_by)
  values (
    cid, private.next_job_number(cid), (p ->> 'customer_id')::uuid, nullif(p ->> 'job_site_id', '')::uuid,
    p ->> 'site_label', nullif(p ->> 'job_name', ''), nullif(p ->> 'pour_type', ''), nullif(p ->> 'supplier_name', ''),
    (p ->> 'scheduled_start')::timestamptz, (p ->> 'scheduled_end')::timestamptz,
    nullif(p ->> 'arrive_by', '')::timestamptz, tz, current_date,
    coalesce((p ->> 'travel_minutes')::int, 0), coalesce((p ->> 'prep_minutes')::int, 30),
    coalesce((p ->> 'pump_minutes')::int, 120), coalesce((p ->> 'cleanup_minutes')::int, 30),
    (p ->> 'estimated_yards')::numeric, nullif(p ->> 'min_pump_size', ''),
    coalesce((p ->> 'lines_on_site')::boolean, false), nullif(p ->> 'purchase_order_number', ''),
    coalesce((p ->> 'collect_on_delivery')::boolean, false), nullif(p ->> 'customer_notes', ''),
    nullif(p ->> 'site_instructions', ''), nullif(p ->> 'internal_note', ''), nullif(p ->> 'billing_service', ''),
    nullif(p ->> 'max_pump_size', ''), coalesce(p -> 'extra_items', '[]'::jsonb),
    status_value, case when status_value = 'confirmed' then now() end, auth.uid(), auth.uid())
  returning * into j;

  if nullif(p ->> 'contact_id', '') is not null then
    insert into public.job_contacts (company_id, job_id, contact_id)
    values (cid, j.id, (p ->> 'contact_id')::uuid);
  end if;

  insert into public.job_status_history (company_id, job_id, dimension, old_value, new_value, changed_by)
  values (cid, j.id, 'booking', null, status_value::text, auth.uid());

  perform private.apply_job_assignments(j, jsonb_build_object(
    'equipment_id', p -> 'equipment_id', 'employee_id', p -> 'employee_id',
    'second_employee_id', p -> 'second_employee_id'));

  return jsonb_build_object('id', j.id, 'job_number', j.job_number, 'version', j.version);
end
$$;


create or replace function public.update_job(p jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  cid uuid := private.require_booking_role();
  j public.jobs;
  expected int := (p ->> 'version')::int;
  new_booking public.booking_status;
  new_start timestamptz;
  new_end timestamptz;
begin
  select * into j from public.jobs where id = (p ->> 'id')::uuid and company_id = cid for update;
  if not found then
    raise exception 'order not found' using errcode = 'P0002';
  end if;
  if j.version <> expected then
    raise exception 'order changed' using errcode = 'P0409';
  end if;
  if j.booking_status = 'cancelled' then
    raise exception 'a cancelled order cannot be changed' using errcode = 'P0001';
  end if;

  new_booking := case when p ? 'booking_status' then (p ->> 'booking_status')::public.booking_status else j.booking_status end;
  if new_booking not in ('pending', 'confirmed') then
    raise exception 'use cancel_job to cancel' using errcode = 'P0001';
  end if;
  new_start := case when p ? 'scheduled_start' then (p ->> 'scheduled_start')::timestamptz else j.scheduled_start end;
  new_end := case when p ? 'scheduled_end' then (p ->> 'scheduled_end')::timestamptz else j.scheduled_end end;

  update public.jobs set
    customer_id = case when p ? 'customer_id' then (p ->> 'customer_id')::uuid else customer_id end,
    job_site_id = case when p ? 'job_site_id' then nullif(p ->> 'job_site_id', '')::uuid else job_site_id end,
    site_label = case when p ? 'site_label' then p ->> 'site_label' else site_label end,
    job_name = case when p ? 'job_name' then nullif(p ->> 'job_name', '') else job_name end,
    pour_type = case when p ? 'pour_type' then nullif(p ->> 'pour_type', '') else pour_type end,
    supplier_name = case when p ? 'supplier_name' then nullif(p ->> 'supplier_name', '') else supplier_name end,
    scheduled_start = new_start,
    scheduled_end = new_end,
    arrive_by = case when p ? 'arrive_by' then nullif(p ->> 'arrive_by', '')::timestamptz else arrive_by end,
    travel_minutes = case when p ? 'travel_minutes' then (p ->> 'travel_minutes')::int else travel_minutes end,
    prep_minutes = case when p ? 'prep_minutes' then (p ->> 'prep_minutes')::int else prep_minutes end,
    pump_minutes = case when p ? 'pump_minutes' then (p ->> 'pump_minutes')::int else pump_minutes end,
    cleanup_minutes = case when p ? 'cleanup_minutes' then (p ->> 'cleanup_minutes')::int else cleanup_minutes end,
    estimated_yards = case when p ? 'estimated_yards' then (p ->> 'estimated_yards')::numeric else estimated_yards end,
    min_pump_size = case when p ? 'min_pump_size' then nullif(p ->> 'min_pump_size', '') else min_pump_size end,
    lines_on_site = case when p ? 'lines_on_site' then (p ->> 'lines_on_site')::boolean else lines_on_site end,
    purchase_order_number = case when p ? 'purchase_order_number' then nullif(p ->> 'purchase_order_number', '') else purchase_order_number end,
    collect_on_delivery = case when p ? 'collect_on_delivery' then (p ->> 'collect_on_delivery')::boolean else collect_on_delivery end,
    customer_notes = case when p ? 'customer_notes' then nullif(p ->> 'customer_notes', '') else customer_notes end,
    site_instructions = case when p ? 'site_instructions' then nullif(p ->> 'site_instructions', '') else site_instructions end,
    internal_note = case when p ? 'internal_note' then nullif(p ->> 'internal_note', '') else internal_note end,
    billing_service = case when p ? 'billing_service' then nullif(p ->> 'billing_service', '') else billing_service end,
    max_pump_size = case when p ? 'max_pump_size' then nullif(p ->> 'max_pump_size', '') else max_pump_size end,
    extra_items = case when p ? 'extra_items' then coalesce(p -> 'extra_items', '[]'::jsonb) else extra_items end,
    booking_status = new_booking,
    confirmed_at = case when new_booking = 'confirmed' and booking_status <> 'confirmed' then now() else confirmed_at end,
    updated_by = auth.uid()
  where id = j.id
  returning * into j;

  -- booking status history: compare with the last recorded booking value
  if p ? 'booking_status' and new_booking::text is distinct from (
       select h.new_value from public.job_status_history h
        where h.job_id = j.id and h.dimension = 'booking' order by h.changed_at desc, h.id desc limit 1) then
    insert into public.job_status_history (company_id, job_id, dimension, old_value, new_value, changed_by)
    values (cid, j.id, 'booking',
      (select h.new_value from public.job_status_history h
        where h.job_id = j.id and h.dimension = 'booking' order by h.changed_at desc, h.id desc limit 1),
      new_booking::text, auth.uid());
  end if;

  -- contact: replace the job contact when given (null clears it)
  if p ? 'contact_id' then
    delete from public.job_contacts where job_id = j.id and role = 'job_contact';
    if nullif(p ->> 'contact_id', '') is not null then
      insert into public.job_contacts (company_id, job_id, contact_id)
      values (cid, j.id, (p ->> 'contact_id')::uuid);
    end if;
  end if;

  perform private.apply_job_assignments(j, p);

  -- dispatch: tell the assigned operator
  if p ->> 'dispatch' = 'true' then
    if not exists (select 1 from public.job_employee_assignments
                    where job_id = j.id and assignment_type = 'primary_operator' and released_at is null) then
      raise exception 'assign an operator before dispatching' using errcode = 'P0001';
    end if;
    update public.jobs set dispatch_status = 'dispatched', dispatched_at = now()
     where id = j.id and dispatch_status <> 'dispatched';
    insert into public.job_status_history (company_id, job_id, dimension, old_value, new_value, changed_by)
    select cid, j.id, 'dispatch', 'assigned', 'dispatched', auth.uid()
     where (select dispatch_status from public.jobs where id = j.id) = 'dispatched'
       and j.dispatch_status <> 'dispatched';
  end if;

  select * into j from public.jobs where id = j.id;
  return jsonb_build_object('id', j.id, 'job_number', j.job_number, 'version', j.version);
end
$$;

