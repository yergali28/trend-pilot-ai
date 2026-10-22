# Источник: Wildberries (Seller API)

Дата проверки документации: **19.10.2026**. Источник фактов — официальные спецификации WB API (Swagger YAML на `dev.wildberries.ru/api/swagger/yaml/ru/…`) и база знаний `dev.wildberries.ru`, прочитанные через индекс документации Context7. Сам портал `dev.wildberries.ru` закрыт JS-проверкой браузера (HTTP 498, «Проверяем браузер»); обход не выполнялся (правило 7 CLAUDE.md).

Ссылки:
- Общее (авторизация, лимиты, статусы): https://dev.wildberries.ru/openapi/api-information · YAML: https://dev.wildberries.ru/api/swagger/yaml/ru/01-general.yaml
- Работа с товарами (карточки, цены): https://dev.wildberries.ru/openapi/work-with-products · YAML: https://dev.wildberries.ru/api/swagger/yaml/ru/02-products.yaml
- Тарифы (комиссии): https://dev.wildberries.ru/openapi/wb-tariffs · YAML: https://dev.wildberries.ru/api/swagger/yaml/ru/10-tariffs.yaml
- Устройство токена: https://dev.wildberries.ru/en/knowledge-base/articles/019d49a1-1540-76f6-befe-726633dc11be
- Лимиты и 429: https://dev.wildberries.ru/en/knowledge-base/articles/019d49a1-28ca-7735-bf2f-98210695abc7 · повтор запроса: https://dev.wildberries.ru/en/knowledge-base/articles/019e3a7a-8d31-7648-a277-cd5eefd96941
- Проверка токена продавца: https://dev.wildberries.ru/news/144

## Решение владельца о токене (19.10.2026)

Используется **персональный боевой токен** (`acc = 3`, `t = false`), режим **только чтение** (бит 30), категории: Контент (1), Аналитика (2), Цены и скидки (3), Статистика (5). Тестового (`acc = 2`, `t = true`) нет. Владелец явно разрешил использовать этот токен в local как исключение из правила 5 CLAUDE.md. Рамки: только чтение, только локально и в staging, минимум запросов с соблюдением лимитов, токен не логируется и не попадает в git, из записанных ответов удаляются персональные данные.

## Авторизация

Заголовок `Authorization: <токен>` (схема `HeaderApiKey`). Токен — JWT; публичные поля: `acc` — тип (1 базовый, 2 тестовый, 3 персональный, 4 сервисный), `t` — тестовый контур, `s` — категории битами (`s & (1 << бит)`), бит 30 — только чтение, `exp` — срок действия.

## Методы, которые использует адаптер

| Метод | Домен | Категория токена | Лимит (на продавца) | Что даёт |
|---|---|---|---|---|
| `POST /content/v2/get/cards/list` | `content-api.wildberries.ru` | Контент или Продвижение | Контент: 100 запросов / 1 мин, интервал 600 мс, всплеск 5 | Карточки: `nmID`, `title`, `subjectID`, `subjectName`, `brand`, `vendorCode`, габариты и вес с упаковкой (`dimensions.weightBrutto`, кг). Пагинация курсором `updatedAt` + `nmID`, `limit` ≤ 100 |
| `GET /api/v2/list/goods/filter` | `discounts-prices-api.wildberries.ru` | Цены и скидки | 10 запросов / 6 сек, интервал 600 мс, всплеск 5 | Цены по размерам: `price`, `discountedPrice` (со скидкой продавца), `clubDiscountedPrice`, `currencyIsoCode4217`, `discount`. `limit` ≤ 1000, `offset` |
| `GET /api/v1/tariffs/commission`, `GET /api/v1/tariffs/box` | `common-api.wildberries.ru` | любая | см. раздел «Тарифы» | Комиссии по предметам и тарифы логистики коробов |

Ответ `401` — токен недействителен или категория не совпадает с сервисом; `403` — нет доступа; `429` — превышен лимит.

## Тарифы: комиссии и логистика (проверено 19.10.2026)

Спецификация: https://dev.wildberries.ru/openapi/wb-tariffs · YAML: https://dev.wildberries.ru/api/swagger/yaml/ru/10-tariffs.yaml. Домен `common-api.wildberries.ru`; методы раздела «Тарифы» доступны с токеном **любой категории** (release notes: https://dev.wildberries.ru/en/release-notes?id=321).

| Метод | Лимит | Параметры | Ответ |
|---|---|---|---|
| `GET /api/v1/tariffs/commission` | 1 запрос / 1 мин, всплеск 2 | `locale`: `ru`, `en`, `zh` — язык `parentName` и `subjectName` | `report[]`: `parentID`, `parentName`, `subjectID`, `subjectName`, комиссии в %: `paidStorageKgvp` (FBW), `kgvpMarketplace` (FBS), `kgvpSupplier` (DBS, DBW), `kgvpSupplierExpress` (EDBS), `kgvpPickup` (C&C), `kgvpBooking` (бронирование) |
| `GET /api/v1/tariffs/box` | персональный и сервисный: 60 запросов / 1 мин, интервал 1 с, всплеск 5; базовый: 1 запрос / 1 ч | `date` (ГГГГ-ММ-ДД), обязательный | `response.data`: `currency` (в реальном ответе `RUB`; в русской спецификации суммы в ₽), `dtNextBox`, `dtTillMax`, `warehouseList[]`: `warehouseName`, `geoName` («страна, для РФ — округ»), `boxDeliveryBase` / `boxDeliveryLiter` (логистика FBO, первый / доп. литр), `boxDeliveryMarketplaceBase` / `…Liter` (FBS), `boxStorageBase` / `…Liter` (хранение в день), коэффициенты `…CoefExpr` в % (уже учтены в тарифах). Суммы — строки с запятой; «-» — тарифа нет |

Страны и языки: у комиссий страна в ответе и спецификации **не указана** (в `fee_rules.country` остаётся пусто). У тарифов коробов `geoName` в реальном ответе 19.10.2026: «Россия» (4 склада) и «СНГ» (20 складов); «Россия» → `RU`, «СНГ» — группа стран, страна остаётся пустой. Языки названий категорий: `ru`, `en`, `zh`.

Реальный ответ сверен со схемой (`pnpm --filter @tp/worker schema:diff` выводит только имена полей): поля совпадают со спецификацией, дополнительно есть `currency` в данных коробов (описано в английской спецификации).

Загрузка в справочники: `pnpm --filter @tp/worker refs:load [--live]` (входит в `pnpm db:reset`, по умолчанию из записи `fixtures/wildberries/tariffs.json`). Каждая строка: источник — URL метода, `fetched_at` — время ответа, `valid_from` — дата актуальности (день запроса), статус `verified`. Пустые и «-» значения строк не получают; ничего не усредняется. Комиссии привязаны к предметам WB (`external_category_id`), поэтому в расчёт товаров пока не попадают: нет сопоставления наших категорий с предметами WB.

## Статистика: заказы и продажи своего магазина (проверено 22.10.2026)

Спецификация: https://dev.wildberries.ru/openapi/reports (раздел «Основные отчёты»). Домен `statistics-api.wildberries.ru`, категория токена «Статистика». Адаптер `wildberries-sales` (`packages/adapters/wildberries/sales.ts`), источник в реестре `wildberries-sales` (роль `analytics`, площадка `wildberries`).

| Метод | Лимит | Параметры | Что берём из ответа |
|---|---|---|---|
| `GET /api/v1/supplier/orders` | персональный, сервисный, базовый с секретом: 1 запрос / 1 мин; базовый: 1 запрос / 2 ч | `dateFrom` (RFC3339, время московское), `flag` (0 — по дате изменения, по умолчанию) | `date`, `nmId`, `supplierArticle`, `subject`, `countryName`, `warehouseName`, `priceWithDisc`, `finishedPrice`, `isCancel` |
| `GET /api/v1/supplier/sales` | то же | то же | те же поля, плюс `saleID` («S…» — продажа, «R…» — возврат; возвратов в живом ответе пока не было) и `forPay` |

- Данные обновляются раз в 30 минут и хранятся 90 дней. При `flag=0` ответ до 80 000 строк; продолжение — с `lastChangeDate` последней строки (адаптер делает один запрос на отчёт, этого хватает для текущих объёмов).
- Цены в отчёте предварительные: для сверки денег нужен отчёт о реализации.
- Белый список полей: номер заказа (`srid`, `gNumber`), стикер, `incomeID`, баркод и регион покупателя отбрасываются схемой при разборе и не попадают ни в `raw_responses`, ни в fixtures.
- Спрос: по каждому `nmId` выкупы минус возвраты за 30 дней (строки с датой раньше периода не считаются, `flag=0` фильтрует по дате изменения). Пишется в `demand_history` с источником `wildberries-sales` и периодом, товар — карточка WB (`products.source_id = wildberries`). Название товара в записи условное («предмет, арт. артикул») и не затирает название из карточки.
- Живой ответ 22.10.2026 (`pnpm record wildberries-sales sales`, `fixtures/wildberries-sales/sales.json`): 2 заказа и 1 продажа за 30 дней, страна «Казахстан», склад «Шымкент Асар». Поля совпали со спецификацией.

Команды: запись `pnpm --filter @tp/worker record wildberries-sales sales` (2 запроса с паузой 1 мин), загрузка `pnpm --filter @tp/worker ingest:once wildberries-sales sales [--live]`.

Остатки по складам (`GET /api/v1/supplier/stocks`) WB отключил; замена — `POST /api/analytics/v1/stocks-report/wb-warehouses` (seller-analytics-api, категория «Аналитика», 1 запрос / 20 с). Пока не подключено: в базе нет таблицы для остатков.

## Лимиты и повторы

- Алгоритм token bucket: «Период/Лимит» — сколько запросов за период, «Интервал» — пополнение одного запроса, «Всплеск» — сколько подряд без паузы.
- Заголовок `X-Ratelimit-Remaining` есть во всех ответах, кроме 429.
- При `429`: `X-Ratelimit-Retry` — секунд до следующей попытки, `X-Ratelimit-Reset` — до восстановления лимита, `X-Ratelimit-Limit` — размер всплеска. Если заголовка нет — экспоненциальная пауза с разбросом ±25 %.
- Ответ `409` засчитывается как 5 запросов (для методов записи; адаптер только читает).

Реализация (`packages/adapters/wildberries`): минимальный интервал между запросами по категории (600 мс для Контента и Цен, 60 с для Тарифов), на `429` ожидание `X-Ratelimit-Retry`, на `429` без заголовка и на `5xx` — экспоненциальная пауза 1, 2, 4, 8 с ±25 %, не больше 5 попыток. Токен не выводится ни в логи, ни в ошибки.

## Что источник даёт и чего не даёт

Даёт (по своему магазину продавца): карточки товаров, вес и габариты, цены и скидки. Справочно: комиссии WB по предметам и тарифы логистики и хранения коробов по складам.

Не даёт (по документации и правилам ТЗ 5.2, 5.7):
- данных о рынке в целом: цены и продажи чужих товаров, число продавцов, концентрация — `no_data`;
- спроса (продаж в месяц) по рынку — `no_data`; продажи своего магазина загружает `wildberries-sales` (см. «Статистика»), это спрос только своих товаров;
- закупочной цены, тарифов карго, пошлин — это другие источники;
- с сентября 2025 WB ограничил сторонним сервисам часть аналитики (остатки по складам и др.) — по сообщению прессы, ТЗ 5.2.

## Запись ответов

`pnpm record wildberries` (apps/worker) делает живые запросы с токеном, обрезает список до 20 позиций, удаляет из ответа поля с персональными и служебными данными продавца и пишет `fixtures/wildberries/seller.json` с `synthetic: false`. Проверка на секреты: `pnpm --filter @tp/worker record:check`.
