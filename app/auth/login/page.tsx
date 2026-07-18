"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Eye, EyeOff, Mail, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { Logo } from "@/components/shared/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { useAppStore } from "@/store/app-store";
import { cn } from "@/lib/utils";

type Tab = "password" | "magic";

export default function LoginPage() {
  const router = useRouter();
  const { initSession } = useAppStore();

  const [tab, setTab]           = useState<Tab>("password");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [magicSent, setMagicSent] = useState(false);

  // ── Password login ────────────────────────────────────────────────────────
  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) { toast.error("Please fill in all fields."); return; }
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    await initSession();
    const session = useAppStore.getState().activeSession;
    if (!session) { router.push("/onboard"); return; }
    router.push("/dashboard");
  }

  // ── Magic-link / OTP login ────────────────────────────────────────────────
  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    if (!email) { toast.error("Please enter your email address."); return; }
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        // After clicking the link → /auth/callback handles role-based routing
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        shouldCreateUser: false, // don't create new accounts via magic link
      },
    });

    setLoading(false);
    if (error) { toast.error(error.message); return; }
    setMagicSent(true);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-slate-50 flex flex-col items-center justify-center p-4">
      {/* Logo */}
      <div className="flex items-center gap-2.5 mb-8">
        <Logo size={40} />
      </div>

      <Card className="w-full max-w-md shadow-xl border-slate-200">
        <CardHeader className="pb-4 text-center">
          <CardTitle className="text-xl">Welcome back</CardTitle>
          <CardDescription>Sign in to your institution dashboard</CardDescription>
        </CardHeader>

        <CardContent>
          {/* ── Tabs ── */}
          <div className="flex rounded-lg bg-slate-100 p-1 mb-6">
            <button
              type="button"
              onClick={() => { setTab("password"); setMagicSent(false); }}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 rounded-md py-1.5 text-sm font-medium transition-colors",
                tab === "password"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              )}
            >
              <KeyRound className="h-3.5 w-3.5" />
              Password
            </button>
            <button
              type="button"
              onClick={() => { setTab("magic"); setMagicSent(false); }}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 rounded-md py-1.5 text-sm font-medium transition-colors",
                tab === "magic"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              )}
            >
              <Mail className="h-3.5 w-3.5" />
              Magic link
            </button>
          </div>

          {/* ── Password form ── */}
          {tab === "password" && (
            <form onSubmit={handlePasswordLogin} className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="email-pw">Email address</Label>
                <Input
                  id="email-pw"
                  type="email"
                  placeholder="you@institution.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link href="/auth/forgot-password" className="text-xs text-blue-600 hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPw ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    onClick={() => setShowPw((v) => !v)}
                    tabIndex={-1}
                  >
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Signing in…</>
                ) : "Sign in"}
              </Button>
            </form>
          )}

          {/* ── Magic link form ── */}
          {tab === "magic" && !magicSent && (
            <form onSubmit={handleMagicLink} className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="email-otp">Email address</Label>
                <Input
                  id="email-otp"
                  type="email"
                  placeholder="you@institution.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>
              <p className="text-xs text-slate-500">
                We&apos;ll email you a secure sign-in link. No password needed — great for teachers and students.
              </p>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Sending…</>
                ) : "Send magic link"}
              </Button>
            </form>
          )}

          {/* ── Magic link sent state ── */}
          {tab === "magic" && magicSent && (
            <div className="text-center py-4 space-y-3">
              <div className="mx-auto h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center">
                <Mail className="h-6 w-6 text-blue-600" />
              </div>
              <p className="font-medium text-slate-800">Check your inbox</p>
              <p className="text-sm text-slate-500">
                We sent a sign-in link to <span className="font-medium text-slate-700">{email}</span>.
                Click the link in the email to access your dashboard.
              </p>
              <button
                type="button"
                className="text-xs text-blue-600 hover:underline mt-2"
                onClick={() => { setMagicSent(false); setEmail(""); }}
              >
                Use a different email
              </button>
            </div>
          )}

          <p className="mt-5 text-center text-sm text-muted-foreground">
            New institution?{" "}
            <Link href="/auth/signup" className="font-semibold text-blue-600 hover:underline">
              Create an account
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
