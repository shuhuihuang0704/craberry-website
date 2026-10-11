import { describe, expect, it } from "vitest";
import { createContentRepository } from "../../src/content/repository";
import { normalizeSanityContent } from "../../src/content/normalize";
import { getLocalContent } from "../../src/content/fallback";

const rawProject = {
  _id: "project-1",
  title: "Sanity project",
  slug: "sanity-project",
  year: "2026",
  category: "Web",
  summary: "A project from Sanity",
  description: "Published content",
  cover: { type: "image", image: { url: "https://cdn.example.com/cover.jpg", alt: "Cover" } },
  media: [],
  sortOrder: 2,
  status: "published",
  featured: true,
  createdAt: "2026-01-02T00:00:00.000Z",
  updatedAt: "2026-01-02T00:00:00.000Z",
};

describe("Sanity content adapter", () => {
  it("normalizes and filters out draft records for the public site", () => {
    const content = normalizeSanityContent({
      projects: [rawProject, { ...rawProject, _id: "drafts.project-2", status: "draft", sortOrder: 1 }],
      categories: ["Web"],
      resume: getLocalContent().resume,
      siteSettings: getLocalContent().siteSettings,
    });

    expect(content.projects).toHaveLength(1);
    expect(content.projects[0]?.slug).toBe("sanity-project");
  });

  it("returns local content when Sanity is unavailable", async () => {
    const fallback = getLocalContent();
    const repository = createContentRepository({
      config: { projectId: "demo", dataset: "production", apiVersion: "2025-01-01" },
      fallback,
      client: { fetch: async () => { throw new Error("offline"); } },
    });

    const snapshot = await repository.getContent();

    expect(snapshot.source).toBe("local");
    expect(snapshot.content.siteSettings.siteName).toBe(fallback.siteSettings.siteName);
    expect(snapshot.error).toContain("offline");
  });

  it("keeps an intentional empty published collection empty", () => {
    const fallback = getLocalContent();
    const content = normalizeSanityContent({
      projects: [],
      categories: [],
      resume: fallback.resume,
      siteSettings: fallback.siteSettings,
    });

    expect(content.projects).toEqual([]);
    expect(content.categories).toEqual([]);
  });
});
