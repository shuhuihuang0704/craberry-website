import { defineField, defineType } from "sanity";

const required = (rule: any) => rule.required();

const imageField = (name = "image", title = "图片") => defineField({
  name,
  title,
  type: "image",
  options: { hotspot: true },
  fields: [defineField({ name: "alt", title: "图片替代文本", type: "string", validation: required })],
});

const videoObject = defineType({
  name: "videoMedia",
  title: "视频媒体",
  type: "object",
  fields: [
    defineField({ name: "videoFile", title: "视频文件", type: "file", options: { accept: "video/mp4,video/webm,video/quicktime" } }),
    defineField({ name: "videoUrl", title: "视频地址", type: "url" }),
    imageField("poster", "视频 Poster"),
    defineField({ name: "autoplay", title: "自动播放", type: "boolean", initialValue: false }),
    defineField({ name: "muted", title: "静音", type: "boolean", initialValue: true }),
    defineField({ name: "loop", title: "循环播放", type: "boolean", initialValue: true }),
  ],
  preview: { select: { title: "videoUrl", media: "poster" }, prepare: ({ title, media }) => ({ title: title || "已上传视频", media }) },
});

const socialLink = defineType({
  name: "socialLink",
  title: "社交链接",
  type: "object",
  fields: [
    defineField({ name: "label", title: "名称", type: "string", validation: required }),
    defineField({ name: "url", title: "链接", type: "url", validation: required }),
  ],
  preview: { select: { title: "label", subtitle: "url" } },
});

const statusField = defineField({
  name: "status",
  title: "发布状态",
  type: "string",
  options: { list: ["draft", "published"] },
  initialValue: "draft",
  validation: required,
});

const uniqueSlug = async (value: string, context: any) => {
  if (!value) return true;
  const documentId = String(context.document?._id || "").replace(/^drafts\./, "");
  const client = context.getClient({ apiVersion: "2025-01-01" });
  const query = `count(*[slug.current == $slug && !(_id in [$id, $draftId])]) == 0`;
  return (await client.fetch(query, { slug: value, id: documentId, draftId: `drafts.${documentId}` })) || "这个 slug 已经被使用，请换一个";
};

const listItem = defineType({
  name: "resumeListItem",
  title: "履历条目",
  type: "object",
  fields: [
    defineField({ name: "title", title: "标题", type: "string", validation: required }),
    defineField({ name: "description", title: "描述", type: "text", rows: 4 }),
    defineField({ name: "date", title: "日期", type: "string" }),
    defineField({ name: "sortOrder", title: "展示顺序", type: "number", initialValue: 0 }),
    statusField,
  ],
  preview: { select: { title: "title", subtitle: "date" } },
});

const projectMedia = defineType({
  name: "projectMedia",
  title: "作品详情媒体模块",
  type: "object",
  fields: [
    defineField({ name: "type", title: "模块类型", type: "string", options: { list: ["image", "video", "gallery", "richText"], layout: "radio" }, initialValue: "image", validation: required }),
    imageField("image", "单张图片"),
    defineField({ name: "video", title: "视频", type: "videoMedia" }),
    defineField({ name: "items", title: "多图画廊", type: "array", of: [{ type: "image", options: { hotspot: true }, fields: [{ name: "alt", title: "图片替代文本", type: "string" }] }] }),
    defineField({ name: "heading", title: "图文标题", type: "string" }),
    defineField({ name: "body", title: "图文内容", type: "text", rows: 6 }),
  ],
  preview: { select: { title: "heading", subtitle: "type", media: "image" }, prepare: ({ title, subtitle, media }) => ({ title: title || "作品媒体", subtitle, media }) },
});

const projectCover = defineType({
  name: "projectCover",
  title: "作品封面",
  type: "object",
  fields: [
    defineField({ name: "type", title: "封面类型", type: "string", options: { list: ["image", "video"], layout: "radio" }, initialValue: "image", validation: required }),
    imageField("image", "封面图片"),
    defineField({ name: "video", title: "封面视频", type: "videoMedia" }),
  ],
});

const project = defineType({
  name: "project",
  title: "作品",
  type: "document",
  fields: [
    defineField({ name: "title", title: "标题", type: "string", validation: required }),
    defineField({ name: "slug", title: "唯一地址 slug", type: "slug", options: { source: "title", maxLength: 96, isUnique: uniqueSlug }, validation: required }),
    defineField({ name: "year", title: "年份", type: "string", validation: required }),
    defineField({ name: "category", title: "分类", type: "reference", to: [{ type: "category" }], validation: required }),
    defineField({ name: "summary", title: "项目摘要", type: "text", rows: 3, validation: required }),
    defineField({ name: "description", title: "项目详细文案", type: "text", rows: 8 }),
    defineField({ name: "cover", title: "作品封面", type: "projectCover", validation: required }),
    defineField({ name: "media", title: "详情页媒体模块（可拖拽排序）", type: "array", of: [{ type: "projectMedia" }] }),
    defineField({ name: "sortOrder", title: "展示顺序", type: "number", initialValue: 0 }),
    statusField,
    defineField({ name: "featured", title: "是否精选", type: "boolean", initialValue: false }),
    defineField({ name: "externalUrl", title: "外部链接", type: "url" }),
  ],
  preview: { select: { title: "title", subtitle: "year", media: "cover.image" } },
  orderings: [{ title: "展示顺序", name: "sortOrderAsc", by: [{ field: "sortOrder", direction: "asc" }] }],
});

const category = defineType({
  name: "category",
  title: "作品分类",
  type: "document",
  fields: [
    defineField({ name: "title", title: "分类名称", type: "string", validation: required }),
    defineField({ name: "slug", title: "唯一地址 slug", type: "slug", options: { source: "title", isUnique: uniqueSlug }, validation: required }),
    defineField({ name: "sortOrder", title: "展示顺序", type: "number", initialValue: 0 }),
  ],
  preview: { select: { title: "title" } },
});

const experience = defineType({
  name: "resumeExperience",
  title: "工作经历",
  type: "object",
  fields: [
    defineField({ name: "company", title: "公司或客户名称", type: "string", validation: required }),
    defineField({ name: "role", title: "职位", type: "string", validation: required }),
    defineField({ name: "startDate", title: "开始时间", type: "string", validation: required }),
    defineField({ name: "endDate", title: "结束时间", type: "string" }),
    defineField({ name: "isCurrent", title: "至今", type: "boolean", initialValue: false }),
    defineField({ name: "description", title: "工作描述", type: "text", rows: 5 }),
    defineField({ name: "sortOrder", title: "展示顺序", type: "number", initialValue: 0 }),
    statusField,
  ],
  preview: { select: { title: "company", subtitle: "role" } },
});

const profile = defineType({
  name: "resumeProfile",
  title: "个人资料",
  type: "object",
  fields: [
    defineField({ name: "name", title: "姓名", type: "string", validation: required }),
    imageField("avatar", "头像"),
    defineField({ name: "role", title: "职位或身份", type: "string", validation: required }),
    defineField({ name: "bio", title: "个人简介", type: "text", rows: 5 }),
    defineField({ name: "location", title: "所在地", type: "string" }),
    defineField({ name: "email", title: "邮箱", type: "email" }),
    defineField({ name: "phone", title: "电话", type: "string" }),
    defineField({ name: "socialLinks", title: "社交平台链接", type: "array", of: [{ type: "socialLink" }] }),
    defineField({ name: "resumeFile", title: "简历下载文件", type: "file", options: { accept: ".pdf,.doc,.docx" } }),
  ],
});

const resume = defineType({
  name: "resume",
  title: "个人履历",
  type: "document",
  fields: [
    defineField({ name: "profile", title: "个人资料", type: "resumeProfile", validation: required }),
    defineField({ name: "experiences", title: "工作经历", type: "array", of: [{ type: "resumeExperience" }] }),
    defineField({ name: "education", title: "教育经历", type: "array", of: [{ type: "resumeListItem" }] }),
    defineField({ name: "honors", title: "获奖经历", type: "array", of: [{ type: "resumeListItem" }] }),
    defineField({ name: "exhibitions", title: "展览或活动", type: "array", of: [{ type: "resumeListItem" }] }),
    defineField({ name: "services", title: "服务能力", type: "array", of: [{ type: "resumeListItem" }] }),
    defineField({ name: "skills", title: "技能标签", type: "array", of: [{ type: "string" }] }),
    defineField({ name: "clients", title: "合作品牌或客户", type: "array", of: [{ type: "string" }] }),
  ],
  preview: { prepare: () => ({ title: "个人履历" }) },
});

const audio = defineType({
  name: "backgroundMusic",
  title: "背景音乐",
  type: "object",
  fields: [
    defineField({ name: "audioFile", title: "音频文件", type: "file", options: { accept: "audio/mpeg,audio/wav,audio/ogg,audio/mp4" } }),
    defineField({ name: "audioUrl", title: "音频地址", type: "url" }),
    defineField({ name: "name", title: "音乐名称", type: "string" }),
    defineField({ name: "enabled", title: "是否启用", type: "boolean", initialValue: false }),
    defineField({ name: "loop", title: "是否循环", type: "boolean", initialValue: true }),
    defineField({ name: "volume", title: "默认音量", type: "number", initialValue: 0.35, validation: (rule) => rule.min(0).max(1) }),
  ],
});

const siteSettings = defineType({
  name: "siteSettings",
  title: "网站全局设置",
  type: "document",
  fields: [
    defineField({ name: "siteName", title: "网站名称", type: "string", validation: required }),
    defineField({ name: "homeIntro", title: "首页介绍", type: "text", rows: 4 }),
    defineField({ name: "seoTitle", title: "SEO 标题", type: "string" }),
    defineField({ name: "seoDescription", title: "SEO 描述", type: "text", rows: 3 }),
    imageField("shareCover", "分享封面"),
    defineField({ name: "footerContent", title: "页脚内容", type: "text", rows: 4 }),
    defineField({ name: "contactEmail", title: "联系邮箱", type: "email" }),
    defineField({ name: "contactPhone", title: "联系电话", type: "string" }),
    defineField({ name: "socialLinks", title: "社交链接", type: "array", of: [{ type: "socialLink" }] }),
    defineField({ name: "backgroundMusic", title: "背景音乐（不会自动播放）", type: "backgroundMusic" }),
  ],
  preview: { prepare: () => ({ title: "网站全局设置" }) },
});

export const schemaTypes = [category, project, profile, experience, listItem, videoObject, projectMedia, projectCover, socialLink, audio, resume, siteSettings];
