create or replace function public.user_daycare_id()
returns uuid language sql stable set search_path = public as $$
  select daycare_id from public.users where id = auth.uid();
$$;

-- posts
create policy "posts_daycare_select"
  on public.posts for select to authenticated
  using (
    room_id in (select id from public.rooms where daycare_id = public.user_daycare_id())
    or exists (
      select 1 from public.post_children pc
      join public.children c on c.id = pc.child_id
      join public.rooms r on r.id = c.room_id
      where pc.post_id = posts.id and r.daycare_id = public.user_daycare_id()
    )
  );

create policy "posts_daycare_insert"
  on public.posts for insert to authenticated
  with check (
    author_id = auth.uid()
    and (select role from public.users where id = auth.uid()) = 'staff'
    and (room_id is null or room_id in (select id from public.rooms where daycare_id = public.user_daycare_id()))
  );

-- post_children
create policy "post_children_daycare_select"
  on public.post_children for select to authenticated
  using (
    exists (
      select 1 from public.children c
      join public.rooms r on r.id = c.room_id
      where c.id = post_children.child_id and r.daycare_id = public.user_daycare_id()
    )
  );

create policy "post_children_daycare_insert"
  on public.post_children for insert to authenticated
  with check (
    exists (
      select 1 from public.posts p
      join public.rooms r on r.id = p.room_id
      where p.id = post_id and r.daycare_id = public.user_daycare_id()
    )
    and exists (
      select 1 from public.children c
      join public.rooms r on r.id = c.room_id
      where c.id = child_id and r.daycare_id = public.user_daycare_id()
    )
  );

-- post_photos
create policy "post_photos_daycare_select"
  on public.post_photos for select to authenticated
  using (
    exists (
      select 1 from public.posts p
      join public.rooms r on r.id = p.room_id
      where p.id = post_photos.post_id and r.daycare_id = public.user_daycare_id()
    )
  );

create policy "post_photos_daycare_insert"
  on public.post_photos for insert to authenticated
  with check (
    exists (
      select 1 from public.posts p
      join public.rooms r on r.id = p.room_id
      where p.id = post_id and r.daycare_id = public.user_daycare_id()
    )
  );
