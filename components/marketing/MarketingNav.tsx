"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import { Logo } from "@/components/shared/Logo";
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
  { label: "Communities", href: "#communities" },
  { label: "Events", href: "#events" },
  { label: "About Us", href: "/about" },
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
    <header id="top" className="fixed top-0 inset-x-0 z-50 px-4 sm:px-6 lg:px-8">
      <nav
        className={cn(
          "mx-auto mt-4 max-w-7xl rounded-full border transition-all duration-300 px-6 h-16 flex items-center justify-between gap-4",
          scrolled
            ? "bg-white/90 backdrop-blur-md border-gray-200/80 shadow-[0_12px_40px_rgba(0,0,0,0.08)]"
            : "bg-white/65 backdrop-blur-sm border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)]"
        )}
        aria-label="Main navigation"
      >
        {/* Logo + wordmark */}
        <Link
          href="/"
          className="flex items-center gap-2.5 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded-md shrink-0"
          aria-label="Facultify home"
        >
          <Logo size={30} />
          <span className="text-lg font-black tracking-tight text-slate-900 hidden xs:inline">
            Facultify
          </span>
        </Link>

        {/* Desktop nav links — centered */}
        <ul
          className="hidden md:flex items-center gap-1 flex-1 justify-center"
          role="list"
        >
          {NAV_LINKS.map(({ label, href }) => (
            <li key={href}>
              <a
                href={href}
                onClick={(e) => handleAnchorClick(e, href)}
                className="px-3.5 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 rounded-full hover:bg-black/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                {label}
              </a>
            </li>
          ))}
        </ul>

        {/* Desktop CTA buttons */}
        <div className="hidden md:flex items-center gap-2 shrink-0">
          <Link
            href="/auth/login"
            className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900 rounded-full hover:bg-gray-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            Login
          </Link>
          <Button
            size="sm"
            asChild
            className="rounded-full px-5 font-bold shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg"
            style={{ background: "#0F172A", color: "#fff" }}
          >
            <Link href="/auth/signup">Start for Free →</Link>
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
                className="text-slate-700 hover:bg-black/5"
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
                    <Logo size={28} />
                    <span className="text-base font-black tracking-tight text-slate-900">
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
                  className="w-full rounded-full border-slate-300 text-slate-700 font-semibold"
                  onClick={() => setMobileOpen(false)}
                >
                  <Link href="/auth/login">Login</Link>
                </Button>
                <Button
                  asChild
                  className="w-full rounded-full font-semibold"
                  style={{ background: "#0F172A", color: "#fff" }}
                  onClick={() => setMobileOpen(false)}
                >
                  <Link href="/auth/signup">Start for Free</Link>
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  );
}
