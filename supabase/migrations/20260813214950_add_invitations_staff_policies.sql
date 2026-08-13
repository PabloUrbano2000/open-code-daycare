create or replace function public.invitations_daycare_staff()
returns boolean language sql stable set search_path = public as $$
  select exists (
    select 1 from public.users u
    where u.id = auth.uid() and u.role = 'staff'
  );
$$;

create policy "invitations_daycare_select"
  on public.invitations for select to authenticated
  using (
    public.invitations_daycare_staff()
    and exists (
      select 1 from public.children c
      join public.rooms r on r.id = c.room_id
      where c.id = invitations.child_id
        and r.daycare_id = (select daycare_id from public.users where id = auth.uid())
    )
  );

create policy "invitations_daycare_insert"
  on public.invitations for insert to authenticated
  with check (
    public.invitations_daycare_staff()
    and exists (
      select 1 from public.children c
      join public.rooms r on r.id = c.room_id
      where c.id = child_id
        and r.daycare_id = (select daycare_id from public.users where id = auth.uid())
    )
  );

create policy "invitations_daycare_update"
  on public.invitations for update to authenticated
  using (
    public.invitations_daycare_staff()
    and exists (
      select 1 from public.children c
      join public.rooms r on r.id = c.room_id
      where c.id = invitations.child_id
        and r.daycare_id = (select daycare_id from public.users where id = auth.uid())
    )
  )
  with check (
    public.invitations_daycare_staff()
    and exists (
      select 1 from public.children c
      join public.rooms r on r.id = c.room_id
      where c.id = child_id
        and r.daycare_id = (select daycare_id from public.users where id = auth.uid())
    )
  );
