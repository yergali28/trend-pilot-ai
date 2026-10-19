import { describe, expect, it } from "vitest";
import { wbCountry, wbNumber } from "../src/refs-load";

describe("справочники WB: разбор значений без домысливания", () => {
  it("числа с запятой разбираются, «-» и пустое — нет тарифа", () => {
    expect(wbNumber("11,2")).toBe(11.2);
    expect(wbNumber("48")).toBe(48);
    expect(wbNumber("-")).toBeNull();
    expect(wbNumber("")).toBeNull();
    expect(wbNumber(undefined)).toBeNull();
  });

  it("страна только по документированному правилу geoName", () => {
    expect(wbCountry("Россия")).toBe("RU");
    expect(wbCountry("Центральный федеральный округ")).toBe("RU");
    expect(wbCountry("СНГ")).toBeNull(); // группа стран: конкретная страна неизвестна
    expect(wbCountry(undefined)).toBeNull();
  });
});
