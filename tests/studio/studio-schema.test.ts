import { describe, expect, it } from "vitest";
import { schemaTypes } from "../../sanity-studio/schemas";

describe("Sanity Studio schema", () => {
  it("registers every content type used by the public repository", () => {
    expect(schemaTypes.filter((schema) => schema.type === "document").map((schema) => schema.name)).toEqual([
      "category",
      "project",
      "resume",
      "siteSettings",
    ]);
  });

  it("labels required editorial fields and uses the published status field", () => {
    const project = schemaTypes.find((schema) => schema.name === "project");
    const title = project?.fields.find((field) => field.name === "title");
    const status = project?.fields.find((field) => field.name === "status");

    expect(title?.validation).toBeDefined();
    expect((status?.options as { list?: string[] } | undefined)?.list).toEqual(["draft", "published"]);
  });
});
