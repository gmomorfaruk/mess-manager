-- ============================================
-- MESS MANAGER - SUPABASE DATABASE SCHEMA
-- Run this in your Supabase SQL editor
-- ============================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─────────────────────────────────────────────
-- TABLES
-- ─────────────────────────────────────────────

-- PROFILES
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  avatar_url text,
  created_at timestamptz default now()
);

-- MESSES
create table if not exists messes (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);

-- MESS MEMBERS
create table if not exists mess_members (
  id uuid primary key default uuid_generate_v4(),
  mess_id uuid references messes(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete set null,
  name text not null,
  email text,
  role text not null check (role in ('admin', 'manager', 'member')) default 'member',
  is_active boolean default true,
  joined_at timestamptz default now()
);

-- MEAL SETTINGS
create table if not exists meal_settings (
  id uuid primary key default uuid_generate_v4(),
  mess_id uuid references messes(id) on delete cascade not null unique,
  morning_value numeric(4,2) not null default 0.5,
  lunch_value numeric(4,2) not null default 1.0,
  dinner_value numeric(4,2) not null default 1.0,
  updated_at timestamptz default now()
);

-- DAILY MEALS
create table if not exists daily_meals (
  id uuid primary key default uuid_generate_v4(),
  mess_id uuid references messes(id) on delete cascade not null,
  member_id uuid references mess_members(id) on delete cascade not null,
  date date not null,
  took_morning boolean default false,
  took_lunch boolean default false,
  took_dinner boolean default false,
  created_by uuid references profiles(id),
  created_at timestamptz default now(),
  unique(mess_id, member_id, date)
);

-- DAILY COSTS
create table if not exists daily_costs (
  id uuid primary key default uuid_generate_v4(),
  mess_id uuid references messes(id) on delete cascade not null,
  date date not null,
  amount numeric(10,2) not null,
  note text,
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);

-- DEPOSITS
create table if not exists deposits (
  id uuid primary key default uuid_generate_v4(),
  mess_id uuid references messes(id) on delete cascade not null,
  member_id uuid references mess_members(id) on delete cascade not null,
  amount numeric(10,2) not null,
  date date not null,
  note text,
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);

-- ─────────────────────────────────────────────
-- RLS & POLICIES
-- ─────────────────────────────────────────────

create or replace function public.is_member_of_mess(target_mess uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.mess_members mm
    where mm.mess_id = target_mess
      and mm.user_id = auth.uid()
      and mm.is_active = true
  );
$$;

create or replace function public.is_admin_of_mess(target_mess uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.mess_members mm
    where mm.mess_id = target_mess
      and mm.user_id = auth.uid()
      and mm.role = 'admin'
      and mm.is_active = true
  );
$$;

create or replace function public.is_manager_or_admin_of_mess(target_mess uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.mess_members mm
    where mm.mess_id = target_mess
      and mm.user_id = auth.uid()
      and mm.role in ('admin', 'manager')
      and mm.is_active = true
  );
$$;

alter table profiles enable row level security;
create policy "Users can view own profile"
  on profiles for select using (auth.uid() = id);
create policy "Users can update own profile"
  on profiles for update using (auth.uid() = id);
create policy "Users can insert own profile"
  on profiles for insert
  with check (auth.uid() = id);

alter table messes enable row level security;
create policy "Members can view their mess"
  on messes for select
  using (public.is_member_of_mess(id));
create policy "Admins can update mess"
  on messes for update
  using (public.is_admin_of_mess(id));
create policy "Authenticated users can create mess"
  on messes for insert
  with check (auth.uid() = created_by);

alter table mess_members enable row level security;
create policy "Members can view mess members"
  on mess_members for select
  using (public.is_member_of_mess(mess_id));
create policy "Users can view own member record"
  on mess_members for select
  using (user_id = auth.uid());
create policy "Creator can add self as first admin"
  on mess_members for insert
  with check (
    user_id = auth.uid()
    and role = 'admin'
    and exists (
      select 1
      from public.messes m
      where m.id = mess_id
        and m.created_by = auth.uid()
    )
  );
create policy "Admins can insert members"
  on mess_members for insert
  with check (public.is_admin_of_mess(mess_id));
create policy "Admins can update members"
  on mess_members for update
  using (public.is_admin_of_mess(mess_id))
  with check (public.is_admin_of_mess(mess_id));
create policy "Admins can delete members"
  on mess_members for delete
  using (public.is_admin_of_mess(mess_id));

alter table meal_settings enable row level security;
create policy "Members can view meal settings"
  on meal_settings for select
  using (public.is_member_of_mess(mess_id));
create policy "Admins can manage meal settings"
  on meal_settings for all
  using (public.is_admin_of_mess(mess_id))
  with check (public.is_admin_of_mess(mess_id));

alter table daily_meals enable row level security;
create policy "Members can view all meals in their mess"
  on daily_meals for select
  using (public.is_member_of_mess(mess_id));
create policy "Managers and admins can manage meals"
  on daily_meals for all
  using (public.is_manager_or_admin_of_mess(mess_id))
  with check (public.is_manager_or_admin_of_mess(mess_id));

alter table daily_costs enable row level security;
create policy "Members can view costs in their mess"
  on daily_costs for select
  using (public.is_member_of_mess(mess_id));
create policy "Managers and admins can manage costs"
  on daily_costs for all
  using (public.is_manager_or_admin_of_mess(mess_id))
  with check (public.is_manager_or_admin_of_mess(mess_id));

alter table deposits enable row level security;
create policy "Members can view deposits in their mess"
  on deposits for select
  using (public.is_member_of_mess(mess_id));
create policy "Managers and admins can manage deposits"
  on deposits for all
  using (public.is_manager_or_admin_of_mess(mess_id))
  with check (public.is_manager_or_admin_of_mess(mess_id));

-- ─────────────────────────────────────────────
-- TRIGGERS
-- ─────────────────────────────────────────────

create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, full_name, email, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.email,
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do update
    set full_name = coalesce(excluded.full_name, profiles.full_name),
        email = coalesce(excluded.email, profiles.email),
        avatar_url = coalesce(excluded.avatar_url, profiles.avatar_url);
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ─────────────────────────────────────────────
-- INDEXES
-- ─────────────────────────────────────────────

create index if not exists idx_mess_members_user_id on mess_members(user_id);
create index if not exists idx_mess_members_mess_id on mess_members(mess_id);
create index if not exists idx_daily_meals_mess_date on daily_meals(mess_id, date);
create index if not exists idx_daily_costs_mess_date on daily_costs(mess_id, date);
create index if not exists idx_deposits_mess_member on deposits(mess_id, member_id);

