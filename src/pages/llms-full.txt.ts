import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { SITE_TITLE, SITE_DESCRIPTION } from "../consts";
import { isPublished } from "../utils/publishedBlogs";
import { blogToMarkdown } from "../utils/blogMarkdown";

export const GET: APIRoute = async ({ site }) => {
  const blogs = (await getCollection("blogs", isPublished)).sort(
    (a, b) => b.data.date.getTime() - a.data.date.getTime(),
  );
  const body = [
    `# ${SITE_TITLE}`,
    `> ${SITE_DESCRIPTION}`,
    ...blogs.map((b) => blogToMarkdown(b, site!)),
  ].join("\n\n---\n\n");
  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
