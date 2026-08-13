create type public.user_role         as enum ('staff', 'parent', 'admin');
create type public.user_status       as enum ('pending', 'active');
create type public.relationship_type as enum ('father', 'mother', 'guardian');
create type public.invitation_status as enum ('pending', 'accepted', 'expired', 'cancelled');
create type public.post_type         as enum ('meal', 'nap', 'activity', 'achievement', 'photo', 'announcement');
create type public.child_status      as enum ('active', 'archived');
