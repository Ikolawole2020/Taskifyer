'use client';

import Navbar from '@/components/Navbar';

const SUPPORT_EMAIL = 'vtech.helpyou@gmail.com';

const SECTIONS = [
  {
    title: '1. About BookNfix',
    body: [
      'BookNfix is a digital marketplace connecting customers with local service providers. We provide the platform for discovery, booking, communication, and payment — services are performed by independent providers.',
      'BookNfix is not the employer of any provider. Providers are independent contractors responsible for the quality and safety of their work.',
    ],
  },
  {
    title: '2. Accounts & Eligibility',
    body: [
      'You must be 18+ to create an account, provide accurate information, and keep it current.',
      'Providers may be required to submit identity documents for verification. Accounts that fail verification or violate these terms may be suspended or removed.',
    ],
  },
  {
    title: '3. Payments & Platform Fee',
    body: [
      '**Platform fee:** BookNfix charges **10% of the total value of each successfully rendered service**. The remaining 90% is paid out to the provider.',
      'Payment is processed via Paystack at booking time; a booking is confirmed once paid. Funds are held until the job is confirmed completed (Section 5). The 10% fee is retained per completed transaction.',
    ],
  },
  {
    title: '4. Booking & Cancellation',
    body: [
      'Customers may cancel while a booking is pending or accepted. Refunds for paid cancellations are reviewed case by case; cancellations after work commenced may not be fully refundable.',
      'Providers who repeatedly accept then decline, or no-show, may be suspended.',
    ],
  },
  {
    title: '5. Job Completion & Automatic Confirmation',
    body: [
      'When the provider marks a job complete, the customer must confirm in-app.',
      '**If the customer does not confirm or dispute within 48 hours**, the booking is automatically marked complete and payment is released to the provider. Disputes must be opened before that window expires.',
    ],
  },
  {
    title: '6. Disputes & Refunds',
    body: [
      'Either party may open a dispute. Our team reviews and contacts both parties. Outcomes may include partial/full refunds to the customer or release of funds to the provider.',
      'Contact: ' + SUPPORT_EMAIL + ' — we usually respond within 24 hours.',
    ],
  },
  {
    title: '7. Provider Obligations',
    body: [
      'Perform services safely, professionally and lawfully; honour accepted bookings; keep profile/pricing accurate; never take payments off-platform. Misrepresentation may result in permanent removal.',
    ],
  },
  {
    title: '8. Prohibited Conduct',
    body: [
      'No circumventing platform payments, harassment, false content, unlawful use, or interference with the service. Violations may result in immediate termination without refund.',
    ],
  },
  {
    title: '9. Limitation of Liability',
    body: [
      'The platform is provided "as is". BookNfix does not guarantee provider work quality; disputes go through Section 6. Total liability per booking is capped at the platform fee charged on that booking.',
    ],
  },
  {
    title: '10. Changes & Contact',
    body: ['We may update these terms; continued use constitutes acceptance. Questions: ' + SUPPORT_EMAIL],
  },
];

export default function TermsPage() {
  const renderBody = (text) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) =>
      part.startsWith('**') && part.endsWith('**') ? (
        <strong key={i} className="text-white font-bold">
          {part.slice(2, -2)}
        </strong>
      ) : (
        <span key={i}>{part}</span>
      )
    );
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 font-sans">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-28 pb-20">
        <h1 className="text-3xl font-extrabold text-white mb-2">Terms & Conditions</h1>
        <p className="text-xs text-slate-500 mb-8">Last updated: August 2026</p>
        <p className="text-sm text-slate-400 leading-relaxed mb-8">
          These Terms govern your use of the BookNfix application. By creating an account
          or using the platform, you agree to be bound by them.
        </p>

        <div className="space-y-5">
          {SECTIONS.map((s, i) => (
            <div key={i} className="bg-slate-900/60 border border-white/10 rounded-xl p-5">
              <h2 className="font-bold text-white text-sm mb-3">{s.title}</h2>
              {s.body.map((para, j) => (
                <p key={j} className="text-[13px] text-slate-400 leading-relaxed mb-2">
                  {renderBody(para)}
                </p>
              ))}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
