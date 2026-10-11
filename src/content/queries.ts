export const SITE_CONTENT_QUERY = `{
  "projects": *[_type == "project" && !(_id in path("drafts.**")) && status == "published"] | order(sortOrder asc, _createdAt asc) {
    _id, title, "slug": slug.current, year, "category": category->title, summary, description,
    sortOrder, status, featured, _createdAt, _updatedAt, externalUrl,
    cover { type, image { asset, alt }, video { "url": coalesce(videoUrl, videoFile.asset->url), poster { asset, alt }, autoplay, muted, loop } },
    media[] { type, heading, body, image { asset, alt }, video { "url": coalesce(videoUrl, videoFile.asset->url), poster { asset, alt }, autoplay, muted, loop }, items[] { image { asset, alt } } }
  },
  "categories": *[_type == "category" && !(_id in path("drafts.**"))] | order(sortOrder asc) { title },
  "resume": *[_type == "resume" && !(_id in path("drafts.**"))][0] {
    profile { name, avatar { asset, alt }, role, bio, location, email, phone, socialLinks[] { label, url }, "resumeFileUrl": resumeFile.asset->url },
    experiences[] { _key, company, role, startDate, endDate, isCurrent, description, sortOrder, status },
    education[] { _key, title, description, date, sortOrder, status },
    honors[] { _key, title, description, date, sortOrder, status },
    exhibitions[] { _key, title, description, date, sortOrder, status },
    services[] { _key, title, description, date, sortOrder, status },
    skills, clients
  },
  "siteSettings": *[_type == "siteSettings" && !(_id in path("drafts.**"))][0] {
    siteName, homeIntro, seoTitle, seoDescription, shareCover { asset, alt }, footerContent, contactEmail, contactPhone,
    socialLinks[] { label, url }, backgroundMusic { "url": coalesce(audioUrl, audioFile.asset->url), name, enabled, loop, volume }
  }
}`;

export const PROJECT_BY_SLUG_QUERY = `*[_type == "project" && slug.current == $slug && !(_id in path("drafts.**")) && status == "published"][0] {
  _id, title, "slug": slug.current, year, "category": category->title, summary, description,
  sortOrder, status, featured, _createdAt, _updatedAt, externalUrl,
  cover { type, image { asset, alt }, video { "url": coalesce(videoUrl, videoFile.asset->url), poster { asset, alt }, autoplay, muted, loop } },
  media[] { type, heading, body, image { asset, alt }, video { "url": coalesce(videoUrl, videoFile.asset->url), poster { asset, alt }, autoplay, muted, loop }, items[] { image { asset, alt } } }
}`;
