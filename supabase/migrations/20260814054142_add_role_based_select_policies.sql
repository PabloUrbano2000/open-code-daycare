-- posts
drop policy if exists "posts_daycare_select" on public.posts;

create policy "posts_staff_select"
  on public.posts for select to authenticated
  using (
    public.is_staff()
    and (
      room_id in (select id from public.rooms where daycare_id = public.user_daycare_id())
      or exists (
        select 1 from public.post_children pc
        join public.children c on c.id = pc.child_id
        join public.rooms r on r.id = c.room_id
        where pc.post_id = posts.id and r.daycare_id = public.user_daycare_id()
      )
    )
  );

create policy "posts_parent_select"
  on public.posts for select to authenticated
  using (
    public.is_parent()
    and (
      exists (
        select 1 from public.post_children pc
        join public.parent_children pc2 on pc2.child_id = pc.child_id
        where pc.post_id = posts.id and pc2.parent_id = auth.uid()
      )
      or (
        type = 'announcement'
        and room_id in (
          select c.room_id from public.children c
          join public.parent_children pc2 on pc2.child_id = c.id
          where pc2.parent_id = auth.uid()
        )
      )
    )
  );

-- post_children
drop policy if exists "post_children_daycare_select" on public.post_children;

create policy "post_children_staff_select"
  on public.post_children for select to authenticated
  using (
    public.is_staff()
    and exists (
      select 1 from public.children c
      join public.rooms r on r.id = c.room_id
      where c.id = post_children.child_id and r.daycare_id = public.user_daycare_id()
    )
  );

create policy "post_children_parent_select"
  on public.post_children for select to authenticated
  using (
    public.is_parent()
    and exists (
      select 1 from public.parent_children pc
      where pc.child_id = post_children.child_id and pc.parent_id = auth.uid()
    )
  );

-- post_photos
drop policy if exists "post_photos_daycare_select" on public.post_photos;

create policy "post_photos_staff_select"
  on public.post_photos for select to authenticated
  using (
    public.is_staff()
    and exists (
      select 1 from public.posts p
      join public.rooms r on r.id = p.room_id
      where p.id = post_photos.post_id and r.daycare_id = public.user_daycare_id()
    )
  );

create policy "post_photos_parent_select"
  on public.post_photos for select to authenticated
  using (
    public.is_parent()
    and exists (
      select 1 from public.posts p where p.id = post_photos.post_id
    )
  );

-- children
drop policy if exists "children_daycare_select" on public.children;

create policy "children_staff_select"
  on public.children for select to authenticated
  using (
    public.is_staff()
    and room_id in (select id from public.rooms where daycare_id = public.user_daycare_id())
  );

create policy "children_parent_select"
  on public.children for select to authenticated
  using (
    public.is_parent()
    and exists (
      select 1 from public.parent_children pc
      where pc.child_id = children.id and pc.parent_id = auth.uid()
    )
  );

-- parent_children
create policy "parent_children_parent_select"
  on public.parent_children for select to authenticated
  using (
    public.is_parent()
    and parent_id = auth.uid()
  );