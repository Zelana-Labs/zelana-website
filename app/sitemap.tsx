import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://zelana.org/",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    }
    // add more pages as your site grows
  ];
}
