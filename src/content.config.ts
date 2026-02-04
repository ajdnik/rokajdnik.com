import { glob } from "astro/loaders";
import { defineCollection, z } from "astro:content";

const blogs = defineCollection({
  loader: glob({ pattern: "**/[^_]*.md", base: "./src/blog" }),
  schema: z.object({
    slug: z.string(),
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    author: z.union([z.string(), z.array(z.string())]),
    tags: z.array(z.string()),
    featured: z.boolean(),
    editable: z.boolean().default(false),
    readTime: z.number().optional(),
    cover: z.object({
      src: z.string(),
      alt: z.string(),
      caption: z.string().optional(),
    }).optional(),
    canonical: z.string().url().optional(),
  }),
});

export const collections = { blogs };

export type BlogType = import("astro:content").CollectionEntry<"blogs">;
