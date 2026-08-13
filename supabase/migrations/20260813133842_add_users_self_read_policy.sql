create policy "users_self_select"
  on public.users
  for select
  to authenticated
  using (auth.uid() = id);
