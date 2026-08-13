create table public.invitations (
  id           uuid primary key default gen_random_uuid(),
  child_id     uuid not null references public.children (id),
  invited_by   uuid not null references public.users (id),
  full_name    text not null,
  email        text not null,
  relationship public.relationship_type not null,
  code         text not null unique,
  status       public.invitation_status not null default 'pending',
  expires_at   timestamptz not null,
  accepted_at  timestamptz,
  created_at   timestamptz not null default now()
);

create index invitations_child_id_idx on public.invitations (child_id);
create index invitations_invited_by_idx on public.invitations (invited_by);

alter table public.invitations enable row level security;
