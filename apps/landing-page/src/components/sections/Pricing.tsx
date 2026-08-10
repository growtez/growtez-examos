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
    <section id="pricing" className="py-20 md:py-28 relative bg-white border-b-4 border-black">
      {/* Background grid pattern */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:16px_16px] opacity-10" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-4xl font-black tracking-tighter text-black sm:text-5xl lg:text-6xl uppercase">
            Transparent Exam Packs
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-black font-semibold text-lg border-2 border-black bg-white p-4 shadow-brutal-sm">
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
              className={`relative flex flex-col justify-between p-6 transition-transform duration-200 border-4 border-black ${
                plan.popular
                  ? 'bg-primary/10 shadow-brutal-lg -translate-y-2'
                  : 'bg-white shadow-brutal hover:-translate-y-1 hover:shadow-brutal-lg'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-black border-2 border-black px-4 py-1 text-xs font-black tracking-widest text-white uppercase shadow-brutal-sm whitespace-nowrap z-10">
                  Most Popular
                </div>
              )}

              <div className="mb-6 text-center">
                <h3 className="text-xl font-black text-black mb-2 uppercase">{plan.name}</h3>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-black tracking-tighter text-black">₹{plan.price}</span>
                  <span className="text-sm font-bold text-black uppercase">/pack</span>
                </div>
              </div>

              <div className="flex-1 flex flex-col space-y-0">
                <div className="flex items-center gap-3 border-b-2 border-black py-3">
                  <Check className="h-5 w-5 text-black shrink-0 stroke-[3]" />
                  <span className="text-[14px] font-bold text-black">
                    {plan.credits} Exam{plan.credits > 1 ? 's' : ''} Publish
                  </span>
                </div>
                <div className="flex items-center gap-3 border-b-2 border-black py-3">
                  <Check className="h-5 w-5 text-black shrink-0 stroke-[3]" />
                  <span className="text-[14px] font-bold text-black">
                    ₹{Math.round(plan.price / plan.credits)} / exam
                  </span>
                </div>
                <div className="flex items-center gap-3 border-b-2 border-black py-3">
                  <Check className="h-5 w-5 text-black shrink-0 stroke-[3]" />
                  <span className="text-[14px] font-bold text-black">Never expires</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
