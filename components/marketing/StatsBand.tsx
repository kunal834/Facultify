const STATS = [
  { value: "40+", label: "Institutions onboarded" },
  { value: "120K+", label: "Tests auto-graded" },
  { value: "85K+", label: "Students assessed" },
  { value: "4.9", label: "Average faculty rating" },
] as const;

export default function StatsBand() {
  return (
    <div className="relative z-20 px-6 lg:px-12 -mt-10 sm:-mt-14">
      <div
        className="mx-auto w-full max-w-6xl rounded-3xl px-6 sm:px-10 py-8 sm:py-10 shadow-[0_20px_50px_-15px_rgba(59,111,255,0.45)]"
        style={{ background: "linear-gradient(120deg, #3B6FFF 0%, #5B4DFF 55%, #7C3AED 100%)" }}
        aria-label="Facultify at a glance"
      >
        <dl className="grid grid-cols-2 lg:grid-cols-4 gap-y-8 gap-x-4 lg:divide-x divide-white/20">
          {STATS.map((stat, i) => (
            <div
              key={stat.label}
              className={["flex flex-col items-center text-center px-2", i > 0 ? "lg:pl-6" : ""].join(" ")}
            >
              <dd className="text-3xl sm:text-4xl font-black text-white tabular-nums tracking-[-0.02em]">
                {stat.value}
              </dd>
              <dt className="mt-1.5 text-xs sm:text-sm font-medium text-white/80">
                {stat.label}
              </dt>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
