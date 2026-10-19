-- Справочники из API площадок: модель продаж и категория площадки как в ответе источника.
-- Страна может быть неизвестна (WB не указывает её у комиссий) — тогда null, а не домысленное значение.
-- Совместимо с прошлой версией: новые колонки допускают null, ограничения ослабляются.
alter table public.fee_rules
  add column scheme text,
  add column external_category_id text,
  add column external_category_name text,
  add column external_parent_name text,
  alter column country drop not null;

alter table public.logistics_rates
  alter column country drop not null;

create index on public.fee_rules (marketplace_id, external_category_id);
