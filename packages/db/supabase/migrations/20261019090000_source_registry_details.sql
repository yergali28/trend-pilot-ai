-- Реестр источников (5.4): дата проверки документации, лимиты по категориям API, что источник даёт и чего не даёт.
-- Совместимо с прошлой версией: новые колонки допускают null.
alter table public.data_sources
  add column checked_at date,
  add column docs_url text,
  add column rate_limits jsonb,
  add column provides text,
  add column limitations text;
