"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";

// ---------------------------------------------------------------------------
// Placeholder testimonials — swap with real customer quotes when available
// ---------------------------------------------------------------------------

const TESTIMONIALS = [
  {
    quote: "We went from grading a stack of 200 papers over a weekend to seeing results before class ended. It changed how our teachers plan the next lesson.",
    name: "Meera Nair",
    role: "Principal, Riverside Academy",
    rating: 5,
  },
  {
    quote: "Onboarding our whole faculty took one afternoon. The invite flow just works, and nobody had to call IT for a password reset.",
    name: "Daniel Osei",
    role: "Vice Principal, Crestline High",
    rating: 5,
  },
  {
    quote: "The analytics finally show us which questions are actually confusing students, not just who scored low. We rewrite tests based on real data now.",
    name: "Priya Deshmukh",
    role: "Head of Science, Lakeview Institute",
    rating: 4,
  },
  {
    quote: "AI-generated drafts save me hours every week. I still review every question, but I'm no longer starting from a blank page.",
    name: "Carlos Ibarra",
    role: "Mathematics Teacher, Northgate School",
    rating: 5,
  },
  {
    quote: "Managing three campuses used to mean three spreadsheets. Now every admin sees the same live dashboard.",
    name: "Fatima Al-Sayed",
    role: "Operations Director, Horizon Schools Group",
    rating: 5,
  },
] as const;

const VISIBLE = 3;

export default function Testimonials() {
  const [start, setStart] = useState(0);

  function shift(delta: number) {
    setStart((s) => (s + delta + TESTIMONIALS.length) % TESTIMONIALS.length);
  }

  const visible = Array.from({ length: VISIBLE }, (_, i) => TESTIMONIALS[(start + i) % TESTIMONIALS.length]);

  return (
    <section aria-labelledby="testimonials-heading" className="py-24 sm:py-32 bg-white">
      <div className="mx-auto w-full max-w-7xl px-6 lg:px-12">
        {/* Header row with arrows */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-14">
          <h2
            id="testimonials-heading"
            className="text-4xl sm:text-5xl font-black leading-[1.08] tracking-[-0.03em] max-w-xl"
            style={{ color: "#0F172A" }}
          >
            Satisfied Educators Are Our Best Ads.
          </h2>

          <div className="flex items-center gap-3 shrink-0" role="group" aria-label="Testimonial navigation">
            <button
              onClick={() => shift(-1)}
              className="inline-flex items-center justify-center w-11 h-11 rounded-full border border-slate-200 text-slate-500 hover:text-slate-900 hover:border-slate-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              aria-label="Previous testimonials"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => shift(1)}
              className="inline-flex items-center justify-center w-11 h-11 rounded-full text-white transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              style={{ background: "#0F172A" }}
              aria-label="Next testimonials"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
          {visible.map((t) => (
            <div
              key={t.name}
              className="flex flex-col gap-5 rounded-2xl border border-slate-200/70 p-7 bg-white"
            >
              <div className="flex gap-0.5" aria-label={`${t.rating} out of 5 stars`}>
                {Array.from({ length: 5 }, (_, i) => (
                  <Star
                    key={i}
                    className="w-4 h-4"
                    fill={i < t.rating ? "#FBBF24" : "none"}
                    style={{ color: i < t.rating ? "#FBBF24" : "#E2E8F0" }}
                  />
                ))}
              </div>

              <p className="text-sm leading-relaxed text-slate-600 flex-1">&ldquo;{t.quote}&rdquo;</p>

              <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0"
                  style={{ background: "linear-gradient(135deg, #3B6FFF 0%, #7C3AED 100%)" }}
                  aria-hidden="true"
                >
                  {t.name.split(" ").map((n) => n[0]).join("")}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900 leading-tight">{t.name}</p>
                  <p className="text-xs text-slate-400 leading-tight mt-0.5">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
