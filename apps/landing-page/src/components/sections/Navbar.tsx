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
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-surface shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="ParikshaOS Logo" width={36} height={36} className="h-9 w-9 object-contain" />
            <span className="text-xl font-extrabold tracking-tight text-text-main uppercase">
              Pariksha<span className="text-primary">OS</span>
            </span>
          </div>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-sm font-bold text-text-muted hover:text-primary transition-colors duration-200 uppercase tracking-wider"
              >
                {link.name}
              </a>
            ))}
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              type="button"
              className="inline-flex items-center justify-center p-2 text-text-muted hover:bg-surface-hover hover:text-text-main focus:outline-none"
              aria-controls="mobile-menu"
              aria-expanded={isOpen}
            >
              <span className="sr-only">Open main menu</span>
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden border-b border-border bg-surface px-4 pt-2 pb-4 space-y-1 shadow-md">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              onClick={() => setIsOpen(false)}
              className="block px-3 py-2 text-base font-bold text-text-muted hover:bg-surface-hover hover:text-primary transition-colors duration-200 uppercase tracking-wider"
            >
              {link.name}
            </a>
          ))}
        </div>
      )}
    </nav>
  );
}
