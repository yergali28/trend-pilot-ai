import { describe, expect, it } from "vitest";
import golden from "../../../fixtures/calc-golden-cases.json" with { type: "json" };
import { calculate, type CalcInput, type ResultValue, type SourceRef } from "../src";

type Raw = Record<string, unknown>;

// Разворачивает сокращения фикстуры (см. description в JSON) в полноценный CalcInput.
function expand(raw: Raw, source: SourceRef): CalcInput {
  const value = (v: unknown) =>
    typeof v === "number" ? { value: v, status: "verified", source } : { status: "verified", source, ...(v as Raw) };
  const out: Raw = {};
  for (const [k, v] of Object.entries(raw)) {
    if (k === "currency") out[k] = v;
    else if (k === "fxRates") out[k] = Object.fromEntries(Object.entries(v as Raw).map(([c, r]) => [c, value(r)]));
    else if (k === "tax") {
      const t = v as Raw;
      out[k] = t.mode === "off" ? { source, ...t } : { ...t, rate: value(t.rate) };
    } else out[k] = value(v);
  }
  return out as unknown as CalcInput;
}

const pick = (obj: unknown, path: string) =>
  path.split(".").reduce<unknown>((o, k) => (o as Raw)[k], obj) as ResultValue;

describe("golden cases", () => {
  it("has at least 12 synthetic cases", () => {
    expect(golden.cases.length).toBeGreaterThanOrEqual(12);
    for (const c of golden.cases) expect(c.synthetic).toBe(true);
  });

  for (const c of golden.cases) {
    it(c.id, () => {
      const result = calculate(expand(c.input as Raw, golden.source as SourceRef));
      for (const [path, exp] of Object.entries(c.expected as Record<string, Raw>)) {
        const got = pick(result, path);
        expect(got.status, path).toBe(exp.status);
        for (const key of ["pessimistic", "realistic", "optimistic"] as const) {
          if (!(key in exp)) continue;
          if (exp[key] === null) expect(got[key], `${path}.${key}`).toBeNull();
          else expect(got[key], `${path}.${key}`).toBeCloseTo(exp[key] as number, 3);
        }
        if (exp.missing) expect(got.missing, `${path}.missing`).toEqual(exp.missing);
        if (exp.reason) expect(got.reason, `${path}.reason`).toBe(exp.reason);
        if (got.status !== "no_data") expect(got.sources.length, `${path}.sources`).toBeGreaterThan(0);
      }
    });
  }
});
