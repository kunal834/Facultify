import { Sparkles, Zap, BarChart3, Users, GraduationCap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import Reveal from "@/components/marketing/Reveal";

const FEATURES = [
  {
    icon: Sparkles,
    title: "AI Test Generation",
    description:
      "Turn a topic, chapter, or learning objective into a complete, balanced test in seconds — MCQs, short answers, and true/false included. Your faculty reviews and publishes; the AI does the scaffolding.",
  },
  {
    icon: Zap,
    title: "Instant Auto-Grading",
    description:
      "MCQ submissions are scored the moment a student hits submit — no batch jobs, no waiting overnight. Analytics appear on your dashboard before the last student finishes.",
  },
  {
    icon: BarChart3,
    title: "Deep Analytics",
    description:
      "See exactly where a class is struggling — question by question, student by student. Identify the concepts that need re-teaching before the exam, not after.",
  },
  {
    icon: Users,
    title: "Student Portal",
    description:
      "A distraction-free test environment with auto-save every 30 seconds, so a dropped connection never costs a student their work. Accessible on any device, no app required.",
  },
  {
    icon: GraduationCap,
    title: "Teacher Management",
    description:
      "Invite faculty members, assign them to departments, and set granular permissions — all from one admin dashboard. Onboarding a new teacher takes under two minutes.",
  },
] as const;

type Feature = (typeof FEATURES)[number];

function FeatureCard({ feature }: { feature: Feature }) {
  const Icon = feature.icon;

  return (
    <Card className="group relative h-full rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_4px_rgba(11,18,32,0.05)] transition-all duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-[0_16px_36px_-16px_rgba(11,18,32,0.18)]">
      <div
        aria-hidden="true"
        className="absolute top-0 inset-x-0 h-[2.5px] rounded-t-2xl bg-brand-500 origin-left scale-x-0 transition-transform duration-300 group-hover:scale-x-100"
      />

      <CardContent className="p-7 flex flex-col gap-5">
        <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-slate-50 border border-slate-200/70 transition-colors duration-300 group-hover:bg-brand-50 group-hover:border-brand-100">
          <Icon className="w-5 h-5 text-ink transition-colors duration-300 group-hover:text-brand-600" strokeWidth={1.75} />
        </div>

        <div className="flex flex-col gap-2">
          <h3 className="text-[1.0625rem] font-semibold leading-snug tracking-[-0.01em] text-ink">
            {feature.title}
          </h3>
          <p className="text-sm leading-relaxed text-ink-soft">{feature.description}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Features() {
  return (
    <section id="features" aria-labelledby="features-heading" className="py-24 sm:py-32 bg-white">
      <div className="mx-auto w-full max-w-7xl px-6 lg:px-12">
        <Reveal>
          <div className="max-w-2xl mx-auto text-center mb-16">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-600 mb-4">
              Built for institutions
            </p>

            <h2
              id="features-heading"
              className="text-4xl sm:text-5xl font-semibold leading-[1.1] tracking-[-0.02em] text-ink"
            >
              Everything your <span className="font-serif italic font-normal text-brand-600">institution</span> needs
            </h2>

            <p className="mt-5 text-lg leading-relaxed text-ink-muted">
              One platform for the full assessment cycle — from writing the first question
              to reading the class-wide report.
            </p>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
          {FEATURES.map((feature, i) => (
            <Reveal key={feature.title} delay={i * 60} className="h-full">
              <FeatureCard feature={feature} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
