/**
 * The boss wordmark: the figure glyph reads as the "b", the gradient
 * "oss" completes the word. Ported from the inline SVG in landing.html.
 *
 * The gradient id is suffixed per instance so multiple logos on one page
 * do not collide in the SVG defs namespace.
 */
export function BossLogo({
  height = 42,
  wordSize = '2rem',
  showWord = true,
  idSuffix = 'nav',
}: {
  height?: number;
  wordSize?: string;
  showWord?: boolean;
  idSuffix?: string;
}) {
  const clipId = `bclip-${idSuffix}`;
  const gradId = `bgrad-${idSuffix}`;
  const width = Math.round((height * 38) / 52);

  return (
    <span style={{ display: 'inline-flex', alignItems: 'flex-end', gap: 0, lineHeight: 1 }}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 38 52"
        width={width}
        height={height}
        fill="none"
        role="img"
        aria-label="boss"
        style={{ display: 'block', flexShrink: 0 }}
      >
        <defs>
          <clipPath id={clipId}>
            <rect x="18" y="0" width="20" height="52" />
          </clipPath>
          <linearGradient id={gradId} x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#2563EB" />
            <stop offset="100%" stopColor="#DBEAFE" />
          </linearGradient>
        </defs>

        <path d="M18,6 C14,2 9,4 8,9" stroke={`url(#${gradId})`} strokeWidth="2.5" strokeLinecap="round" />
        <path d="M18,12 C13,9 9,13 10,18" stroke={`url(#${gradId})`} strokeWidth="2.5" strokeLinecap="round" />

        <circle cx="24" cy="35" r="12" fill={`url(#${gradId})`} clipPath={`url(#${clipId})`} />
        <path d="M29.5,25.5 L32,25.5 L32.5,33 L30.5,40 L29.5,41 L28.5,40 L28,33 Z" fill="#111" />
        <rect x="18" y="20.5" width="10" height="5" fill={`url(#${gradId})`} />
        <rect x="18" y="24" width="14" height="2" rx="0.6" fill="#111" />

        <circle cx="22.5" cy="13" r="9" fill={`url(#${gradId})`} clipPath={`url(#${clipId})`} />
        <ellipse cx="30.5" cy="13.5" rx="1.2" ry="2" fill={`url(#${gradId})`} />

        <ellipse cx="26" cy="12" rx="2.5" ry="1.4" fill="white" />
        <ellipse cx="26" cy="12" rx="2.5" ry="1.4" fill="none" stroke="#111" strokeWidth="1.8" />
        <ellipse cx="20.5" cy="12.4" rx="1.8" ry="1.3" fill="white" />
        <ellipse cx="20.5" cy="12.4" rx="1.8" ry="1.3" fill="none" stroke="#111" strokeWidth="1.8" />

        <line x1="22.3" y1="12.2" x2="23.5" y2="12" stroke="#111" strokeWidth="1.4" strokeLinecap="round" />
        <line x1="28.5" y1="12" x2="30.2" y2="12.5" stroke="#111" strokeWidth="1.4" strokeLinecap="round" />
      </svg>

      {showWord && (
        <span
          style={{
            fontWeight: 800,
            fontSize: wordSize,
            letterSpacing: '-0.03em',
            lineHeight: 1,
            background: 'linear-gradient(to top,#2563EB 0%,#DBEAFE 100%)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            color: 'transparent',
            display: 'inline-block',
          }}
        >
          oss
        </span>
      )}
    </span>
  );
}
