// ---------------------------------------------------------------------------
// A full-bleed "everyone together" collage — stands in for the group photo
// in the reference layout. Faces are generated via DiceBear's avataaars set
// (MIT-licensed, generated on the fly from a seed — no stock photography or
// real people involved) so the hero actually reads as a group, not icons.
// ---------------------------------------------------------------------------

type Face = {
  seed: string;
  size: number;
  top: string;
  left: string;
  ring: string;
  delay: string;
};

function avatarUrl(seed: string, bg: string) {
  return `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(seed)}&backgroundColor=${bg}`;
}

// Faces hug the top and bottom edges only — the vertical middle band stays
// clear so the center caption never gets covered.
const FACES: Face[] = [
  { seed: "Priya-Facultify", size: 84, top: "8%", left: "6%", ring: "b6e3f4", delay: "0ms" },
  { seed: "Arjun-Facultify", size: 68, top: "74%", left: "4%", ring: "ffd5dc", delay: "120ms" },
  { seed: "Meera-Facultify", size: 92, top: "6%", left: "28%", ring: "d1d4f9", delay: "60ms" },
  { seed: "Rohan-Facultify", size: 80, top: "74%", left: "28%", ring: "fde68a", delay: "180ms" },
  { seed: "Ananya-Facultify", size: 72, top: "10%", left: "62%", ring: "c0f5d4", delay: "90ms" },
  { seed: "Karan-Facultify", size: 76, top: "70%", left: "64%", ring: "ffdfbf", delay: "150ms" },
  { seed: "Sana-Facultify", size: 64, top: "8%", left: "86%", ring: "b6e3f4", delay: "30ms" },
];

function FaceBubble({ seed, size, top, left, ring, delay }: Face) {
  return (
    <div
      className="absolute rounded-full overflow-hidden shadow-[0_12px_30px_rgba(15,23,42,0.22)] ring-4 ring-white/80 animate-float"
      style={{ width: size, height: size, top, left, background: `#${ring}`, animationDelay: delay }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={avatarUrl(seed, ring)}
        alt=""
        width={size}
        height={size}
        loading="lazy"
        className="w-full h-full object-cover"
      />
    </div>
  );
}

export default function TribeIllustration() {
  return (
    <div
      className="relative w-full overflow-hidden rounded-[2rem] sm:rounded-[2.75rem] h-[320px] sm:h-[420px] lg:h-[560px]"
      style={{ background: "linear-gradient(135deg, #3B6FFF 0%, #6D5BF6 55%, #7C3AED 100%)" }}
      aria-label="Illustration of teachers and students collaborating on Facultify"
    >
      {/* Warm glow accents — nods to the sunlit reference photo without faking one */}
      <div
        aria-hidden="true"
        className="absolute -top-16 -right-16 w-72 h-72 rounded-full blur-3xl opacity-40"
        style={{ background: "radial-gradient(circle, #FDBA74 0%, transparent 70%)" }}
      />
      <div
        aria-hidden="true"
        className="absolute -bottom-24 -left-10 w-80 h-80 rounded-full blur-3xl opacity-30"
        style={{ background: "radial-gradient(circle, #F472B6 0%, transparent 70%)" }}
      />

      {/* Face cluster */}
      <div className="absolute inset-0">
        {FACES.map((f) => (
          <FaceBubble key={f.seed} {...f} />
        ))}
      </div>

      {/* Center headline card — the "we're all here together" note */}
      <div className="absolute inset-0 flex items-center justify-center px-6">
        <div className="text-center">
          <p className="text-white/90 text-sm sm:text-base font-semibold tracking-wide uppercase">
            Teachers &amp; Students, together
          </p>
          <p className="text-white text-xl sm:text-2xl font-black mt-1">
            One platform for your whole institution
          </p>
        </div>
      </div>
    </div>
  );
}
