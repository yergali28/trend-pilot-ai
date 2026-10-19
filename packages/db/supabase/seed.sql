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
  ('wildberries', 'wildberries', 'sell', 'B', 'api', 'active', 'Персональный токен только для чтения; магазин без товаров', 'replay'),
  ('aliexpress', 'aliexpress', 'buy', 'B', 'api', 'active', 'Работает на записанных ответах источника', 'replay'),
  ('alibaba', 'alibaba', 'buy', 'C', 'provider', 'pending_registration', 'Провайдер данных ещё не выбран', 'replay'),
  ('analytics', null, 'analytics', 'C', 'provider', 'active', 'Работает на записанных ответах источника', 'replay');

-- Wildberries: данные проверены по официальной документации 19.10.2026 (docs/sources/wildberries.md).
update public.data_sources set
  checked_at = '2026-10-19',
  docs_url = 'https://dev.wildberries.ru/openapi/api-information',
  rate_limit_per_minute = 100,
  rate_limits = '{"content": "100 запросов / 1 мин, интервал 600 мс, всплеск 5", "prices": "10 запросов / 6 сек, интервал 600 мс, всплеск 5", "tariffs": "1 запрос / 1 мин, всплеск 2"}',
  provides = 'Свой магазин продавца: карточки (название, предмет, вес с упаковкой), цены со скидкой продавца и валюта; комиссии WB по предметам (раздел Тарифы).',
  limitations = 'Нет данных о рынке: чужие цены и продажи, число продавцов, спрос — no_data. Только товары своего магазина; токен персональный, режим только чтение, срок до 19.04.2027. Часть аналитики WB с 09.2025 недоступна сторонним сервисам (ТЗ 5.2).'
where id = 'wildberries';
