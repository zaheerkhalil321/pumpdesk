-- 0004: remove archived_at. A deleted row is just is_active = false (soft delete).

drop trigger customers_archived_at on public.customers;
drop trigger contacts_archived_at on public.contacts;
drop function private.set_archived_at();

alter table public.customers drop column archived_at;
alter table public.contacts drop column archived_at;

-- Audit log: a soft delete is logged as "deleted".
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
    when old_j ->> 'is_active' = 'true' and new_j ->> 'is_active' = 'false' then 'deleted'
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

-- Existing log rows use the new wording too.
update public.activity_log
set action = 'deleted', summary = pg_catalog.replace(summary, 'Archived ', 'Deleted ')
where action = 'archived';
