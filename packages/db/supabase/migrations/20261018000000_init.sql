-- Модель данных по разделу 10 docs/TZ.md.
-- Справочники создаются пустыми: значения появляются только из официальных источников с датой и источником.
-- Пользователи — auth.users (Supabase Auth), отдельной таблицы users нет.

-- ===== Организации, доступ, тарифы =====

create table public.plans (
  id text primary key,
  name text not null,
  limits jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table public.memberships (
  org_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('owner', 'member', 'viewer')),
  created_at timestamptz not null default now(),
  primary key (org_id, user_id)
);
create index on public.memberships (user_id);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  plan_id text not null references public.plans (id),
  status text not null check (status in ('trial', 'active', 'paused', 'cancelled')),
  period_start timestamptz,
  period_end timestamptz,
  created_at timestamptz not null default now()
);
create index on public.subscriptions (org_id);

create table public.usage_counters (
  org_id uuid not null references public.organizations (id) on delete cascade,
  metric text not null,
  period_start date not null,
  used integer not null default 0 check (used >= 0),
  primary key (org_id, metric, period_start)
);

create table public.platform_admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

-- Одноразовые приглашения. Хранится только sha256 токена, сам токен отдаётся один раз при создании.
create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  email text not null,
  role text not null check (role in ('owner', 'member', 'viewer')),
  token_hash text not null unique,
  expires_at timestamptz not null,
  used_at timestamptz,
  used_by uuid references auth.users (id),
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now()
);
create index on public.invitations (org_id);

-- ===== Источники и сырые данные =====

create table public.marketplaces (
  id text primary key,
  name text not null,
  role text not null check (role in ('sell', 'buy', 'analytics'))
);

create table public.data_sources (
  id text primary key,
  marketplace_id text references public.marketplaces (id),
  role text not null check (role in ('sell', 'buy', 'analytics')),
  layer text not null check (layer in ('A', 'B', 'C', 'D', 'E')),
  method text not null check (method in ('api', 'provider', 'public_page', 'user_input', 'reference')),
  status text not null default 'pending_registration'
    check (status in ('active', 'pending_registration', 'blocked', 'disabled')),
  status_reason text,
  mode text not null default 'replay' check (mode in ('live', 'replay', 'mock')),
  rate_limit_per_minute integer check (rate_limit_per_minute > 0),
  rate_limit_per_day integer check (rate_limit_per_day > 0),
  request_cost numeric check (request_cost >= 0),
  request_cost_currency text,
  token_expires_at timestamptz,
  last_success_at timestamptz,
  success_rate numeric check (success_rate between 0 and 1),
  updated_at timestamptz not null default now()
);

create table public.adapter_runs (
  id uuid primary key default gen_random_uuid(),
  source_id text not null references public.data_sources (id),
  mode text not null check (mode in ('live', 'replay', 'mock')),
  status text not null default 'running' check (status in ('running', 'succeeded', 'failed')),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  records_ok integer,
  records_rejected integer,
  error text
);
create index on public.adapter_runs (source_id, started_at desc);

create table public.raw_responses (
  id uuid primary key default gen_random_uuid(),
  source_id text not null references public.data_sources (id),
  adapter_run_id uuid references public.adapter_runs (id),
  mode text not null check (mode in ('live', 'replay', 'mock')),
  request jsonb not null,
  body jsonb not null,
  fetched_at timestamptz not null,
  synthetic boolean not null,
  created_at timestamptz not null default now()
);
create index on public.raw_responses (source_id, fetched_at desc);

-- ===== Каталог =====

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references public.categories (id),
  name text not null,
  marketplace_id text references public.marketplaces (id),
  external_id text
);

create table public.suppliers (
  id uuid primary key default gen_random_uuid(),
  source_id text not null references public.data_sources (id),
  external_id text not null,
  name text,
  rating numeric,
  active_since date,
  unique (source_id, external_id)
);

-- Товар источника: kind = source (площадка закупки) или listing (площадка продажи).
create table public.products (
  id uuid primary key default gen_random_uuid(),
  source_id text not null references public.data_sources (id),
  kind text not null check (kind in ('source', 'listing')),
  external_id text not null,
  title text not null,
  url text,
  category_id uuid references public.categories (id),
  supplier_id uuid references public.suppliers (id),
  weight_kg numeric check (weight_kg >= 0),
  dimensions_cm jsonb,
  synthetic boolean not null,
  first_seen_at timestamptz not null default now(),
  unique (source_id, external_id)
);

-- Текущее предложение (цена, продавец, MOQ) с происхождением.
create table public.offers (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  source_id text not null references public.data_sources (id),
  raw_response_id uuid not null references public.raw_responses (id),
  method text not null check (method in ('api', 'provider', 'public_page', 'user_input', 'reference')),
  price numeric not null check (price >= 0),
  currency text not null,
  seller_id text,
  moq integer check (moq > 0),
  fetched_at timestamptz not null,
  synthetic boolean not null
);
create index on public.offers (product_id, fetched_at desc);

-- История копится с первого дня, партиции по времени (по умолчанию одна default-партиция,
-- помесячные добавляются отдельной миграцией, когда пойдут реальные данные).
create table public.price_history (
  product_id uuid not null references public.products (id) on delete cascade,
  source_id text not null references public.data_sources (id),
  raw_response_id uuid not null,
  price numeric not null check (price >= 0),
  currency text not null,
  fetched_at timestamptz not null,
  synthetic boolean not null
) partition by range (fetched_at);
create table public.price_history_default partition of public.price_history default;
create index on public.price_history (product_id, fetched_at desc);

create table public.demand_history (
  product_id uuid not null references public.products (id) on delete cascade,
  source_id text not null references public.data_sources (id),
  raw_response_id uuid not null,
  sales_per_month numeric not null check (sales_per_month >= 0),
  period_start date,
  period_end date,
  fetched_at timestamptz not null,
  synthetic boolean not null
) partition by range (fetched_at);
create table public.demand_history_default partition of public.demand_history default;
create index on public.demand_history (product_id, fetched_at desc);

create table public.matches (
  id uuid primary key default gen_random_uuid(),
  source_product_id uuid not null references public.products (id) on delete cascade,
  listing_product_id uuid not null references public.products (id) on delete cascade,
  confidence numeric not null check (confidence between 0 and 1),
  status text not null default 'auto' check (status in ('auto', 'needs_review', 'confirmed', 'rejected')),
  created_at timestamptz not null default now(),
  unique (source_product_id, listing_product_id)
);

-- Значение метрики с происхождением (раздел 5.1).
create table public.source_values (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id uuid not null,
  metric text not null,
  value jsonb,
  source_id text references public.data_sources (id),
  method text not null check (method in ('api', 'provider', 'public_page', 'user_input', 'reference')),
  status text not null check (status in ('verified', 'estimated', 'no_data')),
  fetched_at timestamptz not null,
  raw_response_id uuid references public.raw_responses (id)
);
create index on public.source_values (entity_type, entity_id, metric);

-- ===== Справочники (пустые на старте) =====
-- Общие колонки происхождения: source_url, fetched_at, valid_from/valid_to, status.

create table public.fee_rules (
  id uuid primary key default gen_random_uuid(),
  marketplace_id text not null references public.marketplaces (id),
  country text not null,
  category_id uuid references public.categories (id),
  fee_type text not null,
  rate numeric check (rate between 0 and 1),
  fixed_amount numeric,
  currency text,
  valid_from date not null,
  valid_to date,
  source_url text not null,
  fetched_at timestamptz not null,
  status text not null check (status in ('verified', 'estimated'))
);

create table public.logistics_rates (
  id uuid primary key default gen_random_uuid(),
  marketplace_id text not null references public.marketplaces (id),
  country text not null,
  scheme text not null check (scheme in ('FBO', 'FBS', 'other')),
  rate_type text not null,
  size_rule jsonb,
  amount numeric not null,
  currency text not null,
  valid_from date not null,
  valid_to date,
  source_url text not null,
  fetched_at timestamptz not null,
  status text not null check (status in ('verified', 'estimated'))
);

create table public.cargo_rates (
  id uuid primary key default gen_random_uuid(),
  carrier text not null,
  route text not null,
  delivery_method text not null,
  basis text not null check (basis in ('kg', 'm3')),
  rate numeric not null check (rate >= 0),
  currency text not null,
  valid_from date not null,
  valid_to date,
  source_url text,
  fetched_at timestamptz not null,
  status text not null check (status in ('verified', 'estimated'))
);

create table public.customs_rules (
  id uuid primary key default gen_random_uuid(),
  country text not null,
  hs_code text not null,
  duty_rate numeric check (duty_rate between 0 and 1),
  vat_rate numeric check (vat_rate between 0 and 1),
  notes text,
  valid_from date not null,
  valid_to date,
  source_url text not null,
  fetched_at timestamptz not null,
  status text not null check (status in ('verified', 'estimated'))
);

create table public.fx_rates (
  base_currency text not null,
  quote_currency text not null,
  rate numeric not null check (rate > 0),
  rate_date date not null,
  source_url text not null,
  fetched_at timestamptz not null,
  primary key (base_currency, quote_currency, rate_date)
);

create table public.tax_profiles (
  id uuid primary key default gen_random_uuid(),
  country text not null,
  regime text not null,
  base text not null check (base in ('revenue', 'profit')),
  rate numeric not null check (rate between 0 and 1),
  valid_from date not null,
  valid_to date,
  source_url text not null,
  fetched_at timestamptz not null
);

-- ===== Данные клиента (org_id + RLS) =====

create table public.calculations (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  created_by uuid references auth.users (id),
  source_product_id uuid references public.products (id),
  listing_product_id uuid references public.products (id),
  input jsonb not null,
  result jsonb not null,
  formula_version text not null,
  created_at timestamptz not null default now()
);
create index on public.calculations (org_id, created_at desc);

create table public.saved_lists (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  unique (id, org_id)
);

create table public.saved_items (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  list_id uuid not null,
  -- Элемент всегда в той же организации, что и список.
  foreign key (list_id, org_id) references public.saved_lists (id, org_id) on delete cascade,
  product_id uuid references public.products (id),
  note text,
  created_at timestamptz not null default now()
);

create table public.alerts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  created_by uuid references auth.users (id),
  channel text not null check (channel in ('email', 'telegram')),
  rule jsonb not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Токены кабинетов продавца (слой A, после v1): только шифротекст, ключ вне базы.
create table public.user_connections (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  marketplace_id text not null references public.marketplaces (id),
  token_ciphertext bytea not null,
  scopes text[] not null default '{}',
  expires_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

-- ===== RLS =====

create function public.is_org_member(p_org uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.memberships m where m.org_id = p_org and m.user_id = auth.uid());
$$;

create function public.is_platform_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.platform_admins a where a.user_id = auth.uid());
$$;

do $$
declare t text;
begin
  -- RLS на всех таблицах public; без политики доступ есть только у service_role.
  for t in select tablename from pg_tables where schemaname = 'public' loop
    execute format('alter table public.%I enable row level security', t);
  end loop;

  -- Общие данные площадок и справочники: чтение для вошедших, запись только сервисом.
  foreach t in array array['plans', 'marketplaces', 'data_sources', 'categories', 'suppliers', 'products',
    'offers', 'price_history', 'demand_history', 'matches', 'source_values', 'fee_rules', 'logistics_rates',
    'cargo_rates', 'customs_rules', 'fx_rates', 'tax_profiles'] loop
    execute format('create policy shared_read on public.%I for select to authenticated using (true)', t);
  end loop;

  -- Данные организации: участник читает и пишет только свою организацию.
  foreach t in array array['calculations', 'saved_lists', 'saved_items', 'alerts', 'user_connections'] loop
    execute format('create policy org_select on public.%I for select to authenticated using (public.is_org_member(org_id))', t);
    execute format('create policy org_insert on public.%I for insert to authenticated with check (public.is_org_member(org_id))', t);
    execute format('create policy org_update on public.%I for update to authenticated using (public.is_org_member(org_id)) with check (public.is_org_member(org_id))', t);
    execute format('create policy org_delete on public.%I for delete to authenticated using (public.is_org_member(org_id))', t);
  end loop;

  -- Членство, подписка и счётчики: только чтение своей организации, изменяет админ через сервис.
  foreach t in array array['memberships', 'subscriptions', 'usage_counters'] loop
    execute format('create policy org_select on public.%I for select to authenticated using (public.is_org_member(org_id))', t);
  end loop;
end $$;

create policy org_select on public.organizations for select to authenticated using (public.is_org_member(id));
-- invitations, platform_admins, adapter_runs, raw_responses: политик нет, доступ только у service_role.

-- ===== Приглашения =====

create function public.create_invitation(p_org uuid, p_email text, p_role text, p_ttl interval)
returns text language plpgsql security definer set search_path = '' as $$
declare v_token text;
begin
  if not (public.is_platform_admin() or auth.role() = 'service_role') then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if p_ttl <= interval '0' then
    raise exception 'ttl must be positive' using errcode = '22023';
  end if;
  v_token := encode(extensions.gen_random_bytes(32), 'hex');
  insert into public.invitations (org_id, email, role, token_hash, expires_at, created_by)
  values (p_org, lower(p_email), p_role, encode(extensions.digest(v_token, 'sha256'), 'hex'), now() + p_ttl, auth.uid());
  return v_token;
end $$;

-- Проверка без использования: email и организация действующего приглашения.
create function public.peek_invitation(p_token text)
returns table (org_id uuid, email text, role text) language sql stable security definer set search_path = '' as $$
  select i.org_id, i.email, i.role from public.invitations i
  where i.token_hash = encode(extensions.digest(p_token, 'sha256'), 'hex')
    and i.used_at is null and i.expires_at > now();
$$;

-- Атомарное использование: второй вызов с тем же токеном или после истечения даёт ошибку.
create function public.consume_invitation(p_token text, p_user uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v public.invitations;
begin
  update public.invitations i set used_at = now(), used_by = p_user
  where i.token_hash = encode(extensions.digest(p_token, 'sha256'), 'hex')
    and i.used_at is null and i.expires_at > now()
  returning * into v;
  if v.id is null then
    raise exception 'invitation_invalid' using errcode = 'P0001';
  end if;
  insert into public.memberships (org_id, user_id, role) values (v.org_id, p_user, v.role);
  return v.org_id;
end $$;

revoke execute on function public.create_invitation, public.peek_invitation, public.consume_invitation from public, anon, authenticated;
grant execute on function public.create_invitation to authenticated, service_role;
grant execute on function public.peek_invitation, public.consume_invitation to service_role;
