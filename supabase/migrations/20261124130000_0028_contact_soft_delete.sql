-- 0028: delete a contact (client request). Inactive stays as it is; deleted is a separate state.
--   A deleted contact is also inactive, so every "active contacts only" place (order pickers, texts,
--   phone match) already leaves it out. Lists and the contact page also hide deleted ones.
--   The row is kept (soft delete), so old orders still show the name.

alter table public.contacts add column deleted_at timestamptz;

create index contacts_company_not_deleted_idx on public.contacts (company_id) where deleted_at is null;

-- Only CRM editors may update contacts (contacts_update policy); this lets them set deleted_at too.
grant update (deleted_at) on public.contacts to authenticated;
