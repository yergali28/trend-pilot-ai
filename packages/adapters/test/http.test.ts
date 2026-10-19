import { afterEach, describe, expect, it, vi } from "vitest";
import { backoffMs, requestJson, resetRateState } from "../core/http";
import { wildberries } from "../wildberries";

const res = (status: number, body: unknown, headers: Record<string, string> = {}) => new Response(JSON.stringify(body), { status, headers });
const clock = () => {
  let t = 0;
  const slept: number[] = [];
  return { now: () => t, sleep: async (ms: number) => void (slept.push(ms), (t += ms)), slept };
};

afterEach(() => {
  resetRateState();
  vi.unstubAllGlobals();
});

describe("requestJson: лимиты, 429 и повторы", () => {
  it("на 429 ждёт X-Ratelimit-Retry секунд и повторяет", async () => {
    const c = clock();
    const fetchImpl = vi.fn().mockResolvedValueOnce(res(429, { title: "too many" }, { "X-Ratelimit-Retry": "2" })).mockResolvedValueOnce(res(200, { ok: 1 }));
    const out = await requestJson("https://api.test/x", {}, { key: "k", minIntervalMs: 0, fetchImpl, ...c });
    expect(out).toEqual({ ok: 1 });
    expect(c.slept).toEqual([2000]);
  });

  it("на 429 без заголовка и на 5xx — экспоненциальная пауза с разбросом ±25 %", async () => {
    const c = clock();
    const fetchImpl = vi.fn().mockResolvedValueOnce(res(429, {})).mockResolvedValueOnce(res(503, {})).mockResolvedValueOnce(res(200, { ok: 1 }));
    await requestJson("https://api.test/x", {}, { key: "k", minIntervalMs: 0, fetchImpl, random: () => 0.5, ...c });
    expect(c.slept).toEqual([1000, 2000]);
    expect(backoffMs(3, () => 0)).toBe(3000); // 4 с − 25 %
    expect(backoffMs(3, () => 1)).toBe(5000); // 4 с + 25 %
  });

  it("соблюдает минимальный интервал между запросами одной категории", async () => {
    const c = clock();
    const fetchImpl = vi.fn().mockImplementation(async () => res(200, {}));
    await requestJson("https://api.test/a", {}, { key: "cat", minIntervalMs: 600, fetchImpl, ...c });
    await requestJson("https://api.test/b", {}, { key: "cat", minIntervalMs: 600, fetchImpl, ...c });
    await requestJson("https://api.test/c", {}, { key: "other", minIntervalMs: 600, fetchImpl, ...c });
    expect(c.slept).toEqual([600]);
  });

  it("после исчерпания попыток — rate_limited; 401 — сразу ошибка без токена в тексте", async () => {
    const c = clock();
    const always429 = vi.fn().mockImplementation(async () => res(429, {}, { "X-Ratelimit-Retry": "1" }));
    await expect(requestJson("https://api.test/x", {}, { key: "k", minIntervalMs: 0, maxAttempts: 3, fetchImpl: always429, ...c })).rejects.toMatchObject({ code: "rate_limited" });
    expect(always429).toHaveBeenCalledTimes(3);

    const secret = "SECRET-TOKEN-VALUE";
    const unauthorized = vi.fn().mockResolvedValue(res(401, { title: "unauthorized" }));
    const err = await requestJson("https://api.test/x", { headers: { Authorization: secret } }, { key: "k", minIntervalMs: 0, fetchImpl: unauthorized, ...c }).catch((e: Error) => e);
    expect(err).toMatchObject({ code: "http_error" });
    expect((err as Error).message).toContain("401");
    expect((err as Error).message).not.toContain(secret);
    expect(unauthorized).toHaveBeenCalledTimes(1);
  });

  it("сетевая ошибка повторяется, затем http_error", async () => {
    const c = clock();
    const broken = vi.fn().mockRejectedValue(new Error("ECONNRESET"));
    await expect(requestJson("https://api.test/x", {}, { key: "k", minIntervalMs: 0, maxAttempts: 2, fetchImpl: broken, ...c })).rejects.toMatchObject({ code: "http_error" });
    expect(broken).toHaveBeenCalledTimes(2);
  });
});

describe("wildberries live: запросы по документации", () => {
  it("карточки и цены своего магазина, токен только в заголовке Authorization", async () => {
    const calls: { url: string; init: RequestInit }[] = [];
    vi.stubGlobal("fetch", async (url: string, init: RequestInit) => {
      calls.push({ url, init });
      return url.includes("content-api")
        ? res(200, { cards: [{ nmID: 7, title: "Тестовая карточка", dimensions: { weightBrutto: 0.5 } }], cursor: { total: 1 } })
        : res(200, { data: { listGoods: [{ nmID: 7, currencyIsoCode4217: "RUB", sizes: [{ price: 1000, discountedPrice: 800 }] }] }, error: false, errorText: "" });
    });
    const raw = await wildberries.fetch({ query: "seller" }, { mode: "live", env: { WB_API_TOKEN: "test-token" } });
    expect(calls.map((c) => [c.init.method ?? "GET", c.url])).toEqual([
      ["POST", "https://content-api.wildberries.ru/content/v2/get/cards/list"],
      ["GET", "https://discounts-prices-api.wildberries.ru/api/v2/list/goods/filter?limit=1000&offset=0"],
    ]);
    expect(calls.every((c) => (c.init.headers as Record<string, string>).Authorization === "test-token")).toBe(true);
    expect(raw).toMatchObject({ mode: "live", synthetic: false });
    const { records } = wildberries.normalize(raw);
    expect(records).toEqual([expect.objectContaining({ externalId: "7", price: 800, currency: "RUB", weightKg: 0.5, synthetic: false })]);
  });
});
