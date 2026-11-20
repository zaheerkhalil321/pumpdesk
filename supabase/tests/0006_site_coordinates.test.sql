begin;
create extension if not exists pgtap with schema extensions;
select plan(10);

-- Users: admin c..02, dispatcher c..03. Midcoast customer e1..101.
create function pg_temp.rows_changed(stmt text) returns bigint language plpgsql as $f$
declare n bigint;
begin
  execute stmt;
  get diagnostics n = row_count;
  return n;
end $f$;

set local role authenticated;
set local request.jwt.claims = '{"sub": "c0000000-0000-4000-8000-000000000003", "role": "authenticated"}';

-- 1. An order keeps the map point Google gave for its typed address
select set_config('app.job', (public.book_job($j$
  {"customer_id": "e1000000-0000-4000-8000-000000000101", "site_label": "50 Niilo Hill Rd, Warren, ME", "estimated_yards": 10,
   "site_latitude": 44.1234567, "site_longitude": -69.2345678,
   "scheduled_start": "2026-09-12T11:00:00Z", "scheduled_end": "2026-09-12T15:00:00Z"}
$j$::jsonb)) ->> 'id', true);
select is((select site_latitude || ',' || site_longitude from public.jobs where id = current_setting('app.job')::uuid),
  '44.1234567,-69.2345678', 'book_job saves the point');

-- 2. An order without a point has none
select is((select site_latitude from public.jobs where id = (public.book_job($j$
  {"customer_id": "e1000000-0000-4000-8000-000000000101", "site_label": "Rockland", "estimated_yards": 10,
   "scheduled_start": "2026-09-13T11:00:00Z", "scheduled_end": "2026-09-13T15:00:00Z"}
$j$::jsonb) ->> 'id')::uuid), null, 'an order without a point has none');

-- 3. An edit that does not mention the point keeps it
select public.update_job(jsonb_build_object('id', current_setting('app.job'),
  'version', (select version from public.jobs where id = current_setting('app.job')::uuid), 'job_name', 'Slab'));
select is((select site_longitude from public.jobs where id = current_setting('app.job')::uuid), -69.2345678::numeric,
  'update_job keeps the point when it is not sent');

-- 4. A new point replaces it, and null clears it
select public.update_job(jsonb_build_object('id', current_setting('app.job'),
  'version', (select version from public.jobs where id = current_setting('app.job')::uuid),
  'site_latitude', 43.5, 'site_longitude', -70.25));
select is((select site_latitude || ',' || site_longitude from public.jobs where id = current_setting('app.job')::uuid),
  '43.5000000,-70.2500000', 'update_job replaces the point');
select public.update_job(jsonb_build_object('id', current_setting('app.job'),
  'version', (select version from public.jobs where id = current_setting('app.job')::uuid),
  'site_label', 'Camden', 'site_latitude', null, 'site_longitude', null));
select is((select site_latitude from public.jobs where id = current_setting('app.job')::uuid), null, 'update_job clears the point');

-- 5. A point is both numbers, and a real place
select throws_ok($j$select public.book_job('{"customer_id": "e1000000-0000-4000-8000-000000000101", "site_label": "x", "estimated_yards": 5,
  "site_latitude": 44.1, "scheduled_start": "2026-09-12T11:00:00Z", "scheduled_end": "2026-09-12T15:00:00Z"}'::jsonb)$j$,
  '23514', null, 'a latitude without a longitude is refused');
select throws_ok($j$select public.book_job('{"customer_id": "e1000000-0000-4000-8000-000000000101", "site_label": "x", "estimated_yards": 5,
  "site_latitude": 144.1, "site_longitude": -69.2, "scheduled_start": "2026-09-12T11:00:00Z", "scheduled_end": "2026-09-12T15:00:00Z"}'::jsonb)$j$,
  '23514', null, 'a latitude beyond 90 is refused');

-- 6. Job sites take a point through the table grants (the app writes them directly)
select lives_ok($q$insert into public.job_sites (customer_id, city, state, latitude, longitude)
  values ('e1000000-0000-4000-8000-000000000101', 'Warren', 'ME', 44.1234567, -69.2345678)$q$, 'a dispatcher saves a job site with a point');
select is((select latitude from public.job_sites where city = 'Warren' and latitude is not null limit 1), 44.1234567::numeric, 'the job site keeps it');

-- 7. Branches too (owner or admin)
set local request.jwt.claims = '{"sub": "c0000000-0000-4000-8000-000000000002", "role": "authenticated"}';
select is(pg_temp.rows_changed($q$update public.branches set latitude = 44.1, longitude = -69.2 where is_hq$q$) > 0, true,
  'an admin saves a branch point');

select * from finish();
rollback;
