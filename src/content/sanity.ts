import { createClient, type SanityClient } from "@sanity/client";
import { createImageUrlBuilder } from "@sanity/image-url";
import type { PublicSanityConfig } from "./types";

export function createConfiguredSanityClient(config: PublicSanityConfig): SanityClient | null {
  if (!config.projectId || !config.dataset) return null;
  return createClient({
    projectId: config.projectId,
    dataset: config.dataset,
    apiVersion: config.apiVersion,
    useCdn: true,
    perspective: "published",
    stega: false,
  });
}

export function createSanityImageResolver(client: SanityClient | null): ((source: unknown) => string | undefined) | undefined {
  if (!client) return undefined;
  const builder = createImageUrlBuilder(client);
  return (source) => {
    if (!source || typeof source !== "object") return undefined;
    try {
      return builder.image(source as never).auto("format").fit("max").quality(82).url();
    } catch {
      return undefined;
    }
  };
}
