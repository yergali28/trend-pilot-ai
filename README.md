# Trend Pilot AI

SaaS для селлеров маркетплейсов: подбор товаров и юнит-экономика. Полное ТЗ: [docs/TZ.md](docs/TZ.md), правила работы: [CLAUDE.md](CLAUDE.md), цели этапов: [docs/GOALS.md](docs/GOALS.md).

## Требования

- Node.js 22 (версия в `.nvmrc`, `nvm use`)
- pnpm (версия в поле `packageManager` в `package.json`)
- Docker (запущенный Docker Desktop)
- Supabase CLI

## Первый запуск

```bash
pnpm run setup     # зависимости и .env.local из .env.example
pnpm db:start      # локальный Supabase в Docker (первый раз скачивает образы)
pnpm env:local     # apps/web/.env.local из `supabase status` (ключи локального стенда)
pnpm db:reset      # миграции, seed и демо-каталог (pnpm demo:load)
pnpm dev           # apps/web на http://localhost:3000
```

`pnpm setup` без `run` вызывает встроенную команду pnpm, а не скрипт проекта.

## Проверки локально

Тесты базы (RLS, приглашения), воркера и API ходят в локальный Supabase, поэтому **перед `pnpm test` нужен `pnpm db:start`**. Без него эти тесты падают с ошибкой подключения.

```bash
pnpm db:start      # если ещё не запущен
pnpm lint
pnpm typecheck
pnpm test          # юнит, контрактные, интеграционные тесты; покрытие packages/calc
pnpm build
```

Ключи локального стенда тесты берут из `supabase status` сами, вводить их не нужно. Это ключи локального Docker-стенда, не боевые.

Остановить стенд: `supabase stop --workdir packages/db`.

## Демо-данные

Локально экраны работают на записанных синтетических ответах источников (`fixtures/*/catalog.json`, режим replay) и на синтетике адаптеров (`pnpm demo:load:mock`, режим mock). Допущения расчёта для демо (курсы, карго, комиссии) лежат в `fixtures/demo/assumptions.json` и включаются только при `TP_DEMO_DATA=1`; в интерфейсе всё это помечено «Демо · синтетические данные». Справочники админки содержат только официальные значения и перекрывают демо-допущения.

## Сквозные тесты и проверки интерфейса

```bash
pnpm --filter @tp/web exec playwright install chromium   # один раз
pnpm test:e2e                                            # сквозные тесты (dev-сервер поднимется сам)
pnpm i18n:check                                          # ru/en/kk: пропущенные ключи и строки без ключа
SCREENSHOTS=1 pnpm test:e2e                              # скриншоты экранов в docs/screens/
```

Детектор Impeccable на экранах за входом: запустите `impeccable live-server --background`, затем `DETECT=1 pnpm --filter @tp/web exec playwright test e2e/detect.spec.ts`.

Для входа нужен пользователь: e2e создаёт тестовую организацию и администратора сам; вручную — приглашение из `/admin` или `auth.admin.createUser` в локальном стенде.

## CI

`.github/workflows/ci.yml` запускается на каждый pull request и push в `main`. Шаги по порядку: установка зависимостей, запуск локального Supabase, затем `lint`, `typecheck`, `test`, `build`, сквозные тесты `test:e2e` (браузер Chromium ставится в CI) и проверка дизайна Impeccable. Секретов в CI нет: только ключи локального стенда, которые выдаёт Supabase CLI; они маскируются в логах. При падении отчёты Playwright сохраняются как артефакт `playwright-results`.

**Проверка дизайна Impeccable в CI** (`apps/web/e2e/detect.spec.ts`, `DETECT=1`): Playwright входит под тестовым пользователем, открывает экраны мастера подбора, категорий, товаров категории, карточки товара и три экрана админки в светлой и тёмной теме на ширине 1440 и 390, внедряет детектор Impeccable (`detect.js` отдаёт `impeccable live-server` из скилла, который CI ставит во временную папку) и требует ноль находок: контраст, мелкий текст, вылезание за край экрана, перекос колонок первого экрана, шаблонные приёмы. Браузер работает без графической среды, поэтому проверка идёт в том же задании после e2e. Исходники проверяются командой `npx impeccable detect apps/web packages/ui`.
