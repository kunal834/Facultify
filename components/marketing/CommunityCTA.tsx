import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

// ---------------------------------------------------------------------------
// CommunityCTA section - clean modern CTA with the exact cartoon group image
// ---------------------------------------------------------------------------

export default function CommunityCTA() {
  return (
    <section
      aria-labelledby="community-heading"
      className="py-24 sm:py-32 relative overflow-hidden"
      style={{ background: "#F8FAFF" }}
    >
      {/* Decorative background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-3xl opacity-20 pointer-events-none"
        style={{ background: "radial-gradient(circle, #3B6FFF 0%, #7C3AED 100%)" }}
      />

      <div className="mx-auto w-full max-w-7xl px-6 lg:px-12 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-20 items-center">
          <div className="flex flex-col gap-6">
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-[0.1em]"
              style={{ background: "#3B6FFF1A", color: "#3B6FFF", width: "fit-content" }}
            >
              Start Instantly
            </span>
            <h2
              id="community-heading"
              className="text-4xl sm:text-5xl font-black leading-[1.08] tracking-[-0.03em]"
              style={{ color: "#0F172A" }}
            >
              Bring Your Whole Faculty In Minutes.
            </h2>
            <p className="text-lg leading-relaxed max-w-[480px]" style={{ color: "#475569" }}>
              Invite every teacher with one link. They accept, set a password, and land
              straight in their dashboard — no spreadsheets, no manual account setup,
              no waiting on IT.
            </p>
            <div>
              <Link
                href="/auth/signup"
                className="inline-flex items-center gap-2.5 rounded-full px-8 py-4 text-base font-bold text-white transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
                style={{ background: "#0F172A", boxShadow: "0 4px 20px rgba(15,23,42,0.25)" }}
              >
                Invite Your Team
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
            </div>
          </div>

          {/* Right column - Cartoon Group Image card */}
          <div className="relative mx-auto w-full max-w-[540px] aspect-[4/3] rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(15,23,42,0.15)] border-4 border-white bg-white group hover:scale-[1.02] transition-transform duration-300">
            <Image
              src="/cartoon_group.webp"
              alt="Facultify Community cartoon group"
              fill
              priority
              className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
            />
            {/* Overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
          </div>
        </div>
      </div>
    </section>
  );
}
