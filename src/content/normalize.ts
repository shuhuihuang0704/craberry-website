import { getLocalContent } from "./fallback";
import type {
  ContentStatus,
  MediaAudio,
  MediaImage,
  MediaVideo,
  Project,
  ProjectCover,
  ProjectMediaModule,
  Resume,
  ResumeExperience,
  ResumeListItem,
  SiteContent,
  SiteSettings,
} from "./types";

type AnyRecord = Record<string, unknown>;

function record(value: unknown): AnyRecord {
  return value && typeof value === "object" ? value as AnyRecord : {};
}

function stringValue(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function booleanValue(value: unknown, fallback = false): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function numberValue(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function arrayValue(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

export type NormalizeOptions = {
  imageUrl?: (source: unknown) => string | undefined;
};

function normalizeImage(value: unknown, options: NormalizeOptions, fallbackAlt = ""): MediaImage | undefined {
  if (typeof value === "string") return { url: value, alt: fallbackAlt };
  const input = record(value);
  const url = stringValue(input.url) || options.imageUrl?.(value) || "";
  if (!url) return undefined;
  const focus = record(input.focus);
  return {
    url,
    alt: stringValue(input.alt, fallbackAlt),
    assetId: stringValue(record(input.asset). _ref || input.assetId),
    width: numberValue(input.width, undefined as unknown as number),
    height: numberValue(input.height, undefined as unknown as number),
    focus: typeof focus.x === "number" && typeof focus.y === "number" ? { x: focus.x, y: focus.y } : undefined,
  };
}

function normalizeVideo(value: unknown, options: NormalizeOptions): MediaVideo | undefined {
  const input = record(value);
  const url = stringValue(input.url) || stringValue(input.videoUrl) || stringValue(input.src);
  if (!url) return undefined;
  const poster = normalizeImage(input.poster, options)?.url;
  return {
    url,
    poster,
    assetId: stringValue(record(input.asset)._ref || input.assetId),
    autoplay: booleanValue(input.autoplay),
    muted: booleanValue(input.muted, true),
    loop: booleanValue(input.loop, true),
  };
}

function normalizeCover(value: unknown, options: NormalizeOptions): ProjectCover | undefined {
  const input = record(value);
  const type = stringValue(input.type, "image");
  if (type === "video") {
    const video = normalizeVideo(input.video ?? value, options);
    return video ? { type: "video", video } : undefined;
  }
  const image = normalizeImage(input.image ?? value, options, "Project cover");
  return image ? { type: "image", image } : undefined;
}

function normalizeMedia(value: unknown, options: NormalizeOptions): ProjectMediaModule | undefined {
  const input = record(value);
  const type = stringValue(input.type, "image");
  if (type === "video") {
    const video = normalizeVideo(input.video ?? value, options);
    return video ? { type: "video", video } : undefined;
  }
  if (type === "gallery") {
    const items = arrayValue(input.items).map((item) => {
      const image = normalizeImage(record(item).image ?? item, options, "Gallery image");
      return image ? { image } : undefined;
    }).filter((item): item is { image: MediaImage } => Boolean(item));
    return items.length ? { type: "gallery", items } : undefined;
  }
  if (type === "richText") {
    return { type: "richText", heading: stringValue(input.heading), body: stringValue(input.body) };
  }
  const image = normalizeImage(input.image ?? value, options, "Project image");
  return image ? { type: "image", image } : undefined;
}

function normalizeStatus(value: unknown): ContentStatus {
  return value === "draft" ? "draft" : "published";
}

function normalizeProject(value: unknown, options: NormalizeOptions): Project | undefined {
  const input = record(value);
  const cover = normalizeCover(input.cover, options);
  if (!cover) return undefined;
  return {
    id: stringValue(input.id || input._id),
    title: stringValue(input.title, "Untitled project"),
    slug: stringValue(input.slug, stringValue(record(input.slug).current)),
    year: stringValue(input.year),
    category: stringValue(input.category, "Uncategorised"),
    summary: stringValue(input.summary),
    description: stringValue(input.description),
    cover,
    media: arrayValue(input.media).map((item) => normalizeMedia(item, options)).filter((item): item is ProjectMediaModule => Boolean(item)),
    sortOrder: numberValue(input.sortOrder, 0),
    status: normalizeStatus(input.status),
    featured: booleanValue(input.featured),
    createdAt: stringValue(input.createdAt || input._createdAt, new Date(0).toISOString()),
    updatedAt: stringValue(input.updatedAt || input._updatedAt, new Date(0).toISOString()),
    externalUrl: stringValue(input.externalUrl) || undefined,
  };
}

function normalizeListItem(value: unknown, index: number): ResumeListItem {
  const input = record(value);
  return {
    id: stringValue(input.id || input._key, `item-${index}`),
    title: stringValue(input.title),
    description: stringValue(input.description),
    date: stringValue(input.date) || undefined,
    sortOrder: numberValue(input.sortOrder, index),
    status: normalizeStatus(input.status),
  };
}

function normalizeExperience(value: unknown, index: number): ResumeExperience {
  const input = record(value);
  return {
    id: stringValue(input.id || input._key, `experience-${index}`),
    company: stringValue(input.company),
    role: stringValue(input.role),
    startDate: stringValue(input.startDate),
    endDate: stringValue(input.endDate) || undefined,
    isCurrent: booleanValue(input.isCurrent),
    description: stringValue(input.description),
    sortOrder: numberValue(input.sortOrder, index),
    status: normalizeStatus(input.status),
  };
}

function normalizeAudio(value: unknown, options: NormalizeOptions): MediaAudio | undefined {
  const input = record(value);
  const audioFile = record(input.audioFile);
  const url = stringValue(input.url) || stringValue(input.audioUrl) || stringValue(audioFile.url) || stringValue(record(audioFile.asset).url);
  if (!url) return undefined;
  return {
    url,
    name: stringValue(input.name, "Background music"),
    assetId: stringValue(record(audioFile.asset)._ref),
    enabled: booleanValue(input.enabled),
    loop: booleanValue(input.loop, true),
    volume: Math.min(1, Math.max(0, numberValue(input.volume, 0.35))),
  };
}

function normalizeResume(value: unknown, fallback: Resume, options: NormalizeOptions): Resume {
  const input = record(value);
  const profileInput = record(input.profile);
  const profile = {
    ...fallback.profile,
    ...profileInput,
    name: stringValue(profileInput.name, fallback.profile.name),
    role: stringValue(profileInput.role, fallback.profile.role),
    bio: stringValue(profileInput.bio, fallback.profile.bio),
    location: stringValue(profileInput.location, fallback.profile.location),
    email: stringValue(profileInput.email, fallback.profile.email),
    phone: stringValue(profileInput.phone, fallback.profile.phone),
    avatar: normalizeImage(profileInput.avatar, options, fallback.profile.avatar?.alt) || fallback.profile.avatar,
    socialLinks: arrayValue(profileInput.socialLinks).map((link) => ({ label: stringValue(record(link).label), url: stringValue(record(link).url) })).filter((link) => link.label && link.url),
    resumeFileUrl: stringValue(profileInput.resumeFileUrl) || fallback.profile.resumeFileUrl,
  };
  const list = (key: keyof Pick<Resume, "education" | "honors" | "exhibitions" | "services">) => {
    const values = arrayValue(input[key]).map(normalizeListItem).filter((item) => item.status === "published");
    return (Array.isArray(input[key]) ? values : fallback[key]).sort((a, b) => a.sortOrder - b.sortOrder);
  };
  const experiences = arrayValue(input.experiences).map(normalizeExperience).filter((item) => item.status === "published");
  return {
    ...fallback,
    ...input,
    profile,
    experiences: (Array.isArray(input.experiences) ? experiences : fallback.experiences).sort((a, b) => a.sortOrder - b.sortOrder),
    education: list("education"),
    honors: list("honors"),
    exhibitions: list("exhibitions"),
    services: list("services"),
    skills: Array.isArray(input.skills) ? arrayValue(input.skills).filter((skill): skill is string => typeof skill === "string") : fallback.skills,
    clients: Array.isArray(input.clients) ? arrayValue(input.clients).filter((client): client is string => typeof client === "string") : fallback.clients,
  };
}

function normalizeSettings(value: unknown, fallback: SiteSettings, options: NormalizeOptions): SiteSettings {
  const input = record(value);
  const links = arrayValue(input.socialLinks).map((link) => ({ label: stringValue(record(link).label), url: stringValue(record(link).url) })).filter((link) => link.label && link.url);
  return {
    ...fallback,
    ...input,
    siteName: stringValue(input.siteName, fallback.siteName),
    homeIntro: stringValue(input.homeIntro, fallback.homeIntro),
    seoTitle: stringValue(input.seoTitle, fallback.seoTitle),
    seoDescription: stringValue(input.seoDescription, fallback.seoDescription),
    footerContent: stringValue(input.footerContent, fallback.footerContent),
    shareCover: normalizeImage(input.shareCover, options, fallback.shareCover?.alt) || fallback.shareCover,
    socialLinks: Array.isArray(input.socialLinks) ? links : fallback.socialLinks,
    backgroundMusic: normalizeAudio(input.backgroundMusic, options),
  };
}

export function normalizeSanityContent(raw: unknown, options: NormalizeOptions = {}): SiteContent {
  const input = record(raw);
  const fallback = getLocalContent();
  const projects = arrayValue(input.projects)
    .filter((project) => !stringValue(record(project)._id).startsWith("drafts."))
    .map((project) => normalizeProject(project, options))
    .filter((project): project is Project => Boolean(project))
    .filter((project) => project.status === "published")
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const categories = arrayValue(input.categories).map((category) => typeof category === "string" ? category : stringValue(record(category).title)).filter(Boolean);
  return {
    projects: Array.isArray(input.projects) ? projects : fallback.projects,
    categories: Array.isArray(input.categories) ? categories : fallback.categories,
    resume: normalizeResume(input.resume, fallback.resume, options),
    siteSettings: normalizeSettings(input.siteSettings, fallback.siteSettings, options),
  };
}
