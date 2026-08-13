create table public.parent_children (
  id           uuid primary key default gen_random_uuid(),
  parent_id    uuid not null references public.users (id),
  child_id     uuid not null references public.children (id),
  relationship public.relationship_type not null,
  created_at   timestamptz not null default now(),
  unique (parent_id, child_id)
);

create index parent_children_child_id_idx on public.parent_children (child_id);
alter table public.parent_children enable row level security;
