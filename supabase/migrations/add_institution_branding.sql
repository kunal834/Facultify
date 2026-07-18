-- Run this in the Supabase SQL Editor if `institutions` was created before
-- this feature existed. (schema.sql already includes these for fresh installs.)
--
-- Adds institute brand colors + a public storage bucket for logo uploads,
-- both used to theme the shareable rank cards.

alter table institutions
  add column if not exists primary_color   text not null default '#3B6FFF',
  add column if not exists secondary_color text not null default '#7C3AED';

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('institution-assets', 'institution-assets', true, 2097152, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do nothing;

drop policy if exists "institution_assets_public_read" on storage.objects;
create policy "institution_assets_public_read" on storage.objects for select to public
  using (bucket_id = 'institution-assets');

drop policy if exists "institution_assets_admin_write" on storage.objects;
create policy "institution_assets_admin_write" on storage.objects for insert to authenticated
  with check (
    bucket_id = 'institution-assets' and
    (storage.foldername(name))[1] = auth_institution_id()::text and
    auth_role() = 'admin'
  );

drop policy if exists "institution_assets_admin_update" on storage.objects;
create policy "institution_assets_admin_update" on storage.objects for update to authenticated
  using (
    bucket_id = 'institution-assets' and
    (storage.foldername(name))[1] = auth_institution_id()::text and
    auth_role() = 'admin'
  );

drop policy if exists "institution_assets_admin_delete" on storage.objects;
create policy "institution_assets_admin_delete" on storage.objects for delete to authenticated
  using (
    bucket_id = 'institution-assets' and
    (storage.foldername(name))[1] = auth_institution_id()::text and
    auth_role() = 'admin'
  );
