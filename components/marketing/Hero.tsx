"use client";

import Link from "next/link";
import { ArrowRight, Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

// ---------------------------------------------------------------------------
// Animated grading demo — the product's core loop shown, not described
// ---------------------------------------------------------------------------

const QUESTIONS = [
  { label: "Q1", text: "Which theorem proves √2 is irrational?", correct: "B" },
  { label: "Q2", text: "Define a recursive function.", correct: "A" },
  { label: "Q3", text: "Ohm's Law relates voltage to…", correct: "C" },
  { label: "Q4", text: "Mitosis produces how many cells?", correct: "B" },
];

const STUDENT_ANSWERS = ["B", "A", "C", "A"]; // Q4 wrong on purpose — makes it feel real

function GradingDemo() {
  const [phase, setPhase] = useState<"idle" | "grading" | "done">("idle");
  const [gradedCount, setGradedCount] = useState(0);
  const [score, setScore] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const startDelay = setTimeout(() => startGrading(), 900);
    return () => clearTimeout(startDelay);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      className="relative w-full rounded-2xl overflow-hidden border border-black/5"
      style={{
        background: "#0B1220",
        boxShadow: "0 24px 60px -20px rgba(11,18,32,0.45), 0 4px 16px rgba(11,18,32,0.12)",
      }}
      aria-label="Live grading simulation"
    >
      <div className="flex items-center gap-1.5 px-4 py-3 border-b border-white/[0.06]">
        <span className="w-2.5 h-2.5 rounded-full bg-white/15" />
        <span className="w-2.5 h-2.5 rounded-full bg-white/15" />
        <span className="w-2.5 h-2.5 rounded-full bg-white/15" />
        <span className="ml-3 text-[11px] text-white/40 font-medium tracking-wide">
          Facultify · Auto Grade
        </span>
      </div>

      <div className="p-5 space-y-3">
        <div className="flex items-center justify-between mb-1">
          <div>
            <p className="text-[10.5px] text-white/35 uppercase tracking-widest font-semibold">
              Test · Introduction to Science
            </p>
            <p className="text-white font-semibold text-sm mt-0.5">Priya Mehta — Submission #47</p>
          </div>
          <div className="text-right">
            <p
              className="text-2xl font-semibold tabular-nums transition-colors duration-300"
              style={{ color: phase === "done" ? (pct >= 75 ? "#4ADE80" : "#FB923C") : "rgba(255,255,255,0.35)" }}
            >
              {score}%
            </p>
            <p className="text-[10px] text-white/30 uppercase tracking-widest">Score</p>
          </div>
        </div>

        <div className="w-full h-1.5 rounded-full bg-white/[0.08] overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${pct}%`, background: pct >= 75 ? "#4ADE80" : "#FB923C" }}
          />
        </div>

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
                      ? "rgba(74,222,128,0.07)"
                      : "rgba(251,146,60,0.07)"
                    : "rgba(255,255,255,0.02)",
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
                        ? "rgba(74,222,128,0.16)"
                        : "rgba(251,146,60,0.16)"
                      : "rgba(255,255,255,0.05)",
                    color: isGraded ? (isCorrect ? "#4ADE80" : "#FB923C") : "rgba(255,255,255,0.35)",
                  }}
                >
                  {q.label}
                </span>
                <p className="text-[12px] text-white/60 leading-snug flex-1 truncate">{q.text}</p>
                <span className="shrink-0 text-[11px] font-bold">
                  {isGraded ? (
                    isCorrect ? (
                      <span style={{ color: "#4ADE80" }}>+25</span>
                    ) : (
                      <span style={{ color: "#FB923C" }}>+0</span>
                    )
                  ) : (
                    <span className="text-white/20">···</span>
                  )}
                </span>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
          <div className="flex gap-4">
            <div>
              <p className="text-[10px] text-white/30 uppercase tracking-wider">Graded</p>
              <p className="text-sm font-semibold text-white tabular-nums">
                {gradedCount}/{QUESTIONS.length}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-white/30 uppercase tracking-wider">Time</p>
              <p className="text-sm font-semibold text-white">0.3s</p>
            </div>
          </div>

          {phase === "done" && (
            <button
              onClick={replay}
              className="text-[11px] text-white/40 hover:text-white transition-colors flex items-center gap-1 px-2 py-1 rounded hover:bg-white/5"
              aria-label="Replay grading animation"
            >
              <Play className="w-3 h-3" />
              Replay
            </button>
          )}
          {phase === "grading" && (
            <span className="text-[11px] text-brand-400 animate-pulse">Grading…</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Hero
// ---------------------------------------------------------------------------

export default function Hero() {
  return (
    <section
      className="relative min-h-screen flex flex-col justify-center overflow-hidden bg-white bg-grid-faint"
      aria-label="Hero"
    >
      {/* Single soft glow — atmosphere, not decoration */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute -top-40 right-[-10%] w-[640px] h-[640px] rounded-full blur-[110px] opacity-[0.35]"
          style={{ background: "radial-gradient(circle, #DEE6FF 0%, transparent 70%)" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-7xl px-6 lg:px-12 py-24 lg:py-28">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-20 items-center">
          {/* ── Left: copy stack ── */}
          <motion.div
            className="flex flex-col gap-7"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 self-start rounded-full border border-slate-200 bg-white px-3.5 py-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-500" aria-hidden="true" />
              <span className="text-xs font-semibold text-ink-soft tracking-wide">
                Built for schools &amp; coaching institutes
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-[2.75rem] sm:text-6xl xl:text-[4.5rem] font-semibold leading-[1.08] tracking-[-0.02em] text-ink">
              Assess{" "}
              <span className="font-serif italic font-normal text-brand-600">smarter,</span>
              <br />
              teach better.
            </h1>

            {/* Subheadline */}
            <p className="text-lg sm:text-xl leading-relaxed max-w-[480px] text-ink-muted">
              Facultify gives institutions an end-to-end assessment engine — generate
              AI-authored tests in seconds, grade thousands of submissions instantly,
              and surface the learning gaps your faculty actually need to act on.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-4 pt-1">
              <Link
                href="/auth/signup"
                className="group inline-flex items-center gap-2.5 rounded-xl bg-brand-600 px-8 py-4 text-base font-semibold text-white shadow-[0_10px_30px_-10px_rgba(46,70,173,0.55)] transition-all duration-200 hover:bg-brand-700 hover:shadow-[0_14px_36px_-10px_rgba(46,70,173,0.6)] hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
              >
                Start Free Trial
                <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true" />
              </Link>
            </div>

            {/* Trust note */}
            <p className="text-xs text-ink-faint font-medium">
              No credit card required · Setup in under 5 minutes
            </p>
          </motion.div>

          {/* ── Right: animated grading demo ── */}
          <motion.div
            className="relative lg:pl-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Stat badge — anchored to the demo, single accent, no rainbow */}
            <div
              className="absolute -top-4 -left-4 z-20 flex items-center gap-2.5 rounded-xl bg-white px-3.5 py-2.5 border border-slate-200 shadow-[0_8px_24px_-8px_rgba(11,18,32,0.18)]"
              aria-label="Graded in 0.3 seconds"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
              <div>
                <p className="text-xs font-semibold text-ink leading-none">Graded in 0.3s</p>
                <p className="text-[10px] text-ink-faint leading-none mt-1">vs. 45 min manually</p>
              </div>
            </div>

            <div
              className="absolute -bottom-4 -right-2 z-20 flex items-center gap-2.5 rounded-xl bg-white px-3.5 py-2.5 border border-slate-200 shadow-[0_8px_24px_-8px_rgba(11,18,32,0.18)]"
              aria-label="99.8% grading accuracy"
            >
              <span className="text-lg font-semibold tabular-nums text-brand-600" aria-hidden="true">
                99.8%
              </span>
              <div>
                <p className="text-xs font-semibold text-ink leading-none">Accuracy</p>
                <p className="text-[10px] text-ink-faint leading-none mt-1">audited by faculty</p>
              </div>
            </div>

            <GradingDemo />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
