-- DukaanAI tenant and role foundation. Run this in Supabase SQL Editor.
create table if not exists public.stores (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  store_id uuid references public.stores(id) on delete cascade,
  email text not null default '',
  role text not null default 'staff' check (role in ('owner', 'manager', 'staff')),
  created_at timestamptz not null default now()
);

create index if not exists profiles_store_id_idx on public.profiles(store_id);
alter table public.stores enable row level security;
alter table public.profiles enable row level security;

-- Clients can only read their own role row. Role edits and team listing go through
-- the API, which verifies the Supabase access token and checks the caller's role.
drop policy if exists "read own profile" on public.profiles;
create policy "read own profile" on public.profiles for select to authenticated using (id = auth.uid());

create or replace function public.create_staff_profile()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, coalesce(new.email, ''), 'staff')
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile after insert on auth.users
for each row execute procedure public.create_staff_profile();

-- Bootstrap the first owner after creating an account and a store:
-- Create the store and copy the generated UUID: insert into public.stores (name) values ('Your Store') returning id;
-- Assign an existing auth user as Owner (works whether or not the trigger created their profile):
-- insert into public.profiles (id, email, store_id, role)
-- select id, email, '<STORE_UUID>', 'owner' from auth.users where id = '<AUTH_USER_UUID>'
-- on conflict (id) do update set store_id = excluded.store_id, role = 'owner', email = excluded.email;
-- Never place the Supabase service-role key in frontend environment variables.
