insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values (
  '00000000-0000-0000-0000-000000000000',
  'a2b2c2d2-0000-0000-0000-000000000012',
  'authenticated', 'authenticated',
  'lucia.fernandez@gmail.com',
  extensions.crypt('ElMaldy123@', extensions.gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"daycare_id":"a2b2c2d2-0000-0000-0000-000000000001","role":"parent","full_name":"Lucía Fernández"}',
  now(), now()
) on conflict (id) do nothing;

insert into auth.identities (
  id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
) values (
  'a2b2c2d2-0000-0000-0000-000000000012',
  'a2b2c2d2-0000-0000-0000-000000000012',
  '{"sub":"a2b2c2d2-0000-0000-0000-000000000012","email":"lucia.fernandez@gmail.com"}',
  'email', 'lucia.fernandez@gmail.com',
  now(), now(), now()
) on conflict (id) do nothing;

update auth.users
set confirmation_token = '',
    recovery_token = '',
    email_change = '',
    email_change_token_new = ''
where id = 'a2b2c2d2-0000-0000-0000-000000000012'
  and (confirmation_token is null or recovery_token is null or email_change is null or email_change_token_new is null);

insert into public.parent_children (parent_id, child_id, relationship) values
  ('a2b2c2d2-0000-0000-0000-000000000012', 'a2b2c2d2-0000-0000-0000-000000000201', 'mother'),
  ('a2b2c2d2-0000-0000-0000-000000000012', 'a2b2c2d2-0000-0000-0000-000000000202', 'mother')
on conflict (parent_id, child_id) do nothing;