import { expect, test } from "@playwright/test";
import { service } from "./env";

// Детектор Impeccable на защищённых экранах (вход под тестовым пользователем): DETECT=1 и запущенный
// `impeccable live-server --background` на порту 8400.
test.skip(!process.env.DETECT, "DETECT=1 и impeccable live-server на :8400");

const Q = "sell=all&buy=all&country=KZ&cur=KZT&budget=1500000&x=3&metric=priceToCost";

test("детектор Impeccable: ноль находок на экранах", async ({ page }) => {
  test.setTimeout(10 * 60_000); // 7 экранов × 2 темы × 2 ширины
  const db = service();
  const { data: product } = await db.from("products").select("id").eq("source_id", "aliexpress").eq("external_id", "a-org").single();
  const { data: cat } = await db.from("categories").select("id").eq("external_id", "demo:electronics").single();
  const pages = ["/", `/results?${Q}`, `/results/${cat!.id}?${Q}`, `/products/${product!.id}?${Q}&m=kaspi`, "/admin", "/admin/sources", "/admin/references"];
  const report: string[] = [];
  for (const theme of ["light", "dark"]) {
    await page.goto(`/api/prefs?theme=${theme}&back=/`);
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
      for (const url of pages) {
        const logs: string[] = [];
        const onLog = (m: { text: () => string }) => logs.push(m.text());
        page.on("console", onLog);
        await page.goto(url);
        await page.waitForLoadState("networkidle");
        const verdictLogged = page.waitForEvent("console", { predicate: (m) => m.text().includes("[impeccable]"), timeout: 30_000 });
        await page.addScriptTag({ url: "http://localhost:8400/detect.js" });
        await verdictLogged;
        await page.waitForTimeout(300); // подробности находок идут следом в группе консоли
        page.off("console", onLog);
        const at = logs.findIndex((l) => l.includes("[impeccable]"));
        const verdict = at < 0 ? "" : logs.slice(at, at + 6).join(" | ").replace(/%c|color:[^;|]*;|font-weight: bold/g, "");
        report.push(`${theme} ${width} ${url.split("?")[0]}: ${verdict || "нет вывода детектора"}`);
      }
    }
  }
  await page.goto("/api/prefs?theme=light&back=/");
  console.log(report.join("\n"));
  expect(report.filter((r) => !/No anti-patterns found/.test(r))).toEqual([]);
});
