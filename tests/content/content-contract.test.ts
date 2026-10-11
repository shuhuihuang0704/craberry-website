import { describe, expect, it } from "vitest";
import { getLocalContent } from "../../src/content/fallback";
import type { ProjectMediaModule, SiteContent } from "../../src/content/types";

describe("normalized content contract", () => {
  it("keeps the local fallback in the same shape consumed by the page", () => {
    const content: SiteContent = getLocalContent();

    expect(content.projects.every((project) => project.status === "published")).toBe(true);
    expect(content.projects).toEqual(
      [...content.projects].sort((a, b) => a.sortOrder - b.sortOrder),
    );
    expect(content.resume.profile.name).toBeTruthy();
    expect(content.siteSettings.siteName).toBeTruthy();
  });

  it("represents every supported detail media module explicitly", () => {
    const modules: ProjectMediaModule[] = [
      { type: "image", image: { url: "/cover.jpg", alt: "cover" } },
      {
        type: "video",
        video: { url: "/demo.mp4", poster: "/poster.jpg", autoplay: false, muted: true, loop: true },
      },
      { type: "gallery", items: [{ image: { url: "/one.jpg", alt: "one" } }] },
      { type: "richText", heading: "说明", body: "项目内容" },
    ];

    expect(modules.map((module) => module.type)).toEqual([
      "image",
      "video",
      "gallery",
      "richText",
    ]);
  });
});
