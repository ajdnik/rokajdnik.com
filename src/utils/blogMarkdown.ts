import type { BlogType } from "../content.config";

// Convert raw MDX source to plain markdown: drop imports/exports outside
// code fences, turn <Image> into markdown images, unwrap or drop
// other JSX components.
export function mdxToMarkdown(source: string): string {
  const out: string[] = [];
  let fence: string | null = null;
  const text = source
    .replace(/<Image\b[^>]*?\balt="([^"]*)"[^>]*?\/>/gs, "![$1]")
    .replace(/<figcaption\b[^>]*>(.*?)<\/figcaption>/g, "$1")
    .replace(/^\s*<\/?(figure|figcaption)\b[^>]*>\s*$/gm, "");
  for (const line of text.split("\n")) {
    const fenceMatch = line.match(/^\s*(`{3,}|~{3,})/);
    if (fenceMatch) {
      if (!fence) fence = fenceMatch[1][0];
      else if (fenceMatch[1][0] === fence) fence = null;
      out.push(line);
      continue;
    }
    if (fence) {
      out.push(line);
      continue;
    }
    // Text left over from indented JSX (e.g. figcaption) would render as code.
    if (/^ {2,}(?![-*+>]|\d+[.)])\S/.test(line) && !/^ {4,}/.test(out.at(-2) ?? "")) {
      out.push(line.trimStart());
      continue;
    }
    if (/^(import|export)\s/.test(line)) continue;
    // Wrapper tags like <Callout ...> / </Callout>: keep inner content.
    if (/^\s*<\/?[A-Z][\w.]*(\s[^>]*)?>\s*$/.test(line)) continue;
    // Self-closing components like <Diagram client:visible />.
    if (/^\s*<[A-Z][\w.]*(\s[^>]*)?\/>\s*$/.test(line)) continue;
    out.push(line);
  }
  return out.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

export function blogToMarkdown(blog: BlogType, site: URL | string): string {
  const { title, description, date, author, tags, slug } = blog.data;
  const authors = Array.isArray(author) ? author.join(", ") : author;
  const url = new URL(`/${slug}`, site).href;
  return [
    `# ${title}`,
    "",
    `> ${description}`,
    "",
    `- URL: ${url}`,
    `- Author: ${authors}`,
    `- Published: ${date.toISOString().slice(0, 10)}`,
    `- Tags: ${tags.join(", ")}`,
    "",
    mdxToMarkdown(blog.body ?? ""),
    "",
  ].join("\n");
}
