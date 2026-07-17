'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ShieldAlert, CheckCircle2 } from 'lucide-react';

export default function Hero() {
  const [selectedOption, setSelectedOption] = useState('B');

  return (
    <section className="relative overflow-hidden pt-24 pb-20 md:pt-32 md:pb-28 bg-bg px-4 sm:px-6">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -z-10 h-[400px] w-[600px] -translate-x-1/2 -translate-y-1/2 bg-primary/5 blur-[120px]" />

      <div className="mx-auto max-w-7xl text-center">
        {/* Anti-cheat Tag */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 border border-border bg-surface px-4 py-2 text-xs sm:text-sm text-primary shadow-sm"
        >
          <ShieldAlert className="h-4 w-4 text-primary animate-pulse" />
          <span className="font-bold tracking-wide uppercase text-xs sm:text-sm">Empowering Indian Schools & Institutes</span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mt-8 text-4xl font-extrabold tracking-tight text-text-main sm:text-5xl md:text-6xl lg:text-7xl"
        >
          Conduct Flawless <br className="hidden sm:inline" />
          <span className="text-primary">
            JEE & NEET Mock Tests
          </span>
        </motion.h1>

        {/* Subtext */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mx-auto mt-6 max-w-2xl text-base sm:text-lg md:text-xl text-text-muted font-medium px-2"
        >
          Transform your computer lab into an authentic national-level testing center. Prepare your students with exact exam interfaces, powered by our secure Desktop App and smart School Admin panel—even during internet outages.
        </motion.p>

        {/* Call to Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <a
            href="#features"
            className="inline-flex w-full sm:w-auto items-center justify-center gap-2 border-2 border-primary bg-primary text-white hover:bg-primary/90 px-8 py-4 text-base font-bold transition-all duration-200 uppercase tracking-widest shadow-md"
          >
            Explore Features
          </a>
        </motion.div>

        {/* Visual 3D Desktop Mockup */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="relative mt-16 md:mt-20 w-full"
        >
          {/* Outer glowing frame */}
          <div className="absolute inset-0 -z-10 bg-primary/10 blur-xl" />

          {/* Perspective Container */}
          <div className="perspective-1000 mx-auto max-w-5xl border border-border bg-surface p-1.5 sm:p-2 shadow-2xl transition-transform duration-500 hover:rotate-x-1 hover:rotate-y-[-1deg] w-full">
            <Image 
              src="/desktop-app-image.png" 
              alt="ParikshaOS Desktop App" 
              width={1200} 
              height={800} 
              className="w-full h-auto object-cover border border-border bg-bg" 
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}