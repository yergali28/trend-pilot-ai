// Проверка записанных ответов на секреты и персональные данные. Значения совпадений не печатаются.
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const files = (dir) => readdirSync(dir).flatMap((f) => (statSync(join(dir, f)).isDirectory() ? files(join(dir, f)) : [join(dir, f)])).filter((f) => f.endsWith(".json"));
const patterns = {
  "JWT (eyJ…)": /eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}/,
  "Authorization / Bearer": /authorization|bearer\s/i,
  "токен/секрет в ключе": /"[^"]*(token|secret|password|api[_-]?key)[^"]*"\s*:/i,
  "email": /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/,
  "телефон": /(?<!\d)\+?[78][\s-]?\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}(?!\d)/,
  "ИНН/реквизиты продавца в ключе": /"(tin|inn|ogrn|kpp|sid|uid|oid|supplierName|sellerName)"\s*:/i,
};
// Значения токенов из локальных .env сверяются напрямую, но не выводятся.
const tokens = ["apps/worker/.env.local", "apps/web/.env.local"]
  .filter(existsSync)
  .flatMap((f) => readFileSync(f, "utf8").split(/\r?\n/))
  .filter((l) => /^(WB_API_TOKEN|KASPI_API_TOKEN|OZON_API_KEY|ALIEXPRESS_APP_KEY|ANALYTICS_API_KEY|ONEBOUND_API_KEY|ONEBOUND_API_SECRET|APIFY_TOKEN)=.{8,}/.test(l))
  .map((l) => l.slice(l.indexOf("=") + 1).trim());

let found = 0;
const list = files("fixtures");
for (const f of list) {
  const text = readFileSync(f, "utf8");
  // Названия поставщиков в синтетических фикстурах выдуманы; остальные шаблоны действуют и для них.
  const synthetic = /^\s*\{[^]*?"synthetic"\s*:\s*true/.test(text.slice(0, 400));
  for (const [name, re] of Object.entries(patterns)) {
    if (synthetic && name.startsWith("ИНН")) continue;
    if (re.test(text)) (found++, console.log(`  ${f}: ${name}`));
  }
  if (tokens.some((t) => text.includes(t))) (found++, console.log(`  ${f}: значение токена из .env.local`));
}
console.log(`проверено файлов: ${list.length}, шаблонов: ${Object.keys(patterns).length} + значения токенов из .env (${tokens.length}), совпадений: ${found}`);
if (found > 0) process.exit(1);
