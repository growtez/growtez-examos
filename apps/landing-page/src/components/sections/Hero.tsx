'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, ArrowRight, Play, CheckCircle2 } from 'lucide-react';

export default function Hero() {
  return (
    <section className="relative overflow-hidden pt-24 pb-20 md:pt-32 md:pb-28">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -z-10 h-[400px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-600/20 blur-[120px]" />
      <div className="absolute top-10 right-10 -z-10 h-[300px] w-[300px] rounded-full bg-cyan-500/10 blur-[100px]" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
        {/* Anti-cheat Tag */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/60 px-4 py-1.5 text-xs sm:text-sm text-cyan-400 backdrop-blur-sm"
        >
          <ShieldAlert className="h-4 w-4 text-cyan-400 animate-pulse" />
          <span>Next-Gen Examination Guard Active</span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mt-6 text-4xl font-extrabold tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl"
        >
          The Uncompromising <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-cyan-400 to-indigo-500 bg-clip-text text-transparent">
            Examination Engine
          </span>
        </motion.h1>

        {/* Subtext */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mx-auto mt-6 max-w-2xl text-lg sm:text-xl text-slate-400"
        >
          Military-grade anti-cheat, zero-data-loss offline tolerance, and a flawless JEE-like interface engineered for modern institutes.
        </motion.p>

        {/* Call to Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <a
            href="https://school.parikshaos.com"
            className="group inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 px-6 py-3.5 text-base font-semibold text-white shadow-lg hover:from-cyan-400 hover:to-indigo-500 transition-all duration-200 active:scale-95"
          >
            Institute Login
            <ArrowRight className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-1" />
          </a>
          <a
            href="#pricing"
            className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-900/40 hover:bg-slate-900/80 px-6 py-3.5 text-base font-semibold text-slate-300 hover:text-white transition-all duration-200"
          >
            View Pricing
          </a>
        </motion.div>

        {/* Visual 3D Desktop Mockup */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="relative mt-20"
        >
          {/* Outer glowing frame */}
          <div className="absolute inset-0 -z-10 rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-indigo-500/20 blur-xl" />

          {/* Perspective Container */}
          <div className="perspective-1000 mx-auto max-w-5xl rounded-2xl border border-slate-800 bg-slate-900/60 p-2 shadow-2xl backdrop-blur-sm transition-transform duration-500 hover:rotate-x-1 hover:rotate-y-[-1deg]">
            <div className="aspect-video w-full overflow-hidden rounded-xl border border-slate-800 bg-slate-950 text-left flex flex-col">
              
              {/* Fake Desktop Title Bar */}
              <div className="flex items-center justify-between border-b border-slate-900 bg-slate-900/50 px-4 py-3">
                <div className="flex items-center gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-red-500/80" />
                  <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
                  <div className="h-3 w-3 rounded-full bg-green-500/80" />
                </div>
                <div className="flex items-center gap-1 rounded bg-slate-950 px-3 py-1 text-xs text-slate-500 font-mono select-none">
                  <span className="text-cyan-500">🔒 secure-kiosk://</span>examos.parikshaos.com/session_active
                </div>
                <div className="w-12 text-right text-[10px] text-cyan-400 font-mono animate-pulse">
                  SECURE MODE
                </div>
              </div>

              {/* Fake Exam App Content Mockup */}
              <div className="flex-1 grid grid-cols-4 gap-0 divide-x divide-slate-900">
                {/* Left Panel: Question and Options */}
                <div className="col-span-3 p-6 flex flex-col justify-between overflow-y-auto">
                  <div>
                    {/* Header bar */}
                    <div className="flex justify-between items-center pb-4 border-b border-slate-900">
                      <span className="text-sm font-semibold text-slate-400">Physics | Section A</span>
                      <span className="text-xs bg-slate-900 text-slate-400 px-2 py-0.5 rounded font-mono">Q. ID: 489102</span>
                    </div>

                    {/* Question text */}
                    <div className="mt-6">
                      <p className="text-sm text-slate-300 leading-relaxed font-medium">
                        A solid sphere of mass <span className="text-cyan-400">M</span> and radius <span className="text-cyan-400">R</span> is rolling down an inclined plane without slipping. The acceleration of its center of mass is:
                      </p>
                      <div className="mt-6 space-y-3">
                        <label className="flex items-center gap-3 rounded-lg border border-slate-800 bg-slate-900/20 p-3 hover:bg-slate-900/40 transition-colors cursor-pointer group">
                          <input type="radio" name="mock-q" className="accent-cyan-500" />
                          <span className="text-xs text-slate-400 group-hover:text-slate-200">(A) 5/7 g sin θ</span>
                        </label>
                        <label className="flex items-center gap-3 rounded-lg border border-cyan-500/30 bg-cyan-500/5 p-3 cursor-pointer">
                          <input type="radio" name="mock-q" defaultChecked className="accent-cyan-500" />
                          <span className="text-xs text-cyan-400 font-semibold">(B) 2/3 g sin θ</span>
                        </label>
                        <label className="flex items-center gap-3 rounded-lg border border-slate-800 bg-slate-900/20 p-3 hover:bg-slate-900/40 transition-colors cursor-pointer group">
                          <input type="radio" name="mock-q" className="accent-cyan-500" />
                          <span className="text-xs text-slate-400 group-hover:text-slate-200">(C) 3/5 g sin θ</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Actions footer */}
                  <div className="flex justify-between items-center pt-4 border-t border-slate-900 mt-6">
                    <div className="flex gap-2">
                      <button className="px-3 py-1.5 rounded bg-slate-900 border border-slate-800 text-[11px] text-slate-400">Mark for Review & Next</button>
                      <button className="px-3 py-1.5 rounded bg-slate-900 border border-slate-800 text-[11px] text-slate-400">Clear Response</button>
                    </div>
                    <button className="px-4 py-1.5 rounded bg-gradient-to-r from-cyan-500 to-indigo-600 text-[11px] font-semibold text-white">Save & Next</button>
                  </div>
                </div>

                {/* Right Panel: Student Info & Palette */}
                <div className="col-span-1 p-4 bg-slate-950/50 flex flex-col justify-between">
                  <div>
                    {/* User profile info */}
                    <div className="flex items-center gap-3 pb-4 border-b border-slate-900">
                      <div className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center font-bold text-xs text-slate-300">
                        JD
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-slate-300">John Doe</div>
                        <div className="text-[10px] text-slate-500">Roll: 20261102</div>
                      </div>
                    </div>

                    {/* Question palette grid */}
                    <div className="mt-4">
                      <div className="text-xs font-semibold text-slate-400 mb-2">Question Palette</div>
                      <div className="grid grid-cols-4 gap-2">
                        <div className="h-7 w-7 rounded bg-green-600 text-white font-semibold text-[10px] flex items-center justify-center">1</div>
                        <div className="h-7 w-7 rounded bg-cyan-600 text-white font-semibold text-[10px] flex items-center justify-center">2</div>
                        <div className="h-7 w-7 rounded bg-slate-800 text-slate-500 font-semibold text-[10px] flex items-center justify-center">3</div>
                        <div className="h-7 w-7 rounded bg-slate-800 text-slate-500 font-semibold text-[10px] flex items-center justify-center">4</div>
                        <div className="h-7 w-7 rounded bg-slate-800 text-slate-500 font-semibold text-[10px] flex items-center justify-center">5</div>
                        <div className="h-7 w-7 rounded bg-slate-800 text-slate-500 font-semibold text-[10px] flex items-center justify-center">6</div>
                        <div className="h-7 w-7 rounded bg-slate-800 text-slate-500 font-semibold text-[10px] flex items-center justify-center">7</div>
                        <div className="h-7 w-7 rounded bg-slate-800 text-slate-500 font-semibold text-[10px] flex items-center justify-center">8</div>
                      </div>
                    </div>
                  </div>

                  {/* Status checklist */}
                  <div className="space-y-1.5 border-t border-slate-900 pt-4">
                    <div className="flex items-center gap-1.5 text-[10px] text-green-400">
                      <CheckCircle2 className="h-3 w-3" /> Lock status: Active
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-cyan-400">
                      <CheckCircle2 className="h-3 w-3" /> Local Sync: Connected
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}