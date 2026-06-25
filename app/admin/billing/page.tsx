"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  CreditCard,
  Download,
  CheckCircle2,
  TrendingUp,
  CalendarDays,
  Users,
  GraduationCap,
  Sparkles,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import PageHeader from "@/components/dashboards/PageHeader";
import { useAppStore } from "@/store/app-store";
import { getInvoices, getAdminAnalytics } from "@/lib/supabase-service";
import { SUBSCRIPTION_PLANS } from "@/lib/mock-data";
import { formatDate, formatCurrency, cn } from "@/lib/utils";
import type { Invoice, SubscriptionPlan } from "@/lib/types";

// ─── Status badge ──────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  paid: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  pending: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  overdue: "bg-red-50 text-red-700 ring-1 ring-red-200",
};

function StatusBadge({ status }: { status: Invoice["status"] }) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize",
        STATUS_STYLES[status] ?? "bg-slate-100 text-slate-600"
      )}
    >
      {status}
    </span>
  );
}

// ─── Usage meter ──────────────────────────────────────────────────────────────

interface UsageMeterProps {
  label: string;
  icon: React.ElementType;
  used: number;
  max: number;
  unit?: string;
}

function UsageMeter({ label, icon: Icon, used, max, unit = "" }: UsageMeterProps) {
  const pct = max > 0 ? Math.min((used / max) * 100, 100) : 0;
  const isHigh = pct >= 80;
  const isMid = pct >= 50;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-1.5 text-muted-foreground font-medium">
          <Icon className="h-3.5 w-3.5" />
          {label}
        </span>
        <span
          className={cn(
            "tabular-nums font-semibold",
            isHigh ? "text-red-600" : isMid ? "text-amber-600" : "text-slate-700"
          )}
        >
          {used}{unit} <span className="text-muted-foreground font-normal">/ {max === 999 || max === 9999 ? "∞" : `${max}${unit}`}</span>
        </span>
      </div>
      <Progress
        value={pct}
        className={cn(
          "h-2",
          isHigh
            ? "[&>div]:bg-red-500"
            : isMid
            ? "[&>div]:bg-amber-500"
            : "[&>div]:bg-blue-500"
        )}
      />
    </div>
  );
}

// ─── Plan card (inside dialog) ────────────────────────────────────────────────

interface PlanCardProps {
  plan: SubscriptionPlan;
  isCurrent: boolean;
  onSelect: (plan: SubscriptionPlan) => void;
}

const PLAN_ACCENTS: Record<string, { border: string; badge: string; btn: string }> = {
  starter: {
    border: "border-slate-200 hover:border-slate-300",
    badge: "bg-slate-100 text-slate-600",
    btn: "variant-outline",
  },
  growth: {
    border: "border-blue-400 shadow-md shadow-blue-100",
    badge: "bg-blue-600 text-white",
    btn: "variant-default",
  },
  enterprise: {
    border: "border-violet-300 hover:border-violet-400",
    badge: "bg-violet-100 text-violet-700",
    btn: "variant-outline",
  },
};

function PlanCard({ plan, isCurrent, onSelect }: PlanCardProps) {
  const accent = PLAN_ACCENTS[plan.tier] ?? PLAN_ACCENTS.starter;

  return (
    <div
      className={cn(
        "relative flex flex-col rounded-xl border-2 p-5 transition-all duration-200",
        accent.border,
        isCurrent && "bg-blue-50/40"
      )}
    >
      {plan.tier === "growth" && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full">
          Most popular
        </span>
      )}

      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="font-bold text-slate-900 text-sm">{plan.name}</p>
          <span
            className={cn(
              "text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded",
              accent.badge
            )}
          >
            {plan.tier}
          </span>
        </div>
        <div className="text-right">
          <span className="text-2xl font-extrabold text-slate-900">
            {formatCurrency(plan.priceMonthly, "USD")}
          </span>
          <span className="text-xs text-muted-foreground">/mo</span>
        </div>
      </div>

      <ul className="space-y-1.5 mb-5 flex-1">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-xs text-slate-600">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
            {f}
          </li>
        ))}
      </ul>

      <Button
        className="w-full"
        variant={plan.tier === "growth" ? "default" : "outline"}
        size="sm"
        disabled={isCurrent}
        onClick={() => onSelect(plan)}
      >
        {isCurrent ? "Current plan" : `Switch to ${plan.name}`}
      </Button>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BillingPage() {
  const { activeSession } = useAppStore();

  const institutionId =
    activeSession?.role === "admin" ? activeSession.user.id : "";
  const currentPlanTier =
    activeSession?.role === "admin"
      ? activeSession.user.subscriptionTier
      : "growth";
  const maxTeachers =
    activeSession?.role === "admin" ? activeSession.user.maxTeachers : 25;
  const maxStudents =
    activeSession?.role === "admin" ? activeSession.user.maxStudents : 500;

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [teacherCount, setTeacherCount] = useState(0);
  const [studentCount, setStudentCount] = useState(0);

  useEffect(() => {
    if (!institutionId) return;
    Promise.all([
      getInvoices(institutionId),
      getAdminAnalytics(institutionId),
    ]).then(([inv, analytics]) => {
      setInvoices(inv);
      setTeacherCount(analytics.activeTeachers);
      setStudentCount(analytics.totalStudents);
    });
  }, [institutionId]);

  const plan = SUBSCRIPTION_PLANS.find((p) => p.tier === currentPlanTier);

  const renewalDate = "01 Aug 2026";

  function handleSelectPlan(selected: SubscriptionPlan) {
    if (selected.tier === currentPlanTier) return;
    const action =
      SUBSCRIPTION_PLANS.indexOf(selected) >
      SUBSCRIPTION_PLANS.findIndex((p) => p.tier === currentPlanTier)
        ? "Upgraded"
        : "Downgraded";
    toast.success(`${action} to ${selected.name} plan.`);
    setUpgradeOpen(false);
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Billing & Subscription"
        subtitle="Manage your plan, monitor usage limits, and review payment history"
      >
        <Button
          size="sm"
          onClick={() => setUpgradeOpen(true)}
        >
          <TrendingUp className="h-4 w-4 mr-2" />
          Upgrade Plan
        </Button>
      </PageHeader>

      {/* ── Top section: current plan + payment method ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

        {/* Current plan */}
        <Card className="lg:col-span-2 border-blue-200 bg-gradient-to-br from-white to-blue-50/30">
          <CardHeader className="pb-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <CardTitle className="text-lg">
                    {plan?.name ?? "Growth"} Plan
                  </CardTitle>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                    <ShieldCheck className="h-2.5 w-2.5" />
                    Active
                  </span>
                </div>
                <CardDescription className="flex items-center gap-1.5">
                  <CalendarDays className="h-3.5 w-3.5" />
                  Renews on {renewalDate}
                </CardDescription>
              </div>
              <div className="text-right">
                <p className="text-3xl font-extrabold text-slate-900 tracking-tight">
                  {formatCurrency(plan?.priceMonthly ?? 79, "USD")}
                </p>
                <p className="text-xs text-muted-foreground">per month</p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <UsageMeter
              label="Teachers"
              icon={Users}
              used={teacherCount}
              max={maxTeachers}
            />
            <UsageMeter
              label="Students"
              icon={GraduationCap}
              used={studentCount}
              max={maxStudents}
            />
            <UsageMeter
              label="AI Generations"
              icon={Sparkles}
              used={34}
              max={plan?.aiGenerationCredits ?? 100}
            />

            <div className="flex items-center gap-3 pt-2">
              <Button onClick={() => setUpgradeOpen(true)}>
                <Zap className="h-4 w-4 mr-2" />
                Upgrade Plan
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  toast.info("Contact support to downgrade your plan.")
                }
              >
                Manage Plan
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Payment method */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Payment Method</CardTitle>
            <CardDescription>Used for all future billing cycles</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 rounded-xl border bg-slate-50 px-4 py-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white flex-shrink-0">
                <CreditCard className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  **** **** **** 4242
                </p>
                <p className="text-xs text-muted-foreground">
                  Visa · Expires 12/26
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full"
              onClick={() =>
                toast.info("Payment method update coming soon.")
              }
            >
              Update Payment Method
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              Secured by Stripe · Next charge {renewalDate}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ── Invoice history ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">
            Invoice History
          </CardTitle>
          <CardDescription>
            {invoices.length} invoice{invoices.length !== 1 ? "s" : ""} on
            record
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 hover:bg-slate-50">
                  <TableHead className="font-semibold text-slate-700">
                    Invoice #
                  </TableHead>
                  <TableHead className="font-semibold text-slate-700">
                    Description
                  </TableHead>
                  <TableHead className="font-semibold text-slate-700">
                    Amount
                  </TableHead>
                  <TableHead className="font-semibold text-slate-700">
                    Status
                  </TableHead>
                  <TableHead className="font-semibold text-slate-700">
                    Date
                  </TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="py-10 text-center text-sm text-muted-foreground"
                    >
                      No invoices yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  invoices.map((inv) => (
                    <TableRow key={inv.id} className="group">
                      <TableCell className="font-mono text-xs font-semibold text-slate-700 uppercase">
                        {inv.id}
                      </TableCell>
                      <TableCell className="text-sm text-slate-600">
                        {inv.description}
                      </TableCell>
                      <TableCell className="text-sm font-semibold text-slate-800">
                        {formatCurrency(inv.amount, inv.currency)}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={inv.status} />
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(inv.issuedAt)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                          aria-label={`Download invoice ${inv.id}`}
                          onClick={() =>
                            toast.success(`Invoice ${inv.id.toUpperCase()} downloaded.`)
                          }
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* ── Upgrade dialog ── */}
      <Dialog open={upgradeOpen} onOpenChange={setUpgradeOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Choose a Plan</DialogTitle>
            <DialogDescription>
              Pick the plan that fits your institution. Changes take effect at
              the next billing cycle.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-4">
            {SUBSCRIPTION_PLANS.map((p) => (
              <PlanCard
                key={p.tier}
                plan={p}
                isCurrent={p.tier === currentPlanTier}
                onSelect={handleSelectPlan}
              />
            ))}
          </div>

          <p className="text-center text-xs text-muted-foreground pb-2">
            All plans include a 14-day free trial · Cancel anytime · Prices
            exclude taxes
          </p>
        </DialogContent>
      </Dialog>
    </div>
  );
}
