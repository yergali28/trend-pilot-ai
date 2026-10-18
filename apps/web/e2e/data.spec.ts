import { expect, test } from "@playwright/test";
import { service } from "./env";

const ALL = "/results?sell=all&buy=all&country=KZ&cur=KZT&x=3&metric=priceToCost";

test("нет данных: товар уходит в «Недостаточно данных», числа не подставляются", async ({ page }) => {
  await page.goto(ALL);
  const section = page.getByRole("region", { name: "Недостаточно данных" });
  const mat = section.getByRole("row", { name: /Коврик для йоги 6 мм/ });
  const reason = mat.getByRole("cell").last();
  await expect(reason).toContainText("Цена продажи");
  await expect(reason).not.toContainText(/\d/);

  // Карточка этого товара: цены продажи нет ни на одной площадке, вместо чисел «нет данных».
  const db = service();
  const { data } = await db.from("products").select("id").eq("source_id", "aliexpress").eq("external_id", "a-mat").single();
  await page.goto(`/products/${data!.id}?sell=all&buy=all&country=KZ&cur=KZT&x=3&metric=priceToCost`);
  const matrix = page.getByRole("table", { name: "Сравнение площадок продажи" });
  for (const market of ["Kaspi.kz", "Ozon"]) {
    const row = matrix.getByRole("row", { name: new RegExp(market) });
    await expect(row).toContainText("нет данных");
    await expect(row).not.toContainText("₸");
  }
  await expect(page.getByTestId("net-profit")).toHaveText("нет данных");
  await expect(page.getByText(/Нет данных: Цена продажи/).first()).toBeVisible();
});

test("спрос без продаж от провайдера показывается как «нет данных»", async ({ page }) => {
  const db = service();
  const { data } = await db.from("products").select("id").eq("source_id", "aliexpress").eq("external_id", "a-hub").single();
  await page.goto(`/products/${data!.id}?sell=all&buy=all&country=KZ&cur=KZT&x=3&metric=priceToCost`);
  const kaspi = page.getByRole("table", { name: "Сравнение площадок продажи" }).getByRole("row", { name: /Kaspi\.kz/ });
  await expect(kaspi.getByRole("cell").last()).toHaveText("нет данных");
});

test("экраны работают на данных режима mock", async ({ page }) => {
  const db = service();
  const { data } = await db.from("products").select("id, title").eq("source_id", "aliexpress").eq("external_id", "mock-1").single();
  await page.goto(`/products/${data!.id}?sell=all&buy=all&country=KZ&cur=KZT&x=3&metric=priceToCost`);
  await expect(page.getByRole("heading", { level: 1, name: data!.title })).toBeVisible();
  const kaspi = page.getByRole("table", { name: "Сравнение площадок продажи" }).getByRole("row", { name: /Kaspi\.kz/ });
  await expect(kaspi).toContainText("1 000 ₸");
  await expect(page.getByText("Демо · синтетические данные").first()).toBeVisible();
});

test("смена курса пересчитывает результат за ≤ 1 секунду", async ({ page }) => {
  const db = service();
  const { data } = await db.from("products").select("id").eq("source_id", "aliexpress").eq("external_id", "a-org").single();
  await page.goto(`/products/${data!.id}?sell=all&buy=all&country=KZ&cur=KZT&x=3&metric=priceToCost&m=kaspi`);
  const profit = page.getByTestId("net-profit");
  await expect(profit).toContainText("₸");
  await page.waitForLoadState("networkidle"); // замер после гидратации React

  // Замер внутри страницы: от события ввода до изменения текста прибыли.
  const ms = await page.evaluate(
    () =>
      new Promise<number>((resolve, reject) => {
        const input = document.querySelector<HTMLInputElement>('input[data-field="fx"]')!;
        const target = document.querySelector('[data-testid="net-profit"]')!;
        const before = target.textContent;
        const observer = new MutationObserver(() => {
          if (target.textContent !== before) {
            observer.disconnect();
            resolve(performance.now() - t0);
          }
        });
        observer.observe(target, { subtree: true, childList: true, characterData: true });
        const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
        const t0 = performance.now();
        setter.call(input, "520");
        input.dispatchEvent(new Event("input", { bubbles: true }));
        setTimeout(() => reject(new Error("результат не изменился за 1 с")), 1000);
      }),
  );
  console.log(`пересчёт после смены курса: ${ms.toFixed(1)} мс`);
  expect(ms).toBeLessThanOrEqual(1000);
  await page.getByText(/^Источники входов: \d+$/).click();
  await expect(page.getByRole("table", { name: "Источники входов" }).getByRole("row", { name: /Курс USD Ваш ввод · ввод \d+ .* получено напрямую/ })).toBeVisible();
});
