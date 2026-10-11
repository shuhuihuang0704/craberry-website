import type { ContentRepository } from "./repository";
import type { Project, ProjectMediaModule, SiteContent } from "./types";

function addText(doc: Document, parent: HTMLElement, tag: keyof HTMLElementTagNameMap, text: string, className?: string): HTMLElement {
  const element = doc.createElement(tag);
  element.textContent = text;
  if (className) element.className = className;
  parent.append(element);
  return element;
}

function renderMedia(doc: Document, module: ProjectMediaModule): HTMLElement {
  const wrapper = doc.createElement("figure");
  wrapper.dataset.projectMedia = module.type;
  wrapper.className = `cms-detail-media cms-detail-media--${module.type}`;
  if (module.type === "image") {
    const image = doc.createElement("img");
    image.src = module.image.url;
    image.alt = module.image.alt;
    image.loading = "lazy";
    wrapper.append(image);
  } else if (module.type === "video") {
    const video = doc.createElement("video");
    video.src = module.video.url;
    video.poster = module.video.poster || "";
    video.autoplay = module.video.autoplay;
    video.muted = module.video.muted;
    video.loop = module.video.loop;
    video.controls = true;
    video.playsInline = true;
    video.preload = "metadata";
    wrapper.append(video);
  } else if (module.type === "gallery") {
    module.items.forEach(({ image: item }) => {
      const image = doc.createElement("img");
      image.src = item.url;
      image.alt = item.alt;
      image.loading = "lazy";
      wrapper.append(image);
    });
  } else {
    if (module.heading) addText(doc, wrapper, "h3", module.heading);
    addText(doc, wrapper, "p", module.body);
  }
  return wrapper;
}

export function unmountProjectDetail(doc: Document = document): void {
  doc.querySelector("#cms-project-detail")?.remove();
  doc.body.classList.remove("cms-project-open");
}

export function mountProjectDetail(project: Project | undefined, doc: Document = document): boolean {
  unmountProjectDetail(doc);
  if (!project) return false;
  const dialog = doc.createElement("section");
  dialog.id = "cms-project-detail";
  dialog.className = "cms-project-detail";
  dialog.setAttribute("role", "dialog");
  dialog.setAttribute("aria-modal", "true");
  dialog.setAttribute("aria-label", `${project.title} 作品详情`);
  const close = doc.createElement("a");
  close.href = "#page-3";
  close.className = "cms-project-detail__close";
  close.textContent = "CLOSE ×";
  dialog.append(close);
  const inner = doc.createElement("div");
  inner.className = "cms-project-detail__inner";
  const header = doc.createElement("header");
  header.className = "cms-project-detail__header";
  addText(doc, header, "small", `${project.year} / ${project.category}`);
  addText(doc, header, "h1", project.title);
  addText(doc, header, "p", project.summary);
  inner.append(header);
  const description = doc.createElement("p");
  description.className = "cms-project-detail__description";
  description.textContent = project.description;
  inner.append(description);
  const media = project.media.length ? project.media : [project.cover.type === "image" ? { type: "image" as const, image: project.cover.image } : { type: "video" as const, video: project.cover.video }];
  const mediaGrid = doc.createElement("div");
  mediaGrid.className = "cms-project-detail__media-grid";
  media.forEach((module) => mediaGrid.append(renderMedia(doc, module)));
  inner.append(mediaGrid);
  const externalUrl = project.externalUrl;
  if (externalUrl) {
    try {
      const parsed = new URL(externalUrl, window.location.href);
      if (parsed.protocol === "http:" || parsed.protocol === "https:") {
        const link = doc.createElement("a");
        link.href = parsed.href;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.className = "cms-project-detail__external";
        link.textContent = "打开项目链接 ↗";
        inner.append(link);
      }
    } catch {
      // Invalid external URLs are intentionally omitted from the public page.
    }
  }
  dialog.append(inner);
  doc.body.append(dialog);
  doc.body.classList.add("cms-project-open");
  return true;
}

export function createProjectRouteController(repository: ContentRepository, initialContent: SiteContent, doc: Document = document): { sync: () => Promise<void>; setContent: (content: SiteContent) => void; destroy: () => void } {
  let currentContent = initialContent;
  const sync = async () => {
    const match = window.location.hash.match(/^#project\/(.+)$/);
    if (!match) {
      unmountProjectDetail(doc);
      return;
    }
    const slug = decodeURIComponent(match[1]);
    const project = currentContent.projects.find((item) => item.slug === slug) || await repository.getProjectBySlug(slug);
    mountProjectDetail(project, doc);
  };
  const setContent = (content: SiteContent) => { currentContent = content; void sync(); };
  window.addEventListener("hashchange", sync);
  return { sync, setContent, destroy: () => window.removeEventListener("hashchange", sync) };
}
