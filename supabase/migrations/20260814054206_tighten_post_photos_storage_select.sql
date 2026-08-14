drop policy if exists "post_photos_storage_select" on storage.objects;

create policy "post_photos_storage_select"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'post-photos'
    and (
      (
        public.is_staff()
        and (storage.foldername(name))[1] = (
          select daycare_id::text from public.users where id = auth.uid()
        )
      )
      or (
        public.is_parent()
        and exists (
          select 1
          from public.post_photos pp
          join public.posts p on p.id = pp.post_id
          where pp.url = name
        )
      )
    )
  );