-- 0010_company_logos: where a company's logo file lives.
-- The bucket itself refuses anything but PNG, JPG or WebP over 2 MB (SVG is left out: it can carry scripts).
-- Files sit in a folder named after the company, and only owners and admins can change them.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('company-logos', 'company-logos', true, 2097152, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create policy company_logos_read on storage.objects for select to authenticated
  using (bucket_id = 'company-logos'
    and (storage.foldername(name))[1] = (select private.company_id())::text);
create policy company_logos_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'company-logos'
    and (storage.foldername(name))[1] = (select private.company_id())::text
    and (select private.has_role('{owner,admin}')));
create policy company_logos_delete on storage.objects for delete to authenticated
  using (bucket_id = 'company-logos'
    and (storage.foldername(name))[1] = (select private.company_id())::text
    and (select private.has_role('{owner,admin}')));
