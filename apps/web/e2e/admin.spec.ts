import { expect, test } from "@playwright/test";
import { randomUUID } from "node:crypto";

test("админ создаёт организацию и ссылку; пользователь входит по приглашению и задаёт пароль", async ({ page, browser }) => {
  const run = randomUUID().slice(0, 8);
  await page.goto("/admin");
  await page.getByLabel("Название", { exact: true }).fill(`Клиент ${run}`);
  await page.getByRole("button", { name: "Создать организацию" }).click();
  await expect(page.getByRole("cell", { name: `Клиент ${run}` })).toBeVisible();

  await page.getByLabel("Организация", { exact: true }).selectOption({ label: `Клиент ${run}` });
  await page.getByLabel("Email").fill(`invitee-${run}@test.local`);
  await page.getByRole("button", { name: "Создать ссылку" }).click();
  const link = (await page.getByTestId("invite-link").textContent())!.trim();
  expect(link).toMatch(/\/invite\/[0-9a-f]{64}$/);

  const guest = await browser.newContext({ storageState: { cookies: [], origins: [] }, locale: "ru-RU" });
  const g = await guest.newPage();
  await g.goto(link);
  await expect(g.getByRole("heading", { name: "Установите пароль" })).toBeVisible();
  const password = `pw-${randomUUID()}`;
  await g.getByLabel("Пароль", { exact: true }).fill(password);
  await g.getByLabel("Повторите пароль").fill(password);
  await g.getByRole("button", { name: "Сохранить и войти" }).click();
  await expect(g.getByRole("heading", { level: 1, name: "Подбор товаров" })).toBeVisible();

  // Повторное использование той же ссылки невозможно.
  const again = await (await browser.newContext({ storageState: { cookies: [], origins: [] }, locale: "ru-RU" })).newPage();
  await again.goto(link);
  await expect(again.getByText("Ссылка недействительна")).toBeVisible();
  await guest.close();
});

test("реестр источников и справочники", async ({ page }) => {
  await page.goto("/admin/sources");
  await expect(page.getByRole("heading", { name: "Реестр источников" })).toBeVisible();
  await expect(page.getByText(/^Wildberries ·/)).toBeVisible();
  await expect(page.getByText("Wildberries (wildberries-sales)")).toBeVisible();
  await page.goto("/admin/references");
  await expect(page.getByRole("heading", { name: "Справочники", level: 2 })).toBeVisible();
  await expect(page.getByRole("button", { name: "Добавить" })).toBeVisible();
});
