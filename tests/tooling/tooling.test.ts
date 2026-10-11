import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("CMS tooling", () => {
  it("exposes the typecheck, test, build, and check commands", () => {
    const packageJson = JSON.parse(
      readFileSync(join(process.cwd(), "package.json"), "utf8"),
    ) as { scripts: Record<string, string> };

    expect(packageJson.scripts.typecheck).toBe("tsc --noEmit");
    expect(packageJson.scripts.test).toBe("vitest run");
    expect(packageJson.scripts.build).toBe("node scripts/build-content.mjs");
    expect(packageJson.scripts.check).toBe("npm run typecheck && npm test -- --run");
  });
});
