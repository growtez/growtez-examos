'use client';

import React from 'react';
import Image from 'next/image';
import { Shield } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-surface py-12 md:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Logo & Description */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <Image src="/logo.png" alt="ParikshaOS Logo" width={32} height={32} className="h-8 w-8 object-contain" />
              <span className="text-lg font-extrabold tracking-tight text-text-main uppercase">
                Pariksha<span className="text-primary">OS</span>
              </span>
            </div>
            <p className="text-sm text-text-muted font-medium max-w-xs leading-relaxed">
              Highly secure, offline-tolerant examination platform tailored for Indian schools and coaching institutes to conduct flawless JEE/NEET mock tests and terminal exams.
            </p>
          </div>

          {/* Legal / Contact */}
          <div>
            <h4 className="text-sm font-extrabold text-text-main tracking-widest uppercase">Contact</h4>
            <p className="mt-4 text-sm font-medium text-text-muted">
              Need on-premise setups or enterprise integrations?
            </p>
            <a
              href="tel:6026056362"
              className="mt-2 inline-block text-sm font-bold text-primary hover:underline"
            >
              6026056362
            </a>
          </div>

        </div>

        <div className="mt-12 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs font-bold text-text-muted">
            &copy; {currentYear} ParikshaOS. All rights reserved. Developed by <a href="https://growtez.com" target="_blank" rel="noopener noreferrer" className="text-primary underline hover:text-primary/80 transition-colors">growtez</a>
          </p>
          <div className="flex gap-6 text-xs font-bold text-text-muted">
            <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
