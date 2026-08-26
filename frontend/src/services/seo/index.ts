import { SITE_URL } from "../../constants/seo";
import type { RouteDescriptor } from "../../types/seo";

export function canonicalUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (normalized === "/") return SITE_URL;
  const withoutTrailing = normalized.endsWith("/")
    ? normalized.slice(0, -1)
    : normalized;
  return `${SITE_URL}${withoutTrailing}`;
}

export function buildMetadata(route: RouteDescriptor) {
  const title = route.title;
  const description = route.description;
  const canonical = canonicalUrl(route.path);

  return {
    title,
    description,
    canonical,
  };
}
