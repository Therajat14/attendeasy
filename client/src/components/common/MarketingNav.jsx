import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import Logo from "../ui/Logo";
import ThemeToggle from "../ThemeToggle";
import { ButtonLink } from "../ui/Button";

const links = [
  { label: "How it works", href: "#how-it-works" },
  { label: "Features", href: "#features" },
  { label: "For institutions", href: "#institutions" },
];

export default function MarketingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "border-b border-ink-200/80 bg-white/85 backdrop-blur-xl dark:border-ink-800/80 dark:bg-ink-950/85"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Logo />

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-2 text-[13.5px] font-medium text-ink-600 transition hover:bg-ink-100 hover:text-ink-900 dark:text-ink-300 dark:hover:bg-ink-800 dark:hover:text-white"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-2 sm:flex">
            <ThemeToggle />

            <ButtonLink to="/login" variant="ghost" size="sm">
              Sign in
            </ButtonLink>

            <ButtonLink to="/signup" size="sm" leadingIcon={null}>
              Get started
            </ButtonLink>
          </div>

          <div className="sm:hidden">
            <ThemeToggle />
          </div>

          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            className="inline-flex size-9 items-center justify-center rounded-xl border border-ink-200 text-ink-600 transition hover:bg-ink-50 md:hidden dark:border-ink-700 dark:text-ink-300 dark:hover:bg-ink-800"
          >
            {menuOpen ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden border-t border-ink-200/70 bg-white/95 backdrop-blur-xl md:hidden dark:border-ink-800/70 dark:bg-ink-950/95"
          >
            <div className="space-y-1 px-4 py-4">
              {links.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="block rounded-xl px-3 py-2.5 text-sm font-medium text-ink-700 transition hover:bg-ink-100 dark:text-ink-200 dark:hover:bg-ink-800"
                >
                  {link.label}
                </a>
              ))}

              <div className="grid grid-cols-2 gap-2 pt-2">
                <ButtonLink to="/login" variant="secondary" size="sm" fullWidth>
                  Sign in
                </ButtonLink>
                <ButtonLink to="/signup" size="sm" fullWidth>
                  Get started
                </ButtonLink>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
