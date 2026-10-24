-- Tighten the initial RBAC foundation: keep trigger code outside exposed schemas,
-- use a cached auth.uid() call, and allow each member to read their own store row.
create schema if not exists private;

create or replace function private.create_staff_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, coalesce(new.email, ''), 'staff')
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

revoke all on function private.create_staff_profile() from public, anon, authenticated, service_role;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
after insert on auth.users
for each row execute procedure private.create_staff_profile();

drop function if exists public.create_staff_profile();

drop policy if exists "read own profile" on public.profiles;
create policy "read own profile" on public.profiles
for select to authenticated
using ((select auth.uid()) = id);

drop policy if exists "members read own store" on public.stores;
create policy "members read own store" on public.stores
for select to authenticated
using (
  exists (
    select 1 from public.profiles as p
    where p.id = (select auth.uid())
      and p.store_id = stores.id
  )
);