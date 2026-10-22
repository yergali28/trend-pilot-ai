import { expect, test } from "@playwright/test";

test.describe("сквозной путь мастера подбора", () => {
  test("площадки + бюджет + 3x → категории → товары → карточка", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1, name: "Подбор товаров" })).toBeVisible();
    await page.getByLabel("Бюджет", { exact: true }).fill("1500000");
    await page.getByLabel("Валюта бюджета").selectOption("KZT");
    await page.locator("label", { hasText: /^3x$/ }).click();
    await page.getByRole("button", { name: "Подобрать товары" }).click();

    await expect(page).toHaveURL(/\/results\?/);
    await expect(page).toHaveURL(/x=3/);
    await expect(page.getByRole("heading", { level: 2, name: "Рейтинг категорий" })).toBeVisible();
    await page.getByRole("link", { name: "Аксессуары для электроники" }).click();

    await expect(page.getByRole("heading", { level: 1, name: "Аксессуары для электроники" })).toBeVisible();
    const firstProduct = page.getByRole("table").getByRole("link").first();
    const title = (await firstProduct.textContent())!.trim();
    await firstProduct.click();

    await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Юнит-экономика: / })).toBeVisible();
    await expect(page.getByText("Юнит-экономика: от цены продажи до чистой прибыли")).toBeVisible();
    // «Почему так?»: формула, источник и дата у каждой цифры.
    await expect(page.getByText("Чистая прибыль = цена продажи − себестоимость с доставкой − расходы продажи")).toBeVisible();
    await page.getByText(/^Источники входов: \d+$/).click();
    const sources = page.getByRole("table", { name: "Источники входов" });
    await expect(sources.getByRole("row", { name: /цена закупки AliExpress · API \d+ .* получено напрямую/ })).toBeVisible();
    await expect(sources.getByRole("row", { name: /Курс USD Демо-допущения · справочник \d+ .* оценка/ })).toBeVisible();
    await expect(page.getByText("Демо · синтетические данные").first()).toBeVisible();
  });

  test("режим «Все»: недоступная площадка серым с причиной, покрытие N из M", async ({ page }) => {
    await page.goto("/");
    const alibaba = page.locator("label", { hasText: "Alibaba.com" });
    await expect(alibaba).toContainText("Провайдер данных ещё не выбран");
    await expect(alibaba.locator("input[type=checkbox]")).toBeDisabled();

    await page.getByRole("button", { name: "Подобрать товары" }).click();
    await expect(page).toHaveURL(/sell=all/);
    // Kaspi, Ozon и Wildberries активны; у Wildberries (живой источник, магазин без товаров) данных нет.
    await expect(page.getByText("Данные с 2 из 3 площадок")).toBeVisible();
    const unavailable = page.getByRole("region", { name: "Недоступные площадки" });
    await expect(unavailable).toContainText("Alibaba.com");
    await expect(unavailable).toContainText("ожидает регистрации");
    await expect(unavailable).not.toContainText("Wildberries");

    // Мультивыбор: только Kaspi.
    await page.goto("/");
    const sell = page.getByRole("group", { name: "Площадки продажи" });
    await sell.locator("label", { hasText: "Ozon" }).click();
    await sell.locator("label", { hasText: "Wildberries" }).click();
    await page.getByRole("button", { name: "Подобрать товары" }).click();
    await expect(page).toHaveURL(/sell=kaspi(&|$)/);
    await expect(page.getByText("Данные с 1 из 1 площадок")).toBeVisible();
  });
});
