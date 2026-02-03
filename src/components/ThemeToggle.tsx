import { useState, useEffect } from "react";

function MoonIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="m4.93 4.93 1.41 1.41" />
      <path d="m17.66 17.66 1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="m6.34 17.66-1.41 1.41" />
      <path d="m19.07 4.93-1.41 1.41" />
    </svg>
  );
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState("");

  // initialization from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)");
    const initialTheme = savedTheme || (prefersDark ? "dark" : "light");
    setTheme(initialTheme);
    document.documentElement.classList.toggle(
      "light",
      initialTheme === "light",
    );
    document.documentElement.classList.toggle("dark", initialTheme === "dark");
  }, []);

  // keep localStorage + document class in sync
  useEffect(() => {
    localStorage.setItem("theme", theme);
    document.documentElement.classList.toggle("light", theme === "light");
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  // utility function
  const changeTheme = (newTheme: string) => {
    setTheme(newTheme);
  };

  // button handler
  const toggleTheme = (event: React.MouseEvent) => {
    const newTheme = theme === "dark" ? "light" : "dark";

    const transition = (document as any).startViewTransition?.(() =>
      changeTheme(newTheme),
    );
    if (!transition) return changeTheme(newTheme);

    const x = event.clientX;
    const y = event.clientY;

    transition.ready.then(() => {
      const path = [
        `circle(0% at ${x}px ${y}px)`,
        `circle(150% at ${x}px ${y}px)`,
      ];

      document.documentElement.animate(
        {
          clipPath: theme === "dark" ? path : [...path].reverse(),
        },
        {
          duration: 600,
          easing: "ease-in-out",
          fill: "forwards",
          pseudoElement:
            newTheme === "light"
              ? "::view-transition-new(root)"
              : "::view-transition-old(root)",
        },
      );
    });
  };

  return (
    <button onClick={toggleTheme} aria-label="toggle theme" className="hover:text-accent animation">
      {theme === "light" ? (
        <MoonIcon />
      ) : (
        <SunIcon />
      )}
    </button>
  );
}
