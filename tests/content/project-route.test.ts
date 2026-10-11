import { describe, expect, it } from "vitest";
import { getLocalContent } from "../../src/content/fallback";
import { mountProjectDetail } from "../../src/content/project-route";

describe("project hash route", () => {
  it("renders a published project detail without creating a server route", () => {
    document.body.innerHTML = "";
    const project = getLocalContent().projects[0]!;

    expect(mountProjectDetail(project, document)).toBe(true);
    expect(document.querySelector("#cms-project-detail h1")?.textContent).toBe(project.title);
    expect(document.querySelectorAll("#cms-project-detail [data-project-media]")).not.toHaveLength(0);
  });

  it("returns false for an unknown slug", () => {
    document.body.innerHTML = "";
    expect(mountProjectDetail(undefined, document)).toBe(false);
  });
});
