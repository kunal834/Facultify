"use client";

import { Bell, ChevronDown, LogOut, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/shared/Logo";
import { useAppStore } from "@/store/app-store";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/lib/types";

const ROLE_BADGE: Record<UserRole, { label: string; color: string }> = {
  admin:   { label: "Institution Admin", color: "bg-blue-500 hover:bg-blue-500 text-white" },
  teacher: { label: "Teacher",           color: "bg-green-500 hover:bg-green-500 text-white" },
  student: { label: "Student",           color: "bg-orange-500 hover:bg-orange-500 text-white" },
};

function getInitials(name?: string | null): string {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

export default function DashboardNav() {
  const router = useRouter();
  const { activeSession: session, signOut } = useAppStore();

  const role = session?.role ?? "admin";
  const badge = ROLE_BADGE[role];

  const userName =
    session?.role === "admin"
      ? (session.user as { adminName: string }).adminName
      : session?.user?.name;

  const userEmail =
    session?.role === "admin"
      ? session.user.adminEmail
      : session?.user?.email;

  async function handleSignOut() {
    await signOut();
    router.push("/auth/login");
  }

  return (
    <header className="w-full h-16 bg-white text-gray-850 flex items-center justify-between px-8 border-b border-gray-100/50 shrink-0">
      {/* Spacer to push controls to the right */}
      <div className="flex items-center gap-2" />

      {/* Right section */}
      <div className="flex items-center gap-4">
        {/* Role badge */}
        <Badge className={cn("rounded-full px-3 py-1 font-semibold", badge.color)}>{badge.label}</Badge>

        {/* Notifications */}
        <Button
          variant="ghost"
          size="icon"
          className="text-slate-600 hover:text-slate-900 hover:bg-slate-50 relative rounded-full"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500" />
        </Button>

        {/* User dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-full ring-2 ring-slate-100 hover:ring-[#3B6FFF]/30 transition-all focus:outline-none p-0.5">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-slate-100 text-slate-700 text-sm font-semibold">
                  {getInitials(userName)}
                </AvatarFallback>
              </Avatar>
              <ChevronDown className="h-3.5 w-3.5 text-slate-500 mr-1" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col gap-0.5">
                <p className="font-semibold text-slate-900 text-sm">{userName ?? "—"}</p>
                <p className="text-xs text-muted-foreground truncate">{userEmail ?? ""}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2 cursor-pointer">
              <User className="h-4 w-4 text-slate-500" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="gap-2 cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
