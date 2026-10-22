import { AdapterError } from "./index";

export interface RateOptions {
  /** Ключ лимита (категория API источника): интервал соблюдается отдельно для каждого ключа. */
  key: string;
  /** Минимальный интервал между запросами по ключу, мс (интервал пополнения token bucket). */
  minIntervalMs: number;
  maxAttempts?: number;
  /** Таймаут одного запроса, мс; истёкший запрос повторяется как сетевая ошибка. */
  timeoutMs?: number;
  /** Подменяются в тестах. */
  fetchImpl?: typeof fetch;
  sleep?: (ms: number) => Promise<void>;
  random?: () => number;
  now?: () => number;
}

const lastCall = new Map<string, number>();
const defaultSleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/** Экспоненциальная пауза 1, 2, 4, 8… с с разбросом ±25 %, чтобы параллельные клиенты не били синхронно. */
export const backoffMs = (attempt: number, random: () => number) => 1000 * 2 ** (attempt - 1) * (0.75 + random() * 0.5);

/**
 * JSON-запрос к API источника с учётом лимитов: интервал между запросами по ключу,
 * на 429 — ожидание X-Ratelimit-Retry (или экспоненциальная пауза), на 5xx и сетевые ошибки — повтор.
 * Заголовки запроса (в том числе токен) в ошибки не попадают.
 */
export async function requestJson<T>(url: string, init: RequestInit, o: RateOptions): Promise<T> {
  const fetchImpl = o.fetchImpl ?? fetch;
  const sleep = o.sleep ?? defaultSleep;
  const random = o.random ?? Math.random;
  const now = o.now ?? Date.now;
  const maxAttempts = o.maxAttempts ?? 5;
  const where = new URL(url).host + new URL(url).pathname;

  for (let attempt = 1; ; attempt++) {
    const wait = (lastCall.get(o.key) ?? -Infinity) + o.minIntervalMs - now();
    if (wait > 0) await sleep(wait);
    lastCall.set(o.key, now());

    let res: Response;
    try {
      res = await fetchImpl(url, o.timeoutMs ? { ...init, signal: AbortSignal.timeout(o.timeoutMs) } : init);
    } catch (e) {
      if (attempt >= maxAttempts) throw new AdapterError("http_error", `${where}: сеть недоступна (${(e as Error).message})`);
      await sleep(backoffMs(attempt, random));
      continue;
    }

    if (res.ok) return (await res.json()) as T;

    if (res.status === 429 || res.status >= 500) {
      if (attempt >= maxAttempts) {
        throw new AdapterError(res.status === 429 ? "rate_limited" : "http_error", `${where}: ${res.status} после ${attempt} попыток`);
      }
      const retry = Number(res.headers.get("x-ratelimit-retry"));
      await sleep(res.status === 429 && Number.isFinite(retry) && retry > 0 ? retry * 1000 : backoffMs(attempt, random));
      continue;
    }

    const body = (await res.json().catch(() => ({}))) as { title?: string; detail?: string; errorText?: string };
    throw new AdapterError(res.status === 401 || res.status === 403 ? "auth_error" : "http_error", `${where}: ${res.status} ${body.title ?? body.errorText ?? ""}`.trim());
  }
}

/** Сбросить состояние интервалов (для тестов). */
export const resetRateState = () => lastCall.clear();
