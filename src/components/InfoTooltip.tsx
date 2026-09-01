'use client';

/** Small "i" button with a CSS-only hover/focus tooltip bubble — no JS state, no component library. */
export function InfoTooltip({ text }: { text: React.ReactNode }) {
  return (
    <span style={wrap} tabIndex={0} className="info-tooltip">
      <span style={badge} aria-hidden="true">i</span>
      <span className="info-tooltip-bubble" style={bubble} role="tooltip">{text}</span>
    </span>
  );
}

const wrap: React.CSSProperties = {
  position: 'relative',
  display: 'inline-flex',
  marginLeft: '.35rem',
  verticalAlign: 'middle',
  outline: 'none',
};

const badge: React.CSSProperties = {
  width: '1rem',
  height: '1rem',
  borderRadius: '50%',
  background: 'var(--bg)',
  color: 'var(--primary)',
  fontSize: '.65rem',
  fontWeight: 700,
  fontStyle: 'italic',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'default',
};

const bubble: React.CSSProperties = {
  position: 'absolute',
  bottom: 'calc(100% + 6px)',
  left: '50%',
  transform: 'translateX(-50%)',
  width: 'max-content',
  maxWidth: '220px',
  background: 'var(--ink)',
  color: 'white',
  fontSize: '.7rem',
  fontWeight: 500,
  lineHeight: 1.5,
  padding: '.45rem .6rem',
  borderRadius: 6,
  zIndex: 20,
  whiteSpace: 'pre-line',
  textAlign: 'left',
};
