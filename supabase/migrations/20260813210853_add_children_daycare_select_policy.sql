create policy "children_daycare_select"
  on public.children
  for select
  to authenticated
  using (
    room_id in (
      select id from public.rooms
      where daycare_id = (select daycare_id from public.users where id = auth.uid())
    )
  );