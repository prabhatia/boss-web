'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';

/**
 * Renders the boss logo to a canvas and offers a PNG download.
 * Canvas drawing ported directly from export-logo.html.
 *
 * Used for producing the app icon required by the LinkedIn,
 * Google, and Apple developer console forms.
 */
export function LogoExporter() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;

    const W = 520;
    const H = 400;

    const shadow = (col: string, blur: number, ox = 0, oy = 0) => {
      ctx.shadowColor = col; ctx.shadowBlur = blur;
      ctx.shadowOffsetX = ox; ctx.shadowOffsetY = oy;
    };
    const noShadow = () => {
      ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0;
    };

    const AL = '#DBEAFE', AM = '#93C5FD', AA = '#3B82F6', AD = '#2563EB';

    // Background
    const bgG = ctx.createRadialGradient(185, 150, 30, 200, 200, 295);
    bgG.addColorStop(0, '#1c2433');
    bgG.addColorStop(0.55, '#111827');
    bgG.addColorStop(1, '#05080e');
    ctx.fillStyle = bgG;
    ctx.beginPath(); ctx.roundRect(0, 0, W, H, 64); ctx.fill();

    const rimG = ctx.createLinearGradient(0, 0, W * 0.55, H * 0.38);
    rimG.addColorStop(0, 'rgba(255,251,235,0.07)');
    rimG.addColorStop(1, 'rgba(255,251,235,0)');
    ctx.fillStyle = rimG;
    ctx.beginPath(); ctx.roundRect(0, 0, W, H, 64); ctx.fill();

    ctx.save();
    ctx.beginPath(); ctx.roundRect(0, 0, W, H, 64); ctx.clip();

    // Figure gradient
    const figG = ctx.createLinearGradient(0, 4, 0, 328);
    figG.addColorStop(0, '#DBEAFE');
    figG.addColorStop(0.12, '#93C5FD');
    figG.addColorStop(0.48, '#3B82F6');
    figG.addColorStop(1, '#1E3A8A');

    // Silhouette: head D over belly D, straight left border at x=20
    shadow('rgba(0,0,0,0.5)', 22, 6, 10);
    ctx.fillStyle = figG;
    ctx.beginPath();
    ctx.moveTo(20, 20);
    ctx.bezierCurveTo(18, 4, 126, 4, 138, 66);       // head upper arc
    ctx.bezierCurveTo(136, 116, 90, 126, 80, 128);   // head lower arc
    ctx.bezierCurveTo(74, 130, 72, 136, 74, 142);    // neck
    ctx.bezierCurveTo(76, 146, 98, 150, 120, 154);   // belly rise
    ctx.bezierCurveTo(168, 162, 232, 188, 238, 240); // belly front
    ctx.bezierCurveTo(244, 280, 226, 316, 200, 324); // belly bottom
    ctx.bezierCurveTo(178, 330, 142, 332, 102, 330);
    ctx.bezierCurveTo(66, 328, 30, 316, 20, 306);
    ctx.lineTo(20, 20);                               // straight left border
    ctx.closePath();
    noShadow();
    ctx.fill();

    // Glasses
    const gX = 120, gY = 50, gR = 12;
    ctx.fillStyle = '#0b1520';
    ctx.beginPath(); ctx.ellipse(gX, gY, gR, gR, 0, 0, Math.PI * 2); ctx.fill();

    ctx.strokeStyle = '#1e3a8a'; ctx.lineWidth = 3.5;
    ctx.beginPath(); ctx.ellipse(gX, gY, gR, gR, 0, 0, Math.PI * 2); ctx.stroke();

    ctx.strokeStyle = 'rgba(255,251,235,0.26)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(gX + 2, gY - 4, 8, Math.PI * 1.1, Math.PI * 1.58); ctx.stroke();

    ctx.strokeStyle = '#1e3a8a'; ctx.lineWidth = 3; ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(gX - gR, gY + 1);
    ctx.quadraticCurveTo(62, gY + 2, 26, 64);
    ctx.stroke();

    ctx.restore();

    // "oss" wordmark
    ctx.font = 'bold 120px "Arial Black", Arial, sans-serif';
    ctx.textAlign = 'center';

    const tG = ctx.createLinearGradient(0, 199, 0, 285);
    tG.addColorStop(0, AL);
    tG.addColorStop(0.35, AM);
    tG.addColorStop(0.7, AA);
    tG.addColorStop(1, AD);

    shadow('rgba(37,99,235,0.4)', 14, 0, 3);
    ctx.fillStyle = tG;
    ctx.fillText('oss', 382, 285);
    noShadow();
  }, []);

  function download() {
    const cv = canvasRef.current;
    if (!cv) return;
    const a = document.createElement('a');
    a.download = 'boss-logo.png';
    a.href = cv.toDataURL('image/png');
    a.click();
  }

  return (
    <main
      style={{
        minHeight: '100vh', background: '#1e293b',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: '2rem 1.25rem', gap: '1.5rem',
      }}
    >
      <h1 style={{ color: 'white', fontSize: '1.15rem', fontWeight: 700, textAlign: 'center' }}>
        boss logo — figure + &ldquo;oss&rdquo; · 520 × 400 px
      </h1>

      <canvas
        ref={canvasRef}
        width={520}
        height={400}
        style={{
          borderRadius: 12,
          boxShadow: '0 8px 48px rgba(0,0,0,.7)',
          maxWidth: '100%',
          height: 'auto',
        }}
      />

      <button
        onClick={download}
        style={{
          background: '#2563EB', color: 'white', border: 'none',
          borderRadius: 8, padding: '.65rem 2rem',
          fontSize: '1rem', fontWeight: 700, cursor: 'pointer',
          fontFamily: 'inherit',
        }}
      >
        ⬇ Download boss-logo.png
      </button>

      <p style={{ color: '#94a3b8', fontSize: '.85rem', textAlign: 'center', maxWidth: 420 }}>
        Upload this file to the LinkedIn, Google, and Apple developer app forms
        when configuring OAuth.
      </p>

      <Link href="/" style={{ color: '#94a3b8', fontSize: '.85rem', textDecoration: 'none' }}>
        ← Back to home
      </Link>
    </main>
  );
}
