import { useEffect, useRef, useState, useCallback } from "react";

interface Heading {
  id: string;
  text: string;
  level: number;
}

export default function TableOfContents() {
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const [topPx, setTopPx] = useState<number>(0);
  const navRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const headingElementsRef = useRef<Map<string, IntersectionObserverEntry>>(
    new Map(),
  );

  useEffect(() => {
    const article = document.querySelector("article");
    const markdown = article?.querySelector(".markdown");
    if (!article || !markdown) return;

    // Exclude headings inside footnotes section
    const elements = Array.from(
      markdown.querySelectorAll("h2[id], h3[id]"),
    ).filter(
      (el) =>
        !el.closest(".footnotes") && !el.classList.contains("sr-only"),
    );

    const items: Heading[] = elements.map((el) => ({
      id: el.id,
      text: el.textContent?.replace(/^#\s*/, "") || "",
      level: el.tagName === "H2" ? 2 : 3,
    }));

    // Only show ToC if there are enough headings
    if (items.length < 3) return;

    setHeadings(items);

    // Boundaries: top = hr in the article header, bottom = footnotes or end of markdown
    const topBoundary = article.querySelector("header hr");
    const bottomBoundary =
      markdown.querySelector(".footnotes") || markdown;

    const getActiveHeading = () => {
      const scrollY = window.scrollY;
      let active: string | null = null;
      for (const el of elements) {
        const top = (el as HTMLElement).getBoundingClientRect().top + scrollY;
        if (top <= scrollY + 100) {
          active = el.id;
        } else {
          break;
        }
      }
      return active;
    };

    const updatePosition = () => {
      if (!topBoundary || !navRef.current) return;

      const tocHeight = navRef.current.offsetHeight;
      const vh = window.innerHeight;
      const idealTop = (vh - tocHeight) / 2;

      const topRect = topBoundary.getBoundingClientRect();
      const bottomRect = bottomBoundary.getBoundingClientRect();

      // Clamp: ToC top can't go above the top boundary's bottom edge,
      // and ToC bottom can't go below the bottom boundary's top edge
      const minTop = topRect.bottom;
      const maxTop = bottomRect.top - tocHeight;

      setTopPx(Math.max(minTop, Math.min(idealTop, maxTop)));
    };

    // Heading scroll-spy observer
    const callback: IntersectionObserverCallback = (entries) => {
      entries.forEach((entry) => {
        headingElementsRef.current.set(entry.target.id, entry);
      });

      const visibleHeadings: IntersectionObserverEntry[] = [];
      headingElementsRef.current.forEach((entry) => {
        if (entry.isIntersecting) visibleHeadings.push(entry);
      });

      if (visibleHeadings.length > 0) {
        const sorted = visibleHeadings.sort(
          (a, b) => a.boundingClientRect.top - b.boundingClientRect.top,
        );
        setActiveId(sorted[0].target.id);
      } else {
        const active = getActiveHeading();
        if (active) setActiveId(active);
      }
    };

    observerRef.current = new IntersectionObserver(callback, {
      rootMargin: "-64px 0px -60% 0px",
      threshold: 0,
    });

    elements.forEach((el) => observerRef.current?.observe(el));

    // Set initial state
    const initial = getActiveHeading();
    if (initial) setActiveId(initial);

    // Run position update on scroll + resize
    updatePosition();
    window.addEventListener("scroll", updatePosition, { passive: true });
    window.addEventListener("resize", updatePosition, { passive: true });

    return () => {
      observerRef.current?.disconnect();
      window.removeEventListener("scroll", updatePosition);
      window.removeEventListener("resize", updatePosition);
    };
  }, []);

  // Re-run position calculation once headings render so navRef has its real height
  const positionUpdater = useCallback(() => {
    if (!navRef.current) return;
    const article = document.querySelector("article");
    const markdown = article?.querySelector(".markdown");
    if (!article || !markdown) return;
    const topBoundary = article.querySelector("header hr");
    const bottomBoundary =
      markdown.querySelector(".footnotes") || markdown;
    if (!topBoundary) return;

    const tocHeight = navRef.current.offsetHeight;
    const vh = window.innerHeight;
    const idealTop = (vh - tocHeight) / 2;
    const topRect = topBoundary.getBoundingClientRect();
    const bottomRect = bottomBoundary.getBoundingClientRect();
    const minTop = topRect.bottom;
    const maxTop = bottomRect.top - tocHeight;
    setTopPx(Math.max(minTop, Math.min(idealTop, maxTop)));
  }, []);

  useEffect(() => {
    if (headings.length > 0) {
      // Wait a frame for the DOM to paint so we can measure navRef height
      requestAnimationFrame(positionUpdater);
    }
  }, [headings, positionUpdater]);

  // Scroll the active ToC item into view within the nav
  const activeRef = useRef<HTMLButtonElement | null>(null);
  useEffect(() => {
    activeRef.current?.scrollIntoView({
      block: "nearest",
      behavior: "smooth",
    });
  }, [activeId]);

  if (headings.length === 0) return null;

  const handleClick = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth" });
    setActiveId(id);
  };

  return (
    <nav
      ref={navRef}
      className="toc-sidebar"
      style={{ top: `${topPx}px` }}
      aria-label="Table of contents"
    >
      <ul className="space-y-1">
        {headings.map((heading) => (
          <li key={heading.id}>
            <button
              ref={activeId === heading.id ? activeRef : null}
              onClick={() => handleClick(heading.id)}
              className={`toc-link ${heading.level === 3 ? "toc-indent" : ""} ${activeId === heading.id ? "toc-active" : ""}`}
            >
              {heading.text}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
