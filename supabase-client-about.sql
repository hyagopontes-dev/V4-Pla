alter table public.clients
  add column if not exists logo_url text,
  add column if not exists about text;
