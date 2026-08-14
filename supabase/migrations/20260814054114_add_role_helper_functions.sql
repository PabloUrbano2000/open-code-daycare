create or replace function public.is_staff()
returns boolean
language sql
stable
set search_path = public
as $$
  select exists (
    select 1 from public.users u
    where u.id = auth.uid()
      and u.role = 'staff'
  );
$$;

create or replace function public.is_parent()
returns boolean
language sql
stable
set search_path = public
as $$
  select exists (
    select 1 from public.users u
    where u.id = auth.uid()
      and u.role = 'parent'
  );
$$;