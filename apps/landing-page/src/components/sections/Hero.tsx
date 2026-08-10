'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ShieldAlert, CheckCircle2 } from 'lucide-react';

export default function Hero() {
  const [selectedOption, setSelectedOption] = useState('B');

  return (
    <section className="relative overflow-hidden pt-10 pb-20 md:pt-24 md:pb-28 bg-primary/10 px-4 sm:px-6 border-b-4 border-black">
      {/* Background grid pattern */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:16px_16px] opacity-20" />

      <div className="mx-auto max-w-7xl text-center">
        {/* Anti-cheat Tag */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="brutal-tag mb-6"
        >
          <ShieldAlert className="h-4 w-4" />
          <span>Empowering Indian Schools & Institutes</span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mt-4 text-5xl font-black tracking-tighter text-black sm:text-6xl md:text-7xl lg:text-8xl uppercase leading-none"
        >
          Conduct Flawless <br className="hidden sm:inline" />
          <span className="bg-primary text-white px-2 inline-block mt-2 shadow-brutal-sm border-2 border-black -rotate-1">
            JEE & NEET Mock Tests
          </span>
        </motion.h1>

        {/* Subtext */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mx-auto mt-8 max-w-3xl text-lg sm:text-xl md:text-2xl text-black font-semibold px-2 border-l-4 border-black pl-4 text-left sm:text-center sm:border-none sm:pl-0"
        >
          Transform your computer lab into an authentic national-level testing center. Prepare your students with exact exam interfaces, powered by our secure Desktop App and smart School Admin panel—even during internet outages.
        </motion.p>

        {/* Call to Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-6"
        >
          <a
            href="https://school.parikshaos.com"
            className="brutal-btn text-lg px-8 py-4"
          >
            Get Started
          </a>
        </motion.div>

        {/* Visual 3D Desktop Mockup */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="relative mt-20 w-full px-4 sm:px-0"
        >
          {/* Brutal Container */}
          <div className="mx-auto max-w-5xl border-4 border-black bg-white p-2 shadow-brutal-lg w-full">
            <Image 
              src="/desktop-app-image.png" 
              alt="ParikshaOS Desktop App" 
              width={1200} 
              height={800} 
              className="w-full h-auto object-cover border-2 border-black" 
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}