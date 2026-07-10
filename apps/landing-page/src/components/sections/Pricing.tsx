'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Check, Info } from 'lucide-react';

export default function Pricing() {
  return (
    <section id="pricing" className="py-20 md:py-28 relative">
      <div className="absolute top-10 left-1/2 -z-10 h-[400px] w-[500px] -translate-x-1/2 rounded-full bg-indigo-600/10 blur-[120px]" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Flexible Plans for Every Institute
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-slate-400">
            Scale seamlessly from local weekly mock tests to full-scale state-level entrance examination cycles.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-8 max-w-4xl mx-auto md:grid-cols-2 items-stretch">
          
          {/* Card 1: Pay-per-Exam */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="relative flex flex-col justify-between rounded-2xl border border-indigo-500/50 bg-slate-900/40 p-8 backdrop-blur-sm shadow-[0_0_30px_-5px_rgba(99,102,241,0.25)] hover:border-indigo-400 transition-all"
          >
            {/* "Most Popular" badge */}
            <div className="absolute top-0 right-6 -translate-y-1/2 rounded-full bg-indigo-600 px-3 py-1 text-xs font-semibold tracking-wider text-white uppercase">
              Most Popular
            </div>

            <div>
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold text-white">Pay-per-Exam</h3>
                  <p className="mt-2 text-sm text-slate-400">Pay a flat rate per exam created. Perfect for coaching classes and mock series.</p>
                </div>
              </div>

              <div className="mt-6 flex items-baseline">
                <span className="text-5xl font-extrabold tracking-tight text-white">₹300</span>
                <span className="ml-1 text-sm font-semibold text-slate-400">/ exam</span>
              </div>

              <div className="mt-4 flex items-center gap-1.5 rounded-lg bg-indigo-950/40 p-2 text-xs text-indigo-300 border border-indigo-900/50">
                <Info className="h-4 w-4 text-indigo-400 shrink-0" />
                <span>Unlimited students per exam. Credits never expire.</span>
              </div>

              <ul className="mt-8 space-y-4">
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-indigo-400 shrink-0" />
                  <span className="text-sm text-slate-300">All features unlocked: Kiosk, Sync, JEE UI</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-indigo-400 shrink-0" />
                  <span className="text-sm text-slate-300">Custom branding & subdomains</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-indigo-400 shrink-0" />
                  <span className="text-sm text-slate-300">Unlimited questions & question bank access</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-indigo-400 shrink-0" />
                  <span className="text-sm text-slate-300">Detailed analytics & scorecard exports</span>
                </li>
              </ul>
            </div>

            <div className="mt-8">
              <a
                href="https://school.parikshaos.com"
                className="block w-full text-center rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition-all duration-200"
              >
                Get Started
              </a>
            </div>
          </motion.div>

          {/* Card 2: Annual Pro */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/30 p-8 backdrop-blur-sm hover:border-slate-700 transition-all"
          >
            <div>
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold text-white">Annual Pro</h3>
                  <p className="mt-2 text-sm text-slate-400">Unlimited examination runs for high-scale academies and institutional groups.</p>
                </div>
              </div>

              <div className="mt-6 flex items-baseline">
                <span className="text-5xl font-extrabold tracking-tight text-white">Custom</span>
                <span className="ml-1 text-sm font-semibold text-slate-400">/ flat yearly fee</span>
              </div>

              <div className="mt-4 flex items-center gap-1.5 rounded-lg bg-slate-900/60 p-2 text-xs text-slate-400 border border-slate-800">
                <Info className="h-4 w-4 text-cyan-400 shrink-0" />
                <span>Dedicated DB servers + SLA protection.</span>
              </div>

              <ul className="mt-8 space-y-4">
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-cyan-400 shrink-0" />
                  <span className="text-sm text-slate-300">Unlimited examinations & students</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-cyan-400 shrink-0" />
                  <span className="text-sm text-slate-300">Dedicated high-availability database cluster</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-cyan-400 shrink-0" />
                  <span className="text-sm text-slate-300">Custom parent & student portal mobile apps</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-cyan-400 shrink-0" />
                  <span className="text-sm text-slate-300">Premium 24/7 technical deployment support</span>
                </li>
              </ul>
            </div>

            <div className="mt-8">
              <a
                href="https://school.parikshaos.com"
                className="block w-full text-center rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 py-3 text-sm font-semibold text-white transition-all duration-200"
              >
                Get Started
              </a>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
