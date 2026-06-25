"use client";

import Link from "next/link";
import { Play, ArrowRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";

// ---------------------------------------------------------------------------
// Animated grading demo — the product's core loop shown, not described
// ---------------------------------------------------------------------------

const QUESTIONS = [
  { label: "Q1", text: "Which theorem proves √2 is irrational?", correct: "B", choices: ["A", "B", "C", "D"] },
  { label: "Q2", text: "Define a recursive function.", correct: "A", choices: ["A", "B", "C", "D"] },
  { label: "Q3", text: "Ohm's Law relates voltage to…", correct: "C", choices: ["A", "B", "C", "D"] },
  { label: "Q4", text: "Mitosis produces how many cells?", correct: "B", choices: ["A", "B", "C", "D"] },
];

const STUDENT_ANSWERS = ["B", "A", "C", "A"]; // Q4 wrong on purpose — makes it feel real

function GradingDemo() {
  const [phase, setPhase] = useState<"idle" | "grading" | "done">("idle");
  const [gradedCount, setGradedCount] = useState(0);
  const [score, setScore] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Auto-start after mount delay so it catches the eye mid-scroll
    const startDelay = setTimeout(() => startGrading(), 800);
    return () => clearTimeout(startDelay);
  }, []);

  function startGrading() {
    setPhase("grading");
    setGradedCount(0);
    setScore(0);

    QUESTIONS.forEach((q, i) => {
      timerRef.current = setTimeout(() => {
        setGradedCount(i + 1);
        if (STUDENT_ANSWERS[i] === q.correct) {
          setScore((s) => s + 25);
        }
        if (i === QUESTIONS.length - 1) {
          setTimeout(() => setPhase("done"), 400);
        }
      }, 420 * (i + 1));
    });
  }

  function replay() {
    setPhase("idle");
    setGradedCount(0);
    setScore(0);
    setTimeout(() => startGrading(), 200);
  }

  const pct = Math.round((score / 100) * 100);

  return (
    <div
      className="relative w-full rounded-2xl overflow-hidden shadow-2xl border border-slate-200/60"
      style={{ background: "linear-gradient(145deg, #0F172A 0%, #1E2A4A 100%)" }}
      aria-label="Live grading simulation"
    >
      {/* Window chrome */}
      <div className="flex items-center gap-1.5 px-4 py-3 border-b border-slate-700/50">
        <span className="w-3 h-3 rounded-full bg-rose-500/80" />
        <span className="w-3 h-3 rounded-full bg-amber-400/80" />
        <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
        <span className="ml-3 text-xs text-slate-400 font-mono tracking-wide">Facultify — Auto Grade</span>
      </div>

      <div className="p-5 space-y-3">
        {/* Header row */}
        <div className="flex items-center justify-between mb-1">
          <div>
            <p className="text-[11px] text-slate-400 uppercase tracking-widest font-semibold">Test · Introduction to Science</p>
            <p className="text-white font-semibold text-sm mt-0.5">Priya Mehta — Submission #47</p>
          </div>
          <div className="text-right">
            <p
              className="text-2xl font-black tabular-nums transition-all duration-300"
              style={{ color: phase === "done" ? (pct >= 75 ? "#4ADE80" : "#FB923C") : "#94A3B8" }}
            >
              {score}%
            </p>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest">Score</p>
          </div>
        </div>

        {/* Score bar */}
        <div className="w-full h-1.5 rounded-full bg-slate-700 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${pct}%`,
              background: pct >= 75 ? "#4ADE80" : "#FB923C",
            }}
          />
        </div>

        {/* Question rows */}
        <div className="space-y-2 pt-1">
          {QUESTIONS.map((q, i) => {
            const isGraded = i < gradedCount;
            const isCorrect = isGraded && STUDENT_ANSWERS[i] === q.correct;
            return (
              <div
                key={q.label}
                className="flex items-start gap-3 rounded-lg px-3 py-2.5 transition-all duration-300"
                style={{
                  background: isGraded
                    ? isCorrect
                      ? "rgba(74,222,128,0.08)"
                      : "rgba(251,146,60,0.08)"
                    : "rgba(255,255,255,0.03)",
                  borderLeft: isGraded
                    ? `2px solid ${isCorrect ? "#4ADE80" : "#FB923C"}`
                    : "2px solid transparent",
                }}
              >
                <span
                  className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded font-mono"
                  style={{
                    background: isGraded
                      ? isCorrect
                        ? "rgba(74,222,128,0.2)"
                        : "rgba(251,146,60,0.2)"
                      : "rgba(255,255,255,0.06)",
                    color: isGraded ? (isCorrect ? "#4ADE80" : "#FB923C") : "#64748B",
                  }}
                >
                  {q.label}
                </span>
                <p className="text-[12px] text-slate-300 leading-snug flex-1 truncate">{q.text}</p>
                <span className="shrink-0 text-[11px] font-bold">
                  {isGraded ? (
                    isCorrect ? (
                      <span style={{ color: "#4ADE80" }}>+25</span>
                    ) : (
                      <span style={{ color: "#FB923C" }}>+0</span>
                    )
                  ) : (
                    <span className="text-slate-600">···</span>
                  )}
                </span>
              </div>
            );
          })}
        </div>

        {/* Bottom bar */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-700/50">
          <div className="flex gap-4">
            <div>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">Graded</p>
              <p className="text-sm font-semibold text-white tabular-nums">{gradedCount}/{QUESTIONS.length}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">Time</p>
              <p className="text-sm font-semibold text-white">0.3s</p>
            </div>
          </div>

          {phase === "done" && (
            <button
              onClick={replay}
              className="text-[11px] text-slate-400 hover:text-white transition-colors flex items-center gap-1 px-2 py-1 rounded hover:bg-white/5"
              aria-label="Replay grading animation"
            >
              <Play className="w-3 h-3" />
              Replay
            </button>
          )}
          {phase === "grading" && (
            <span className="text-[11px] text-blue-400 animate-pulse">Grading…</span>
          )}
        </div>
      </div>

      {/* Ambient glow beneath the card — purely decorative */}
      <div
        aria-hidden="true"
        className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-3/4 h-16 blur-2xl opacity-40 pointer-events-none rounded-full"
        style={{ background: "linear-gradient(90deg, #3B6FFF, #7C3AED)" }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stat counter — ticks up on first mount
// ---------------------------------------------------------------------------

function StatCounter({ end, suffix, label }: { end: number; suffix: string; label: string }) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          let start = 0;
          const duration = 1400;
          const step = 16;
          const increment = end / (duration / step);
          const timer = setInterval(() => {
            start += increment;
            if (start >= end) {
              setVal(end);
              clearInterval(timer);
            } else {
              setVal(Math.floor(start));
            }
          }, step);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end]);

  return (
    <div ref={ref} className="flex flex-col items-start gap-0.5">
      <p
        className="text-3xl font-black tabular-nums leading-none"
        style={{ color: "#0F172A" }}
      >
        {val.toLocaleString()}{suffix}
      </p>
      <p className="text-sm text-slate-500 font-medium leading-tight">{label}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Hero
// ---------------------------------------------------------------------------

export default function Hero() {
  return (
    <section
      className="relative min-h-screen flex flex-col justify-center overflow-hidden"
      style={{ background: "linear-gradient(160deg, #F8FAFF 0%, #EEF2FF 55%, #F5F3FF 100%)" }}
      aria-label="Hero"
    >
      {/* Decorative blobs — atmosphere, not decoration */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute -top-32 -left-32 w-[600px] h-[600px] rounded-full blur-3xl opacity-[0.18]"
          style={{ background: "radial-gradient(circle, #3B6FFF 0%, transparent 70%)" }}
        />
        <div
          className="absolute -bottom-48 -right-24 w-[500px] h-[500px] rounded-full blur-3xl opacity-[0.15]"
          style={{ background: "radial-gradient(circle, #7C3AED 0%, transparent 70%)" }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full blur-3xl opacity-[0.06]"
          style={{ background: "radial-gradient(ellipse, #3B6FFF 0%, transparent 60%)" }}
        />
      </div>

      {/* Grid container */}
      <div className="relative z-10 mx-auto w-full max-w-7xl px-6 lg:px-12 py-20 lg:py-28">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-20 items-center">

          {/* ── Left: copy stack ── */}
          <div className="flex flex-col gap-8 animate-fade-in">

            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2.5 self-start">
              <span
                className="w-2 h-2 rounded-full animate-pulse"
                style={{ background: "linear-gradient(135deg, #3B6FFF, #7C3AED)" }}
                aria-hidden="true"
              />
              <span
                className="text-xs font-bold uppercase tracking-[0.16em]"
                style={{ color: "#3B6FFF" }}
              >
                AI-Powered Assessment
              </span>
            </div>

            {/* Headline */}
            <div>
              <h1
                className="text-5xl sm:text-6xl xl:text-7xl font-black leading-[1.05] tracking-[-0.03em]"
                style={{ color: "#0F172A" }}
              >
                Assess{" "}
                <span
                  className="inline-block bg-clip-text text-transparent"
                  style={{
                    backgroundImage: "linear-gradient(135deg, #3B6FFF 0%, #7C3AED 100%)",
                    WebkitBackgroundClip: "text",
                  }}
                >
                  Smarter,
                </span>
                <br />
                Teach Better.
              </h1>
            </div>

            {/* Subheadline */}
            <p
              className="text-lg sm:text-xl leading-relaxed max-w-[480px] font-normal"
              style={{ color: "#475569" }}
            >
              Facultify gives institutions an end-to-end assessment engine — generate
              AI-authored tests in seconds, grade thousands of submissions instantly,
              and surface the learning gaps your faculty actually need to act on.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-4">
              <Link
                href="/auth/signup"
                className="inline-flex items-center gap-2.5 rounded-xl px-8 py-4 text-base font-bold text-white transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{
                  background: "linear-gradient(135deg, #3B6FFF 0%, #5B4DFF 100%)",
                  boxShadow: "0 4px 20px rgba(59,111,255,0.35)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 32px rgba(59,111,255,0.45)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 20px rgba(59,111,255,0.35)";
                }}
              >
                Start Free Trial
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>

              <button
                className="inline-flex items-center gap-2.5 rounded-xl border px-8 py-4 text-base font-semibold transition-all duration-200 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{
                  borderColor: "#CBD5E1",
                  color: "#334155",
                }}
                aria-label="Watch product demo video"
              >
                <span
                  className="flex items-center justify-center w-7 h-7 rounded-full"
                  style={{ background: "linear-gradient(135deg, #3B6FFF, #7C3AED)" }}
                  aria-hidden="true"
                >
                  <Play className="w-3 h-3 text-white fill-white" />
                </span>
                Watch Demo
              </button>
            </div>

            {/* Trust note */}
            <p className="text-xs text-slate-400 font-medium -mt-2">
              No credit card required &middot; Setup in under 5 minutes
            </p>

            {/* Divider */}
            <div className="h-px w-full max-w-sm" style={{ background: "linear-gradient(90deg, #E2E8F0, transparent)" }} aria-hidden="true" />

            {/* Stats row */}
            <div className="flex flex-wrap gap-10">
              <StatCounter end={500} suffix="+" label="Institutions" />
              <StatCounter end={50000} suffix="+" label="Students" />
              <StatCounter end={1000000} suffix="+" label="Tests Graded" />
            </div>
          </div>

          {/* ── Right: animated grading demo ── */}
          <div
            className="relative animate-fade-in lg:pl-4"
            style={{ animationDelay: "150ms", animationFillMode: "both" }}
          >
            {/* Floating badge — social proof anchored to the demo */}
            <div
              className="absolute -top-4 -left-4 z-20 flex items-center gap-2 rounded-xl px-3 py-2 shadow-lg border"
              style={{ background: "#fff", borderColor: "#E2E8F0" }}
              aria-label="Graded in 0.3 seconds"
            >
              <span className="text-lg" aria-hidden="true">&#9889;</span>
              <div>
                <p className="text-xs font-bold text-slate-800 leading-none">Graded in 0.3s</p>
                <p className="text-[10px] text-slate-400 leading-none mt-0.5">vs. 45 min manually</p>
              </div>
            </div>

            {/* Floating accuracy badge */}
            <div
              className="absolute -bottom-4 -right-2 z-20 flex items-center gap-2 rounded-xl px-3 py-2 shadow-lg border"
              style={{ background: "#fff", borderColor: "#E2E8F0" }}
              aria-label="99.8% grading accuracy"
            >
              <span
                className="text-lg font-black tabular-nums"
                style={{ color: "#4ADE80" }}
                aria-hidden="true"
              >
                99.8%
              </span>
              <div>
                <p className="text-xs font-bold text-slate-800 leading-none">Accuracy</p>
                <p className="text-[10px] text-slate-400 leading-none mt-0.5">audited by faculty</p>
              </div>
            </div>

            <GradingDemo />
          </div>
        </div>
      </div>
    </section>
  );
}
