'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Check, Info } from 'lucide-react';

export default function Pricing() {
  return (
    <section id="pricing" className="py-20 md:py-28 relative bg-bg">
      <div className="absolute top-10 left-1/2 -z-10 h-[400px] w-[500px] -translate-x-1/2 bg-primary/5 blur-[120px]" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-text-main sm:text-4xl">
            Flexible Plans for Every Institute
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-text-muted font-medium">
            Scale seamlessly from weekly coaching mock tests to full-school terminal examination cycles.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-8 max-w-4xl mx-auto md:grid-cols-2 items-stretch">
          
          {/* Card 1: Pay-per-Exam */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="relative flex flex-col justify-between border-2 border-primary bg-surface p-8 shadow-xl"
          >
            {/* "Most Popular" badge */}
            <div className="absolute top-0 right-6 -translate-y-1/2 bg-primary px-4 py-1.5 text-xs font-bold tracking-widest text-white uppercase shadow-sm">
              Most Popular
            </div>

            <div>
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-extrabold text-text-main">Weekly Mock Test Plan</h3>
                  <p className="mt-2 text-sm text-text-muted font-medium">Pay a flat rate per mock test created. Perfect for coaching classes running weekend tests.</p>
                </div>
              </div>

              <div className="mt-6 flex items-baseline">
                <span className="text-5xl font-extrabold tracking-tight text-text-main">₹300</span>
                <span className="ml-1 text-sm font-bold text-text-muted uppercase">/ test</span>
              </div>

              <div className="mt-4 flex items-center gap-1.5 bg-primary/5 p-3 text-xs font-bold text-primary border border-primary/20">
                <Info className="h-4 w-4 text-primary shrink-0" />
                <span>Unlimited students per test. Credits never expire.</span>
              </div>

              <ul className="mt-8 space-y-4">
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-primary shrink-0" />
                  <span className="text-sm font-medium text-text-main">School Admin Panel & Desktop App</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-primary shrink-0" />
                  <span className="text-sm font-medium text-text-main">Authentic JEE/NEET UI for students</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-primary shrink-0" />
                  <span className="text-sm font-medium text-text-main">Create unlimited questions & batches</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-primary shrink-0" />
                  <span className="text-sm font-medium text-text-main">Instant report cards for parents</span>
                </li>
              </ul>
            </div>

            <div className="mt-8">
              <a
                href="https://wa.me/916026056362?text=Hi%2C%20I%20am%20interested%20in%20ParikshaOS%20for%20my%20institute"
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full text-center bg-primary hover:bg-primary/90 py-4 text-sm font-bold text-white uppercase tracking-widest transition-colors duration-200"
              >
                Contact Sales
              </a>
            </div>
          </motion.div>

          {/* Card 2: Annual Pro */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="flex flex-col justify-between border border-border bg-surface p-8 hover:border-primary transition-all duration-300"
          >
            <div>
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-extrabold text-text-main">Complete School License</h3>
                  <p className="mt-2 text-sm text-text-muted font-medium">Unlimited examination runs for K-12 schools managing daily practice and terminal exams.</p>
                </div>
              </div>

              <div className="mt-6 flex items-baseline">
                <span className="text-5xl font-extrabold tracking-tight text-text-main">Custom</span>
                <span className="ml-1 text-sm font-bold text-text-muted uppercase">/ yearly</span>
              </div>

              <div className="mt-4 flex items-center gap-1.5 bg-surface-hover p-3 text-xs font-bold text-text-muted border border-border">
                <Info className="h-4 w-4 text-primary shrink-0" />
                <span>Custom installation for your computer labs.</span>
              </div>

              <ul className="mt-8 space-y-4">
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-primary shrink-0" />
                  <span className="text-sm font-medium text-text-main">Unlimited tests & student accounts</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-primary shrink-0" />
                  <span className="text-sm font-medium text-text-main">Local server sync for patchy internet</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-primary shrink-0" />
                  <span className="text-sm font-medium text-text-main">Student Portal & Teacher Dashboard</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-primary shrink-0" />
                  <span className="text-sm font-medium text-text-main">On-boarding & 24/7 technical support</span>
                </li>
              </ul>
            </div>

            <div className="mt-8">
              <a
                href="https://wa.me/916026056362?text=Hi%2C%20I%20am%20interested%20in%20ParikshaOS%20for%20my%20school"
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full text-center bg-surface-hover hover:bg-bg border border-border py-4 text-sm font-bold text-text-main uppercase tracking-widest transition-colors duration-200"
              >
                Contact Sales
              </a>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
