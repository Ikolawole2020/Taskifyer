'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';

const SUPPORT_EMAIL = 'vtech.helpyou@gmail.com';

const FAQS = [
  {
    q: 'How do I book a service?',
    a: 'Find a service, pick a date, time and location, then confirm your booking. The provider will accept or decline your request.',
  },
  {
    q: 'How do I pay for a service?',
    a: 'After booking, pay securely through Paystack (card, transfer, or USSD). Your money is only released to the provider after the job is confirmed completed.',
  },
  {
    q: 'When does the provider get paid?',
    a: 'Once the provider marks the job complete and you confirm it. If you don\u2019t respond within 48 hours, it auto-confirms and the provider is paid.',
  },
  {
    q: 'How do I become a provider?',
    a: 'Register as a PROVIDER, add your services from the dashboard, and submit an ID document for verification from Profile → Get Verified.',
  },
  {
    q: 'How do I cancel a booking?',
    a: 'Open the booking in Bookings and click "Cancel Booking" — allowed while pending or accepted.',
  },
  {
    q: 'What if something goes wrong?',
    a: 'Click "Report an Issue" on the booking to open a dispute. Our team reviews and contacts both parties.',
  },
  {
    q: 'Is my payment information safe?',
    a: 'Yes — payments run through Paystack (PCI-DSS compliant). We never store your card details.',
  },
];

export default function HelpPage() {
  const [open, setOpen] = useState(null);

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 font-sans">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-28 pb-20">
        <h1 className="text-3xl font-extrabold text-white mb-2">Help Center</h1>
        <p className="text-sm text-slate-400 mb-8">
          Answers to common questions about using BookNfix.
        </p>

        <div className="mb-10 p-5 rounded-2xl bg-slate-900/70 border border-white/10 flex items-center justify-between gap-4">
          <div>
            <p className="font-bold text-white text-sm">Contact Support</p>
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="text-blue-400 hover:text-blue-300 text-sm"
            >
              {SUPPORT_EMAIL}
            </a>
          </div>
          <span className="text-2xl">📮</span>
        </div>

        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
          Frequently Asked Questions
        </h2>
        <div className="space-y-3">
          {FAQS.map((faq, i) => (
            <div key={i} className="bg-slate-900/60 border border-white/10 rounded-xl overflow-hidden">
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left"
              >
                <span className={`text-sm font-semibold ${open === i ? 'text-blue-300' : 'text-white'}`}>
                  {faq.q}
                </span>
                <span className="text-slate-500">{open === i ? '−' : '+'}</span>
              </button>
              {open === i && (
                <p className="px-5 pb-4 text-sm text-slate-400 leading-relaxed">{faq.a}</p>
              )}
            </div>
          ))}
        </div>

        <p className="mt-8 text-xs text-slate-500 text-center">
          Still stuck? Email us at {SUPPORT_EMAIL} — we usually reply within 24 hours.
        </p>
      </main>
    </div>
  );
}
