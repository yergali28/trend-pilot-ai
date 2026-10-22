-- Рыночные показатели товаров площадки продажи от провайдера аналитики (MPStats и др.): выручка, продажи,
-- рейтинг, отзывы, остатки и дневные ряды за период. Значения только из ответа провайдера, со ссылкой на сырой ответ.
alter table public.products
  add column image_url text,
  add column brand text;

create table public.listing_stats (
  product_id uuid not null references public.products (id) on delete cascade,
  source_id text not null references public.data_sources (id),
  raw_response_id uuid not null references public.raw_responses (id),
  period_start date not null,
  period_end date not null,
  price numeric check (price >= 0),
  currency text,
  sales numeric check (sales >= 0),
  revenue numeric check (revenue >= 0),
  rating numeric check (rating between 0 and 5),
  reviews integer check (reviews >= 0),
  stock integer check (stock >= 0),
  seller text,
  -- Дневные ряды за период: { "sales": [...], "price": [...], "stock": [...] }, первый элемент — period_start.
  daily jsonb,
  fetched_at timestamptz not null,
  synthetic boolean not null
);
create index on public.listing_stats (product_id, fetched_at desc);

alter table public.listing_stats enable row level security;
create policy shared_read on public.listing_stats for select to authenticated using (true);
