export type ContentStatus = "draft" | "published";

export type MediaImage = {
  url: string;
  alt: string;
  assetId?: string;
  width?: number;
  height?: number;
  focus?: { x: number; y: number };
};

export type MediaVideo = {
  url: string;
  poster?: string;
  assetId?: string;
  autoplay: boolean;
  muted: boolean;
  loop: boolean;
};

export type MediaAudio = {
  url: string;
  name: string;
  assetId?: string;
  enabled: boolean;
  loop: boolean;
  volume: number;
};

export type ProjectCover =
  | { type: "image"; image: MediaImage }
  | { type: "video"; video: MediaVideo };

export type ProjectMediaModule =
  | { type: "image"; image: MediaImage }
  | { type: "video"; video: MediaVideo }
  | { type: "gallery"; items: Array<{ image: MediaImage }> }
  | { type: "richText"; heading?: string; body: string };

export type Project = {
  id: string;
  title: string;
  slug: string;
  year: string;
  category: string;
  summary: string;
  description: string;
  cover: ProjectCover;
  media: ProjectMediaModule[];
  sortOrder: number;
  status: ContentStatus;
  featured: boolean;
  createdAt: string;
  updatedAt: string;
  externalUrl?: string;
};

export type ResumeProfile = {
  name: string;
  avatar?: MediaImage;
  role: string;
  bio: string;
  location: string;
  email: string;
  phone?: string;
  socialLinks: Array<{ label: string; url: string }>;
  resumeFileUrl?: string;
};

export type ResumeExperience = {
  id: string;
  company: string;
  role: string;
  startDate: string;
  endDate?: string;
  isCurrent: boolean;
  description: string;
  sortOrder: number;
  status: ContentStatus;
};

export type ResumeListItem = {
  id: string;
  title: string;
  description: string;
  date?: string;
  sortOrder: number;
  status: ContentStatus;
};

export type Resume = {
  profile: ResumeProfile;
  experiences: ResumeExperience[];
  education: ResumeListItem[];
  honors: ResumeListItem[];
  exhibitions: ResumeListItem[];
  services: ResumeListItem[];
  skills: string[];
  clients: string[];
};

export type SiteSettings = {
  siteName: string;
  homeIntro: string;
  seoTitle: string;
  seoDescription: string;
  shareCover?: MediaImage;
  footerContent: string;
  contactEmail?: string;
  contactPhone?: string;
  socialLinks: Array<{ label: string; url: string }>;
  backgroundMusic?: MediaAudio;
};

export type SiteContent = {
  projects: Project[];
  categories: string[];
  resume: Resume;
  siteSettings: SiteSettings;
};

export type ContentSource = "sanity" | "local";

export type ContentSnapshot = {
  content: SiteContent;
  source: ContentSource;
  error?: string;
  updatedAt: string;
};

export type PublicSanityConfig = {
  projectId: string;
  dataset: string;
  apiVersion: string;
};
