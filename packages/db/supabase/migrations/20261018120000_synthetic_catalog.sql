-- Демо-каталог (категории и сопоставления) помечается так же, как товары: synthetic = true.
-- Совместимо с прошлой версией: новые колонки со значением по умолчанию.
alter table public.categories add column synthetic boolean not null default false;
alter table public.matches add column synthetic boolean not null default false;
create index on public.products (category_id);
create index on public.matches (listing_product_id);
