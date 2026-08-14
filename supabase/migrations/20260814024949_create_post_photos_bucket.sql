insert into storage.buckets (id, name, public)
values ('post-photos', 'post-photos', false)
on conflict (id) do nothing;

create policy "post_photos_storage_insert"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'post-photos'
    and (select role from public.users where id = auth.uid()) = 'staff'
    and (storage.foldername(name))[1] = (select daycare_id::text from public.users where id = auth.uid())
  );

create policy "post_photos_storage_select"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'post-photos'
    and (storage.foldername(name))[1] = (select daycare_id::text from public.users where id = auth.uid())
  );
