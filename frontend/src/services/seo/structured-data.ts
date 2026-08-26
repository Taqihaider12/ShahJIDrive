import { SITE_URL, AUTHOR_NAME, SITE_DESCRIPTION } from "../../constants/seo";
import type { JsonLd } from "../../types/seo";

export function personJsonLd(): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": `${SITE_URL}/#person`,
    "name": AUTHOR_NAME,
    "url": SITE_URL,
    "description": SITE_DESCRIPTION,
    "sameAs": []
  };
}

export function websiteJsonLd(): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    "url": SITE_URL,
    "name": AUTHOR_NAME,
    "author": { "@id": `${SITE_URL}/#person` }
  };
}

export function breadcrumbListJsonLd(
  items: Array<{ name: string; url: string }>
): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, i) => ({
      "@type": "ListItem",
      "position": i + 1,
      "name": item.name,
      "item": item.url
    }))
  };
}
