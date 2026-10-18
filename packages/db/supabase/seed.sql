-- Реестр источников для локальной разработки: только факты о том, какие адаптеры есть.
-- Лимиты, стоимость и сроки токенов неизвестны до регистрации (Приложение A docs/TZ.md), поэтому null.
insert into public.marketplaces (id, name, role) values
  ('kaspi', 'Kaspi.kz', 'sell'),
  ('wildberries', 'Wildberries', 'sell'),
  ('ozon', 'Ozon', 'sell'),
  ('aliexpress', 'AliExpress', 'buy');

insert into public.data_sources (id, marketplace_id, role, layer, method, status, status_reason, mode) values
  ('kaspi', 'kaspi', 'sell', 'B', 'api', 'pending_registration', 'Нет токена Shop API', 'replay'),
  ('wildberries', 'wildberries', 'sell', 'B', 'api', 'pending_registration', 'Нет токена Seller API', 'replay'),
  ('ozon', 'ozon', 'sell', 'B', 'api', 'pending_registration', 'Нет ключа Seller API', 'replay'),
  ('aliexpress', 'aliexpress', 'buy', 'B', 'api', 'pending_registration', 'Нет App Key Open Platform', 'replay'),
  ('analytics', null, 'analytics', 'C', 'provider', 'pending_registration', 'Провайдер аналитики не выбран (пилот данных, 5.6)', 'replay');
