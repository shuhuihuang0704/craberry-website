import { describe, expect, it } from "vitest";
import { hydratePageContent } from "../../src/content/hydrate";
import { getLocalContent } from "../../src/content/fallback";

describe("static page hydration", () => {
  it("fills the existing resume shell and only renders published project data", () => {
    document.body.innerHTML = `
      <title>Old title</title>
      <main>
        <div class="resume-feature-copy"><p>Old profile</p><div class="resume-feature-list"><div class="resume-timeline"></div><aside class="resume-honors"></aside></div></div>
        <div data-cms-projects><div data-cms-project-grid></div></div>
      </main>
    `;
    const content = getLocalContent();

    hydratePageContent(content, document, "sanity");

    expect(document.querySelector(".resume-feature-copy > p")?.textContent).toContain("黄淑慧");
    expect(document.querySelectorAll(".resume-timeline article")).toHaveLength(4);
    expect(document.querySelectorAll("[data-cms-project-card]")).toHaveLength(content.projects.length);
    expect(document.body.dataset.contentSource).toBe("sanity");
  });

  it("does not autoplay configured background music", () => {
    document.body.innerHTML = "<main data-cms-projects><div data-cms-project-grid></div></main>";
    const content = getLocalContent();
    content.siteSettings.backgroundMusic = { url: "/music.mp3", name: "Music", enabled: true, loop: true, volume: 0.3 };

    hydratePageContent(content, document);

    expect(document.querySelector("#siteBackgroundMusic")).not.toBeNull();
    expect((document.querySelector("#siteBackgroundMusic") as HTMLAudioElement).paused).toBe(true);
    expect(document.querySelector("[data-audio-toggle]")?.textContent).toBe("SOUND / OFF");
  });
});
