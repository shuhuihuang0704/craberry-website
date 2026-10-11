import type { Project, ResumeListItem, SiteContent } from "./types";

function safeExternalUrl(value: string | undefined): string | undefined {
  if (!value) return undefined;
  try {
    const url = new URL(value, window.location.href);
    return url.protocol === "http:" || url.protocol === "https:" ? url.href : undefined;
  } catch {
    return undefined;
  }
}

function textElement<K extends keyof HTMLElementTagNameMap>(doc: Document, tag: K, text: string, className?: string): HTMLElementTagNameMap[K] {
  const element = doc.createElement(tag);
  element.textContent = text;
  if (className) element.className = className;
  return element;
}

function renderTimeline(doc: Document, content: SiteContent): void {
  const timeline = doc.querySelector<HTMLElement>(".resume-timeline");
  if (!timeline) return;
  const items: Array<ResumeListItem | { id: string; title: string; description: string; date?: string }> = [
    ...content.resume.education,
    ...content.resume.experiences.map((experience) => ({ id: experience.id, title: `${experience.role} · ${experience.company}`, description: experience.description, date: `${experience.startDate}—${experience.isCurrent ? "现在" : experience.endDate || ""}` })),
  ];
  timeline.replaceChildren(...items.map((item, index) => {
    const article = doc.createElement("article");
    article.dataset.wheelIndex = String(index);
    article.append(textElement(doc, "time", item.date || "—"));
    article.append(textElement(doc, "strong", item.title));
    article.append(textElement(doc, "p", item.description));
    return article;
  }));
}

function renderResumeHonors(doc: Document, content: SiteContent): void {
  const honors = doc.querySelector<HTMLElement>(".resume-honors");
  if (!honors) return;
  const skillText = content.resume.skills.join("、") || "持续整理中";
  const honorsText = content.resume.honors.map((item) => item.description || item.title).join("\n") || "持续整理中";
  const servicesText = content.resume.services.map((item) => item.description || item.title).join("\n") || "持续整理中";
  honors.replaceChildren(
    textElement(doc, "strong", "SKILL"),
    textElement(doc, "p", skillText),
    textElement(doc, "strong", "HONORS"),
    textElement(doc, "p", honorsText),
    textElement(doc, "strong", "SERVICE", "resume-honors__service-title"),
    textElement(doc, "p", servicesText),
  );
}

function renderProjectCard(doc: Document, project: Project): HTMLElement {
  const card = doc.createElement("article");
  card.dataset.cmsProjectCard = project.slug;
  card.className = "cms-project-card";
  const media = doc.createElement("div");
  media.className = "cms-project-card__media";
  if (project.cover.type === "image") {
    const image = doc.createElement("img");
    image.src = project.cover.image.url;
    image.alt = project.cover.image.alt || project.title;
    image.loading = "lazy";
    media.append(image);
  } else {
    const video = doc.createElement("video");
    video.src = project.cover.video.url;
    video.poster = project.cover.video.poster || "";
    video.muted = true;
    video.playsInline = true;
    video.preload = "metadata";
    media.append(video);
  }
  const body = doc.createElement("div");
  body.className = "cms-project-card__body";
  body.append(textElement(doc, "small", `${project.year} / ${project.category}`));
  body.append(textElement(doc, "h3", project.title));
  body.append(textElement(doc, "p", project.summary));
  const link = doc.createElement("a");
  link.href = `#project/${encodeURIComponent(project.slug)}`;
  link.textContent = "查看作品 →";
  const externalUrl = safeExternalUrl(project.externalUrl);
  if (externalUrl) {
    const external = doc.createElement("a");
    external.href = externalUrl;
    external.target = "_blank";
    external.rel = "noopener noreferrer";
    external.textContent = "GitHub ↗";
    body.append(link, external);
  } else {
    body.append(link);
  }
  card.append(media, body);
  return card;
}

function renderProjects(doc: Document, content: SiteContent): void {
  const host = doc.querySelector<HTMLElement>("[data-cms-projects]");
  if (!host) return;
  const grid = host.querySelector<HTMLElement>("[data-cms-project-grid]") || host;
  const cards = content.projects.filter((project) => project.status === "published").map((project) => renderProjectCard(doc, project));
  grid.replaceChildren(...cards);
}

function updateSettings(doc: Document, content: SiteContent): void {
  const settings = content.siteSettings;
  if (settings.seoTitle) doc.title = settings.seoTitle;
  const description = doc.querySelector<HTMLMetaElement>('meta[name="description"]') || (() => {
    const meta = doc.createElement("meta");
    meta.name = "description";
    doc.head.append(meta);
    return meta;
  })();
  description.content = settings.seoDescription;
  const ogImage = settings.shareCover?.url;
  if (ogImage) {
    const meta = doc.querySelector<HTMLMetaElement>('meta[property="og:image"]') || (() => {
      const created = doc.createElement("meta");
      created.setAttribute("property", "og:image");
      doc.head.append(created);
      return created;
    })();
    meta.content = ogImage;
  }
  doc.querySelectorAll<HTMLElement>("[data-site-name]").forEach((element) => { element.textContent = settings.siteName; });
  const homeIntro = doc.querySelector<HTMLElement>(".hero-note-bottom p");
  if (homeIntro && settings.homeIntro) homeIntro.textContent = settings.homeIntro;
  const footerContent = doc.querySelector<HTMLElement>(".ending-description p");
  if (footerContent && settings.footerContent) footerContent.textContent = settings.footerContent;
}

function initBackgroundMusic(doc: Document, content: SiteContent): void {
  const music = content.siteSettings.backgroundMusic;
  if (!music || !music.enabled) {
    doc.querySelector<HTMLAudioElement>("#siteBackgroundMusic")?.remove();
    doc.querySelector<HTMLElement>("[data-audio-toggle]")?.remove();
    return;
  }
  let audio = doc.querySelector<HTMLAudioElement>("#siteBackgroundMusic");
  if (!audio) {
    audio = doc.createElement("audio");
    audio.id = "siteBackgroundMusic";
    audio.src = music.url;
    audio.preload = "none";
    audio.loop = music.loop;
    audio.volume = music.volume;
    doc.body.append(audio);
  }
  if (audio.getAttribute("src") !== music.url) audio.src = music.url;
  audio.loop = music.loop;
  audio.volume = music.volume;
  let button = doc.querySelector<HTMLButtonElement>("[data-audio-toggle]");
  if (!button) {
    button = doc.createElement("button");
    button.type = "button";
    button.dataset.audioToggle = "true";
    button.className = "site-audio-toggle";
    button.setAttribute("aria-pressed", "false");
    doc.body.append(button);
  }
  const updateLabel = () => { button!.textContent = audio!.paused ? "SOUND / OFF" : "SOUND / ON"; button!.setAttribute("aria-pressed", String(!audio!.paused)); };
  if (button.dataset.bound !== "true") {
    button.dataset.bound = "true";
    button.addEventListener("click", () => {
      if (audio!.paused) {
        void audio!.play().then(() => { localStorage.setItem("craberry-audio-preference", "on"); updateLabel(); }).catch(() => updateLabel());
      } else {
        audio!.pause();
        localStorage.setItem("craberry-audio-preference", "off");
        updateLabel();
      }
    });
  }
  updateLabel();
}

export function hydratePageContent(content: SiteContent, doc: Document = document, source: "sanity" | "local" = "local", error?: string): void {
  doc.body.dataset.contentSource = source;
  const isDevelopment = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
  if (isDevelopment) {
    let badge = doc.querySelector<HTMLElement>("[data-content-source-badge]");
    if (!badge) {
      badge = doc.createElement("small");
      badge.dataset.contentSourceBadge = "true";
      badge.className = "content-source-badge";
      doc.body.append(badge);
    }
    badge.textContent = `CONTENT / ${source.toUpperCase()}${error ? ` · ${error}` : ""}`;
  }
  const profile = content.resume.profile;
  const profileCopy = doc.querySelector<HTMLElement>(".resume-feature-copy");
  const profileDescription = profileCopy?.querySelector<HTMLElement>(":scope > p");
  if (profileDescription) profileDescription.textContent = `${profile.name} · ${profile.role}。${profile.bio}`;
  renderTimeline(doc, content);
  renderResumeHonors(doc, content);
  renderProjects(doc, content);
  updateSettings(doc, content);
  initBackgroundMusic(doc, content);
}
