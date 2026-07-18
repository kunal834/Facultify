import {
  Sparkles,
  CheckSquare,
  BarChart3,
  BookOpen,
  GraduationCap,
  Users,
  LayoutDashboard,
  Zap,
  Trophy,
  Flame,
  Archive,
  FileText,
  MessageCircle,
  Calendar,
  Layers,
  Award,
  Lightbulb,
  ClipboardList,
  Cloud,
  CheckCircle2
} from "lucide-react";

// ---------------------------------------------------------------------------
// 19 Facultify Services
// ---------------------------------------------------------------------------
const SERVICES = [
  {
    icon: Sparkles,
    title: "AI Test Generation",
    subtitle: "Generate complete question papers in seconds using AI.",
    bullets: [
      "Create tests from a chapter, topic, or learning objective.",
      "Supports MCQs, Short Answer, Long Answer, and True/False questions.",
      "Teachers can review, edit, and publish before assigning."
    ],
    bg: "linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)",
    color: "#3B6FFF"
  },
  {
    icon: CheckSquare,
    title: "AI Auto-Grading",
    subtitle: "Save hours of manual checking.",
    bullets: [
      "Instantly grades MCQ exams.",
      "AI evaluates subjective (short and long) answers using predefined rubrics.",
      "Teachers can review and override AI scores whenever required."
    ],
    bg: "linear-gradient(135deg, #F5F3FF 0%, #EDE9FE 100%)",
    color: "#7C3AED"
  },
  {
    icon: BarChart3,
    title: "Student Performance Analytics",
    subtitle: "Understand every student's learning progress.",
    bullets: [
      "Individual student reports and class-wise performance analysis.",
      "Topic-wise and question-wise insights.",
      "Identify weak and strong areas, and track improvement over time."
    ],
    bg: "linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)",
    color: "#059669"
  },
  {
    icon: BookOpen,
    title: "Question Bank",
    subtitle: "Build and manage a reusable question library.",
    bullets: [
      "Store questions for future use and organize by subject, chapter, topic, difficulty, and exam.",
      "Search and reuse questions across multiple tests.",
      "Import Previous Year Questions (PYQs)."
    ],
    bg: "linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)",
    color: "#D97706"
  },
  {
    icon: GraduationCap,
    title: "Student Portal",
    subtitle: "A complete online examination platform.",
    bullets: [
      "Students can take tests from any device with auto-save every 30 seconds.",
      "View previous tests and performance history.",
      "Secure and distraction-free testing environment."
    ],
    bg: "linear-gradient(135deg, #FFF1F2 0%, #FFE4E6 100%)",
    color: "#E11D48"
  },
  {
    icon: Users,
    title: "Teacher Management",
    subtitle: "Manage all faculty members from one dashboard.",
    bullets: [
      "Add and remove teachers, and assign subjects and departments.",
      "Role-based access control.",
      "Monitor teacher activity."
    ],
    bg: "linear-gradient(135deg, #F0FDFA 0%, #CCFBF1 100%)",
    color: "#0D9488"
  },
  {
    icon: LayoutDashboard,
    title: "Institute Dashboard",
    subtitle: "Everything an institute needs in one place.",
    bullets: [
      "Manage teachers and students, and create/schedule examinations.",
      "Monitor overall institute performance.",
      "Access reports and analytics."
    ],
    bg: "linear-gradient(135deg, #FDF4FF 0%, #FAE8FF 100%)",
    color: "#C084FC"
  },
  {
    icon: Zap,
    title: "Daily Quiz & Learning Streaks",
    subtitle: "Keep students engaged every day.",
    bullets: [
      "Daily quizzes, current affairs, and topic-of-the-day practice.",
      "Daily streak system.",
      "Leaderboards to encourage consistency."
    ],
    bg: "linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%)",
    color: "#EA580C"
  },
  {
    icon: Trophy,
    title: "Live Mock Tests & All India Ranking",
    subtitle: "Prepare students for real competitive exams.",
    bullets: [
      "Schedule live mock tests with All India Rank (AIR) and percentile calculation.",
      "Compare performance with other students.",
      "Predicted safe and borderline scores based on previous cut-offs."
    ],
    bg: "linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)",
    color: "#16A34A"
  },
  {
    icon: Flame,
    title: "1 vs 1 Quiz Battles",
    subtitle: "Make learning competitive and fun.",
    bullets: [
      "Challenge friends or classmates with timed quizzes.",
      "Instant winner announcement.",
      "Improve speed and accuracy."
    ],
    bg: "linear-gradient(135deg, #FEF2F2 0%, #FEE2E2 100%)",
    color: "#DC2626"
  },
  {
    icon: Archive,
    title: "Previous Year Question (PYQ) Bank",
    subtitle: "Access exam-focused practice material.",
    bullets: [
      "PYQs organized by exam, year, subject, chapter, and topic.",
      "Ideal for SSC, UPSC, JEE, NEET, Boards, and other competitive exams."
    ],
    bg: "linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)",
    color: "#2563EB"
  },
  {
    icon: FileText,
    title: "AI Subjective Answer Evaluation",
    subtitle: "Automate descriptive answer checking.",
    bullets: [
      "AI checks short and long answers based on rubrics and answer quality.",
      "Personalized feedback for students.",
      "Teacher approval and manual editing available."
    ],
    bg: "linear-gradient(135deg, #F5F3FF 0%, #EDE9FE 100%)",
    color: "#8B5CF6"
  },
  {
    icon: MessageCircle,
    title: "WhatsApp Parent Reports",
    subtitle: "Keep parents informed automatically.",
    bullets: [
      "Test scores, attendance updates, weak/strong topics, and performance trends.",
      "Reports available in Hindi and English.",
      "Sent directly to parents via WhatsApp."
    ],
    bg: "linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)",
    color: "#22C55E"
  },
  {
    icon: Calendar,
    title: "Test Scheduling",
    subtitle: "Conduct exams effortlessly.",
    bullets: [
      "Schedule tests in advance, set start/end times, and control duration.",
      "Assign tests to specific classes or batches."
    ],
    bg: "linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)",
    color: "#475569"
  },
  {
    icon: Layers,
    title: "Batch & Student Management",
    subtitle: "Organize students efficiently.",
    bullets: [
      "Create multiple batches, assign students, and bulk import student data.",
      "Track attendance and academic progress."
    ],
    bg: "linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)",
    color: "#059669"
  },
  {
    icon: Award,
    title: "Leaderboards & Gamification",
    subtitle: "Increase student motivation.",
    bullets: [
      "Daily, weekly, and monthly rankings.",
      "Achievement badges to reward consistent learners."
    ],
    bg: "linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)",
    color: "#D97706"
  },
  {
    icon: Lightbulb,
    title: "AI Learning Recommendations",
    subtitle: "Help students improve faster.",
    bullets: [
      "Personalized study suggestions and recommended practice topics.",
      "Weak-area improvement plans and performance-based learning path."
    ],
    bg: "linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)",
    color: "#B45309"
  },
  {
    icon: ClipboardList,
    title: "Comprehensive Reports",
    subtitle: "Generate professional reports instantly.",
    bullets: [
      "Student Report Cards and Class Performance Reports.",
      "Subject-wise, Teacher Performance, and Institute Performance Analytics."
    ],
    bg: "linear-gradient(135deg, #F5F3FF 0%, #EDE9FE 100%)",
    color: "#6D28D9"
  },
  {
    icon: Cloud,
    title: "Secure Cloud Platform",
    subtitle: "Reliable and accessible.",
    bullets: [
      "Cloud-based access with no software installation required.",
      "Data backup and secure authentication.",
      "Access from desktop, tablet, or mobile."
    ],
    bg: "linear-gradient(135deg, #ECFEFF 0%, #CFFAFE 100%)",
    color: "#0891B2"
  }
];

// ---------------------------------------------------------------------------
// "Why Facultify?" list
// ---------------------------------------------------------------------------
const WHY_FACULTIFY = [
  "AI-powered test generation",
  "AI grading for objective and subjective exams",
  "Deep student performance analytics",
  "Comprehensive question bank",
  "Daily quizzes and gamification",
  "Live mock tests with All India Rank",
  "Previous Year Question Bank",
  "Parent reports on WhatsApp",
  "Institute, teacher, and student management",
  "Fast, secure, and easy to use",
  "Built for schools, colleges, coaching institutes, and universities"
];

export default function ValueProps() {
  return (
    <section
      id="features"
      aria-labelledby="value-props-heading"
      className="py-24 sm:py-32 bg-white"
    >
      <div className="mx-auto w-full max-w-7xl px-6 lg:px-12">
        {/* Section header */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-[0.1em] mb-4"
            style={{ background: "#3B6FFF1A", color: "#3B6FFF" }}
          >
            Facultify Services
          </span>
          <h2
            id="value-props-heading"
            className="text-4xl sm:text-5xl font-black leading-[1.08] tracking-[-0.03em] text-gray-900"
          >
            Everything Your Institution Needs
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-gray-500">
            A comprehensive suite of AI-powered tools designed to automate test generation, auto-grade exams, and track student success.
          </p>
        </div>

        {/* 19 Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-28">
          {SERVICES.map((service) => {
            const Icon = service.icon;
            return (
              <div
                key={service.title}
                className="flex flex-col gap-4 rounded-[1.75rem] border border-gray-200/50 p-6 bg-gray-50/30 hover:bg-white shadow-[0_8px_30px_rgba(0,0,0,0.015)] hover:shadow-[0_20px_45px_rgba(15,23,42,0.07)] hover:border-gray-200/80 hover:-translate-y-1.5 hover:scale-[1.01] transition-all duration-300"
              >
                <div
                  className="inline-flex items-center justify-center w-12 h-12 rounded-xl shrink-0"
                  style={{ background: service.bg }}
                  aria-hidden="true"
                >
                  <Icon className="w-6 h-6" style={{ color: service.color }} strokeWidth={2} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">{service.title}</h3>
                  <p className="text-sm font-semibold text-gray-600 mb-3">{service.subtitle}</p>
                  <ul className="space-y-2">
                    {service.bullets.map((bullet, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs leading-relaxed text-gray-500">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0 mt-1.5" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>

        {/* Why Facultify Section */}
        <div className="relative rounded-[3rem] border-4 border-white shadow-[0_30px_70px_rgba(15,23,42,0.08)] p-8 sm:p-14 overflow-hidden" style={{ background: "linear-gradient(135deg, #F8FAFF 0%, #F1F5F9 100%)" }}>
          {/* Internal premium hairline border */}
          <div className="absolute inset-0 rounded-[2.8rem] border border-gray-200/60 pointer-events-none" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
            <div>
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-[0.1em] mb-4"
                style={{ background: "#7C3AED1A", color: "#7C3AED" }}
              >
                At a Glance
              </span>
              <h3 className="text-3xl sm:text-4xl font-black leading-[1.1] tracking-[-0.02em] text-gray-900 mb-6">
                Why Choose Facultify?
              </h3>
              <p className="text-lg leading-relaxed text-gray-600 mb-6">
                Designed to empower educators, simplify administrative workflows, and maximize student learning efficiency.
              </p>
            </div>
            <div>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {WHY_FACULTIFY.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <span
                      className="shrink-0 mt-[3px] w-5 h-5 rounded-full flex items-center justify-center bg-green-100/80 border border-green-200/60"
                      aria-hidden="true"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-600" strokeWidth={3} />
                    </span>
                    <span className="text-sm font-semibold text-gray-700 leading-snug">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
