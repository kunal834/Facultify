import { Sparkles, Zap, BarChart3, Users, GraduationCap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import Reveal from "@/components/marketing/Reveal";

// ---------------------------------------------------------------------------
// Feature data — each card has a palette token so the accent is purposeful,
// not arbitrary. Colors drawn from the product's semantic world:
//   blue   = AI / intelligence
//   violet = speed / electric
//   emerald = growth / data
//   amber  = people / warmth
//   rose   = student experience
//   teal   = knowledge / archive
// ---------------------------------------------------------------------------

const FEATURES = [
  {
    icon: Sparkles,
    title: "AI Test Generation",
    description:
      "Turn a topic, chapter, or learning objective into a complete, balanced test in seconds — MCQs, short answers, and true/false included. Your faculty reviews and publishes; the AI does the scaffolding.",
    iconBg: "linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)",
    iconColor: "#3B6FFF",
    borderAccent: "#3B6FFF",
    shadowColor: "rgba(59,111,255,0.12)",
  },
  {
    icon: Zap,
    title: "Instant Auto-Grading",
    description:
      "MCQ submissions are scored the moment a student hits submit — no batch jobs, no waiting overnight. Analytics appear on your dashboard before the last student finishes.",
    iconBg: "linear-gradient(135deg, #F5F3FF 0%, #EDE9FE 100%)",
    iconColor: "#7C3AED",
    borderAccent: "#7C3AED",
    shadowColor: "rgba(124,58,237,0.12)",
  },
  {
    icon: BarChart3,
    title: "Deep Analytics",
    description:
      "See exactly where a class is struggling — question by question, student by student. Identify the concepts that need re-teaching before the exam, not after.",
    iconBg: "linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)",
    iconColor: "#059669",
    borderAccent: "#059669",
    shadowColor: "rgba(5,150,105,0.12)",
  },
  {
    icon: Users,
    title: "Student Portal",
    description:
      "A distraction-free test environment with auto-save every 30 seconds, so a dropped connection never costs a student their work. Accessible on any device, no app required.",
    iconBg: "linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)",
    iconColor: "#D97706",
    borderAccent: "#D97706",
    shadowColor: "rgba(217,119,6,0.12)",
  },
  {
    icon: GraduationCap,
    title: "Teacher Management",
    description:
      "Invite faculty members, assign them to departments, and set granular permissions — all from one admin dashboard. Onboarding a new teacher takes under two minutes.",
    iconBg: "linear-gradient(135deg, #FFF1F2 0%, #FFE4E6 100%)",
    iconColor: "#E11D48",
    borderAccent: "#E11D48",
    shadowColor: "rgba(225,29,72,0.12)",
  },
] as const;

// ---------------------------------------------------------------------------
// FeatureCard
// ---------------------------------------------------------------------------

type Feature = (typeof FEATURES)[number];

function FeatureCard({ feature }: { feature: Feature }) {
  const Icon = feature.icon;

  return (
    <Card
      className="group relative bg-white border border-slate-200/80 rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1"
      style={{
        // The aesthetic risk: cards grow a colored left border on hover —
        // structural color that encodes which feature you're reading, not decoration.
        boxShadow: "0 1px 4px rgba(15,23,42,0.06), 0 0 0 0 transparent",
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.boxShadow = `0 8px 32px ${feature.shadowColor}, 0 1px 4px rgba(15,23,42,0.06)`;
        const bar = el.querySelector<HTMLElement>("[data-accent-bar]");
        if (bar) bar.style.opacity = "1";
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.boxShadow = "0 1px 4px rgba(15,23,42,0.06), 0 0 0 0 transparent";
        const bar = el.querySelector<HTMLElement>("[data-accent-bar]");
        if (bar) bar.style.opacity = "0";
      }}
    >
      {/* Colored top-edge accent bar — revealed on hover */}
      <div
        data-accent-bar
        aria-hidden="true"
        className="absolute top-0 inset-x-0 h-[3px] transition-opacity duration-300"
        style={{ background: feature.borderAccent, opacity: 0 }}
      />

      <CardContent className="p-7 flex flex-col gap-5">
        {/* Icon badge */}
        <div
          className="inline-flex items-center justify-center w-12 h-12 rounded-xl shrink-0"
          style={{ background: feature.iconBg }}
          aria-hidden="true"
        >
          <Icon
            className="w-5 h-5"
            style={{ color: feature.iconColor }}
            strokeWidth={1.75}
          />
        </div>

        {/* Text */}
        <div className="flex flex-col gap-2">
          <h3
            className="text-[1.0625rem] font-bold leading-snug tracking-[-0.01em]"
            style={{ color: "#0F172A" }}
          >
            {feature.title}
          </h3>
          <p
            className="text-sm leading-relaxed"
            style={{ color: "#64748B" }}
          >
            {feature.description}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Features section
// ---------------------------------------------------------------------------

export default function Features() {
  return (
    <section
      id="features"
      aria-labelledby="features-heading"
      style={{ background: "#F8FAFF" }}
      className="py-24 sm:py-32"
    >
      <div className="mx-auto w-full max-w-7xl px-6 lg:px-12">

        {/* Section header */}
        <div className="max-w-2xl mx-auto text-center mb-16">
          {/* Eyebrow — mirrors Hero pattern for visual continuity */}
          <div className="inline-flex items-center gap-2 mb-5">
            <span
              className="block w-5 h-px"
              style={{ background: "linear-gradient(90deg, transparent, #3B6FFF)" }}
              aria-hidden="true"
            />
            <span
              className="text-xs font-bold uppercase tracking-[0.16em]"
              style={{ color: "#3B6FFF" }}
            >
              Built for institutions
            </span>
            <span
              className="block w-5 h-px"
              style={{ background: "linear-gradient(90deg, #3B6FFF, transparent)" }}
              aria-hidden="true"
            />
          </div>

          <h2
            id="features-heading"
            className="text-4xl sm:text-5xl font-black leading-[1.08] tracking-[-0.03em]"
            style={{ color: "#0F172A" }}
          >
            Everything your{" "}
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage: "linear-gradient(135deg, #3B6FFF 0%, #7C3AED 100%)",
                WebkitBackgroundClip: "text",
              }}
            >
              institution
            </span>{" "}
            needs
          </h2>

          <p
            className="mt-5 text-lg leading-relaxed"
            style={{ color: "#475569" }}
          >
            One platform for the full assessment cycle — from writing the first question
            to reading the class-wide report.
          </p>
        </div>

        {/* Feature grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
          {FEATURES.map((feature, i) => (
            <Reveal key={feature.title} delay={i * 60}>
              <FeatureCard feature={feature} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
