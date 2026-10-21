# Закупка на 1688 и Taobao через провайдеров

Слой поиска закупочных цен на 1688 и Taobao. Прямого доступа к официальным API у нас нет, поэтому данные идут через сторонних провайдеров. Провайдер меняется одной переменной окружения, остальной код от него не зависит.

Проверено 21.10.2026.

## Как устроено

| Файл | Что внутри |
|---|---|
| `sourcing/model.ts` | Модель `Product` (Zod), интерфейс `SourcingProvider`, ошибки `ProviderAuthError`, `ProviderRateLimit`, `ProviderUnavailable` |
| `sourcing/providers.ts` | `oneboundProvider`, `apifyProvider`, `mockProvider` и маппинг ответов в `Product` |
| `sourcing/index.ts` | Фабрика `createSourcingProvider` (по `PROVIDER`), кэш `withCache`, `findSourcing`, `marginConfigFromEnv` |
| `packages/calc/src/sourcing.ts` | Формула маржи `sourcingMargin` (по правилу 3 CLAUDE.md формулы живут только в `packages/calc`) |
| `fixtures/sourcing/mock.json` | Синтетические карточки для `PROVIDER=mock` |
| `apps/worker/src/sourcing.ts` | Запуск из командной строки |

Интерфейс провайдера:

```ts
search(marketplace: "1688" | "taobao", keyword, { page, pageSize, sort }): Promise<Product[]>
getItem(marketplace, itemId): Promise<Product | null>
searchByImage?(marketplace, imageUrl, { pageSize }): Promise<Product[]>   // пока только у mock
```

Поля `Product`: `marketplace`, `itemId`, `titleCn`, `titleEn`, `priceCny`, `minOrderQty`, `salesCount`, `supplierId`, `supplierName`, `city`, `province`, `imageUrl`, `url`, `raw`. Имена полей в camelCase, как принято в проекте; в постановке они были в snake_case. Если провайдер чего-то не дал, в поле стоит `null`, ничего не подставляется. Запись без ID, названия или цены отбрасывается.

Устойчивость обеспечивает общий HTTP-клиент адаптеров `core/http.ts`, тот же, что у Wildberries:
- минимальный интервал между запросами к провайдеру (по умолчанию 1 с);
- таймаут запроса;
- на `429` пауза по `X-Ratelimit-Retry` или экспоненциальная 1, 2, 4… с ±25 %;
- на `5xx` и сетевые ошибки повтор;
- `401` и `403` → `ProviderAuthError`, исчерпанные повторы на `429` → `ProviderRateLimit`, остальное → `ProviderUnavailable`.

Ключи передаются в URL или заголовке и не попадают ни в сообщения об ошибках (там только хост и путь), ни в логи.

Результаты поиска и карточек кэшируются в памяти процесса на `SOURCING_CACHE_TTL_HOURS` часов (по умолчанию 24). Ошибки не кэшируются.

`findSourcing(keyword, { provider, wbPriceRub, margin, topN, pageSize, marketplaces, maxMoq })`:
- ищет на 1688 и Taobao параллельно;
- сортирует по цене за штуку, при равной цене выше меньший MOQ, неизвестный MOQ ниже известного;
- `maxMoq` отсекает кандидатов с большей минимальной партией (с неизвестным MOQ кандидаты остаются);
- для каждого кандидата считает стоимость минимальной партии и маржу относительно цены WB.

Если не ответила одна площадка, её ошибка попадает в `errors`, а результаты второй возвращаются. Если не ответили обе, выбрасывается исключение.

Маржа (`sourcingMargin`):
- закупка = цена ¥ × курс;
- себестоимость = закупка + доставка за единицу + комиссия WB (% от цены продажи) + прочие расходы;
- прибыль = цена WB − себестоимость;
- маржинальность = прибыль ÷ цена WB.

Все ставки передаются конфигом. Нулевой или отрицательный курс, отрицательные суммы и комиссия больше 100 % дают `RangeError`. При нулевой цене WB маржинальность равна `null`.

## Как выбрать провайдера

| `PROVIDER` | Что делает | Ключи |
|---|---|---|
| `mock` (по умолчанию) | Синтетические карточки из `fixtures/sourcing/mock.json`, без сети | не нужны |
| `onebound` | REST API Onebound (万邦): `item_search` и `item_get` для 1688 и Taobao | `ONEBOUND_API_KEY`, `ONEBOUND_API_SECRET` |
| `apify` | Акторы Apify: `automation-lab/1688-scraper`, `ethereal_wool/taobao-product-search-scraper` | `APIFY_TOKEN` |

Сравнение:
- **Onebound** — API с ключом. Есть поиск и карточка с MOQ и городом. Квота суточная: в ответе приходит `api_info: "today:N max:M"`.
- **Apify** — платный запуск актора на каждый запрос. 1688-актор: от $2.40 за 1 000 карточек плюс $0.01–0.02 за запуск; без cookies отдаёт около 40 карточек на ключевое слово. Taobao-актор: $35 за 1 000 поисков, и он помечен автором как **DEPRECATED** — замену можно задать через `APIFY_ACTOR_TAOBAO`.

## Переменные окружения

Задаются в `apps/worker/.env.local` (не коммитится) или в окружении процесса. Образец без значений — в `.env.example`.

| Переменная | Зачем |
|---|---|
| `PROVIDER` | `mock`, `onebound` или `apify` |
| `ONEBOUND_API_KEY`, `ONEBOUND_API_SECRET` | Ключ и секрет Onebound. В опубликованных примерах обязательны оба; в постановке был только ключ, поэтому секрет передаётся, если задан |
| `APIFY_TOKEN` | Токен Apify, уходит в заголовке `Authorization: Bearer` |
| `APIFY_ACTOR_1688`, `APIFY_ACTOR_TAOBAO` | Необязательно: другой актор в формате `owner/name` |
| `SOURCING_CACHE_TTL_HOURS` | Время жизни кэша, часов; `0` — без кэша |
| `SOURCING_CNY_RUB`, `SOURCING_SHIPPING_PER_UNIT_RUB`, `SOURCING_WB_COMMISSION_PCT`, `SOURCING_OTHER_COSTS_PER_UNIT_RUB` | Ставки маржи для запуска из командной строки. Обязательны, значений по умолчанию нет |

## Запуск в режиме mock

```bash
PROVIDER=mock SOURCING_CNY_RUB=12 SOURCING_SHIPPING_PER_UNIT_RUB=50 SOURCING_WB_COMMISSION_PCT=20 SOURCING_OTHER_COSTS_PER_UNIT_RUB=30 \
  pnpm --filter @tp/worker sourcing "phone case" --wb-price 600 --top 5 [--max-moq 100]
```

Ставки в примере условные. Ключевые слова в фикстурах на трёх языках: `手机壳` / `phone case` / `чехол`, `收纳盒` / `organizer` / `органайзер`, `蓝牙耳机` / `earbuds` / `наушники`.

Тесты: `pnpm --filter @tp/adapters test` (провайдеры, маппинг, ошибки, повторы, кэш, `findSourcing`) и `pnpm --filter @tp/calc test` (маржа). Настоящая сеть в тестах запрещена: глобальный `fetch` подменён на падающий.

## Как проверить реальный провайдер

1. Положите ключ в `apps/worker/.env.local` и задайте там `PROVIDER=onebound` или `PROVIDER=apify`.
2. Сделайте один запрос с маленьким лимитом, например `--top 3`. Кэш на 24 часа не даст случайно повторить платный запрос.
3. Сверьте ответ с маппингом в `providers.ts`, особенно пункты `TODO(onebound)` и `TODO(apify)`. Если поля разошлись, исправьте маппинг и добавьте реальный пример ответа без ключей в тест.
4. Проверьте ошибки: неверный ключ должен давать `ProviderAuthError`, исчерпанная квота — `ProviderRateLimit`. Коды ошибок Onebound для ключа и квоты пока не подтверждены, сейчас они дают `ProviderUnavailable`.

## Известные ограничения

- **Документация Onebound открывается только после входа** в кабинет (`open.onebound.cn/help/api/*` перенаправляет на логин). Аккаунт мы не регистрируем. Формат взят из примеров, которые публикует сам Onebound (juejin.cn, «万邦Noah», 2022): путь `https://api-gw.onebound.cn/1688/item_search/?key&secret&q&page&page_size&sort`, ответ `items.item[]` с полями `num_iid`, `title`, `price`, `promotion_price`, `sales`, `seller_nick`, `area`, `pic_url`, `detail_url`, успех `error_code: "0000"`, ошибка `error: "item-not-found"`. Карточка `item_get`: `item.min_num`, `location`, `seller_id`, `seller_info.shop_name`. Для Taobao (`/taobao/...`) та же схема взята **по аналогии и не подтверждена** — см. `TODO(onebound)`.
- **Поиск по фото.** Onebound (`item_search_img`) и актор `apivault_labs/1688-image-search` поиск по фото поддерживают. Вход актора известен (`imageUrl`, `marketplace`, `maxResults`), но поля выхода не опубликованы. Поэтому `searchByImage` пока есть только у mock.
- **Apify и MOQ.** У 1688-актора MOQ (`moq`) есть только в режиме карточки (`productUrls`), в поиске он обычно пустой. `salesCount` у 1688-актора — это число заказов (`orderCount`), а не штук. Сортировку по цене делаем у себя: актор сортирует только «bestSelling». Номера страницы у акторов нет, поэтому берём `page × pageSize` записей и отрезаем нужную страницу. Карточку Taobao по ID актор не отдаёт.
- **Сбор публичных страниц.** Акторы Apify собирают публичные страницы 1688 и Taobao на своей стороне. По правилу 7 CLAUDE.md такой сбор включается только письменным решением владельца после юридической проверки. По умолчанию стоит `mock`, и пока `PROVIDER=apify` с токеном не задан, ничего не собирается. Решение о живом режиме за владельцем.
- **Цены.** Цены провайдеров — это цены витрины в CNY на момент запроса, без доставки по Китаю и без оптовой лестницы. Лестница есть у 1688-актора в `raw.quantityPrices`.
- **Кэш живёт в памяти процесса.** Общий кэш между воркерами (например, через `raw_responses`) — когда понадобится.
- **В справочники и интерфейс пока не встроено.** Слой возвращает данные коду. Запись в `offers` и `raw_responses` через ингест — следующий шаг, тогда же нужна запись в реестре `data_sources`.
