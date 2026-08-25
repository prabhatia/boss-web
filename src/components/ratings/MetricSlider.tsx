'use client';

interface MetricSliderProps {
  label: string;
  score: number;
  onScoreChange: (score: number) => void;
  showNumericInput?: boolean;
  /** Comment box is rendered only when this and onCommentChange are both provided. */
  comment?: string;
  onCommentChange?: (comment: string) => void;
}

/** One 1.0-10.0 rating row: label, optional numeric input, slider, optional comment box. */
export function MetricSlider({
  label,
  score,
  onScoreChange,
  showNumericInput = false,
  comment,
  onCommentChange,
}: MetricSliderProps) {
  function clamp(n: number): number {
    if (Number.isNaN(n)) return score;
    return Math.min(10, Math.max(1, Math.round(n * 10) / 10));
  }

  return (
    <div style={row}>
      <div style={labelRow}>
        <label style={labelStyle}>{label}</label>
        {showNumericInput && (
          <input
            type="number"
            min={1}
            max={10}
            step={0.1}
            value={score}
            onChange={(e) => onScoreChange(clamp(parseFloat(e.target.value)))}
            style={numberInput}
            aria-label={`${label} score`}
          />
        )}
        {!showNumericInput && <span style={scoreBadge}>{score.toFixed(1)}</span>}
      </div>

      <input
        type="range"
        min={1}
        max={10}
        step={0.1}
        value={score}
        onChange={(e) => onScoreChange(clamp(parseFloat(e.target.value)))}
        style={slider}
        aria-label={label}
      />

      {comment !== undefined && onCommentChange && (
        <textarea
          value={comment}
          onChange={(e) => onCommentChange(e.target.value)}
          placeholder="Comment (optional)"
          rows={2}
          style={textarea}
        />
      )}
    </div>
  );
}

const row: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '.4rem',
  padding: '.85rem 0',
  borderBottom: '1px solid var(--border)',
};

const labelRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '.6rem',
};

const labelStyle: React.CSSProperties = {
  fontSize: '.85rem',
  fontWeight: 600,
  color: 'var(--ink)',
};

const scoreBadge: React.CSSProperties = {
  fontSize: '.85rem',
  fontWeight: 700,
  color: 'var(--primary)',
  minWidth: '2.2rem',
  textAlign: 'right',
};

const numberInput: React.CSSProperties = {
  width: '4rem',
  padding: '.25rem .4rem',
  border: '1px solid var(--border)',
  borderRadius: 6,
  fontSize: '.82rem',
  fontFamily: 'inherit',
  color: 'var(--ink)',
  textAlign: 'right',
};

const slider: React.CSSProperties = {
  width: '100%',
  accentColor: 'var(--primary)',
  cursor: 'pointer',
};

const textarea: React.CSSProperties = {
  width: '100%',
  padding: '.5rem .6rem',
  border: '1px solid var(--border)',
  borderRadius: 8,
  fontSize: '.8rem',
  fontFamily: 'inherit',
  color: 'var(--ink)',
  resize: 'vertical',
};
