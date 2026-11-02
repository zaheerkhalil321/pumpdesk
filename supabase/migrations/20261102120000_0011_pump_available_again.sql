-- 0011_pump_available_again: when a pump in maintenance is expected back.
-- A pump in maintenance with a date counts as available from that day; with no date it stays in
-- maintenance until someone sets it back to available.

alter table public.equipment
  add column available_again_on date;

-- equipment uses column-level grants, so the new column needs its own.
grant insert (available_again_on) on public.equipment to authenticated;
grant update (available_again_on) on public.equipment to authenticated;
