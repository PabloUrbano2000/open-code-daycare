drop policy if exists "posts_daycare_select" on public.posts;

create policy "posts_daycare_select"
  on public.posts for select to authenticated
  using (
    room_id in (select id from public.rooms where daycare_id = public.user_daycare_id())
  );