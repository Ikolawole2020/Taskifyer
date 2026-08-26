'use client';

import { useEffect, useState } from 'react';
import API from '@/lib/api';
import Navbar from '@/components/Navbar';
import { getApiErrorMessage } from '@/lib/errors';

export default function PayoutSetupPage() {
  const [banks, setBanks] = useState([]);
  const [bank, setBank] = useState(null);
  const [accountNumber, setAccountNumber] = useState('');
  const [resolvedName, setResolvedName] = useState(null);
  const [resolving, setResolving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState({ show: false, text: '', ok: true });

  useEffect(() => {
    API.get('/payments/banks/')
      .then((res) => setBanks(res.data.banks || []))
      .catch(() => setMsg({ show: true, text: 'Could not load banks. Is the server up?', ok: false }));
  }, []);

  useEffect(() => {
    if (accountNumber.length !== 10 || !bank) {
      setResolvedName(null);
      return;
    }
    setResolving(true);
    const t = setTimeout(async () => {
      try {
        const res = await API.post('/payments/resolve-account/', {
          account_number: accountNumber,
          bank_code: bank.code,
        });
        setResolvedName(res.data.account_name);
      } catch {
        setResolvedName(null);
      } finally {
        setResolving(false);
      }
    }, 600);
    return () => clearTimeout(t);
  }, [accountNumber, bank]);

  const submit = async () => {
    if (!bank || !resolvedName) return;
    setSubmitting(true);
    try {
      await API.post('/payments/setup-payout/', {
        bank_name: bank.name,
        bank_code: bank.code,
        account_number: accountNumber,
      });
      setMsg({ show: true, text: 'Payout account linked successfully!', ok: true });
    } catch (error) {
      setMsg({ show: true, text: getApiErrorMessage(error, 'Failed to link account.'), ok: false });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#071033] text-slate-100 font-sans">
      <Navbar />
      <main className="max-w-xl mx-auto px-4 sm:px-6 pt-28 pb-20">
        <h1 className="text-3xl font-extrabold text-white mb-2">Payout Account</h1>
        <p className="text-sm text-slate-400 mb-8">
          Link your bank account to receive your earnings automatically after each completed job.
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
          Bank
        </label>
        <select
          value={bank?.code || ''}
          onChange={(e) => {
            const b = banks.find((x) => x.code === e.target.value);
            setBank(b || null);
            setResolvedName(null);
          }}
          className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-sm text-white mb-5 focus:outline-none focus:border-blue-500"
        >
          <option value="">{banks.length ? 'Select your bank' : 'Loading banks…'}</option>
          {banks.map((b) => (
            <option key={b.code} value={b.code}>
              {b.name}
            </option>
          ))}
        </select>

        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
          Account Number
        </label>
        <input
          value={accountNumber}
          onChange={(e) => setAccountNumber(e.target.value.replace(/[^0-9]/g, '').slice(0, 10))}
          placeholder="10-digit account number"
          inputMode="numeric"
          className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 mb-3 focus:outline-none focus:border-blue-500"
        />

        {accountNumber.length === 10 && (
          <div className="flex items-center gap-2 mb-5 text-sm font-medium">
            {resolving ? (
              <span className="text-slate-400">Verifying…</span>
            ) : resolvedName ? (
              <>
                <span className="text-emerald-400">✓</span>
                <span className="text-emerald-300">{resolvedName}</span>
              </>
            ) : (
              <>
                <span className="text-amber-400">⚠</span>
                <span className="text-amber-300">Could not verify this account number</span>
              </>
            )}
          </div>
        )}

        <button
          onClick={submit}
          disabled={!bank || !resolvedName || submitting}
          className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3.5 rounded-xl text-sm font-bold transition"
        >
          {submitting ? 'Linking…' : 'Link Account'}
        </button>

        <p className="mt-4 text-[11px] text-slate-500 text-center">
          Your account is verified with Paystack before linking. We only store the last 4 digits.
        </p>
      </main>
    </div>
  );
}
