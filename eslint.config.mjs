import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["**/node_modules/**", "**/.next/**", "**/coverage/**", "**/dist/**", "**/next-env.d.ts"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  // Скрипты Node (.mjs): глобалы рантайма.
  { files: ["**/*.mjs"], languageOptions: { globals: { console: "readonly", process: "readonly" } } },
);
