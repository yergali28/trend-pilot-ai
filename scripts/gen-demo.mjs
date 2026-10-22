// Генератор расширенного демо-каталога: дописывает в fixtures синтетические товары с id «g-…».
// Всё synthetic: true, не рыночные данные. Зерно фиксированное — повторный запуск даёт тот же набор.
// `node scripts/gen-demo.mjs` перезаписывает только позиции g-…, ручные записи не трогает.
import { readFileSync, writeFileSync } from "node:fs";

const CATEGORIES = {
  kitchen: ["Кухня и посуда", ["Силиконовые лопатки, 5 шт.", "Контейнеры для еды, 10 шт.", "Тёрка многофункциональная", "Органайзер для специй", "Коврик для сушки посуды", "Формы для льда силиконовые", "Нож для овощей спиральный", "Мерные ложки, набор"]],
  beauty: ["Красота и уход", ["Массажёр для лица роликовый", "Набор кистей для макияжа, 12 шт.", "Зеркало с подсветкой настольное", "Щётка для умывания силиконовая", "Бигуди мягкие, 20 шт.", "Органайзер для косметики", "Пилка электрическая для ногтей", "Повязка на голову для умывания"]],
  pets: ["Товары для животных", ["Лежанка для кошки круглая", "Когтеточка-столбик", "Миска двойная на подставке", "Игрушка-мышь интерактивная", "Перчатка для вычёсывания шерсти", "Шлейка для собак светоотражающая", "Поилка-фонтан для кошек", "Пакеты для выгула, 300 шт."]],
  toys: ["Детские игрушки", ["Конструктор магнитный, 64 детали", "Пазл деревянный для малышей", "Мыльные пузыри, генератор", "Кинетический песок, 1 кг", "Набор для рисования в чемоданчике", "Игрушка-антистресс поп-ит", "Машинка инерционная", "Доска для рисования LCD"]],
  auto: ["Автотовары", ["Держатель телефона в дефлектор", "Органайзер в багажник", "Зарядка в прикуриватель 2 USB", "Щётка для снега телескопическая", "Чехол на руль", "Ароматизатор в дефлектор", "Компрессор автомобильный мини", "Коврик противоскользящий на панель"]],
  garden: ["Сад и дача", ["Перчатки садовые с когтями", "Опрыскиватель ручной 2 л", "Секатор садовый", "Светильник садовый на солнечной батарее", "Капельный полив, набор", "Подвязки для растений, 100 шт.", "Кашпо подвесное", "Семена газона, 1 кг"]],
  office: ["Канцелярия", ["Ручки гелевые, 12 цветов", "Стикеры-закладки, набор", "Органайзер настольный", "Блокнот на кольцах A5", "Маркеры для скетчинга, 24 шт.", "Подставка для ноутбука", "Степлер с скобами", "Папка-конверт, 10 шт."]],
  light: ["Освещение", ["Лента светодиодная 5 м", "Ночник с датчиком движения", "Гирлянда-шторка 3×3 м", "Лампа-прищепка для чтения", "Светильник-проектор звёздное небо", "Фонарик налобный", "Свечи светодиодные, 6 шт.", "Лампа для селфи кольцевая"]],
  bath: ["Ванная", ["Держатель для зубных щёток", "Коврик для ванной противоскользящий", "Дозатор для мыла сенсорный", "Полка угловая без сверления", "Шапочка для душа, 3 шт.", "Органайзер для душа подвесной", "Лейка для душа с фильтром", "Крючки самоклеящиеся, 10 шт."]],
  outdoor: ["Туризм и кемпинг", ["Коврик туристический самонадувающийся", "Фонарь кемпинговый", "Термокружка 500 мл", "Гамак с москитной сеткой", "Набор посуды походный", "Компас-брелок", "Сидушка туристическая", "Мультитул складной"]],
  mobile: ["Мобильные аксессуары", ["Защитное стекло, 3 шт.", "Кабель USB-C 2 м плетёный", "Кольцо-держатель для телефона", "Подставка для планшета", "Беспроводная зарядка 15 Вт", "Чехол-кошелёк для телефона", "Стилус для экрана", "Монопод для селфи с пультом"]],
  computer: ["Компьютерные аксессуары", ["Коврик для мыши XXL", "Подставка под монитор", "Кабель-органайзер на стол", "Мышь беспроводная тихая", "Подставка-охлаждение для ноутбука", "Клавиатура беспроводная мини", "Веб-камера 1080p", "Разветвитель HDMI"]],
  bags: ["Сумки и аксессуары", ["Сумка-шопер холщовая", "Поясная сумка спортивная", "Кошелёк с RFID-защитой", "Органайзер для сумки", "Косметичка дорожная", "Рюкзак складной", "Чехол для паспорта", "Сумка-холодильник 10 л"]],
  health: ["Здоровье и массаж", ["Массажный мяч, 2 шт.", "Аппликатор Кузнецова", "Таблетница на неделю", "Массажёр для шеи", "Ортопедическая подушка", "Корсет для осанки", "Эспандер кистевой", "Грелка солевая"]],
  tools: ["Инструменты", ["Набор отвёрток прецизионных", "Уровень лазерный", "Рулетка 5 м", "Набор бит, 32 шт.", "Клеевой пистолет", "Нож строительный", "Скотч двусторонний, 3 шт.", "Стяжки кабельные, 200 шт."]],
};

// mulberry32: детерминированный генератор, чтобы набор не менялся между запусками.
let seed = 20261022;
const rnd = () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const between = (a, b) => a + rnd() * (b - a);
const roundTo = (v, step) => Math.max(step, Math.round(v / step) * step);

const products = [];
let n = 0;
for (const [cat, [, names]] of Object.entries(CATEGORIES)) {
  for (const title of names) {
    n++;
    const usd = Number(between(0.6, 9).toFixed(2));
    const weight = Number(between(0.05, 1.2).toFixed(2));
    // Наценка на цену закупки: от «почти без маржи» до «очень маржинально».
    const markup = between(1.6, 7.5);
    const hot = rnd(); // популярность
    const demand = (base) => Math.round(base * (0.15 + hot ** 2 * 3) * between(0.6, 1.4));
    const landedRub = usd * 92 + weight * 450;
    products.push({
      id: `g${String(n).padStart(3, "0")}`,
      cat,
      title,
      usd,
      weight,
      ozon: rnd() < 0.9 ? roundTo(landedRub * markup, 10) : null,
      wb: rnd() < 0.92 ? roundTo(landedRub * markup * between(0.85, 1.05), 10) : null,
      kaspi: rnd() < 0.85 ? roundTo(landedRub * 5.6 * markup * between(0.9, 1.15), 100) : null,
      demand: {
        ozon: rnd() < 0.9 ? demand(180) : null,
        wildberries: rnd() < 0.9 ? demand(320) : null,
        kaspi: rnd() < 0.85 ? demand(90) : null,
      },
    });
  }
}

const file = (p) => new URL(`../fixtures/${p}`, import.meta.url);
const edit = (p, fn) => {
  const json = JSON.parse(readFileSync(file(p), "utf8"));
  fn(json);
  writeFileSync(file(p), `${JSON.stringify(json, null, 2)}\n`);
};
const mine = (id) => String(id).startsWith("g") || String(id).startsWith("wb-g") || String(id).startsWith("a-g") || String(id).startsWith("k-g");
const ozonId = (p) => 20000 + Number(p.id.slice(1));
const wbId = (p) => 300000 + Number(p.id.slice(1));

edit("aliexpress/catalog.json", (j) => {
  j.body.products = j.body.products.filter((x) => !mine(x.product_id));
  for (const p of products) j.body.products.push({ product_id: `a-${p.id}`, product_title: p.title, target_sale_price: p.usd.toFixed(2), target_sale_price_currency: "USD", package_weight: p.weight });
});
edit("kaspi/catalog.json", (j) => {
  j.body.data = j.body.data.filter((x) => !mine(x.id));
  for (const p of products) if (p.kaspi) j.body.data.push({ id: `k-${p.id}`, attributes: { name: p.title, price: p.kaspi, currency: "KZT" } });
});
edit("ozon/catalog.json", (j) => {
  j.body.result.items = j.body.result.items.filter((x) => x.product_id < 20000);
  for (const p of products) if (p.ozon) j.body.result.items.push({ product_id: ozonId(p), name: p.title, price: String(p.ozon), currency_code: "RUB" });
});

// Wildberries: синтетический демо-каталог в формате адаптера (карточки и цены), отдельно от живой записи seller.json.
const wbProducts = products.filter((p) => p.wb);
writeFileSync(
  file("wildberries/catalog.json"),
  `${JSON.stringify(
    {
      recordedAt: "2026-10-18T00:00:00Z",
      synthetic: true,
      note: "Синтетический демо-каталог в формате адаптера WB (scripts/gen-demo.mjs). Не данные магазина и не рынок.",
      body: {
        cards: wbProducts.map((p) => ({ nmID: wbId(p), title: p.title, subjectName: CATEGORIES[p.cat][0], dimensions: { weightBrutto: p.weight } })),
        goods: wbProducts.map((p) => ({ nmID: wbId(p), currencyIsoCode4217: "RUB", sizes: [{ price: Math.round(p.wb * 1.6), discountedPrice: p.wb }] })),
      },
    },
    null,
    2,
  )}\n`,
);

const listingId = { ozon: (p) => String(ozonId(p)), wildberries: (p) => String(wbId(p)), kaspi: (p) => `k-${p.id}` };
const listed = { ozon: (p) => p.ozon, wildberries: (p) => p.wb, kaspi: (p) => p.kaspi };
edit("analytics/catalog.json", (j) => {
  j.body.items = j.body.items.filter((x) => !(x.marketplace === "wildberries" || mine(x.external_id) || Number(x.external_id) >= 20000));
  for (const p of products)
    for (const [m, sales] of Object.entries(p.demand))
      if (listed[m](p)) j.body.items.push({ marketplace: m, external_id: listingId[m](p), title: p.title, sales_per_month: sales, period_start: "2026-09-01", period_end: "2026-09-30" });
});

edit("demo/catalog.json", (j) => {
  j.categories = j.categories.filter((c) => !(c.id in CATEGORIES));
  for (const [id, [name]] of Object.entries(CATEGORIES)) j.categories.push({ id, name });
  j.productCategories = j.productCategories.filter((x) => !mine(x.source[1]));
  j.matches = j.matches.filter((x) => !mine(x.source[1]));
  for (const p of products) {
    j.productCategories.push({ source: ["aliexpress", `a-${p.id}`], category: p.cat });
    for (const m of ["kaspi", "ozon", "wildberries"])
      if (listed[m](p)) j.matches.push({ source: ["aliexpress", `a-${p.id}`], listing: [m, listingId[m](p)], confidence: Number(between(0.72, 0.97).toFixed(2)) });
  }
});

console.log(`товаров ${products.length}, категорий ${Object.keys(CATEGORIES).length}; WB ${wbProducts.length}, Ozon ${products.filter((p) => p.ozon).length}, Kaspi ${products.filter((p) => p.kaspi).length}`);
