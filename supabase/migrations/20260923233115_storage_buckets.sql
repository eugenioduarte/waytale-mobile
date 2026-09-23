-- Private buckets for story audio and place/route images.
--
-- Neither bucket is public: clients get time-limited signed URLs (`createSignedUrl`), which needs
-- a SELECT policy on `storage.objects`. There are no INSERT/UPDATE/DELETE policies, so only the
-- service role (curation pipeline, Edge Functions) can upload or replace files.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('audio', 'audio', false, 52428800, array['audio/mpeg', 'audio/mp4', 'audio/aac', 'audio/ogg']),
  ('images', 'images', false, 10485760, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "Signed-in users can read story audio and images" on storage.objects
  for select to authenticated using (bucket_id in ('audio', 'images'));
