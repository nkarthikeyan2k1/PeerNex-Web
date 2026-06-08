// SystemLine — centered status divider used inside ChatLog
// Layout: ──── ● some status text ────

import './SystemLine.scss';

export interface SystemLineProps {
  text: string;
  /** Optional dot color — any CSS color value, e.g. "var(--c-ok)" */
  dot?: string;
}

export default function SystemLine({ text, dot }: SystemLineProps) {
  return (
    <div className="system-line" role="status" aria-live="polite">
      <span className="system-line__rule" aria-hidden />
      <span className="system-line__content">
        {dot && (
          <span
            className="system-line__dot"
            style={{ background: dot }}
            aria-hidden
          />
        )}
        {text}
      </span>
      <span className="system-line__rule" aria-hidden />
    </div>
  );
}
