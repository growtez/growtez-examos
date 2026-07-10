'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { MonitorX, Database, LayoutGrid, Users } from 'lucide-react';

interface BentoItemProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  className?: string;
  badge?: string;
}

function BentoItem({ title, description, icon, className = '', badge }: BentoItemProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.5 }}
      className={`group relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/30 p-6 sm:p-8 backdrop-blur-sm transition-all duration-300 hover:border-slate-700 hover:bg-slate-900/50 ${className}`}
    >
      {/* Glow Effect on Hover */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-cyan-500/10 to-indigo-500/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      
      <div className="flex h-full flex-col justify-between">
        <div>
          {/* Header row with Icon and Badge */}
          <div className="flex items-center justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-950 border border-slate-800 text-cyan-400 group-hover:text-indigo-400 transition-colors duration-300">
              {icon}
            </div>
            {badge && (
              <span className="rounded-full bg-cyan-500/10 px-2.5 py-0.5 text-xs font-semibold text-cyan-400">
                {badge}
              </span>
            )}
          </div>

          <h3 className="mt-6 text-xl font-bold text-white group-hover:text-cyan-400 transition-colors duration-200">
            {title}
          </h3>
          <p className="mt-3 text-sm text-slate-400 leading-relaxed">
            {description}
          </p>
        </div>

        {/* Decorative Grid Pattern for visual premium look */}
        <div className="mt-8 opacity-20 group-hover:opacity-30 transition-opacity">
          <div className="grid grid-cols-6 gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-1 rounded bg-slate-800" />
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function BentoGrid() {
  const features = [
    {
      title: 'Ironclad Kiosk Mode',
      description: 'Total browser-lock environment. Restricts Alt+Tab, Windows Key, copy-paste, print-screen, and automatically flags AnyDesk, TeamViewer, or unauthorized virtual displays.',
      icon: <MonitorX className="h-6 w-6" />,
      badge: 'Anti-Cheat',
      className: 'md:col-span-2',
    },
    {
      title: 'Zero-Data-Loss Offline Tolerance',
      description: 'Power cuts and internet outages are no longer an issue. Our local dual-save engine continuously updates SQLite database locally and auto-syncs with the cloud whenever connection resumes.',
      icon: <Database className="h-6 w-6" />,
      badge: 'Fault Tolerant',
      className: 'md:col-span-1',
    },
    {
      title: 'JEE-Simulated Interface',
      description: 'Prepare students for the real deal. Native NTA JEE Mains/Advanced layout including section-switching, question palettes, status flags, and calculator panel.',
      icon: <LayoutGrid className="h-6 w-6" />,
      badge: 'Exam Simulation',
      className: 'md:col-span-1',
    },
    {
      title: 'Multi-Tenant RLS Security',
      description: 'Complete data isolation powered by PostgreSQL Row-Level Security. Every institute’s questions, student records, and report generation processes are strictly isolated and encrypted.',
      icon: <Users className="h-6 w-6" />,
      badge: 'Military Grade',
      className: 'md:col-span-2',
    },
  ];

  return (
    <section id="features" className="py-20 md:py-28 relative">
      <div className="absolute top-1/2 left-10 -z-10 h-[300px] w-[300px] rounded-full bg-cyan-500/5 blur-[100px]" />
      <div className="absolute bottom-10 right-10 -z-10 h-[350px] w-[350px] rounded-full bg-indigo-500/5 blur-[120px]" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Engineered for High-Stakes Assessments
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-slate-400">
            ParikshaOS provides the ultimate environment for secure, robust, and familiar online tests.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-3">
          {features.map((feature, index) => (
            <BentoItem
              key={index}
              title={feature.title}
              description={feature.description}
              icon={feature.icon}
              badge={feature.badge}
              className={feature.className}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
