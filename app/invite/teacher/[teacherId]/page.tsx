"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { Loader2 } from "lucide-react";
import { Logo } from "@/components/shared/Logo";

// Standalone invite-acceptance page — NOT inside the teacher layout.
export default function TeacherInvitePage() {
  const router = useRouter();
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      const params = new URLSearchParams(window.location.search);
      const setup = params.get("setup") === "1";

      // PKCE flow: Supabase sent ?code= — do a full HTTP navigation so the
      // browser correctly receives the Set-Cookie headers from /auth/callback.
      const code = params.get("code");
      if (code) {
        const qs = setup ? `?code=${code}&setup=1` : `?code=${code}`;
        window.location.replace(`/auth/callback${qs}`);
        return;
      }

      // Supabase returns ?error= when the token is expired, already used, or
      // pre-fetched by an email client before the teacher clicked the link.
      if (params.get("error")) {
        setError("This invite link has expired or has already been used. Please ask your admin to send a new invite.");
        return;
      }

      // Implicit/hash flow: Supabase sent #access_token= (legacy / implicit grant).
      // Instead of relying on onAuthStateChange (which defers SIGNED_IN via
      // setTimeout(0) and can race with the subscription setup), we extract the
      // tokens directly and call setSession() ourselves — deterministic & fast.
      const hash = window.location.hash;
      if (!hash.includes("access_token")) {
        setError("This invite link is invalid. Please ask your admin to send a new invite.");
        return;
      }

      const hashParams = new URLSearchParams(hash.substring(1)); // strip leading #
      const accessToken  = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token") ?? "";

      if (!accessToken) {
        setError("This invite link is invalid. Please ask your admin to send a new invite.");
        return;
      }

      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      // setSession validates the tokens and stores them in cookies so the
      // subsequent server-side /api/auth/finalize call can read the session.
      const { error: sessionError } = await supabase.auth.setSession({
        access_token:  accessToken,
        refresh_token: refreshToken,
      });

      if (sessionError) {
        setError("This invite link has expired or is invalid. Please ask your admin to send a new invite.");
        return;
      }

      try {
        const res = await fetch("/api/auth/finalize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ setup }),
        });
        const json = await res.json();
        if (json.error) { setError(json.error); return; }
        router.replace(json.destination ?? "/teacher");   // finalize returns /auth/set-password?next=/teacher on fresh invites
      } catch {
        setError("Something went wrong. Please try again.");
      }
    })();
  }, [router]);

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3">
        <p className="text-red-500 text-sm">{error}</p>
        <a href="/auth/login" className="text-sm text-blue-600 underline">Go to login</a>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-slate-50">
      <Logo size={40} />
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        Setting up your teacher account…
      </div>
    </div>
  );
}
