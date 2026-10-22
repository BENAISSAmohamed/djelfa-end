-- ENS Djelfa Portal - Supabase schema
-- Run in Supabase SQL Editor using a trusted project owner account.
-- Do not put service_role keys in the browser or in GitHub.

create extension if not exists pgcrypto;

do $$ begin
  create type public.app_role as enum ('student', 'teacher', 'admin');
exception when duplicate_object then null;
end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  email text not null default '',
  role public.app_role not null default 'student',
  specialty text,
  student_number text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 180),
  body text not null check (char_length(body) between 1 and 10000),
  published boolean not null default false,
  author_id uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.resources (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 180),
  description text,
  specialty text not null,
  subject text,
  kind text not null default 'lesson' check (kind in ('lesson','summary','exam','other')),
  file_path text,
  content text,
  published boolean not null default false,
  author_id uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists announcements_published_created_idx
  on public.announcements (published, created_at desc);
create index if not exists resources_published_created_idx
  on public.resources (published, created_at desc);
create index if not exists resources_specialty_idx on public.resources (specialty);

create or replace function public.current_app_role()
returns public.app_role
language sql stable security definer
set search_path = ''
as $$
  select p.role from public.profiles p where p.id = (select auth.uid())
$$;

create or replace function public.current_specialty()
returns text
language sql stable security definer
set search_path = ''
as $$
  select p.specialty from public.profiles p where p.id = (select auth.uid())
$$;

create or replace function public.is_teacher_or_admin()
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select coalesce(public.current_app_role() in ('teacher'::public.app_role, 'admin'::public.app_role), false)
$$;

create or replace function public.is_admin()
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select coalesce(public.current_app_role() = 'admin'::public.app_role, false)
$$;

-- Create profile for each new Auth user. The role is always forced to student.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, email, role, specialty, student_number)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.email, ''),
    'student'::public.app_role,
    nullif(new.raw_user_meta_data ->> 'specialty', ''),
    nullif(new.raw_user_meta_data ->> 'student_number', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles
for each row execute procedure public.set_updated_at();
drop trigger if exists announcements_set_updated_at on public.announcements;
create trigger announcements_set_updated_at before update on public.announcements
for each row execute procedure public.set_updated_at();
drop trigger if exists resources_set_updated_at on public.resources;
create trigger resources_set_updated_at before update on public.resources
for each row execute procedure public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.announcements enable row level security;
alter table public.resources enable row level security;

-- Profiles: authenticated users can read their own profile; admins can read all.
drop policy if exists "profile read own or admin" on public.profiles;
create policy "profile read own or admin" on public.profiles
for select to authenticated using (id = (select auth.uid()) or public.is_admin());

-- Users can update only non-privileged profile fields on their own record.
-- Role and email are protected by trigger below.
drop policy if exists "profile update own or admin" on public.profiles;
create policy "profile update own or admin" on public.profiles
for update to authenticated
using (id = (select auth.uid()) or public.is_admin())
with check (id = (select auth.uid()) or public.is_admin());

create or replace function public.protect_profile_privileges()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if (select auth.uid()) is not null and not public.is_admin() then
    if new.role is distinct from old.role then
      raise exception 'Only an administrator can change account roles';
    end if;
    if new.email is distinct from old.email then
      raise exception 'Email changes must be handled through Supabase Auth';
    end if;
    if new.id is distinct from old.id then
      raise exception 'Profile id cannot be changed';
    end if;
  end if;
  return new;
end;
$$;
drop trigger if exists profiles_protect_privileges on public.profiles;
create trigger profiles_protect_privileges before update on public.profiles
for each row execute procedure public.protect_profile_privileges();

-- Profiles cannot be inserted directly by browser clients or deleted through the app.
drop policy if exists "profile insert blocked" on public.profiles;
create policy "profile insert blocked" on public.profiles
for insert to authenticated with check (false);
drop policy if exists "profile delete admin only" on public.profiles;
create policy "profile delete admin only" on public.profiles
for delete to authenticated using (public.is_admin());

-- Announcements: anyone may read published items; only admins manage.
drop policy if exists "read published announcements" on public.announcements;
create policy "read published announcements" on public.announcements
for select to anon, authenticated using (published = true or public.is_admin());
drop policy if exists "admin insert announcements" on public.announcements;
create policy "admin insert announcements" on public.announcements
for insert to authenticated with check (public.is_admin() and author_id = (select auth.uid()));
drop policy if exists "admin update announcements" on public.announcements;
create policy "admin update announcements" on public.announcements
for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admin delete announcements" on public.announcements;
create policy "admin delete announcements" on public.announcements
for delete to authenticated using (public.is_admin());

-- Resources: published metadata is public; only teacher/admin can insert.
drop policy if exists "read published resources" on public.resources;
create policy "read published resources" on public.resources
for select to anon, authenticated using (published = true or author_id = (select auth.uid()) or public.is_admin());
drop policy if exists "teacher admin insert resources" on public.resources;
create policy "teacher admin insert resources" on public.resources
for insert to authenticated with check (
  public.is_teacher_or_admin() and author_id = (select auth.uid())
);
drop policy if exists "author or admin update resources" on public.resources;
create policy "author or admin update resources" on public.resources
for update to authenticated
using (author_id = (select auth.uid()) and public.is_teacher_or_admin() or public.is_admin())
with check (author_id = (select auth.uid()) and public.is_teacher_or_admin() or public.is_admin());
drop policy if exists "author or admin delete resources" on public.resources;
create policy "author or admin delete resources" on public.resources
for delete to authenticated
using ((author_id = (select auth.uid()) and public.is_teacher_or_admin()) or public.is_admin());

-- Private storage bucket. Signed URLs are generated by the app only after policy checks.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('learning-resources', 'learning-resources', false, 20971520,
  array['application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
on conflict (id) do update set public = false, file_size_limit = 20971520,
  allowed_mime_types = excluded.allowed_mime_types;

alter table storage.objects enable row level security;

drop policy if exists "teachers upload to own folder" on storage.objects;
create policy "teachers upload to own folder" on storage.objects
for insert to authenticated
with check (
  bucket_id = 'learning-resources'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and public.is_teacher_or_admin()
);

drop policy if exists "authorized users read resource files" on storage.objects;
create policy "authorized users read resource files" on storage.objects
for select to authenticated
using (
  bucket_id = 'learning-resources'
  and (
    public.is_admin()
    or (storage.foldername(name))[1] = (select auth.uid())::text
    or exists (
      select 1 from public.resources r
      where r.file_path = name and r.published = true
    )
  )
);

drop policy if exists "teachers update own files" on storage.objects;
create policy "teachers update own files" on storage.objects
for update to authenticated
using (
  bucket_id = 'learning-resources'
  and public.is_teacher_or_admin()
  and ((storage.foldername(name))[1] = (select auth.uid())::text or public.is_admin())
)
with check (
  bucket_id = 'learning-resources'
  and public.is_teacher_or_admin()
  and ((storage.foldername(name))[1] = (select auth.uid())::text or public.is_admin())
);

drop policy if exists "teachers delete own files" on storage.objects;
create policy "teachers delete own files" on storage.objects
for delete to authenticated
using (
  bucket_id = 'learning-resources'
  and public.is_teacher_or_admin()
  and ((storage.foldername(name))[1] = (select auth.uid())::text or public.is_admin())
);

-- IMPORTANT: Promote the initial administrator manually in SQL Editor only after
-- creating the account in Authentication > Users. Replace the email below:
-- update public.profiles set role = 'admin' where email = 'YOUR_ADMIN_EMAIL';


-- Attendance: teachers record a session and per-student status; students can read only their own records.
create table if not exists public.attendance_sessions (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles(id) on delete restrict,
  title text not null check (char_length(title) between 1 and 180),
  specialty text not null,
  class_name text,
  session_date date not null default current_date,
  created_at timestamptz not null default now()
);
create table if not exists public.attendance_records (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.attendance_sessions(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  status text not null check (status in ('present','absent','late')),
  session_date date not null default current_date,
  session_title text not null default 'Class session',
  class_name text,
  specialty text,
  created_at timestamptz not null default now(),
  unique(session_id, student_id)
);
create index if not exists attendance_records_student_idx on public.attendance_records(student_id, created_at desc);
create index if not exists attendance_sessions_teacher_date_idx on public.attendance_sessions(teacher_id, session_date desc);
alter table public.attendance_sessions enable row level security;
alter table public.attendance_records enable row level security;

drop policy if exists "teachers read student roster" on public.profiles;
create policy "teachers read student roster" on public.profiles for select to authenticated
using (public.is_teacher_or_admin() and role = 'student' and (specialty = public.current_specialty() or public.is_admin()));

drop policy if exists "teacher create attendance session" on public.attendance_sessions;
create policy "teacher create attendance session" on public.attendance_sessions for insert to authenticated
with check (public.is_teacher_or_admin() and teacher_id = (select auth.uid()));
drop policy if exists "teacher read own sessions admin all" on public.attendance_sessions;
create policy "teacher read own sessions admin all" on public.attendance_sessions for select to authenticated
using (teacher_id = (select auth.uid()) or public.is_admin());
drop policy if exists "student read own attendance or teacher roster" on public.attendance_records;
create policy "student read own attendance or teacher roster" on public.attendance_records for select to authenticated
using (student_id = (select auth.uid()) or public.is_admin() or exists (select 1 from public.attendance_sessions s where s.id = session_id and s.teacher_id = (select auth.uid())));
drop policy if exists "teacher add attendance for own session" on public.attendance_records;
create policy "teacher add attendance for own session" on public.attendance_records for insert to authenticated
with check (exists (select 1 from public.attendance_sessions s where s.id = session_id and s.teacher_id = (select auth.uid()) and public.is_teacher_or_admin()) and exists (select 1 from public.profiles p where p.id = student_id and p.role = 'student' and (p.specialty = (select s.specialty from public.attendance_sessions s where s.id = session_id) or public.is_admin())));

-- Safe migration statements for projects where the original schema was already applied.
alter table public.resources alter column file_path drop not null;
alter table public.resources add column if not exists content text;
alter table public.attendance_records add column if not exists session_date date not null default current_date;
alter table public.attendance_records add column if not exists session_title text not null default 'Class session';
alter table public.attendance_records add column if not exists class_name text;
alter table public.attendance_records add column if not exists specialty text;
