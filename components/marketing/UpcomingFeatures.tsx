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
    iconColor: "#0D9488",
    iconBg: "linear-gradient(135deg, #F0FDFA 0%, #CCFBF1 100%)",
  },
  {
    icon: Share2,
    title: "Shareable Rank Cards",
    description:
      "Every result auto-renders into a branded, shareable card — your institution's own colors and logo, a student's rank and percentile, ready to post in one tap.",
    status: "Coming Soon",
    iconColor: "#DB2777",
    iconBg: "linear-gradient(135deg, #FDF2F8 0%, #FCE7F3 100%)",
  },
  {
    icon: Target,
    title: "Exam-Track Specialization",
    description:
      "Tag your institution, batches, and tests by target exam — JEE, NEET, UPSC, SSC, CUET — so content stays relevant to what students are actually preparing for.",
    status: "Coming Soon",
    iconColor: "#EA580C",
    iconBg: "linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%)",
  },
  {
    icon: Swords,
    title: "1v1 Battle Arena",
    description:
      "Real-time head-to-head quiz duels between students on the same topic — instant scoring, instant winner.",
    status: "In Beta",
    iconColor: "#DC2626",
    iconBg: "linear-gradient(135deg, #FEF2F2 0%, #FEE2E2 100%)",
  },
  {
    icon: Archive,
    title: "Previous Year Question Bank",
    description:
      "Practice sets organized by exam, year, subject, and topic — built for JEE, NEET, SSC, UPSC, and board exams.",
    status: "Coming Soon",
    iconColor: "#2563EB",
    iconBg: "linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)",
  },
  {
    icon: Trophy,
    title: "Live Mock Tests & All-India Rank",
    description:
      "Scheduled mock exams with All-India Rank and percentile, so students see exactly where they stand against peers nationwide.",
    status: "Coming Soon",
    iconColor: "#16A34A",
    iconBg: "linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)",
  },
  {
    icon: Flame,
    title: "Daily Quiz & Streaks",
    description:
      "A short daily quiz with a streak system and leaderboard, to build a consistent practice habit outside test days.",
    status: "Coming Soon",
    iconColor: "#EA580C",
    iconBg: "linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%)",
  },
  {
    icon: FileText,
    title: "AI Subjective Answer Evaluation",
    description:
      "Rubric-based AI grading for short and long written answers, with teacher review and override before anything is final.",
    status: "Coming Soon",
    iconColor: "#8B5CF6",
    iconBg: "linear-gradient(135deg, #F5F3FF 0%, #EDE9FE 100%)",
  },
  {
    icon: MessageCircle,
    title: "WhatsApp Parent Reports",
    description:
      "Test scores and performance trends sent straight to parents on WhatsApp, in Hindi or English, without any extra app to install.",
    status: "Coming Soon",
    iconColor: "#22C55E",
    iconBg: "linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)",
  },
  {
    icon: Lightbulb,
    title: "AI Learning Recommendations",
    description:
      "Personalized next-topic suggestions for every student, generated from their own performance data — not a generic syllabus order.",
    status: "Coming Soon",
    iconColor: "#B45309",
    iconBg: "linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)",
  },
] as const;

type UpcomingItem = (typeof UPCOMING)[number];

function UpcomingCard({ item }: { item: UpcomingItem }) {
  const Icon = item.icon;

  return (
    <div
      className="group relative rounded-2xl border-2 border-dashed border-slate-200 bg-white/60 p-6 flex flex-col gap-4 transition-all duration-300 hover:border-slate-300 hover:bg-white hover:-translate-y-1"
      style={{ boxShadow: "0 1px 4px rgba(15,23,42,0.04)" }}
    >
      {/* Status badge */}
      <span
        className="absolute top-4 right-4 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full"
        style={{
          background: item.status === "In Beta" ? "rgba(220,38,38,0.1)" : "rgba(15,23,42,0.06)",
          color: item.status === "In Beta" ? "#DC2626" : "#64748B",
        }}
      >
        {item.status}
      </span>

      <div
        className="inline-flex items-center justify-center w-11 h-11 rounded-xl shrink-0"
        style={{ background: item.iconBg }}
        aria-hidden="true"
      >
        <Icon className="w-5 h-5" style={{ color: item.iconColor }} strokeWidth={1.75} />
      </div>

      <div className="flex flex-col gap-1.5 pr-14">
        <h3 className="text-[1.0625rem] font-bold leading-snug tracking-[-0.01em]" style={{ color: "#0F172A" }}>
          {item.title}
        </h3>
        <p className="text-sm leading-relaxed" style={{ color: "#64748B" }}>
          {item.description}
        </p>
      </div>
    </div>
  );
}

export default function UpcomingFeatures() {
  return (
    <section
      id="upcoming"
      aria-labelledby="upcoming-heading"
      className="py-24 sm:py-32"
      style={{ background: "#F8FAFF" }}
    >
      <div className="mx-auto w-full max-w-7xl px-6 lg:px-12">
        <Reveal>
          <div className="max-w-2xl mx-auto text-center mb-16">
            <div className="inline-flex items-center gap-2 mb-5">
              <span className="block w-5 h-px" style={{ background: "linear-gradient(90deg, transparent, #7C3AED)" }} aria-hidden="true" />
              <span className="text-xs font-bold uppercase tracking-[0.16em]" style={{ color: "#7C3AED" }}>
                Coming Next
              </span>
              <span className="block w-5 h-px" style={{ background: "linear-gradient(90deg, #7C3AED, transparent)" }} aria-hidden="true" />
            </div>

            <h2
              id="upcoming-heading"
              className="text-4xl sm:text-5xl font-black leading-[1.08] tracking-[-0.03em]"
              style={{ color: "#0F172A" }}
            >
              Already in{" "}
              <span
                className="bg-clip-text text-transparent"
                style={{ backgroundImage: "linear-gradient(135deg, #3B6FFF 0%, #7C3AED 100%)", WebkitBackgroundClip: "text" }}
              >
                active development
              </span>
            </h2>

            <p className="mt-5 text-lg leading-relaxed" style={{ color: "#475569" }}>
              The next version of Facultify — these ship progressively, at no extra cost to institutes already on the platform.
            </p>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
          {UPCOMING.map((item, i) => (
            <Reveal key={item.title} delay={i * 50}>
              <UpcomingCard item={item} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
