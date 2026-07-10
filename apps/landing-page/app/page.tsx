'use client';

import React from 'react';
import Navbar from '../src/components/sections/Navbar';
import Hero from '../src/components/sections/Hero';
import BentoGrid from '../src/components/sections/BentoGrid';
import Pricing from '../src/components/sections/Pricing';
import Footer from '../src/components/sections/Footer';

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 relative">
      <Navbar />
      <Hero />
      <BentoGrid />
      <Pricing />
      <Footer />
    </main>
  );
}