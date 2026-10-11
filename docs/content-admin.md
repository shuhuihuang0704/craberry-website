# Craberry 内容后台使用说明

## 1. 第一次配置

1. 在 Sanity 创建一个项目和 `production` dataset。
2. 在 `sanity-studio/.env` 中填写 `SANITY_STUDIO_PROJECT_ID`、`SANITY_STUDIO_DATASET`。
3. 在根目录构建前端时填写 `SANITY_PROJECT_ID`、`SANITY_DATASET`、`SANITY_API_VERSION`。这些公开配置可以进入浏览器；写入 Token 不要放入根目录环境变量，也不要提交到 Git。
4. 在 Sanity 项目的 CORS 设置中加入本地 Studio 地址、正式站点地址和 GitHub Pages 地址。

## 2. 启动和部署 Studio

```powershell
cd sanity-studio
npm install
npm run dev
```

部署到 Sanity 托管 Studio：

```powershell
npm run deploy
```

Studio 自带登录、草稿、发布、图片/视频/音频资源上传和删除确认。作品、分类、个人履历、网站全局设置都在 Studio 左侧内容列表中维护。数组字段支持拖拽排序；作品另有数字 `展示顺序`，用于前台排序。

## 3. 发布规则

- 新建内容默认是草稿，草稿不会被正式网站的 GROQ 查询返回。
- 在 Studio 中点击发布后，正式站点会通过 Sanity Live Content API 监听到变更；静态站点刷新时也会重新读取最新已发布内容。
- 网站没有配置 Sanity、请求超时或网络失败时，前台继续使用 `src/content/fallback.ts` 中的本地数据。
- 详情页使用 `#project/<slug>`，不会向服务器请求不存在的路径，因此刷新不会产生 404。

## 4. GitHub Pages 自动部署

仓库中的 `.github/workflows/deploy-pages.yml` 会在 `main` 推送时执行 `npm run check` 和 `npm run build`。在 GitHub Settings → Secrets and variables → Actions → Variables 中配置：

- `SANITY_PROJECT_ID`
- `SANITY_DATASET`（可选，默认 `production`）
- `SANITY_API_VERSION`（可选，默认 `2025-01-01`）

然后在仓库 Settings → Pages 中选择 GitHub Actions 作为发布来源。

当前仓库根目录已不包含 `CNAME` 文件，发布后应使用 `https://shuhuihuang0704.github.io/craberry-website/`。请同时检查 GitHub 仓库 Settings → Pages：如果 Custom domain 仍显示 `craberry.com`，将其清空并保存。`craberry.com` 的 DNS 若仍指向 Hostinger，只会影响该自定义域名，不影响 `github.io` 项目地址。
