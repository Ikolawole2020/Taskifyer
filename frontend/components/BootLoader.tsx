'use client';

/**
 * Cinematic BookNfix boot splash — replaces the plain text loader.
 * Self-contained (inline <style> + keyframes). Multi-stage:
 *   1. animated aurora gradient + drift orbs
 *   2. logo tile springs in with a scale/rotate overshoot + shine sweep
 *   3. each letter of "BookNfix" pops in sequentially (stagger)
 *   4. shimmer progress bar fills
 *   5. floating particles + tagline fade in
 */
const LETTERS = ['B', 'o', 'o', 'k', 'N', 'f', 'i', 'x'];

export default function BootLoader() {
  return (
    <div className="bootwrap">
      <style>{`
        .bootwrap {
          position: fixed; inset: 0; overflow: hidden;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          gap: 26px; background: #071033; color: #fff; z-index: 9999;
        }
        /* layered aurora glow */
        .boot-aurora {
          position: absolute; left: -20%; right: -20%; top: -20%; bottom: -20%;
          background:
            radial-gradient(56% 38% at 30% 28%, rgba(249,115,22,0.20), transparent 70%),
            radial-gradient(48% 34% at 72% 34%, rgba(56,189,248,0.16), transparent 70%),
            radial-gradient(60% 46% at 50% 72%, rgba(59,130,246,0.14), transparent 70%);
          animation: bootAurora 9s ease-in-out infinite alternate;
        }
        @keyframes bootAurora {
          from { transform: translate(-6%, -3%) scale(1); }
          50%  { transform: translate(0, 2%) scale(1.08); }
          to   { transform: translate(6%, 3%) scale(1); }
        }
        /* drifting particles */
        ${Array.from({ length: 9 }, (_, i) => `
          .boot-p${i} {
            position: absolute; width: 6px; height: 6px; border-radius: 50%;
            background: rgba(249,115,22,0.7);
            left: ${8 + i * 11}%; top: ${78 - (i % 3) * 22}%;
            animation: bootFloat${i} ${5 + (i % 3)}s linear infinite;
            box-shadow: 0 0 10px rgba(249,115,22,0.6);
          }
          @keyframes bootFloat${i} {
            0%   { transform: translateY(0); opacity: 0; }
            12%  { opacity: 1; }
            100% { transform: translateY(-380px); opacity: 0; }
          }`).join('')}

        /* logo tile with spring-in + shine */
        .boot-logo {
          display: flex; align-items: center; justify-content: center;
          width: 96px; height: 96px; border-radius: 26px;
          background: linear-gradient(145deg, rgba(249,115,22,0.28), rgba(59,130,246,0.20));
          border: 1px solid rgba(249,115,22,0.45);
          font-size: 46px;
          box-shadow: 0 0 46px rgba(249,115,22,0.30), inset 0 0 18px rgba(249,115,22,0.15);
          animation: bootLogo 1.05s cubic-bezier(.2,.9,.3,1.2) both;
          animation-iteration-count: 1;
          position: relative; overflow: hidden;
        }
        .boot-logo::after {
          content: ''; position: absolute; inset: 0;
          background: linear-gradient(115deg, transparent 28%, rgba(255,255,255,0.55) 50%, transparent 72%);
          animation: bootShine 2s ease-in-out infinite;
        }
        @keyframes bootLogo {
          0%   { transform: scale(0) rotate(-18deg); }
          60%  { transform: scale(1.18) rotate(6deg); }
          80%  { transform: scale(0.94) rotate(-2deg); }
          100% { transform: scale(1) rotate(0deg); }
        }
        @keyframes bootShine {
          0% { transform: translateX(-160px); }
          100% { transform: translateX(160px); }
        }

        /* sequential letter reveal */
        ${LETTERS.map((_, i) => `
          .boot-lt${i} {
            display: inline-block; transform-origin: 50% 60%;
            animation: bootLet ${0.5 + i * 0.13}s both;
          }`).join('')}
        @keyframes bootLet {
          0%   { transform: scale(0) translateY(14px); opacity: 0; }
          60%  { transform: scale(1.35) translateY(-4px); opacity: 1; }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }
        .boot-name {
          font-size: 30px; font-weight: 900; letter-spacing: -0.5px;
        }
        .boot-name .n { color: #F97316; }

        /* shimmer progress bar */
        .boot-bar {
          width: 180px; height: 5px; border-radius: 3px;
          background: rgba(255,255,255,0.10); overflow: hidden;
        }
        .boot-bar-fill {
          height: 100%; border-radius: 3px;
          background: linear-gradient(90deg, #F97316, #fbbf24, #F97316);
          background-size: 200% 100%;
          width: 0;
          animation: bootFill 2.2s cubic-bezier(.4,0,.7,1) forwards;
        }
        @keyframes bootFill {
          0%   { width: 0; }
          60%  { width: 86%; }
          100% { width: 100%; }
        }
        .boot-bar-fill::after {
          content: ''; position: absolute; inset: 0;
          background: rgba(255,255,255,0.45);
          animation: bootBarShine 0.9s ease-in-out infinite;
        }
        .boot-bar{ position: relative; }
        @keyframes bootBarShine {
          from { left: -40%; } to { left: 100%; }
        }

        /* tagline */
        .boot-tag {
          font-size: 11px; letter-spacing: 0.4px; color: rgba(255,255,255,0.55);
          animation: bootFadeUp 1.4s ease-out both;
          animation-delay: 1.1s;
        }
        @keyframes bootFadeUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="boot-aurora" />
      {Array.from({ length: 9 }, (_, i) => (
        <div key={i} className={'boot-p' + i} />
      ))}

      <div className="boot-logo">🛠️</div>
      <div className="boot-name">
        {LETTERS.map((l, i) => (
          <span key={i} className={'boot-lt' + i + (l === 'N' ? ' n' : '')}>{l}</span>
        ))}
      </div>
      <div className="boot-bar"><div className="boot-bar-fill" /></div>
      <div className="boot-tag">Trusted Local Artisans · Secure Bookings</div>
    </div>
  );
}