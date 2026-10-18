-- Реестр источников для локальной разработки (local, режим replay).
-- Лимиты, стоимость и сроки токенов неизвестны до регистрации (Приложение A docs/TZ.md), поэтому null.
-- active здесь означает «доступны записанные ответы»; в staging/production статус ставит администратор.
insert into public.marketplaces (id, name, role) values
  ('kaspi', 'Kaspi.kz', 'sell'),
  ('wildberries', 'Wildberries', 'sell'),
  ('ozon', 'Ozon', 'sell'),
  ('aliexpress', 'AliExpress', 'buy'),
  ('alibaba', 'Alibaba.com', 'buy');

insert into public.data_sources (id, marketplace_id, role, layer, method, status, status_reason, mode) values
  ('kaspi', 'kaspi', 'sell', 'B', 'api', 'active', 'Работает на записанных ответах источника', 'replay'),
  ('ozon', 'ozon', 'sell', 'B', 'api', 'active', 'Работает на записанных ответах источника', 'replay'),
  ('wildberries', 'wildberries', 'sell', 'B', 'api', 'pending_registration', 'Нет токена Seller API', 'replay'),
  ('aliexpress', 'aliexpress', 'buy', 'B', 'api', 'active', 'Работает на записанных ответах источника', 'replay'),
  ('alibaba', 'alibaba', 'buy', 'C', 'provider', 'pending_registration', 'Провайдер данных ещё не выбран', 'replay'),
  ('analytics', null, 'analytics', 'C', 'provider', 'active', 'Работает на записанных ответах источника', 'replay');
