'use client';

interface SegmentedControlProps<T extends string> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  'aria-label'?: string;
}

/** A row of mutually-exclusive clickable segments — reused for the salary period and RSU vesting-schedule pickers. */
export function SegmentedControl<T extends string>({ options, value, onChange, ...rest }: SegmentedControlProps<T>) {
  return (
    <div role="radiogroup" aria-label={rest['aria-label']} style={wrap}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={o.value === value}
          onClick={() => onChange(o.value)}
          style={o.value === value ? { ...segment, ...segmentActive } : segment}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

const wrap: React.CSSProperties = {
  display: 'flex',
  border: '1px solid var(--border)',
  borderRadius: 8,
  overflow: 'hidden',
};

const segment: React.CSSProperties = {
  flex: 1,
  padding: '.4rem .5rem',
  border: 'none',
  background: 'white',
  fontSize: '.78rem',
  fontWeight: 600,
  color: 'var(--body)',
  cursor: 'pointer',
  fontFamily: 'inherit',
  borderRight: '1px solid var(--border)',
};

const segmentActive: React.CSSProperties = {
  background: 'var(--primary)',
  color: 'white',
};
