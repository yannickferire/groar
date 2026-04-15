import type { MetadataRoute } from "next";
import { MILESTONE_PAGES } from "@/lib/milestone-pages";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://groar.app";

  // Update these dates when page content actually changes
  const lastUpdated = "2026-03-25";

  return [
    {
      url: siteUrl,
      lastModified: lastUpdated,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${siteUrl}/pricing`,
      lastModified: lastUpdated,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${siteUrl}/login`,
      lastModified: "2026-02-01",
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${siteUrl}/vs`,
      lastModified: "2026-02-15",
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${siteUrl}/vs/canva`,
      lastModified: "2026-02-15",
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${siteUrl}/vs/screenshots`,
      lastModified: "2026-02-15",
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${siteUrl}/vs/piktochart`,
      lastModified: "2026-02-15",
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${siteUrl}/vs/image-charts`,
      lastModified: "2026-02-15",
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${siteUrl}/vs/spreadsheets`,
      lastModified: "2026-02-15",
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${siteUrl}/vs/build-in-public`,
      lastModified: "2026-02-15",
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${siteUrl}/leaderboard`,
      lastModified: lastUpdated,
      changeFrequency: "daily",
      priority: 0.7,
    },
    {
      url: `${siteUrl}/open`,
      lastModified: lastUpdated,
      changeFrequency: "daily",
      priority: 0.7,
    },
    {
      url: `${siteUrl}/wall`,
      lastModified: lastUpdated,
      changeFrequency: "daily",
      priority: 0.6,
    },
    {
      url: `${siteUrl}/privacy`,
      lastModified: "2026-01-29",
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${siteUrl}/terms`,
      lastModified: "2026-01-29",
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${siteUrl}/rewards`,
      lastModified: "2026-04-08",
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${siteUrl}/milestone`,
      lastModified: "2026-04-01",
      changeFrequency: "monthly",
      priority: 0.7,
    },
    ...MILESTONE_PAGES.filter((m) => !m.slug.includes("-on-")).map((m) => ({
      url: `${siteUrl}/milestone/${m.slug}`,
      lastModified: "2026-04-01",
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
