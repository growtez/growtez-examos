'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Menu, X, Shield, ChevronRight } from 'lucide-react';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { name: 'Features', href: '#features' },
    { name: 'Pricing', href: '#pricing' },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b-4 border-black bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="ParikshaOS Logo" width={36} height={36} className="h-9 w-9 object-contain" />
            <span className="text-2xl font-black tracking-tighter text-black uppercase">
              Pariksha<span className="text-primary">OS</span>
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-base font-bold text-black hover:bg-primary hover:text-white hover:-translate-y-1 transition-all duration-200 border-2 border-transparent hover:border-black px-3 py-1 uppercase tracking-wider"
              >
                {link.name}
              </a>
            ))}
            <a href="https://school.parikshaos.com" className="brutal-btn text-sm px-5 py-2">Get Started</a>
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              type="button"
              className="inline-flex items-center justify-center p-2 text-black hover:bg-primary hover:text-white border-2 border-transparent hover:border-black transition-colors focus:outline-none"
              aria-controls="mobile-menu"
              aria-expanded={isOpen}
            >
              <span className="sr-only">Open main menu</span>
              {isOpen ? <X className="h-6 w-6 stroke-[3]" /> : <Menu className="h-6 w-6 stroke-[3]" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden border-t-4 border-black bg-white px-4 pt-2 pb-4 space-y-2">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              onClick={() => setIsOpen(false)}
              className="block px-4 py-3 text-lg font-bold text-black hover:bg-primary hover:text-white border-2 border-transparent hover:border-black transition-all duration-200 uppercase tracking-wider"
            >
              {link.name}
            </a>
          ))}
          <a
            href="https://school.parikshaos.com"
            onClick={() => setIsOpen(false)}
            className="block text-center mt-4 brutal-btn"
          >
            Get Started
          </a>
        </div>
      )}
    </nav>
  );
}
