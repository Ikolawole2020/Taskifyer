'use client';

import { useRef, useState } from 'react';
import API from '@/lib/api';
import Navbar from '@/components/Navbar';
import { getApiErrorMessage } from '@/lib/errors';

const DOC_TYPES = ['NIN', "Driver's License", 'Passport', 'Voter Card', 'Other'];

export default function VerifyProviderPage() {
  const fileRef = useRef(null);
  const [docType, setDocType] = useState('');
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState({ show: false, text: '', ok: true });

  const submit = async () => {
    if (!docType) return setMsg({ show: true, text: 'Select your ID document type.', ok: false });
    if (!file) return setMsg({ show: true, text: 'Attach your ID document.', ok: false });

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('id_document', file);
      formData.append('id_document_type', docType);
      await API.post('/verify-request/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setMsg({
        show: true,
        text: 'Submitted! Your document is under review — we\u2019ll notify you once approved.',
        ok: true,
      });
      setFile(null);
      if (fileRef.current) fileRef.current.value = '';
    } catch (error) {
      setMsg({ show: true, text: getApiErrorMessage(error, 'Failed to submit verification.'), ok: false });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#071033] text-slate-100 font-sans">
      <Navbar />
      <main className="max-w-xl mx-auto px-4 sm:px-6 pt-28 pb-20">
        <h1 className="text-3xl font-extrabold text-white mb-2">Get Verified</h1>
        <p className="text-sm text-slate-400 mb-8">
          Verified providers get a trust badge, rank higher in search, and win more jobs.
        </p>

        {msg.show && (
          <div
            className={`mb-6 px-4 py-3 rounded-xl border text-sm font-medium ${
              msg.ok
                ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-200'
                : 'bg-rose-950/80 border-rose-500/40 text-rose-200'
            }`}
          >
            {msg.text}
          </div>
        )}

        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
          ID Document Type
        </label>
        <div className="flex flex-wrap gap-2 mb-6">
          {DOC_TYPES.map((t) => (
            <button
              key={t}
              onClick={() => setDocType(t)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
                docType === t
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-slate-900 text-slate-400 border border-white/10 hover:border-white/25'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
          ID Document (Image or PDF)
        </label>
        <input
          ref={fileRef}
          type="file"
          accept="image/*,.pdf"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="w-full bg-slate-900 border border-dashed border-white/20 rounded-xl px-4 py-3 text-sm text-slate-300 mb-6 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-blue-600 file:text-white file:text-xs file:font-semibold"
        />

        <button
          onClick={submit}
          disabled={submitting}
          className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white py-3.5 rounded-xl text-sm font-bold transition"
        >
          {submitting ? 'Submitting…' : 'Submit for Review'}
        </button>

        <p className="mt-4 text-[11px] text-slate-500 text-center">
          Reviewed manually by our team. Never shown publicly.
        </p>
      </main>
    </div>
  );
}
