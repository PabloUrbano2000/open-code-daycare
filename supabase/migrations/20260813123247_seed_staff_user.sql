insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values (
  '00000000-0000-0000-0000-000000000000',
  'a2b2c2d2-0000-0000-0000-000000000011',
  'authenticated', 'authenticated',
  'pablo@google.com',
  extensions.crypt('ElMaldy123@', extensions.gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"daycare_id":"a2b2c2d2-0000-0000-0000-000000000001","role":"staff","full_name":"Pablo"}',
  now(), now()
) on conflict (id) do nothing;

insert into auth.identities (
  id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
) values (
  'a2b2c2d2-0000-0000-0000-000000000011',
  'a2b2c2d2-0000-0000-0000-000000000011',
  '{"sub":"a2b2c2d2-0000-0000-0000-000000000011","email":"pablo@google.com"}',
  'email', 'pablo@google.com',
  now(), now(), now()
) on conflict (id) do nothing;
