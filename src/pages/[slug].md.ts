import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { isPublished } from "../utils/publishedBlogs";
import { blogToMarkdown } from "../utils/blogMarkdown";

export async function getStaticPaths() {
  const blogs = await getCollection("blogs", isPublished);
  return blogs.map((blog) => ({
    params: { slug: blog.data.slug },
    props: { blog },
  }));
}

export const GET: APIRoute = ({ props, site }) =>
  new Response(blogToMarkdown(props.blog, site!), {
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  });
