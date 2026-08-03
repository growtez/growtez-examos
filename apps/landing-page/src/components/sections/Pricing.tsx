'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Check, Info } from 'lucide-react';

const plans = [
  { id: 1, name: "1 Exam Pack", price: 299, credits: 1 },
  { id: 2, name: "3 Exams Pack", price: 799, credits: 3 },
  { id: 3, name: "6 Exams Pack", price: 1499, credits: 6, popular: true },
  { id: 4, name: "9 Exams Pack", price: 2099, credits: 9 },
  { id: 5, name: "12 Exams Pack", price: 2699, credits: 12 },
];

export default function Pricing() {
  return (
    <section id="pricing" className="py-20 md:py-28 relative bg-bg">
      <div className="absolute top-10 left-1/2 -z-10 h-[400px] w-[500px] -translate-x-1/2 bg-primary/5 blur-[120px]" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-text-main sm:text-4xl">
            Transparent Exam Packs
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-text-muted font-medium">
            No hidden subscription fees. Top up your account with exam packs and only pay for what you use.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6 items-stretch max-w-6xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className={`relative flex flex-col justify-between bg-surface p-6 transition-all duration-300 hover:-translate-y-1 ${
                plan.popular
                  ? 'border-2 border-primary shadow-xl shadow-primary/10'
                  : 'border border-border shadow-md'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary px-3 py-1 text-[10px] font-bold tracking-widest text-white uppercase shadow-sm whitespace-nowrap z-10">
                  Most Popular
                </div>
              )}

              <div className="mb-6 text-center">
                <h3 className="text-lg font-bold text-text-main mb-2">{plan.name}</h3>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-3xl font-extrabold tracking-tight text-text-main">₹{plan.price}</span>
                  <span className="text-xs font-bold text-text-muted uppercase">/pack</span>
                </div>
              </div>

              <div className="flex-1 flex flex-col space-y-0">
                <div className="flex items-center gap-3 border-b border-border/50 py-3">
                  <Check className="h-4 w-4 text-emerald-500 shrink-0" strokeWidth={3} />
                  <span className="text-[13px] font-medium text-text-muted">
                    {plan.credits} Exam{plan.credits > 1 ? 's' : ''} Publish
                  </span>
                </div>
                <div className="flex items-center gap-3 border-b border-border/50 py-3">
                  <Check className="h-4 w-4 text-emerald-500 shrink-0" strokeWidth={3} />
                  <span className="text-[13px] font-medium text-text-muted">
                    ₹{Math.round(plan.price / plan.credits)} / exam
                  </span>
                </div>
                <div className="flex items-center gap-3 border-b border-border/50 py-3">
                  <Check className="h-4 w-4 text-emerald-500 shrink-0" strokeWidth={3} />
                  <span className="text-[13px] font-medium text-text-muted">Never expires</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
