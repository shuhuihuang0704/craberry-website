import { getPublicSanityConfig } from "./runtime-config";
import { hydratePageContent } from "./hydrate";
import { createDefaultContentRepository } from "./repository";
import { createProjectRouteController } from "./project-route";

export async function bootstrapContent(): Promise<void> {
  if (typeof document === "undefined") return;
  const repository = createDefaultContentRepository(getPublicSanityConfig());
  const snapshot = await repository.getContent();
  hydratePageContent(snapshot.content, document, snapshot.source, snapshot.error);
  const projectRoute = createProjectRouteController(repository, snapshot.content, document);
  await projectRoute.sync();
  if (snapshot.error && (location.hostname === "localhost" || location.hostname === "127.0.0.1")) {
    console.warn("[content] Falling back to local content:", snapshot.error);
    document.body.dataset.contentError = snapshot.error;
  }
  repository.subscribe?.((nextSnapshot) => {
    hydratePageContent(nextSnapshot.content, document, nextSnapshot.source, nextSnapshot.error);
    projectRoute.setContent(nextSnapshot.content);
  });
}

if (typeof document !== "undefined") {
  void bootstrapContent();
}
