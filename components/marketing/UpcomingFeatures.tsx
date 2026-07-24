import { BookOpen, Share2, Target, Swords, Archive, Trophy, Flame, FileText, MessageCircle, Lightbulb } from "lucide-react";
import Reveal from "@/components/marketing/Reveal";

// ---------------------------------------------------------------------------
// What's shipping next — kept honestly separate from the live Features
// section above. Nothing here is claimed as available today.
// ---------------------------------------------------------------------------

const UPCOMING = [
  {
    icon: BookOpen,
    title: "Reusable Question Bank",
    description:
      "Tag, search, and reuse questions across tests and semesters — an institutional library that compounds instead of getting rewritten from scratch every year.",
    status: "Coming Soon",
  },
  {
    icon: Share2,
    title: "Shareable Rank Cards",
    description:
      "Every result auto-renders into a branded, shareable card — your institution's own colors and logo, a student's rank and percentile, ready to post in one tap.",
    status: "Coming Soon",
  },
  {
    icon: Target,
    title: "Exam-Track Specialization",
    description:
      "Tag your institution, batches, and tests by target exam — JEE, NEET, UPSC, SSC, CUET — so content stays relevant to what students are actually preparing for.",
    status: "Coming Soon",
  },
  {
    icon: Swords,
    title: "1v1 Battle Arena",
    description:
      "Real-time head-to-head quiz duels between students on the same topic — instant scoring, instant winner.",
    status: "In Beta",
  },
  {
    icon: Archive,
    title: "Previous Year Question Bank",
    description:
      "Practice sets organized by exam, year, subject, and topic — built for JEE, NEET, SSC, UPSC, and board exams.",
    status: "Coming Soon",
  },
  {
    icon: Trophy,
    title: "Live Mock Tests & All-India Rank",
    description:
      "Scheduled mock exams with All-India Rank and percentile, so students see exactly where they stand against peers nationwide.",
    status: "Coming Soon",
  },
  {
    icon: Flame,
    title: "Daily Quiz & Streaks",
    description:
      "A short daily quiz with a streak system and leaderboard, to build a consistent practice habit outside test days.",
    status: "Coming Soon",
  },
  {
    icon: FileText,
    title: "AI Subjective Answer Evaluation",
    description:
      "Rubric-based AI grading for short and long written answers, with teacher review and override before anything is final.",
    status: "Coming Soon",
  },
  {
    icon: MessageCircle,
    title: "WhatsApp Parent Reports",
    description:
      "Test scores and performance trends sent straight to parents on WhatsApp, in Hindi or English, without any extra app to install.",
    status: "Coming Soon",
  },
  {
    icon: Lightbulb,
    title: "AI Learning Recommendations",
    description:
      "Personalized next-topic suggestions for every student, generated from their own performance data — not a generic syllabus order.",
    status: "Coming Soon",
  },
] as const;

type UpcomingItem = (typeof UPCOMING)[number];

function UpcomingCard({ item }: { item: UpcomingItem }) {
  const Icon = item.icon;
  const isBeta = item.status === "In Beta";

  return (
    <div className="group relative h-full rounded-2xl border border-slate-200/70 bg-slate-50/40 p-6 flex flex-col gap-4 transition-all duration-300 hover:border-slate-300 hover:bg-white hover:-translate-y-1 hover:shadow-[0_16px_36px_-18px_rgba(11,18,32,0.16)]">
      <span
        className={
          "absolute top-4 right-4 text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-full " +
          (isBeta ? "bg-brand-50 text-brand-600" : "bg-slate-100 text-ink-soft")
        }
      >
        {item.status}
      </span>

      <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-white border border-slate-200/70">
        <Icon className="w-4.5 h-4.5 text-ink-soft" strokeWidth={1.75} />
      </div>

      <div className="flex flex-col gap-1.5 pr-14">
        <h3 className="text-[1.0625rem] font-semibold leading-snug tracking-[-0.01em] text-ink">
          {item.title}
        </h3>
        <p className="text-sm leading-relaxed text-ink-soft">{item.description}</p>
      </div>
    </div>
  );
}

export default function UpcomingFeatures() {
  return (
    <section id="upcoming" aria-labelledby="upcoming-heading" className="py-24 sm:py-32 bg-slate-50/50">
      <div className="mx-auto w-full max-w-7xl px-6 lg:px-12">
        <Reveal>
          <div className="max-w-2xl mx-auto text-center mb-16">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-600 mb-4">
              Coming next
            </p>

            <h2
              id="upcoming-heading"
              className="text-4xl sm:text-5xl font-semibold leading-[1.1] tracking-[-0.02em] text-ink"
            >
              Already in <span className="font-serif italic font-normal text-brand-600">active development</span>
            </h2>

            <p className="mt-5 text-lg leading-relaxed text-ink-muted">
              The next version of Facultify — these ship progressively, at no extra cost to institutes already on the platform.
            </p>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
          {UPCOMING.map((item, i) => (
            <Reveal key={item.title} delay={i * 50} className="h-full">
              <UpcomingCard item={item} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
