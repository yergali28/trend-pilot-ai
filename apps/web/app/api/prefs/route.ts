import { NextResponse } from "next/server";
import { isLocale } from "../../../lib/i18n";
import { LANG_COOKIE, THEME_COOKIE } from "../../../lib/prefs";
import { safeNext } from "../../../lib/session";

/** Переключение языка и темы: cookie на год и возврат на ту же страницу. */
export function GET(req: Request) {
  const url = new URL(req.url);
  const res = NextResponse.redirect(new URL(safeNext(url.searchParams.get("back")), url.origin));
  const lang = url.searchParams.get("lang");
  const theme = url.searchParams.get("theme");
  const opts = { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" as const };
  if (isLocale(lang)) res.cookies.set(LANG_COOKIE, lang, opts);
  if (theme === "light" || theme === "dark") res.cookies.set(THEME_COOKIE, theme, opts);
  return res;
}
