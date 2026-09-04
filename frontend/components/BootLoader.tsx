'use client';

/**
 * Animated BookNfix loading splash — replaces the plain "Loading BookNfix..."
 * text. Self-contained (inline <style> + keyframes) so it works anywhere,
 * including as a Next.js <Suspense> fallback.
 */
export default function BootLoader() {
  return (
    <div className="bootwrap">
      <style>{`
        .bootwrap {
          position: fixed; inset: 0;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          gap: 24px;
          background: #071033;
          color: #fff;
          z-index: 9999;
        }
        .boot-logo {
          display: flex; align-items: center; justify-content: center;
          width: 84px; height: 84px;
          border-radius: 24px;
          background: linear-gradient(145deg, rgba(249,115,22,0.22), rgba(59,130,246,0.18));
          border: 1px solid rgba(249,115,22,0.35);
          font-size: 40px;
          animation: bootPulse 1.4s ease-in-out infinite;
          box-shadow: 0 0 40px rgba(249,115,22,0.25);
        }
        .boot-name b { color: #F97316; }
        .boot-name {
          font-size: 28px; font-weight: 900; letter-spacing: -0.5px;
          animation: bootFade 1.8s ease-in-out infinite;
        }
        .boot-ring {
          width: 34px; height: 34px;
          border: 3px solid rgba(255,255,255,0.12);
          border-top-color: #F97316;
          border-radius: 50%;
          animation: bootSpin 0.8s linear infinite;
        }
        @keyframes bootSpin { to { transform: rotate(360deg); } }
        @keyframes bootPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.08); }
        }
        @keyframes bootFade {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>

      <div className="boot-logo">🛠️</div>
      <div className="boot-name">
        Book<b>N</b>fix
      </div>
      <div className="boot-ring" />
    </div>
  );
}