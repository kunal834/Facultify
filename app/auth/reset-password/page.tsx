"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Eye, EyeOff, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { Logo } from "@/components/shared/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";

// Reached by clicking the "reset password" link Supabase emails after
// resetPasswordForEmail(). Supabase appends either ?code= (PKCE) or
// #access_token= (implicit) depending on project auth settings, so both
// are handled here — same dual-flow pattern as /auth/confirm.
function ResetPasswordForm() {
  const router = useRouter();

  const [checking, setChecking] = useState(true);
  const [sessionReady, setSessionReady] = useState(false);
  const [linkError, setLinkError] = useState("");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    (async () => {
      const supabase = createClient();
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          console.error("exchangeCodeForSession failed:", error.status, error.code, error.message);
          setLinkError("This password reset link has expired or has already been used. Please request a new one.");
        } else {
          setSessionReady(true);
        }
        setChecking(false);
        return;
      }

      const hash = window.location.hash;
      const accessToken = hash.includes("access_token")
        ? new URLSearchParams(hash.substring(1)).get("access_token")
        : null;

      if (accessToken) {
        const refreshToken = new URLSearchParams(hash.substring(1)).get("refresh_token") ?? "";
        const { error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
        if (error) {
          setLinkError("This password reset link has expired or is invalid. Please request a new one.");
        } else {
          setSessionReady(true);
        }
        setChecking(false);
        return;
      }

      // No token in the URL — allow it only if the browser already has a
      // live session (e.g. user refreshed this page after landing here).
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setSessionReady(true);
      } else {
        setLinkError("This password reset link is invalid or has expired. Please request a new one.");
      }
      setChecking(false);
    })();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) { toast.error("Password must be at least 8 characters."); return; }
    if (password !== confirm) { toast.error("Passwords don't match."); return; }

    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) { toast.error(error.message); return; }
    toast.success("Password updated — welcome back!");
    router.replace("/dashboard");
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-slate-50 flex flex-col items-center justify-center p-4">
      <div className="flex items-center gap-2.5 mb-8">
        <Logo size={40} />
      </div>

      <Card className="w-full max-w-md shadow-xl border-slate-200">
        <CardHeader className="pb-4 text-center">
          <CardTitle className="text-xl">Set a new password</CardTitle>
          <CardDescription>Choose a new password for your account.</CardDescription>
        </CardHeader>

        <CardContent>
          {linkError ? (
            <div className="text-center py-4 space-y-3">
              <p className="text-sm text-red-600">{linkError}</p>
              <a href="/auth/forgot-password" className="text-sm text-blue-600 hover:underline">
                Request a new link
              </a>
            </div>
          ) : sessionReady ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="new-password">New password</Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showPw ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                    minLength={8}
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

              <div className="space-y-1.5">
                <Label htmlFor="confirm-password">Confirm password</Label>
                <Input
                  id="confirm-password"
                  type={showPw ? "text" : "password"}
                  placeholder="••••••••"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  autoComplete="new-password"
                  required
                  minLength={8}
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving…</>
                ) : (
                  <><KeyRound className="h-4 w-4 mr-2" />Set password &amp; continue</>
                )}
              </Button>
            </form>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}
