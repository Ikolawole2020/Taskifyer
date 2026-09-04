'use client';

import { useEffect, useState } from 'react';

/**
 * Modern cinematic BookNfix boot splash.
 *  - real logo (public/logo.png) inside a rotating conic progress ring
 *  - animated percentage counter + progress bar
 *  - synthwave grid floor + drifting geometric particles
 *  - gradient shimmer wordmark + letterbox bars
 * Fast total (~1.5s) so the wait never feels long.
 */
export default function BootLoader() {
  const [pct, setPct] = useState(0);

  // Animate 0 -> 100 over ~1.2s at 60fps (easeOutCubic).
  useEffect(() => {
    const dur = 1200;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setPct(Math.round(eased * 100));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="bootwrap">
      <style>{`
        .bootwrap {
          position: fixed; inset: 0; overflow: hidden;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          gap: 22px;
          background: radial-gradient(60% 45% at 50% 30%, #0e1b3e 0%, #071033 60%, #050a1f 100%);
          color: #fff; z-index: 9999;
        }

        /* ---- synthwave grid floor ---- */
        .boot-grid {
          position: absolute; left: -50%; right: -50%; bottom: -6%; height: 55%;
          background-image:
            linear-gradient(rgba(249,115,22,0.9) 1px, transparent 1px),
            linear-gradient(90deg, rgba(56,189,248,0.9) 1px, transparent 1px);
          background-size: 44px 34px;
          transform: perspective(340px) rotateX(62deg);
          transform-origin: 50% 100%;
          animation: gridMove 1.2s linear infinite;
          -webkit-mask-image: linear-gradient(to top, rgba(0,0,0,1) 30%, transparent 95%);
                  mask-image: linear-gradient(to top, rgba(0,0,0,1) 30%, transparent 95%);
          opacity: 0.55;
        }
        @keyframes gridMove { from { background-position: 0 0; } to { background-position: 0 34px; } }

        /* ---- floating gradient blobs ---- */
        .boot-blob { position: absolute; border-radius: 50%; filter: blur(60px); opacity: 0.55; }
        .boot-blob-a { width: 320px; height: 320px; left: -80px; top: -60px;
          background: radial-gradient(circle, rgba(249,115,22,0.6), transparent 70%);
          animation: blobFloat 6s ease-in-out infinite alternate; }
        .boot-blob-b { width: 340px; height: 340px; right: -90px; top: 20%;
          background: radial-gradient(circle, rgba(56,189,248,0.5), transparent 70%);
          animation: blobFloat 7s ease-in-out infinite alternate-reverse; }
        @keyframes blobFloat { from { transform: translate(0,0) scale(1); } to { transform: translate(30px,40px) scale(1.15); } }

        /* ---- letterbox bars ---- */
        .boot-lbox-t, .boot-lbox-b { position: absolute; left: 0; right: 0; height: 3px;
          background: linear-gradient(90deg, transparent, rgba(249,115,22,0.9), transparent);
          opacity: 0; animation: lbox 1.6s ease-out forwards; }
        .boot-lbox-t { top: 0; } .boot-lbox-b { bottom: 0; }
        @keyframes lbox { 0% { opacity: 0; } 25% { opacity: 1; } 100% { opacity: 1; } }

        /* ---- floating geometric particles ---- */
        .boot-part { position: absolute; opacity: 0; animation: partRise linear infinite; }
        @keyframes partRise {
          0% { transform: translateY(0) rotate(0deg); opacity: 0; }
          10% { opacity: 0.9; }
          100% { transform: translateY(-420px) rotate(220deg); opacity: 0; }
        }
      `}</style>

      <div className="boot-grid" />
      <div className="boot-blob boot-blob-a" />
      <div className="boot-blob boot-blob-b" />
      <div className="boot-lbox-t" />
      <div className="boot-lbox-b" />

      {/* geometric particles */}
      {Array.from({ length: 14 }, (_, i) => {
        const size = 5 + ((i * 7) % 8);
        return (
          <div
            key={i}
            className="boot-part"
            style={{
              width: size,
              height: size,
              left: (6 + ((i * 13) % 88)) + '%',
              bottom: (10 + ((i * 17) % 60)) + '%',
              background: i % 2 ? 'rgba(56,189,248,0.85)' : 'rgba(249,115,22,0.85)',
              boxShadow: '0 0 8px currentColor',
              animationDuration: (2.6 + (i % 5)) + 's',
              animationDelay: (i % 4) * 0.3 + 's',
            }}
          />
        );
      })}

      {/* logo inside rotating conic ring */}
      <style>{`
        .boot-ring {
          position: absolute; inset: 0; border-radius: 50%;
          background: conic-gradient(from 0deg, transparent 0deg, #F97316 90deg, #38bdf8 180deg, #F97316 270deg, transparent 360deg);
          animation: ringRotate 1.1s linear infinite;
          filter: drop-shadow(0 0 18px rgba(249,115,22,0.6));
        }
        .boot-ring-mask {
          position: absolute; inset: 5px; border-radius: 50%;
          background: radial-gradient(circle at 50% 42%, #0a1230 0%, #071033 70%);
          display: flex; align-items: center; justify-content: center;
        }
        .boot-logo {
          width: 90px; height: 90px; object-fit: contain; border-radius: 20px;
          animation: logoIn 0.7s cubic-bezier(.2,.9,.3,1.3) both;
          filter: drop-shadow(0 0 20px rgba(249,115,22,0.5));
        }
        .boot-dot { position: absolute; width: 10px; height: 10px; border-radius: 50%;
          background: #F97316; top: 50%; left: 50%; transform: translate(-50%,-50%);
          box-shadow: 0 0 14px #F97316; }
        .boot-logo-wrap { position: relative; width: 150px; height: 150px; }
        @keyframes ringRotate { to { transform: rotate(360deg); } }
        @keyframes logoIn { 0% { transform: scale(0) rotate(-20deg); opacity: 0; }
          60% { transform: scale(1.12) rotate(4deg); } 100% { transform: scale(1) rotate(0); } }
        .boot-name { font-size: 34px; font-weight: 900; letter-spacing: -0.5px;
          background: linear-gradient(90deg, #fff 0%, #fbbf24 30%, #F97316 50%, #38bdf8 70%, #fff 100%);
          background-size: 250% auto;
          -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;
          color: transparent; animation: shimmer 2.4s linear infinite, nameIn 0.6s ease-out both; }
        @keyframes shimmer { to { background-position: -250% center; } }
        @keyframes nameIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
        .boot-num { font-size: 22px; font-weight: 800; font-variant-numeric: tabular-nums; color: rgba(255,255,255,0.9); }
        .boot-bar { width: 220px; height: 6px; border-radius: 4px; background: rgba(255,255,255,0.10); overflow: hidden; position: relative; }
        .boot-fill { height: 100%; border-radius: 4px; background: linear-gradient(90deg, #F97316, #fbbf24, #38bdf8); width: 0%; transition: width 90ms linear; }
        .boot-tag { font-size: 11px; letter-spacing: 0.5px; color: rgba(255,255,255,0.5);
          animation: tagIn 1s ease-out both; animation-delay: 0.4s; }
        @keyframes tagIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
      `}</style>

      <div className="boot-logo-wrap">
        <div className="boot-ring" />
        <div className="boot-ring-mask">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="boot-logo" src="/logo.png" alt="BookNfix" />
        </div>
        <div className="boot-dot" />
      </div>

      <div className="boot-name">BookNfix</div>
      <div className="boot-num">{pct}%</div>
      <div className="boot-bar">
        <div className="boot-fill" style={{ width: pct + '%' }} />
      </div>
      <div className="boot-tag">Trusted Local Artisans · Secure Bookings</div>
    </div>
  );
}