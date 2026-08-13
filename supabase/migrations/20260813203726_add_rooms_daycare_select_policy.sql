create policy "rooms_daycare_select"
  on public.rooms
  for select
  to authenticated
  using (daycare_id = (select daycare_id from public.users where id = auth.uid()));
