-- NOVA Hair Atelier Supabase setup
-- Run this once in your Supabase project's SQL Editor.

-- Enable UUID generation if it is not already available.
create extension if not exists pgcrypto;

-- Generic app-state table used by the current React app.
-- Each feature saves one JSON row, which keeps the existing UI fast to migrate
-- while making every current save path durable in Supabase.
create table if not exists public.nova_app_state (
  state_key text primary key,
  value jsonb not null default 'null'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.nova_app_state enable row level security;

drop policy if exists "nova_app_state_public_read" on public.nova_app_state;
drop policy if exists "nova_app_state_public_insert" on public.nova_app_state;
drop policy if exists "nova_app_state_public_update" on public.nova_app_state;

create policy "nova_app_state_public_read"
on public.nova_app_state
for select
to anon, authenticated
using (true);

create policy "nova_app_state_public_insert"
on public.nova_app_state
for insert
to anon, authenticated
with check (
  state_key in (
    'catalog',
    'appointments',
    'transactions',
    'clients',
    'employees',
    'paymentConfig',
    'companyInfo',
    'pos',
    'notifications',
    'sentReminders',
    'reminderRules'
  )
);

create policy "nova_app_state_public_update"
on public.nova_app_state
for update
to anon, authenticated
using (
  state_key in (
    'catalog',
    'appointments',
    'transactions',
    'clients',
    'employees',
    'paymentConfig',
    'companyInfo',
    'pos',
    'notifications',
    'sentReminders',
    'reminderRules'
  )
)
with check (
  state_key in (
    'catalog',
    'appointments',
    'transactions',
    'clients',
    'employees',
    'paymentConfig',
    'companyInfo',
    'pos',
    'notifications',
    'sentReminders',
    'reminderRules'
  )
);

-- Public storage bucket for logos, catalog item images, and payment QR codes.
insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'app-assets',
  'app-assets',
  true,
  10485760,
  array['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "app_assets_public_read" on storage.objects;
drop policy if exists "app_assets_public_upload" on storage.objects;
drop policy if exists "app_assets_public_update" on storage.objects;

create policy "app_assets_public_read"
on storage.objects
for select
to anon, authenticated
using (
  bucket_id = 'app-assets'
);

create policy "app_assets_public_upload"
on storage.objects
for insert
to anon, authenticated
with check (
  bucket_id = 'app-assets'
  and name like 'uploads/%'
);

create policy "app_assets_public_update"
on storage.objects
for update
to anon, authenticated
using (
  bucket_id = 'app-assets'
  and name like 'uploads/%'
)
with check (
  bucket_id = 'app-assets'
  and name like 'uploads/%'
);
