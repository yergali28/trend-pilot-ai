import { expect, test, type Page } from "@playwright/test";
import { service } from "./env";

// Скриншоты экранов для docs/screens: только по запросу (SCREENSHOTS=1), чтобы обычный прогон не менял файлы.
test.skip(!process.env.SCREENSHOTS, "SCREENSHOTS=1 для съёмки экранов");

const OUT = "../../docs/screens";
const Q = "sell=all&buy=all&country=KZ&cur=KZT&budget=1500000&x=3&metric=priceToCost";
const WIDTHS = [1440, 390];

async function shoot(page: Page, name: string, url: string, ready: () => Promise<void>) {
  for (const width of WIDTHS) {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
    await page.goto(url);
    await ready();
    await page.waitForLoadState("networkidle");
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    await page.screenshot({ path: `${OUT}/${name}-${width}.png`, fullPage: true });
  }
}

test("экраны приложения", async ({ page }) => {
  const db = service();
  const { data: product } = await db.from("products").select("id").eq("source_id", "aliexpress").eq("external_id", "a-org").single();
  const { data: cat } = await db.from("categories").select("id").eq("external_id", "demo:electronics").single();
  await shoot(page, "wizard", `/?${Q}`, () => expect(page.getByRole("heading", { level: 1 })).toBeVisible());
  await shoot(page, "categories", `/results?${Q}`, () => expect(page.getByRole("heading", { name: "Рейтинг категорий" })).toBeVisible());
  await shoot(page, "category-products", `/results/${cat!.id}?${Q}`, () => expect(page.getByRole("table")).toBeVisible());
  await shoot(page, "product-card", `/products/${product!.id}?${Q}&m=kaspi`, () => expect(page.getByTestId("net-profit")).toContainText("₸"));
  await shoot(page, "admin-orgs", "/admin", () => expect(page.getByRole("heading", { name: "Организации" })).toBeVisible());
  await shoot(page, "admin-sources", "/admin/sources", () => expect(page.getByRole("heading", { name: "Реестр источников" })).toBeVisible());
  await shoot(page, "admin-references", "/admin/references", () => expect(page.getByRole("heading", { name: "Справочники", level: 2 })).toBeVisible());
  // Справочники с загруженными комиссиями и тарифами WB (refs:load в global-setup).
  await shoot(page, "admin-references-fee-wb", "/admin/references?table=fee_rules", () => expect(page.getByRole("link", { name: "common-api.wildberries.ru" }).first()).toBeVisible());
  await shoot(page, "admin-references-logistics-wb", "/admin/references?table=logistics_rates", () => expect(page.getByRole("link", { name: "common-api.wildberries.ru" }).first()).toBeVisible());
});

test("экраны входа", async ({ browser }) => {
  const guest = await browser.newPage({ storageState: { cookies: [], origins: [] }, locale: "ru-RU" });
  await shoot(guest, "login", "/login", () => expect(guest.getByRole("heading", { name: "Вход" })).toBeVisible());
  const db = service();
  const { data: org } = await db.from("organizations").insert({ name: "Скриншот приглашения" }).select("id").single();
  const { data: token } = await db.rpc("create_invitation", { p_org: org!.id, p_email: "invitee@example.test", p_role: "member", p_ttl: "1 hour" });
  await shoot(guest, "invite", `/invite/${token}`, () => expect(guest.getByRole("heading", { name: "Установите пароль" })).toBeVisible());
  await db.from("organizations").delete().eq("id", org!.id);
});
