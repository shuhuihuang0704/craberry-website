import { readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
// @ts-expect-error jsdom v26 has no bundled TypeScript declarations in this project.
import { JSDOM } from "jsdom";
import { afterEach, describe, expect, it, vi } from "vitest";

const html = readFileSync(resolve(process.cwd(), "index.html"), "utf8");

type TransitionLoad = "stall" | "metadata";

function mountPortfolio(options: { coarsePointer?: boolean; transitionLoad?: TransitionLoad } = {}) {
  let scrollY = 0;
  let heroPlayCalls = 0;
  const coarsePointer = options.coarsePointer ?? false;
  const transitionLoad = options.transitionLoad ?? "stall";
  const dom = new JSDOM(html, {
    url: "https://portfolio.test/",
    runScripts: "dangerously",
    beforeParse(window: Window & typeof globalThis) {
      Object.defineProperty(window, "innerHeight", { configurable: true, value: 800 });
      Object.defineProperty(window, "innerWidth", { configurable: true, value: 390 });
      Object.defineProperty(window, "scrollY", { configurable: true, get: () => scrollY });
      Object.defineProperty(window, "scrollTo", {
        configurable: true,
        value: (_x: number, y: number) => {
          scrollY = Number(y) || 0;
          window.dispatchEvent(new window.Event("scroll"));
        },
      });
      Object.defineProperty(window.HTMLElement.prototype, "scrollIntoView", {
        configurable: true,
        value(this: HTMLElement) {
          const pageIndex = Array.from(window.document.querySelectorAll(".portfolio-page")).indexOf(this);
          if (pageIndex >= 0) window.scrollTo(0, (pageIndex + 1) * 800);
          else if (this.id === "top") window.scrollTo(0, 0);
        },
      });
      window.requestAnimationFrame = (() => 1) as typeof window.requestAnimationFrame;
      window.cancelAnimationFrame = (() => {}) as typeof window.cancelAnimationFrame;
      window.matchMedia = ((media: string) => ({
        matches: media === "(pointer: coarse)" && coarsePointer,
        media,
        onchange: null,
        addListener() {},
        removeListener() {},
        addEventListener() {},
        removeEventListener() {},
        dispatchEvent: () => false,
      })) as typeof window.matchMedia;
      window.fetch = (() => Promise.resolve({ ok: false, json: async () => [] } as Response)) as typeof window.fetch;
      window.HTMLCanvasElement.prototype.getContext = (() => null) as typeof window.HTMLCanvasElement.prototype.getContext;

      Object.defineProperty(window.HTMLMediaElement.prototype, "readyState", {
        configurable: true,
        get(this: HTMLMediaElement & { testReadyState?: number }) { return this.testReadyState ?? 0; },
      });
      Object.defineProperty(window.HTMLMediaElement.prototype, "currentSrc", {
        configurable: true,
        get(this: HTMLMediaElement & { testCurrentSrc?: string }) { return this.testCurrentSrc ?? ""; },
      });
      Object.defineProperty(window.HTMLMediaElement.prototype, "currentTime", {
        configurable: true,
        get(this: HTMLMediaElement & { testCurrentTime?: number }) { return this.testCurrentTime ?? 0; },
        set(this: HTMLMediaElement & { testCurrentTime?: number }, value: number) { this.testCurrentTime = value; },
      });
      window.HTMLMediaElement.prototype.play = function () {
        if (this.id === "mainVideo") heroPlayCalls += 1;
        return Promise.resolve();
      };
      window.HTMLMediaElement.prototype.pause = function () {};
      window.HTMLMediaElement.prototype.load = function () {
        if (this.id !== "pageTransitionVideo" || transitionLoad !== "metadata") return;
        const media = this as HTMLMediaElement & { testReadyState?: number; testCurrentSrc?: string };
        media.testReadyState = 1;
        media.testCurrentSrc = this.src;
        window.setTimeout(() => this.dispatchEvent(new window.Event("loadedmetadata")), 0);
      };
    },
  });

  const pages = [...dom.window.document.querySelectorAll<HTMLElement>(".portfolio-page")];
  pages.forEach((page, index) => {
    page.getBoundingClientRect = () => {
      const top = (index + 1) * 800 - scrollY;
      return { x: 0, y: top, top, bottom: top + 800, left: 0, right: 390, width: 390, height: 800, toJSON: () => ({}) };
    };
  });

  for (const id of ["mainVideo", "outroVideo"]) {
    const video = dom.window.document.getElementById(id) as HTMLVideoElement & { testReadyState?: number };
    video.testReadyState = 1;
    video.dispatchEvent(new dom.window.Event("loadedmetadata"));
  }

  return {
    dom,
    setScrollY: (value: number) => { scrollY = value; },
    heroPlayCalls: () => heroPlayCalls,
  };
}

afterEach(() => {
  vi.useRealTimers();
});

describe("portfolio page navigation", () => {
  it("keeps touch-device videos on the standard inline playback path", () => {
    const { dom } = mountPortfolio({ coarsePointer: true });
    const videos = [...dom.window.document.querySelectorAll("video")];

    expect(videos.length).toBeGreaterThan(0);
    expect(videos.every(video => video.hasAttribute("playsinline"))).toBe(true);
    expect(videos.some(video => video.hasAttribute("x5-playsinline"))).toBe(false);
    dom.window.close();
  });

  it("selects compact hero videos on touch devices", () => {
    const { dom } = mountPortfolio({ coarsePointer: true });

    expect(dom.window.document.getElementById("mainVideo")?.getAttribute("src")).toBe("main-video-mobile.mp4");
    expect(dom.window.document.getElementById("outroVideo")?.getAttribute("src")).toBe("main-video-mobile.mp4");
    expect(statSync(resolve(process.cwd(), "main-video-mobile.mp4")).size).toBeLessThan(500_000);
    dom.window.close();
  });

  it("loads a compact transition clip when a touch user advances pages", async () => {
    vi.useFakeTimers();
    const { dom, setScrollY } = mountPortfolio({ coarsePointer: true, transitionLoad: "metadata" });
    setScrollY(800);

    (dom.window.document.querySelector("#page-1 .page-next") as HTMLAnchorElement).click();
    await vi.advanceTimersByTimeAsync(0);

    expect(dom.window.document.getElementById("pageTransitionVideo")?.getAttribute("src")).toBe("custom-transition-mobile.mp4");
    expect(statSync(resolve(process.cwd(), "custom-transition-mobile.mp4")).size).toBeLessThan(1_000_000);
    dom.window.close();
  });

  it("uses a compact portrait asset for the mobile biography background", () => {
    const { dom } = mountPortfolio({ coarsePointer: true });
    const mobilePortrait = dom.window.document.querySelector(".resume-feature-photo source[media]");

    expect(mobilePortrait?.getAttribute("srcset")).toBe("page-1-mobile.webp");
    expect(statSync(resolve(process.cwd(), "page-1-mobile.webp")).size).toBeLessThan(500_000);
    dom.window.close();
  });

  it("uses the compressed texture for portfolio page backgrounds", () => {
    expect(html).not.toContain('url("resume-texture.png")');
    expect(html).toContain('url("resume-texture.webp")');
  });

  it("keeps the touch-device resume timeline in natural document flow", () => {
    const { dom } = mountPortfolio({ coarsePointer: true });

    expect(dom.window.document.querySelector(".resume-timeline")?.classList.contains("is-wheel")).toBe(false);
    dom.window.close();
  });

  it("retains the interactive timeline wheel on fine-pointer devices", () => {
    const { dom } = mountPortfolio({ coarsePointer: false });

    expect(dom.window.document.querySelector(".resume-timeline")?.classList.contains("is-wheel")).toBe(true);
    dom.window.close();
  });

  it("restarts the touch-device home video when the Ending return button is used", () => {
    const { dom, setScrollY, heroPlayCalls } = mountPortfolio({ coarsePointer: true });
    const { document } = dom.window;
    setScrollY(2400);

    (document.querySelector(".page-next--restart") as HTMLAnchorElement).click();

    expect(dom.window.location.hash).toBe("#top");
    expect(heroPlayCalls()).toBe(2);
    dom.window.close();
  });

  it("falls back to the target page if transition metadata never arrives", async () => {
    vi.useFakeTimers();
    const { dom, setScrollY } = mountPortfolio({ transitionLoad: "stall" });
    setScrollY(800);
    (dom.window.document.querySelector("#page-1 .page-next") as HTMLAnchorElement).click();

    await vi.advanceTimersByTimeAsync(15_000);

    expect(dom.window.location.hash).toBe("#page-2");
    expect(dom.window.document.querySelector(".page-transition")?.classList.contains("is-playing")).toBe(false);
    dom.window.close();
  });

  it("releases the full-screen transition if video playback stops making progress", async () => {
    vi.useFakeTimers();
    const { dom, setScrollY } = mountPortfolio({ transitionLoad: "metadata" });
    setScrollY(800);
    (dom.window.document.querySelector("#page-1 .page-next") as HTMLAnchorElement).click();
    await vi.advanceTimersByTimeAsync(0);
    expect(dom.window.document.querySelector(".page-transition")?.classList.contains("is-playing")).toBe(true);

    await vi.advanceTimersByTimeAsync(10_000);

    expect(dom.window.location.hash).toBe("#page-2");
    expect(dom.window.document.querySelector(".page-transition")?.classList.contains("is-playing")).toBe(false);
    dom.window.close();
  });
});
