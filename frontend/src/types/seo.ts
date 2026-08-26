export type SchemaType =
  | "Person"
  | "WebSite"
  | "BlogPosting"
  | "CreativeWork"
  | "BreadcrumbList"
  | "FAQPage";

export interface RouteDescriptor {
  path: string;
  title: string;
  description: string;
  ogImage?: string;
  indexable?: boolean;
}

export interface SitemapEntry {
  url: string;
  lastModified?: string;
  changeFrequency?:
    | "always"
    | "hourly"
    | "daily"
    | "weekly"
    | "monthly"
    | "yearly"
    | "never";
  priority?: number;
}

export interface JsonLd {
  "@context": "https://schema.org";
  "@type": SchemaType;
  [key: string]: unknown;
}
