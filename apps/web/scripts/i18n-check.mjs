// Проверка i18n: полнота ru/en/kk, подстановки, ключи из кода и строки интерфейса без ключей.
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const locales = ["ru", "en", "kk"];
const cat = Object.fromEntries(locales.map((l) => [l, JSON.parse(readFileSync(`messages/${l}.json`, "utf8"))]));
const all = new Set(locales.flatMap((l) => Object.keys(cat[l])));
const vars = (s) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(",");
let problems = 0;

for (const l of locales) {
  const missing = [...all].filter((k) => !(k in cat[l]));
  const empty = Object.entries(cat[l]).filter(([, v]) => typeof v !== "string" || !v.trim()).map(([k]) => k);
  const badVars = Object.keys(cat.ru).filter((k) => k in cat[l] && vars(cat[l][k]) !== vars(cat.ru[k]));
  console.log(`${l}: ключей ${Object.keys(cat[l]).length}, пропущено ${missing.length}, пустых ${empty.length}, расхождений подстановок ${badVars.length}`);
  for (const k of [...missing, ...empty, ...badVars]) console.log(`  ${l}: ${k}`);
  problems += missing.length + empty.length + badVars.length;
}

const files = (dir) => readdirSync(dir).flatMap((f) => (statSync(join(dir, f)).isDirectory() ? files(join(dir, f)) : [join(dir, f)]));
const sources = [...files("app"), ...files("components"), ...files("lib"), ...files("../../packages/ui/src")].filter((f) => /\.(tsx?|mjs)$/.test(f));

// Ключи, использованные в коде литералом t("key"), должны быть в каталоге.
const usedMissing = new Set();
for (const f of sources) for (const m of readFileSync(f, "utf8").matchAll(/\bt\(\s*"([^"]+)"/g)) if (!(m[1] in cat.ru)) usedMissing.add(`${f}: ${m[1]}`);
console.log(`ключей из кода без перевода: ${usedMissing.size}`);
for (const k of usedMissing) console.log(`  ${k}`);
problems += usedMissing.size;

// Кириллица в разметке .tsx вне комментариев означает строку интерфейса без ключа.
const hardcoded = [];
for (const f of sources.filter((f) => f.endsWith(".tsx"))) {
  const code = readFileSync(f, "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");
  code.split("\n").forEach((line, i) => /[А-Яа-яЁёӘәҒғҚқҢңӨөҰұҮүҺһІі]/.test(line) && hardcoded.push(`${f}:${i + 1}: ${line.trim().slice(0, 80)}`));
}
console.log(`строк интерфейса без ключа: ${hardcoded.length}`);
for (const h of hardcoded) console.log(`  ${h}`);
problems += hardcoded.length;

if (problems > 0) process.exit(1);
console.log("i18n: ok");
