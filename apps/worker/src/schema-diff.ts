import { BOX_URL, COMMISSION_URL } from "@tp/adapters";

// Сверка схем с реальным ответом: выводит только имена полей ответа, которых нет в схеме (значения не выводятся).
const token = process.env.WB_API_TOKEN;
if (!token) throw new Error("Токен не настроен: WB_API_TOKEN");
const keys = (o: unknown): string[] => (o && typeof o === "object" ? Object.keys(o as object) : []);
const get = async (url: string) => (await fetch(url, { headers: { Authorization: token } })).json() as Promise<Record<string, unknown>>;
const commission = await get(`${COMMISSION_URL}?locale=ru`);
const box = await get(`${BOX_URL}?date=${new Date().toISOString().slice(0, 10)}`);
const row = (commission.report as unknown[])?.[0];
const data = ((box.response as Record<string, unknown>)?.data ?? {}) as Record<string, unknown>;
console.log(JSON.stringify({
  commissionTop: keys(commission),
  commissionRow: keys(row),
  boxTop: keys(box),
  boxData: keys(data),
  boxWarehouse: keys((data.warehouseList as unknown[])?.[0]),
}, null, 2));
