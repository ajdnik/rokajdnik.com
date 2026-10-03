import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { SITE_TITLE, SITE_DESCRIPTION } from "../consts";
import { isPublished } from "../utils/publishedBlogs";

export const GET: APIRoute = async ({ site }) => {
  const blogs = (await getCollection("blogs", isPublished)).sort(
    (a, b) => b.data.date.getTime() - a.data.date.getTime(),
  );
  const abs = (path: string) => new URL(path, site).href;

  const posts = blogs.map(
    (b) =>
      `- [${b.data.title}](${abs(`/${b.data.slug}.md`)}): ${b.data.description}`,
  );

  const body = `# ${SITE_TITLE}

> ${SITE_DESCRIPTION}. Software engineering leader writing about programming, retro computing and algorithms.

## About

- [CV](${abs("/cv")}): Career history, education and skills
- [CV (PDF)](${abs("/Rok_Ajdnik_CV.pdf")}): ATS-friendly PDF version

## Blog posts

${posts.join("\n")}

## Optional

- [Full content of all posts](${abs("/llms-full.txt")}): Every post concatenated as markdown
- [RSS feed](${abs("/rss.xml")})
- [Sitemap](${abs("/sitemap-index.xml")})
`;
  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
