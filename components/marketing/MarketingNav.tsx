"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { GraduationCap, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "#pricing" },
  { label: "About", href: "#about" },
] as const;

export default function MarketingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 12);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function handleAnchorClick(
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string
  ) {
    const id = href.replace("#", "");
    const el = document.getElementById(id);
    if (el) {
      e.preventDefault();
      el.scrollIntoView({ behavior: "smooth" });
    }
    setMobileOpen(false);
  }

  return (
    <header
      className={cn(
        "fixed top-0 inset-x-0 z-50 transition-all duration-200",
        scrolled
          ? "bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-sm"
          : "bg-transparent"
      )}
    >
      <nav
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between"
        aria-label="Main navigation"
      >
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded-md"
          aria-label="Facultify home"
        >
          <GraduationCap
            className="h-6 w-6 text-blue-600 group-hover:text-blue-700 transition-colors"
            aria-hidden="true"
          />
          <span className="text-[1.125rem] font-bold tracking-tight text-slate-900 leading-none">
            Facultify
          </span>
        </Link>

        {/* Desktop nav links */}
        <ul
          className="hidden md:flex items-center gap-1"
          role="list"
        >
          {NAV_LINKS.map(({ label, href }) => (
            <li key={href}>
              <a
                href={href}
                onClick={(e) => handleAnchorClick(e, href)}
                className="px-3.5 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 rounded-md hover:bg-slate-100/70 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                {label}
              </a>
            </li>
          ))}
        </ul>

        {/* Desktop CTA buttons */}
        <div className="hidden md:flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            asChild
            className="border-slate-300 text-slate-700 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-400 font-medium"
          >
            <Link href="/auth/login">Log In</Link>
          </Button>
          <Button
            size="sm"
            asChild
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm"
          >
            <Link href="/auth/signup">Get Started</Link>
          </Button>
        </div>

        {/* Mobile hamburger */}
        <div className="md:hidden">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Open navigation menu"
                className="text-slate-700 hover:bg-slate-100"
              >
                <Menu className="h-5 w-5" aria-hidden="true" />
              </Button>
            </SheetTrigger>

            <SheetContent side="right" className="w-72 flex flex-col pt-8">
              <SheetHeader className="mb-6">
                <SheetTitle asChild>
                  <Link
                    href="/"
                    className="flex items-center gap-2"
                    onClick={() => setMobileOpen(false)}
                  >
                    <GraduationCap
                      className="h-5 w-5 text-blue-600"
                      aria-hidden="true"
                    />
                    <span className="text-base font-bold tracking-tight text-slate-900">
                      Facultify
                    </span>
                  </Link>
                </SheetTitle>
              </SheetHeader>

              {/* Mobile nav links */}
              <nav aria-label="Mobile navigation" className="flex-1">
                <ul className="flex flex-col gap-1" role="list">
                  {NAV_LINKS.map(({ label, href }) => (
                    <li key={href}>
                      <SheetClose asChild>
                        <a
                          href={href}
                          onClick={(e) => handleAnchorClick(e, href)}
                          className="flex items-center px-3 py-2.5 text-sm font-medium text-slate-700 hover:text-slate-900 rounded-md hover:bg-slate-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                        >
                          {label}
                        </a>
                      </SheetClose>
                    </li>
                  ))}
                </ul>
              </nav>

              {/* Mobile CTA buttons */}
              <div className="flex flex-col gap-2 pt-6 border-t border-slate-200 mt-auto">
                <Button
                  variant="outline"
                  asChild
                  className="w-full border-slate-300 text-slate-700 font-medium"
                  onClick={() => setMobileOpen(false)}
                >
                  <Link href="/auth/login">Log In</Link>
                </Button>
                <Button
                  asChild
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium"
                  onClick={() => setMobileOpen(false)}
                >
                  <Link href="/auth/signup">Get Started</Link>
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  );
}
