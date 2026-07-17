'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { MonitorX, BarChart3, LayoutGrid, Users } from 'lucide-react';

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
      className={`group relative overflow-hidden border border-border bg-surface p-6 sm:p-8 transition-all duration-300 hover:border-primary hover:shadow-lg ${className}`}
    >
      {/* Glow Effect on Hover */}
      <div className="absolute inset-0 -z-10 bg-primary/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      
      <div className="flex h-full flex-col justify-between">
        <div>
          {/* Header row with Icon and Badge */}
          <div className="flex items-center justify-between">
            <div className="flex h-12 w-12 items-center justify-center bg-bg border border-border text-primary group-hover:bg-primary group-hover:text-white transition-colors duration-300">
              {icon}
            </div>
            {badge && (
              <span className="bg-primary/5 border border-primary/20 px-3 py-1 text-xs font-bold text-primary uppercase tracking-wider">
                {badge}
              </span>
            )}
          </div>

          <h3 className="mt-8 text-xl font-extrabold text-text-main group-hover:text-primary transition-colors duration-200">
            {title}
          </h3>
          <p className="mt-3 text-sm text-text-muted font-medium leading-relaxed">
            {description}
          </p>
        </div>

        {/* Decorative Grid Pattern for visual premium look */}
        <div className="mt-8 opacity-40 group-hover:opacity-100 transition-opacity">
          <div className="grid grid-cols-6 gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-1 bg-border group-hover:bg-primary/20 transition-colors duration-300" />
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
      title: 'Secure Desktop App for Labs',
      description: 'Lock down your computer labs with our dedicated desktop app. Prevents Alt+Tab, disables copy-paste, and creates a strict, distraction-free examination environment for authentic testing.',
      icon: <MonitorX className="h-6 w-6" />,
      badge: 'Anti-Cheat App',
      className: 'md:col-span-2',
    },
    {
      title: 'Download Results & PDF Answersheets',
      description: 'Students and parents can see their results online instantly. Download detailed scorecards and complete PDF answersheets for comprehensive performance review.',
      icon: <BarChart3 className="h-6 w-6" />,
      badge: 'Instant Results',
      className: 'md:col-span-1',
    },
    {
      title: 'Authentic Examination Interface',
      description: 'Give students the exact JEE/NEET UI experience. Reduce exam anxiety by letting them practice on the same layout they will face on the final day.',
      icon: <LayoutGrid className="h-6 w-6" />,
      badge: 'Exam Simulation',
      className: 'md:col-span-1',
    },
    {
      title: 'Comprehensive School Admin Panel',
      description: 'Manage everything from a single dashboard. Create tests, organize batches, monitor real-time exam progress, and generate detailed report cards instantly for parents and teachers.',
      icon: <Users className="h-6 w-6" />,
      badge: 'Smart Management',
      className: 'md:col-span-2',
    },
  ];

  return (
    <section id="features" className="py-20 md:py-28 relative bg-surface border-y border-border">
      <div className="absolute top-1/2 left-10 -z-10 h-[300px] w-[300px] bg-primary/5 blur-[100px]" />
      <div className="absolute bottom-10 right-10 -z-10 h-[350px] w-[350px] bg-primary/5 blur-[120px]" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-text-main sm:text-4xl">
            Built for Indian Schools and Coaching Institutes
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-text-muted font-medium">
            ParikshaOS provides the ultimate environment to conduct secure, robust, and familiar online tests right in your school labs.
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
