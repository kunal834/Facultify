"use client";

import { BookOpen, Bell, ChevronDown, LogOut, User } from "lucide-react";
import { useRouter } from "next/navigation";
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
    <header className="w-full h-16 bg-slate-900 text-white flex items-center justify-between px-6 shadow-md shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-2">
        <BookOpen className="h-6 w-6 text-blue-400" />
        <span className="text-xl font-bold tracking-tight">Facultify</span>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-4">
        {/* Role badge */}
        <Badge className={badge.color}>{badge.label}</Badge>

        {/* Notifications */}
        <Button
          variant="ghost"
          size="icon"
          className="text-slate-300 hover:text-white hover:bg-slate-800 relative"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500" />
        </Button>

        {/* User dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-full ring-2 ring-slate-700 hover:ring-blue-400 transition-all focus:outline-none">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-slate-700 text-slate-200 text-sm font-semibold">
                  {getInitials(userName)}
                </AvatarFallback>
              </Avatar>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400 mr-1" />
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
