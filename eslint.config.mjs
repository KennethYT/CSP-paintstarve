import coreWebVitals from "eslint-config-next/core-web-vitals";
import typescriptConfig from "eslint-config-next/typescript";

/** @type {import("eslint").Linter.Config[]} */
const config = [
  {
    ignores: [
      ".next/**",
      ".open-next/**",
      "node_modules/**",
      "next-env.d.ts",
      "demo/**",
      // Prisma 產生的 client，由 prisma generate 重建，不該進 lint
      "lib/generated/**"
    ]
  },
  ...coreWebVitals,
  ...typescriptConfig
];

export default config;
