import { build } from "esbuild";

const publicConfig = {
  projectId: process.env.SANITY_PROJECT_ID ?? "",
  dataset: process.env.SANITY_DATASET ?? "production",
  apiVersion: process.env.SANITY_API_VERSION ?? "2025-01-01",
};

await build({
  entryPoints: ["src/content/runtime-entry.ts"],
  bundle: true,
  format: "iife",
  platform: "browser",
  target: "es2022",
  outfile: "content-runtime.js",
  sourcemap: true,
  define: {
    __PUBLIC_SANITY_CONFIG__: JSON.stringify(publicConfig),
  },
});
