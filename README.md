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
pnpm db:reset      # применить миграции и seed на чистой базе
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

## CI

`.github/workflows/ci.yml` запускается на каждый pull request и push в `main`: установка зависимостей, запуск локального Supabase, затем `lint`, `typecheck`, `test`, `build`. Секретов в CI нет.
