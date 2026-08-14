insert into public.posts (id, author_id, room_id, type, title, body, published_at) values
  ('a2b2c2d2-0000-0000-0000-000000000301', 'a2b2c2d2-0000-0000-0000-000000000011', null, 'achievement', null, '¡Usó el orinal solito por primera vez! Estaba feliz de contárselo a todos. Un gran paso.', now() - interval '3 hours'),
  ('a2b2c2d2-0000-0000-0000-000000000302', 'a2b2c2d2-0000-0000-0000-000000000011', null, 'activity', null, 'Pintamos con témperas esta mañana. Mateo eligió el azul para todo y se concentró un montón mezclando colores.', now() - interval '5 hours'),
  ('a2b2c2d2-0000-0000-0000-000000000303', 'a2b2c2d2-0000-0000-0000-000000000011', 'a2b2c2d2-0000-0000-0000-000000000101', 'announcement', 'Anuncio general', 'El viernes salimos al parque por la mañana. Recuerden mandar gorra y una botellita de agua.', now() - interval '7 hours')
on conflict (id) do nothing;

insert into public.post_children (post_id, child_id) values
  ('a2b2c2d2-0000-0000-0000-000000000301', 'a2b2c2d2-0000-0000-0000-000000000201'),
  ('a2b2c2d2-0000-0000-0000-000000000302', 'a2b2c2d2-0000-0000-0000-000000000201')
on conflict (post_id, child_id) do nothing;

insert into public.post_photos (id, post_id, url, position) values
  ('a2b2c2d2-0000-0000-0000-000000000401', 'a2b2c2d2-0000-0000-0000-000000000302', '/seed/temperas.webp', 0)
on conflict (id) do nothing;
