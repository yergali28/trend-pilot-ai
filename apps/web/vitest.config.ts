import { defineConfig } from "vitest/config";

// e2e/*.spec.ts — Playwright (pnpm test:e2e), не vitest.
export default defineConfig({ test: { include: ["test/**/*.test.ts"] } });
