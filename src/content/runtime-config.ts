import type { PublicSanityConfig } from "./types";

declare const __PUBLIC_SANITY_CONFIG__: PublicSanityConfig | undefined;

const emptyConfig: PublicSanityConfig = {
  projectId: "",
  dataset: "production",
  apiVersion: "2025-01-01",
};

export function getPublicSanityConfig(): PublicSanityConfig {
  return typeof __PUBLIC_SANITY_CONFIG__ === "undefined"
    ? emptyConfig
    : { ...emptyConfig, ...__PUBLIC_SANITY_CONFIG__ };
}
