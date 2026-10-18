import type { NextConfig } from "next";

const config: NextConfig = { transpilePackages: ["@tp/calc", "@tp/ui"], devIndicators: false };

export default config;
