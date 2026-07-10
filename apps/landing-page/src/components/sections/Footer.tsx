'use client';

import React from 'react';
import { Shield } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-900 bg-slate-950/40 py-12 md:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Logo & Description */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded bg-gradient-to-br from-cyan-400 to-indigo-600 p-[1px]">
                <div className="flex h-full w-full items-center justify-center rounded bg-slate-950">
                  <Shield className="h-4 w-4 text-cyan-400" />
                </div>
              </div>
              <span className="text-lg font-bold tracking-tight text-white">
                Pariksha<span className="bg-gradient-to-r from-cyan-400 to-indigo-500 bg-clip-text text-transparent">OS</span>
              </span>
            </div>
            <p className="text-sm text-slate-400 max-w-xs leading-relaxed">
              Highly secure, offline-tolerant, and state-of-the-art examination architecture for coaching institutes, universities, and boards.
            </p>
            <div className="flex items-center gap-4 pt-2">
              {/* Twitter SVG */}
              <a href="#" className="text-slate-400 hover:text-white transition-colors" aria-label="Twitter">
                <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              {/* GitHub SVG */}
              <a href="#" className="text-slate-400 hover:text-white transition-colors" aria-label="GitHub">
                <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.138 20.162 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
                </svg>
              </a>
              {/* LinkedIn SVG */}
              <a href="#" className="text-slate-400 hover:text-white transition-colors" aria-label="LinkedIn">
                <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Portals Links */}
          <div>
            <h4 className="text-sm font-bold text-white tracking-wider uppercase">Portals</h4>
            <ul className="mt-4 space-y-2">
              <li>
                <a
                  href="https://school.parikshaos.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-slate-400 hover:text-cyan-400 transition-colors"
                >
                  Institute Portal
                </a>
              </li>
              <li>
                <a
                  href="https://admin.parikshaos.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-slate-400 hover:text-cyan-400 transition-colors"
                >
                  System Admin
                </a>
              </li>
            </ul>
          </div>

          {/* Legal / Contact */}
          <div>
            <h4 className="text-sm font-bold text-white tracking-wider uppercase">Contact</h4>
            <p className="mt-4 text-sm text-slate-400">
              Need on-premise setups or enterprise integrations?
            </p>
            <a
              href="mailto:support@parikshaos.com"
              className="mt-2 inline-block text-sm text-cyan-400 hover:underline"
            >
              support@parikshaos.com
            </a>
          </div>

        </div>

        <div className="mt-12 pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-500">
            &copy; {currentYear} ParikshaOS. All rights reserved. Formerly Growtez ExamOS.
          </p>
          <div className="flex gap-6 text-xs text-slate-500">
            <a href="#" className="hover:text-slate-400 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-slate-400 transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
