import { chromium } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { STATE, service } from "./env";

/** Демо-данные (replay и mock), организация и пользователь-администратор, вход через интерфейс. */
export default async function globalSetup() {
  execFileSync("pnpm", ["demo:load"], { cwd: "../..", stdio: "ignore" });
  execFileSync("pnpm", ["demo:load:mock"], { cwd: "../..", stdio: "ignore" });

  const db = service();
  const run = randomUUID().slice(0, 8);
  const email = `e2e-${run}@test.local`;
  const password = `pw-${randomUUID()}`; // одноразовый пароль тестового пользователя
  const user = await db.auth.admin.createUser({ email, password, email_confirm: true });
  if (user.error) throw user.error;
  const org = await db.from("organizations").insert({ name: `E2E ${run}` }).select("id").single().throwOnError();
  await db.from("memberships").insert({ org_id: org.data!.id, user_id: user.data.user.id, role: "owner" }).throwOnError();
  await db.from("platform_admins").insert({ user_id: user.data.user.id }).throwOnError();

  mkdirSync(STATE, { recursive: true });
  writeFileSync(`${STATE}/creds.json`, JSON.stringify({ email, password, orgId: org.data!.id, userId: user.data.user.id }));

  const browser = await chromium.launch();
  const page = await browser.newPage({ baseURL: "http://localhost:3000", locale: "ru-RU" });
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Пароль").fill(password);
  await page.getByRole("button", { name: "Войти" }).click();
  await page.waitForURL("http://localhost:3000/");
  await page.context().storageState({ path: `${STATE}/user.json` });
  await browser.close();
}
