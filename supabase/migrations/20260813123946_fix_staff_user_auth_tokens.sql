update auth.users
set confirmation_token = '',
    recovery_token = '',
    email_change = '',
    email_change_token_new = ''
where id = 'a2b2c2d2-0000-0000-0000-000000000011'
  and (confirmation_token is null or recovery_token is null or email_change is null or email_change_token_new is null);
