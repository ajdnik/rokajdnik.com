import { useEffect, useState } from "react";

export default function ScrollProgressBar() {
  const [scrollPercent, setScrollPercent] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } =
        document.documentElement;
      const scrolled = (scrollTop / (scrollHeight - clientHeight)) * 100;
      setScrollPercent(scrolled);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="bg-foreground/13 fixed top-0 left-0 z-50 h-1 w-full">
      <div
        className="bg-accent h-full transition-all duration-150 ease-in-out"
        style={{ width: `${scrollPercent}%` }}
      />
    </div>
  );
}
