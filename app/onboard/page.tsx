"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import {
  Check,
  Building2,
  User,
  ClipboardList,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import { Logo } from "@/components/shared/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { onboardInstitution } from "@/lib/supabase-service";
import { useAppStore } from "@/store/app-store";
import type { OnboardFormData } from "@/lib/types";

// ─── Step metadata ────────────────────────────────────────────────────────────

const STEPS = [
  { id: 1, label: "Institution", icon: Building2 },
  { id: 2, label: "Admin Profile", icon: User },
  { id: 3, label: "Confirm", icon: ClipboardList },
] as const;

// ─── Default form state ───────────────────────────────────────────────────────

const DEFAULT_FORM: OnboardFormData = {
  institutionName: "",
  domain: "",
  adminEmail: "",
  adminName: "",
  phoneNumber: "",
  address: "",
  city: "",
  country: "India",
};

// ─── Page component ───────────────────────────────────────────────────────────

export default function OnboardPage() {
  const router = useRouter();
  const { initSession } = useAppStore();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<OnboardFormData>(DEFAULT_FORM);
  const [loading, setLoading] = useState(false);

  // Admin Email must match the account you're actually signed in as — never a
  // free-typed value that could drift from the auth session (see onboardInstitution()).
  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data: { user } }) => {
        if (user?.email) update("adminEmail", user.email);
      });
  }, []);

  const update = (field: keyof OnboardFormData, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const goNext = () => setStep((s) => Math.min(s + 1, STEPS.length));
  const goBack = () => setStep((s) => Math.max(s - 1, 1));

  async function handleSubmit() {
    setLoading(true);
    try {
      await onboardInstitution(form);
      // Populate the store from the newly created profile
      await initSession();
      toast.success(
        `${form.institutionName} has been onboarded successfully! Welcome aboard.`
      );
      router.push("/admin");
    } catch {
      toast.error("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-slate-50 flex flex-col items-center justify-center p-4">
      {/* Back to Home */}
      <div className="w-full max-w-2xl mb-4">
        <button
          onClick={() => router.push("/")}
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </button>
      </div>

      {/* Logo */}
      <div className="flex items-center gap-2.5 mb-10">
        <Logo size={40} />
      </div>

      {/* Step Progress Indicator */}
      <div className="flex items-center w-full max-w-2xl mb-8">
        {STEPS.map((s, i) => {
          const isComplete = step > s.id;
          const isCurrent = step === s.id;
          const Icon = s.icon;

          return (
            <div key={s.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center shrink-0">
                <div
                  className={cn(
                    "h-10 w-10 rounded-full flex items-center justify-center border-2 transition-all duration-200",
                    isComplete
                      ? "bg-blue-600 border-blue-600 text-white shadow-sm"
                      : isCurrent
                      ? "border-blue-600 text-blue-600 bg-white shadow-sm"
                      : "border-slate-200 text-slate-400 bg-white"
                  )}
                >
                  {isComplete ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Icon className="h-4 w-4" />
                  )}
                </div>
                <span
                  className={cn(
                    "text-xs mt-1.5 font-medium whitespace-nowrap",
                    isCurrent
                      ? "text-blue-600"
                      : isComplete
                      ? "text-slate-700"
                      : "text-slate-400"
                  )}
                >
                  {s.label}
                </span>
              </div>

              {/* Connector line */}
              {i < STEPS.length - 1 && (
                <div
                  className={cn(
                    "h-0.5 flex-1 mx-2 mb-5 rounded-full transition-all duration-300",
                    step > s.id ? "bg-blue-600" : "bg-slate-200"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Main Card */}
      <Card className="w-full max-w-2xl shadow-xl border-slate-200">
        {/* ── Step 1: Institution Info ── */}
        {step === 1 && (
          <>
            <CardHeader className="pb-4">
              <CardTitle className="text-xl">Tell us about your institution</CardTitle>
              <CardDescription>
                This information will be used to configure your account and
                invite faculty members.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="institutionName">
                  Institution Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="institutionName"
                  placeholder="e.g. Apex Academy"
                  value={form.institutionName}
                  onChange={(e) => update("institutionName", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="domain">
                  Domain <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="domain"
                  placeholder="e.g. apexacademy.edu"
                  value={form.domain}
                  onChange={(e) => update("domain", e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Used to verify teacher and student email addresses.
                </p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="adminEmail">
                  Admin Email <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="adminEmail"
                  type="email"
                  value={form.adminEmail}
                  disabled
                  readOnly
                />
                <p className="text-xs text-muted-foreground">
                  This is the email you signed in with — it&apos;s your login for this institution.
                </p>
              </div>
            </CardContent>
          </>
        )}

        {/* ── Step 2: Admin Profile ── */}
        {step === 2 && (
          <>
            <CardHeader className="pb-4">
              <CardTitle className="text-xl">Admin profile</CardTitle>
              <CardDescription>
                Set up the primary administrator who will manage this institution.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="adminName">
                  Full Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="adminName"
                  placeholder="e.g. Dr. Ramesh Gupta"
                  value={form.adminName}
                  onChange={(e) => update("adminName", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={form.phoneNumber}
                  onChange={(e) => update("phoneNumber", e.target.value)}
                />
              </div>
            </CardContent>
          </>
        )}

        {/* ── Step 3: Confirm & Submit ── */}
        {step === 3 && (
          <>
            <CardHeader className="pb-4">
              <CardTitle className="text-xl">Review & Confirm</CardTitle>
              <CardDescription>
                Please review your details before creating the institution.
                You&apos;ll start on the Free plan (1 teacher, 20 students) and
                can upgrade any time from Billing.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="divide-y divide-slate-100 rounded-lg border border-slate-100 overflow-hidden">
                {(
                  [
                    ["Institution Name", form.institutionName || "—"],
                    ["Domain", form.domain || "—"],
                    ["Admin Email", form.adminEmail || "—"],
                    ["Admin Name", form.adminName || "—"],
                    ["Phone Number", form.phoneNumber || "—"],
                  ] as [string, string][]
                ).map(([label, value]) => (
                  <div
                    key={label}
                    className="py-3 px-4 flex items-center justify-between text-sm gap-4"
                  >
                    <dt className="text-muted-foreground font-medium shrink-0">
                      {label}
                    </dt>
                    <dd className="font-semibold text-slate-900 text-right truncate">
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>

              <p className="mt-4 text-xs text-muted-foreground text-center">
                By submitting, you agree to our Terms of Service and Privacy
                Policy.
              </p>
            </CardContent>
          </>
        )}

        {/* Navigation */}
        <div className="px-6 pb-6 pt-2 flex items-center justify-between">
          <Button
            variant="outline"
            onClick={goBack}
            disabled={step === 1 || loading}
          >
            
            Back
          </Button>

          <div className="text-xs text-muted-foreground">
            Step {step} of {STEPS.length}
          </div>

          {step < STEPS.length ? (
            <Button onClick={goNext}>Continue</Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="min-w-[160px]"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Institution"
              )}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
