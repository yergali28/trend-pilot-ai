import { describe, expect, it } from "vitest";
import { BoxTariffsResponse, CommissionResponse, fetchWbTariffs } from "../wildberries/tariffs";

describe("wildberries tariffs: записанный живой ответ (replay)", () => {
  it("tariffs.json совпадает со схемами комиссий и тарифов коробов", async () => {
    const snap = await fetchWbTariffs({ mode: "replay" });
    expect(snap.synthetic).toBe(false);
    expect(CommissionResponse.safeParse(snap.body.commission).success).toBe(true);
    expect(BoxTariffsResponse.safeParse(snap.body.box).success).toBe(true);
    expect(snap.body.commission.report.length).toBeGreaterThan(0);
    expect(snap.body.box.response.data.warehouseList.length).toBeGreaterThan(0);
    for (const r of snap.body.commission.report.slice(0, 50)) expect(r.subjectID).toBeGreaterThan(0);
  });

  it("ответ, не совпадающий со схемой, отклоняется", () => {
    expect(CommissionResponse.safeParse({ report: [{ subjectID: "x" }] }).success).toBe(false);
    expect(BoxTariffsResponse.safeParse({ response: { data: { warehouseList: [{}] } } }).success).toBe(false);
  });

  it("live без токена — понятная ошибка", async () => {
    await expect(fetchWbTariffs({ mode: "live", env: {} })).rejects.toMatchObject({ code: "token_not_configured", message: expect.stringContaining("WB_API_TOKEN") });
  });
});
