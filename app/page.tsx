"use client";

import MarketingNav from "@/components/marketing/MarketingNav";
import Hero from "@/components/marketing/Hero";
import ValueProps from "@/components/marketing/ValueProps";
import CommunityCTA from "@/components/marketing/CommunityCTA";
import Footer from "@/components/marketing/Footer";

export default function LandingPage() {
  return (
    <main>
      <MarketingNav />
      <Hero />
      <ValueProps />
      <CommunityCTA />
      <Footer />
    </main>
  );
}
