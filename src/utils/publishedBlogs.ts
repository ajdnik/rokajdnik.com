import type { BlogType } from "../content.config";

export function isPublished(blog: Pick<BlogType, "data">): boolean {
  return !blog.data.draft && blog.data.date.getTime() <= Date.now();
}
