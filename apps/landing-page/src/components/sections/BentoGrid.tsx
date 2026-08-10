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
  bgColor?: string;
}

function BentoItem({ title, description, icon, className = '', badge, bgColor = 'bg-white' }: BentoItemProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.5 }}
      className={`group relative overflow-hidden border-4 border-black p-6 sm:p-8 transition-transform duration-200 hover:-translate-y-2 shadow-brutal hover:shadow-brutal-lg ${bgColor} ${className}`}
    >
      
      <div className="flex h-full flex-col justify-between">
        <div>
          {/* Header row with Icon and Badge */}
          <div className="flex items-center justify-between">
            <div className="flex h-14 w-14 items-center justify-center bg-white border-4 border-black text-black group-hover:bg-primary group-hover:text-white transition-colors duration-300 shadow-brutal-sm">
              {icon}
            </div>
            {badge && (
              <span className="bg-white border-4 border-black px-3 py-1 text-xs font-black text-black uppercase tracking-widest shadow-brutal-sm">
                {badge}
              </span>
            )}
          </div>

          <h3 className="mt-8 text-2xl font-black text-black">
            {title}
          </h3>
          <p className="mt-4 text-base text-black font-medium leading-relaxed border-l-4 border-black pl-3">
            {description}
          </p>
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
      icon: <MonitorX className="h-7 w-7 stroke-[2.5]" />,
      badge: 'Anti-Cheat App',
      className: 'md:col-span-2',
      bgColor: 'bg-primary/10',
    },
    {
      title: 'Download Results & PDF Answersheets',
      description: 'Students and parents can see their results online instantly. Download detailed scorecards and complete PDF answersheets for comprehensive performance review.',
      icon: <BarChart3 className="h-7 w-7 stroke-[2.5]" />,
      badge: 'Instant Results',
      className: 'md:col-span-1',
      bgColor: 'bg-white',
    },
    {
      title: 'Authentic Examination Interface',
      description: 'Give students the exact JEE/NEET UI experience. Reduce exam anxiety by letting them practice on the same layout they will face on the final day.',
      icon: <LayoutGrid className="h-7 w-7 stroke-[2.5]" />,
      badge: 'Exam Simulation',
      className: 'md:col-span-1',
      bgColor: 'bg-white',
    },
    {
      title: 'Comprehensive School Admin Panel',
      description: 'Manage everything from a single dashboard. Create tests, organize batches, monitor real-time exam progress, and generate detailed report cards instantly for parents and teachers.',
      icon: <Users className="h-7 w-7 stroke-[2.5]" />,
      badge: 'Smart Management',
      className: 'md:col-span-2',
      bgColor: 'bg-primary/10',
    },
  ];

  return (
    <section id="features" className="py-20 md:py-28 relative bg-white border-b-4 border-black">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-4xl font-black tracking-tighter text-black sm:text-5xl lg:text-6xl uppercase">
            Built for Indian Schools and Coaching Institutes
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-black font-semibold text-lg border-2 border-black bg-white p-4 shadow-brutal-sm">
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
              bgColor={feature.bgColor}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
