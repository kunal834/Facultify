"use client";

import { useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { SUBSCRIPTION_PLANS } from "@/lib/mock-data";
import { formatCurrency } from "@/lib/utils";
import Reveal from "@/components/marketing/Reveal";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function annualMonthly(priceAnnual: number): number {
  // Annual plan billed yearly — show effective monthly rate
  return Math.round(priceAnnual / 12);
}

function annualSavings(priceMonthly: number, priceAnnual: number): number {
  return priceMonthly * 12 - priceAnnual;
}

// ---------------------------------------------------------------------------
// PricingCard
// ---------------------------------------------------------------------------

interface PricingCardProps {
  plan: (typeof SUBSCRIPTION_PLANS)[number];
  annual: boolean;
  popular: boolean;
}

function PricingCard({ plan, annual, popular }: PricingCardProps) {
  const displayedPrice = annual
    ? annualMonthly(plan.priceAnnual)
    : plan.priceMonthly;
  const savings = annualSavings(plan.priceMonthly, plan.priceAnnual);

  return (
    <div
      className={
        popular
          ? "relative z-10 lg:-mt-4 lg:-mb-4"
          : "relative"
      }
    >
      <Card
        className={[
          "flex flex-col h-full rounded-2xl transition-all duration-300",
          popular
            ? "border-2 border-brand-500 shadow-[0_20px_44px_-20px_rgba(46,70,173,0.35)] bg-white"
            : "border border-slate-200/80 bg-white hover:border-slate-300 hover:shadow-md hover:shadow-slate-100",
        ].join(" ")}
      >
        {/* Popular accent bar */}
        {popular && (
          <div
            aria-hidden="true"
            className="absolute top-0 inset-x-0 h-[3px] rounded-t-2xl bg-brand-500"
          />
        )}

        <CardHeader className={popular ? "pt-8 px-8 pb-0" : "pt-7 px-7 pb-0"}>
          {/* Tier name + popular badge */}
          <div className="flex items-center justify-between gap-3 mb-5">
            <h3
              className={
                "text-base font-bold uppercase tracking-[0.12em] " +
                (popular ? "text-brand-600" : "text-ink-soft")
              }
            >
              {plan.name}
            </h3>
            {popular && (
              <Badge className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border-0 bg-brand-600 text-white">
                Most Popular
              </Badge>
            )}
          </div>

          {/* Price block */}
          <div className="flex items-end gap-1.5 mb-1">
            <span className="text-5xl font-semibold tabular-nums leading-none tracking-[-0.03em] text-ink transition-all duration-300">
              {formatCurrency(displayedPrice)}
            </span>
            <span className="text-sm text-slate-500 font-medium mb-1.5 leading-none">
              / mo
            </span>
          </div>

          {/* Annual context line */}
          <div className="h-6 flex items-center gap-2 mb-6">
            {annual ? (
              <>
                <span className="text-xs text-slate-400 line-through tabular-nums">
                  {formatCurrency(plan.priceMonthly)}/mo
                </span>
                <span
                  className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full"
                  style={{
                    background: "rgba(5,150,105,0.08)",
                    color: "#059669",
                  }}
                >
                  Save {formatCurrency(savings)}/yr
                </span>
              </>
            ) : (
              <span className="text-xs text-slate-400">
                Billed monthly &middot; cancel anytime
              </span>
            )}
          </div>
        </CardHeader>

        <CardContent
          className={[
            "flex flex-col flex-1",
            popular ? "px-8 pb-8" : "px-7 pb-7",
          ].join(" ")}
        >
          {/* Divider */}
          <div className="w-full h-px bg-slate-100 mb-6" aria-hidden="true" />

          {/* Feature list */}
          <ul className="flex flex-col gap-3.5 flex-1 mb-8" role="list">
            {plan.features.map((feature) => (
              <li key={feature} className="flex items-start gap-3">
                <span
                  className={
                    "shrink-0 mt-[1px] w-4.5 h-4.5 rounded-full flex items-center justify-center " +
                    (popular ? "bg-brand-50" : "bg-slate-100")
                  }
                  aria-hidden="true"
                >
                  <Check
                    className={"w-3 h-3 " + (popular ? "text-brand-600" : "text-ink-soft")}
                    strokeWidth={2.5}
                  />
                </span>
                <span className="text-sm leading-snug text-slate-700">{feature}</span>
              </li>
            ))}
          </ul>

          {/* CTA */}
          <Button
            asChild
            className={[
              "w-full h-11 rounded-xl text-sm font-bold transition-all duration-200 focus-visible:ring-2 focus-visible:ring-offset-2",
              popular
                ? "bg-brand-600 text-white shadow-[0_10px_24px_-8px_rgba(46,70,173,0.4)] hover:bg-brand-700 hover:shadow-[0_14px_30px_-8px_rgba(46,70,173,0.45)] hover:-translate-y-0.5"
                : "border border-slate-200 bg-white text-slate-800 hover:bg-slate-50 hover:border-slate-300",
            ].join(" ")}
          >
            <Link href="/onboard">Get Started</Link>
          </Button>

          {/* Fine print */}
          <p className="text-center text-[11px] text-slate-400 mt-3 leading-tight">
            {plan.tier === "campus"
              ? "Custom pricing above 3,000 students — talk to us"
              : "No credit card required"}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Pricing section
// ---------------------------------------------------------------------------

export default function Pricing() {
  const [annual, setAnnual] = useState(false);

  return (
    <section
      id="pricing"
      aria-labelledby="pricing-heading"
      className="py-24 sm:py-32 overflow-hidden"
      style={{ background: "#FFFFFF" }}
    >
      <div className="mx-auto w-full max-w-7xl px-6 lg:px-12">

        {/* Section header */}
        <div className="max-w-2xl mx-auto text-center mb-14">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-600 mb-4">
            Simple pricing
          </p>

          <h2
            id="pricing-heading"
            className="text-4xl sm:text-5xl font-semibold leading-[1.1] tracking-[-0.02em] text-ink"
          >
            One plan for every <span className="font-serif italic font-normal text-brand-600">institution</span>
          </h2>

          <p className="mt-5 text-lg leading-relaxed text-ink-muted">
            Scale from a small coaching centre to a university network.
            Every plan includes AI generation, instant grading, and full analytics.
          </p>

          {/* Billing toggle */}
          <div
            className="inline-flex items-center gap-3 mt-8 px-4 py-2.5 rounded-full border border-slate-200 bg-slate-50"
            role="group"
            aria-label="Billing period"
          >
            <button
              onClick={() => setAnnual(false)}
              className={[
                "text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded-sm",
                !annual ? "text-slate-900" : "text-slate-400",
              ].join(" ")}
              aria-pressed={!annual}
            >
              Monthly
            </button>

            <Switch
              checked={annual}
              onCheckedChange={setAnnual}
              aria-label="Toggle annual billing"
              className="data-[state=checked]:bg-brand-600"
            />

            <button
              onClick={() => setAnnual(true)}
              className={[
                "text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded-sm",
                annual ? "text-slate-900" : "text-slate-400",
              ].join(" ")}
              aria-pressed={annual}
            >
              Annual
            </button>

            <span
              className={
                "inline-flex items-center text-[11px] font-bold px-2 py-0.5 rounded-full ml-0.5 transition-colors duration-200 " +
                (annual ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-ink-faint")
              }
              aria-live="polite"
              aria-label={annual ? "2 months free with annual billing" : " No discount with monthly billing"}
            > 
              2 months free
            </span>
          </div>
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6 items-start md:items-stretch">
          {SUBSCRIPTION_PLANS.map((plan, i) => (
            <Reveal key={plan.tier} delay={i * 60} className="h-full">
              <PricingCard
                plan={plan}
                annual={annual}
                popular={plan.tier === "institution"}
              />
            </Reveal>
          ))}
        </div>

        {/* Bottom trust row */}
        <div
          className="mt-14 flex flex-wrap items-center justify-center gap-x-8 gap-y-3"
          aria-label="Trust signals"
        >
          {[
            "No setup fees",
            "Cancel anytime",
            "SOC 2 compliant",
            "99.9% uptime SLA",
          ].map((item) => (
            <div key={item} className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 shrink-0 text-brand-600" strokeWidth={2.5} aria-hidden="true" />
              <span className="text-sm font-medium text-ink-soft">{item}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
