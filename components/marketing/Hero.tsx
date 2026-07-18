"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ArrowUpRight, Sparkles } from "lucide-react";

// ---------------------------------------------------------------------------
// Hero — white backdrop, big centered statement, full-bleed 3D cartoon
// illustration beneath it, floating action button in the corner.
// Fine-tuned outlines, 3D shadows, and premium curved borders.
// ---------------------------------------------------------------------------

export default function Hero() {
  return (
    <section
      className="relative overflow-hidden bg-white pt-10"
      aria-label="Hero"
    >
      {/* 3D lighting / radial gradient backdrop */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full blur-3xl opacity-35 pointer-events-none"
        style={{ background: "radial-gradient(circle, #3B6FFF20 0%, #7C3AED10 70%, transparent 100%)" }}
      />

      {/* Copy block */}
      <div className="relative z-10 mx-auto w-full max-w-4xl px-6 lg:px-12 pt-36 pb-12 sm:pt-40 sm:pb-16 flex flex-col items-center text-center gap-6">
        {/* Headline */}
        <h1
          className="text-4xl sm:text-5xl xl:text-6xl font-black leading-[1.1] tracking-[-0.03em] text-gray-900 drop-shadow-sm"
        >
          Ready to Transform Your Institution&apos;s Assessments?
        </h1>

        {/* Subheadline */}
        <p className="text-lg sm:text-xl leading-relaxed max-w-3xl text-gray-500">
          Stop spending hours creating question papers and grading answer sheets. Let AI handle the repetitive work while your faculty focuses on teaching and improving student outcomes.
        </p>

        {/* CTAs with 3D outline and lift */}
        <div className="flex flex-wrap items-center justify-center gap-4 mt-2">
          <Link
            href="/auth/signup"
            className="inline-flex items-center gap-2.5 rounded-full px-8 py-4 text-base font-bold text-white transition-all duration-300 hover:shadow-[0_12px_30px_rgba(15,23,42,0.3)] hover:-translate-y-1 active:translate-y-0 border border-gray-950"
            style={{ background: "#0F172A", boxShadow: "0 4px 20px rgba(15,23,42,0.2)" }}
          >
            Get a Free Demo
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Link>
          <Link
            href="/auth/signup"
            className="inline-flex items-center gap-2.5 rounded-full px-8 py-4 text-base font-semibold text-gray-700 border-2 border-gray-200/80 bg-white hover:bg-gray-50 hover:border-gray-300 shadow-[0_4px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_24px_rgba(0,0,0,0.06)] transition-all duration-300 hover:-translate-y-1 active:translate-y-0"
          >
            <span className="w-5 h-5 flex items-center justify-center rounded-full bg-gray-900">
              <Sparkles className="w-3 h-3 text-white" aria-hidden="true" />
            </span>
            Start Your Free Trial
          </Link>
        </div>

        {/* Supporting Text */}
        <p className="text-xs text-gray-400 font-bold tracking-wide mt-2">
          No credit card required &bull; Quick setup &bull; Personalized onboarding &bull; Dedicated support
        </p>
      </div>

      {/* 3D curved frame & wrapper for full-bleed cartoon illustration */}
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-10">
        <div className="relative overflow-hidden rounded-[2.5rem] sm:rounded-[3.5rem] border-8 border-white shadow-[0_20px_60px_rgba(15,23,42,0.12)] bg-gray-50">
          {/* Thin premium frame outline */}
          <div className="absolute inset-0 rounded-[2.5rem] sm:rounded-[3.5rem] border border-gray-200/60 pointer-events-none z-10" />
          <Image
            src="/cartoon_group.webp"
            alt="A diverse group of students taking a selfie together"
            width={1600}
            height={900}
            priority
            className="w-full h-auto object-cover object-top hover:scale-[1.01] transition-transform duration-700"
            style={{ maxHeight: "580px", objectFit: "cover", objectPosition: "top center" }}
          />
        </div>
      </div>

      {/* Floating action button — bottom-right corner */}
      <Link
        href="/auth/signup"
        aria-label="Get started with Facultify"
        className="absolute bottom-8 right-8 sm:bottom-12 sm:right-12 z-20 inline-flex items-center justify-center w-14 h-14 rounded-full text-white shadow-[0_12px_30px_rgba(15,23,42,0.35)] border border-gray-800 transition-all duration-350 hover:-translate-y-1 hover:rotate-45"
        style={{ background: "#0F172A" }}
      >
        <ArrowUpRight className="w-6 h-6" aria-hidden="true" />
      </Link>
    </section>
  );
}
