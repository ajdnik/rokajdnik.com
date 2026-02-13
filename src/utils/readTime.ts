import type { BlogType } from "../content.config";

const WORDS_PER_MINUTE = 200;

export function calculateReadTime(body: string | undefined): number {
  const words = (body ?? "").split(/\s+/).filter(Boolean).length;
  return Math.ceil(words / WORDS_PER_MINUTE);
}

export function withReadTime(blogs: BlogType[]): BlogType[] {
  return blogs.map((blog) => ({
    ...blog,
    data: { ...blog.data, readTime: calculateReadTime(blog.body) },
  }));
}
