-- 0015_optional_yards: the order's yardage is optional. No yardage is saved as 0, and the pour then
-- defaults to 1 hour (the app works the pour length out from the yardage).

alter table public.jobs drop constraint if exists jobs_estimated_yards_check;
alter table public.jobs add constraint jobs_estimated_yards_check check (estimated_yards >= 0 and estimated_yards <= 10000);

create or replace function public.book_job(p jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  cid uuid := private.require_booking_role();
  tz text := coalesce(nullif(p ->> 'timezone', ''), (select c.timezone from public.companies c where c.id = cid));
  j public.jobs;
  status_value public.booking_status := coalesce(nullif(p ->> 'booking_status', ''), 'pending')::public.booking_status;
begin
  if status_value not in ('pending', 'inspection_pending', 'confirmed', 'turned_in', 'reviewed') then
    raise exception 'use cancel_job to cancel' using errcode = 'P0001';
  end if;

  insert into public.jobs (
    company_id, job_number, customer_id, job_site_id, site_label, job_name, pour_type, supplier_name,
    scheduled_start, scheduled_end, arrive_by, timezone, service_date,
    travel_minutes, linked_to_previous, prep_minutes, pump_minutes, cleanup_minutes, estimated_yards, min_pump_size,
    lines_on_site, purchase_order_number, collect_on_delivery, customer_notes, site_instructions,
    internal_note, billing_service, max_pump_size, extra_items, booking_status, confirmed_at, created_by, updated_by)
  values (
    cid, private.next_job_number(cid), (p ->> 'customer_id')::uuid, nullif(p ->> 'job_site_id', '')::uuid,
    p ->> 'site_label', nullif(p ->> 'job_name', ''), nullif(p ->> 'pour_type', ''), nullif(p ->> 'supplier_name', ''),
    (p ->> 'scheduled_start')::timestamptz, (p ->> 'scheduled_end')::timestamptz,
    nullif(p ->> 'arrive_by', '')::timestamptz, tz, current_date,
    coalesce((p ->> 'travel_minutes')::int, 0), coalesce((p ->> 'linked_to_previous')::boolean, false),
    coalesce((p ->> 'prep_minutes')::int, 30),
    coalesce((p ->> 'pump_minutes')::int, 120), coalesce((p ->> 'cleanup_minutes')::int, 30),
    coalesce((p ->> 'estimated_yards')::numeric, 0), nullif(p ->> 'min_pump_size', ''),
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

