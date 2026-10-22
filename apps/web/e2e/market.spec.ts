import { expect, test } from "@playwright/test";

test("рынок WB: ниши, карточки товаров и страница товара с динамикой", async ({ page }) => {
  await page.goto("/market");
  await expect(page.getByRole("heading", { level: 1, name: "Рынок Wildberries" })).toBeVisible();
  await expect(page.getByRole("img", { name: "Ниши по выручке за 30 дней" })).toBeVisible();
  const niche = page.getByRole("table").getByRole("link").first();
  const name = (await niche.textContent())!.trim();
  await niche.click();
  await expect(page.getByRole("heading", { level: 1, name })).toBeVisible();
  await page.getByRole("list").getByRole("link").first().click();
  await expect(page.getByRole("img", { name: "Продажи и цена по дням" })).toBeVisible();
  await expect(page.getByText(/Источник: MPSTATS, период/)).toBeVisible();
  await expect(page.getByRole("heading", { name: "Юнит-экономика" })).toBeVisible();
});
