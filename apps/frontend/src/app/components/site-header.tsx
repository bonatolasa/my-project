"use client";

import { ArrowRight, Menu, RadioTower, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

const sections = [
  ["features", "Features"],
  ["how-it-works", "How It Works"],
  ["networks", "Networks"],
  ["faq", "FAQ"],
] as const;

export default function SiteHeader() {
  const [activeSection, setActiveSection] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActiveSection(visible.target.id);
      },
      { rootMargin: "-20% 0px -65% 0px", threshold: [0, 0.15, 0.35, 0.6] },
    );
    sections.forEach(([id]) => {
      const section = document.getElementById(id);
      if (section) observer.observe(section);
    });
    return () => observer.disconnect();
  }, []);

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="site-header sticky top-0 z-50 border-b border-white/60 bg-white/75 backdrop-blur-xl">
      <div className="mx-auto flex min-h-[76px] max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-10">
        <Link className="flex shrink-0 items-center gap-3 font-semibold tracking-tight" href="/" aria-label="Virtual Phone home">
          <span className="brand-mark grid size-10 place-items-center rounded-xl text-white"><RadioTower size={20} /></span>
          <span className="text-[15px]">Virtual<span className="text-blue-600">Phone</span></span>
        </Link>

        <nav className="desktop-navigation hidden items-center gap-8 text-[13px] font-medium text-slate-600" aria-label="Main navigation">
          {sections.map(([id, label]) => (
            <a key={id} href={`#${id}`} className={`nav-link${activeSection === id ? " is-active" : ""}`} aria-current={activeSection === id ? "location" : undefined}>
              {label}
            </a>
          ))}
        </nav>

        <div className="desktop-actions hidden items-center gap-3">
          <Link href="/login" className="login-link rounded-lg px-3 py-2 text-sm font-medium">Log in</Link>
          <Link href="/register" className="button-primary inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white">Get Started <ArrowRight size={15} /></Link>
        </div>

        <button type="button" className="mobile-menu-toggle" aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"} aria-expanded={menuOpen} aria-controls="mobile-navigation" onClick={() => setMenuOpen((open) => !open)}>
          {menuOpen ? <X size={21} /> : <Menu size={21} />}
        </button>
      </div>

      <div id="mobile-navigation" className={`mobile-navigation${menuOpen ? " is-open" : ""}`} aria-hidden={!menuOpen}>
        <nav className="grid gap-1 px-5 pb-5" aria-label="Mobile navigation">
          {sections.map(([id, label]) => (
            <a key={id} href={`#${id}`} className={`mobile-nav-link${activeSection === id ? " is-active" : ""}`} aria-current={activeSection === id ? "location" : undefined} tabIndex={menuOpen ? 0 : -1} onClick={closeMenu}>{label}</a>
          ))}
          <div className="mt-2 grid grid-cols-2 gap-3 border-t border-slate-200/80 pt-4">
            <Link href="/login" className="mobile-auth-link" tabIndex={menuOpen ? 0 : -1} onClick={closeMenu}>Log in</Link>
            <Link href="/register" className="button-primary inline-flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-semibold text-white" tabIndex={menuOpen ? 0 : -1} onClick={closeMenu}>Get Started <ArrowRight size={15} /></Link>
          </div>
        </nav>
      </div>
    </header>
  );
}
