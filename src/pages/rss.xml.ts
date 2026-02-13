import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import type { APIContext } from "astro";
import { SITE_TITLE, SITE_DESCRIPTION } from "../consts";

export async function GET(context: APIContext) {
  if (!context.site) {
    return new Response("Site is not defined on the request context", {
      status: 500,
    });
  }

  const blogs = await getCollection("blogs");
  return rss({
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    site: context.site,
    trailingSlash: false,
    items: blogs.map((blog) => ({
      title: String(blog.data.title),
      description: String(blog.data.description),
      pubDate: new Date(blog.data.date),
      link: `/${blog.data.slug}`,
    })),
  });
}
