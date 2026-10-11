import { getLocalContent } from "./fallback";
import { normalizeSanityContent } from "./normalize";
import { PROJECT_BY_SLUG_QUERY, SITE_CONTENT_QUERY } from "./queries";
import { createConfiguredSanityClient, createSanityImageResolver } from "./sanity";
import type { ContentSnapshot, Project, PublicSanityConfig, Resume, SiteContent, SiteSettings } from "./types";
import type { SanityClient } from "@sanity/client";

export type SanityClientLike = Pick<SanityClient, "fetch"> & Partial<Pick<SanityClient, "listen">>;

export type ContentRepository = {
  getContent(): Promise<ContentSnapshot>;
  getProjects(): Promise<Project[]>;
  getProjectBySlug(slug: string): Promise<Project | undefined>;
  getResume(): Promise<Resume>;
  getSiteSettings(): Promise<SiteSettings>;
  subscribe?(onChange: (snapshot: ContentSnapshot) => void): () => void;
};

type RepositoryOptions = {
  config: PublicSanityConfig;
  fallback?: SiteContent;
  client?: SanityClientLike | null;
  timeoutMs?: number;
};

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Content request timed out after ${timeoutMs}ms`)), timeoutMs);
    promise.then((value) => { clearTimeout(timer); resolve(value); }, (error: unknown) => { clearTimeout(timer); reject(error); });
  });
}

export function createContentRepository(options: RepositoryOptions): ContentRepository {
  const fallback = options.fallback ?? getLocalContent();
  const client = options.client === undefined ? createConfiguredSanityClient(options.config) : options.client;
  const imageUrl = createSanityImageResolver(client as SanityClient | null);
  let lastSnapshot: ContentSnapshot | undefined;

  async function getContent(): Promise<ContentSnapshot> {
    if (!client) {
      const snapshot = { content: fallback, source: "local" as const, updatedAt: new Date().toISOString() };
      lastSnapshot = snapshot;
      return snapshot;
    }
    try {
      const raw = await withTimeout(client.fetch(SITE_CONTENT_QUERY, {}, { perspective: "published" }), options.timeoutMs ?? 4500);
      const snapshot = { content: normalizeSanityContent(raw, { imageUrl }), source: "sanity" as const, updatedAt: new Date().toISOString() };
      lastSnapshot = snapshot;
      return snapshot;
    } catch (error) {
      const snapshot = {
        content: fallback,
        source: "local" as const,
        error: error instanceof Error ? error.message : "Unable to load Sanity content",
        updatedAt: new Date().toISOString(),
      };
      lastSnapshot = snapshot;
      return snapshot;
    }
  }

  async function getProjects(): Promise<Project[]> {
    return (await getContent()).content.projects;
  }

  async function getProjectBySlug(slug: string): Promise<Project | undefined> {
    if (!client) return fallback.projects.find((project) => project.slug === slug);
    try {
      const raw = await withTimeout(client.fetch(PROJECT_BY_SLUG_QUERY, { slug }, { perspective: "published" }), options.timeoutMs ?? 4500);
      const project = normalizeSanityContent({ projects: raw, resume: fallback.resume, siteSettings: fallback.siteSettings }, { imageUrl }).projects.find((item) => item.slug === slug);
      return project ?? fallback.projects.find((item) => item.slug === slug);
    } catch {
      return fallback.projects.find((project) => project.slug === slug);
    }
  }

  async function getResume(): Promise<Resume> {
    return (await getContent()).content.resume;
  }

  async function getSiteSettings(): Promise<SiteSettings> {
    return (await getContent()).content.siteSettings;
  }

  function subscribe(onChange: (snapshot: ContentSnapshot) => void): () => void {
    if (!client?.listen) return () => undefined;
    const listen = client.listen as unknown as (...args: unknown[]) => { subscribe: (callback: () => void) => { unsubscribe: () => void } };
    const subscription = listen(SITE_CONTENT_QUERY, {}, { perspective: "published", includeResult: false }).subscribe(() => {
      void getContent().then(onChange);
    });
    return () => subscription.unsubscribe();
  }

  return { getContent, getProjects, getProjectBySlug, getResume, getSiteSettings, subscribe };
}

export function createDefaultContentRepository(config: PublicSanityConfig): ContentRepository {
  return createContentRepository({ config });
}
