"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Logo } from "@/components/shared/Logo";
import { useAppStore } from "@/store/app-store";

type UserRole = "admin" | "teacher" | "student";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface DashboardSidebarProps {
  items: NavItem[];
  role: UserRole;
}

export default function DashboardSidebar({ items }: DashboardSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useAppStore();

  async function handleSignOut() {
    await signOut();
    router.push("/auth/login");
  }

  return (
    <aside className="hidden lg:flex flex-col w-20 py-6 items-center shrink-0 bg-slate-950 text-slate-400 justify-between h-full rounded-[2rem] border border-slate-900/60 shadow-xl">
      <div className="flex flex-col items-center gap-6 w-full">
        {/* White rounded logo card */}
        <Link href="/" className="transition-transform duration-300 hover:scale-105" aria-label="Facultify home">
          <div className="w-12 h-12 rounded-[1.25rem] bg-white border border-gray-200 shadow-sm flex items-center justify-center p-2">
            <Logo size={24} />
          </div>
        </Link>

        {/* Navigation list */}
        <nav className="flex flex-col gap-3.5 items-center w-full px-2 mt-6" role="list">
          {items.map(({ label: itemLabel, href, icon: ItemIcon }) => {
            const isActive = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                aria-label={itemLabel}
                className={`relative group w-12 h-12 rounded-[1.25rem] border flex items-center justify-center transition-all duration-300 ${
                  isActive
                    ? "bg-[#3B6FFF] text-white border-[#3B6FFF] shadow-[0_8px_20px_rgba(59,111,255,0.3)] scale-[1.05]"
                    : "text-slate-400 border-transparent hover:bg-slate-900 hover:text-white"
                }`}
              >
                <ItemIcon className="w-5 h-5 shrink-0" />
                
                {/* Tooltip */}
                <span className="absolute left-16 px-3 py-1.5 text-xs font-bold text-slate-900 bg-white border border-slate-100 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none z-50 shadow-[0_8px_30px_rgba(0,0,0,0.08)]">
                  {itemLabel}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Logout button at the bottom */}
      <button
        onClick={handleSignOut}
        aria-label="Sign out"
        className="relative group w-12 h-12 rounded-[1.25rem] border border-transparent flex items-center justify-center text-slate-500 hover:bg-red-950/20 hover:text-red-400 hover:border-red-950/30 transition-all duration-300 mt-auto"
      >
        <LogOut className="w-5 h-5 shrink-0" />
        
        {/* Tooltip */}
        <span className="absolute left-16 px-3 py-1.5 text-xs font-bold text-red-500 bg-white border border-red-50 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none z-50 shadow-[0_8px_30px_rgba(0,0,0,0.08)]">
          Sign Out
        </span>
      </button>
    </aside>
  );
}
