import { describe, expect, it } from "vitest";
import { AdapterError, adapters, NormalizedRecord } from "..";

describe.each(Object.values(adapters))("$sourceId adapter", (adapter) => {
  it("live without token fails with token_not_configured", async () => {
    const err = await adapter.fetch({ query: "demo" }, { mode: "live", env: {} }).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(AdapterError);
    expect(err).toMatchObject({ code: "token_not_configured" });
    expect((err as Error).message).toContain("Токен не настроен");
  });

  it.runIf(!adapter.hasLive)("live with a token is still explicitly not implemented", async () => {
    const env = { [adapter.tokenEnv]: "placeholder" };
    await expect(adapter.fetch({ query: "demo" }, { mode: "live", env })).rejects.toMatchObject({ code: "not_implemented" });
  });

  it("replay fixture matches the source contract and normalizes", async () => {
    const raw = await adapter.fetch({ query: "demo" }, { mode: "replay" });
    expect(raw).toMatchObject({ sourceId: adapter.sourceId, mode: "replay", synthetic: true });
    expect(adapter.rawSchema.safeParse(raw.body).success).toBe(true);
    const { records, rejected } = adapter.normalize(raw);
    expect(records.length).toBeGreaterThan(0);
    for (const r of records) {
      expect(NormalizedRecord.safeParse(r).success).toBe(true);
      expect(r).toMatchObject({ sourceId: adapter.sourceId, fetchedAt: raw.fetchedAt, synthetic: true });
    }
    // В каждой записи есть позиция без цены или продаж: она отклоняется с причиной, а не получает число.
    expect(rejected.length).toBe(1);
    expect(rejected[0]?.reason).toBeTruthy();
  });

  it.runIf(["kaspi", "ozon", "aliexpress", "analytics"].includes(adapter.sourceId))("demo catalog recording matches the contract", async () => {
    const raw = await adapter.fetch({ query: "catalog" }, { mode: "replay" });
    expect(adapter.rawSchema.safeParse(raw.body).success).toBe(true);
    const { records } = adapter.normalize(raw);
    expect(records.length).toBeGreaterThan(0);
    for (const r of records) expect(r.synthetic).toBe(true);
  });

  it("mock returns only synthetic records", async () => {
    const raw = await adapter.fetch({ query: "anything" }, { mode: "mock" });
    const { records } = adapter.normalize(raw);
    expect(records.length).toBeGreaterThan(0);
    for (const r of records) expect(r.synthetic).toBe(true);
  });

  it("missing fixture and unsafe name are explicit errors", async () => {
    await expect(adapter.fetch({ query: "absent" }, { mode: "replay" })).rejects.toMatchObject({ code: "fixture_not_found" });
    await expect(adapter.fetch({ query: "../x" }, { mode: "replay" })).rejects.toMatchObject({ code: "fixture_not_found" });
  });

  it("body that breaks the contract is rejected", () => {
    const raw = { sourceId: adapter.sourceId, mode: "replay" as const, request: { query: "x" }, fetchedAt: "2026-10-18T00:00:00Z", body: { unexpected: true }, synthetic: true };
    expect(() => adapter.normalize(raw)).toThrow(expect.objectContaining({ code: "contract_violation" }));
  });
});

describe("wildberries: записанный живой ответ (replay)", () => {
  it("seller.json — реальная запись по контракту, не синтетика", async () => {
    const { wildberries } = await import("../wildberries");
    const raw = await wildberries.fetch({ query: "seller" }, { mode: "replay" });
    expect(raw.synthetic).toBe(false);
    expect(wildberries.rawSchema.safeParse(raw.body).success).toBe(true);
    const { records } = wildberries.normalize(raw);
    // Источник даёт только предложения своего магазина: спроса и рыночных данных нет — они остаются no_data.
    expect(records.every((r) => r.type === "offer" && r.kind === "listing")).toBe(true);
  });
});
