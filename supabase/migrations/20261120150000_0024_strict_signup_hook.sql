-- 0024_strict_signup_hook: who may create a login.
-- The email provider must stay on (in GoTrue, turning email sign-up off turns email *login* off too, so
-- office staff could not sign in to the dashboard). So the hook is the only gate, and it is strict again:
--   * a phone number of an active operator may sign itself up (operator app);
--   * nobody else signs themselves up (email or any other phone): signup_not_allowed.
-- Admins still add office staff with "Create user" in Supabase (the admin API does not run this hook).
-- "Invite user" by email does run it, so invites are refused: add office users with "Create user".

create or replace function private.hook_before_user_created(event jsonb) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  digits text := private.phone_digits(event -> 'user' ->> 'phone');
begin
  if digits = '' then
    return jsonb_build_object('error', jsonb_build_object('http_code', 403, 'message', 'signup_not_allowed'));
  end if;
  if exists (
       select 1 from public.employees e
        where e.is_operator and e.status = 'active' and e.phone = '+' || digits) then
    return '{}'::jsonb;
  end if;
  return jsonb_build_object('error', jsonb_build_object('http_code', 403, 'message', 'phone_not_found'));
end
$$;

revoke execute on function private.hook_before_user_created(jsonb) from public, anon, authenticated;
grant execute on function private.hook_before_user_created(jsonb) to supabase_auth_admin;
