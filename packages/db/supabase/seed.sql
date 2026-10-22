-- Реестр источников для локальной разработки (local, режим replay).
-- Лимиты, стоимость и сроки токенов неизвестны до регистрации (Приложение A docs/TZ.md), поэтому null.
-- active здесь означает «доступны записанные ответы»; в staging/production статус ставит администратор.
insert into public.marketplaces (id, name, role) values
  ('kaspi', 'Kaspi.kz', 'sell'),
  ('wildberries', 'Wildberries', 'sell'),
  ('ozon', 'Ozon', 'sell'),
  ('aliexpress', 'AliExpress', 'buy'),
  ('alibaba', 'Alibaba.com', 'buy'),
  ('1688', '1688.com', 'buy');

insert into public.data_sources (id, marketplace_id, role, layer, method, status, status_reason, mode) values
  ('kaspi', 'kaspi', 'sell', 'B', 'api', 'active', 'Работает на записанных ответах источника', 'replay'),
  ('ozon', 'ozon', 'sell', 'B', 'api', 'active', 'Работает на записанных ответах источника', 'replay'),
  ('wildberries', 'wildberries', 'sell', 'B', 'api', 'active', 'Персональный токен только для чтения', 'replay'),
  ('wildberries-sales', 'wildberries', 'analytics', 'B', 'api', 'active', 'Продажи своего магазина по токену продавца (категория «Статистика»), не рынок', 'replay'),
  ('aliexpress', 'aliexpress', 'buy', 'B', 'api', 'active', 'Работает на записанных ответах источника', 'replay'),
  ('alibaba', 'alibaba', 'buy', 'C', 'provider', 'pending_registration', 'Провайдер данных ещё не выбран', 'replay'),
  ('analytics', null, 'analytics', 'C', 'provider', 'active', 'Работает на записанных ответах источника', 'replay'),
  ('mpstats', 'wildberries', 'analytics', 'C', 'provider', 'active', 'Без токена MPSTATS: демо-запись в формате провайдера', 'replay'),
  ('1688', '1688', 'buy', 'C', 'provider', 'active', 'Поиск 1688 через Apify (сбор публичных страниц, решение владельца 22.10.2026)', 'live');

-- Wildberries: данные проверены по официальной документации 19.10.2026 (docs/sources/wildberries.md).
update public.data_sources set
  checked_at = '2026-10-19',
  docs_url = 'https://dev.wildberries.ru/openapi/api-information',
  rate_limit_per_minute = 100,
  rate_limits = '{"content": "100 запросов / 1 мин, интервал 600 мс, всплеск 5", "prices": "10 запросов / 6 сек, интервал 600 мс, всплеск 5", "tariffs_commission": "1 запрос / 1 мин, всплеск 2", "tariffs_box": "60 запросов / 1 мин, интервал 1 с, всплеск 5 (персональный токен)"}',
  provides = 'Свой магазин продавца: карточки (название, предмет, вес с упаковкой), цены со скидкой продавца и валюта. Справочно для всех: комиссии WB по 7 415 предметам и моделям продаж (FBW, FBS, DBS/DBW, EDBS, C&C, бронирование), тарифы логистики и хранения коробов по складам в RUB.',
  limitations = 'Нет рыночных продаж и спроса, чужих цен, числа продавцов — no_data. У комиссий страна не указана; у тарифов коробов geoName: Россия или СНГ (группа стран, без конкретной страны). Комиссии привязаны к предметам WB, у наших товаров привязки к предметам пока нет. Токен персональный, только чтение, срок до 19.04.2027.'
where id = 'wildberries';

-- Продажи своего магазина WB (statistics-api), проверено по документации и живому ответу 22.10.2026.
update public.data_sources set
  checked_at = '2026-10-22',
  docs_url = 'https://dev.wildberries.ru/openapi/reports',
  rate_limit_per_minute = 1,
  rate_limits = '{"orders": "1 запрос / 1 мин (персональный токен)", "sales": "1 запрос / 1 мин (персональный токен)"}',
  provides = 'Свой магазин продавца: заказы и продажи/возвраты по товарам (nmId) за 30 дней — предмет, артикул, страна, склад, цены. Спрос товара = выкупы минус возвраты за период.',
  limitations = 'Только свой магазин, не рынок. Данные обновляются раз в 30 минут, хранятся 90 дней; поля цен предварительные (не отчёт реализации). Номера заказов, стикеры и регион покупателя не сохраняются.'
where id = 'wildberries-sales';

-- MPSTATS: рыночные данные WB (товары категории с продажами, выручкой, рейтингом и дневными рядами), проверено по документации 22.10.2026.
update public.data_sources set
  checked_at = '2026-10-22',
  docs_url = 'https://mpstats.io/integrations/analytics-wb/',
  provides = 'Рынок WB: товары категорий с ценой, продажами и выручкой за 30 дней, рейтингом, отзывами, остатками, фото и дневными рядами продаж, цен и остатков.',
  limitations = 'Платный тариф с API; лимиты зависят от тарифа (429 с Retry-After). Пока токена нет, работает демо-запись (synthetic). Закупочной цены провайдер не даёт.'
where id = 'mpstats';

-- 1688 через Apify (актор automation-lab/1688-scraper): решение владельца по правилу 7 от 22.10.2026 — «разрешаю под свою ответственность».
update public.data_sources set
  checked_at = '2026-10-22',
  docs_url = 'https://apify.com/automation-lab/1688-scraper',
  provides = 'Предложения 1688 по ключевому слову: цена от (¥, нижняя ступень), поставщик, провинция и город, число заказов, ссылка и фото.',
  limitations = 'Сбор публичных страниц через Apify, платно за результат. MOQ в поиске не приходит. Совпадение с товаром WB — аналог по запросу, требует проверки.'
where id = '1688';
