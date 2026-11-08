import React from 'react';

interface ViewfinderFrameProps {
  children: React.ReactNode;
  frameLabel?: string;
  badge?: string;
  className?: string;
  cornerSize?: number;
  active?: boolean;
}

export function ViewfinderFrame({
  children,
  frameLabel,
  badge,
  className = '',
  cornerSize = 10,
  active = false,
}: ViewfinderFrameProps) {
  const bracketColor = active
    ? 'border-[#E54D2E] dark:border-[#FF5733]'
    : 'border-stone-400/80 dark:border-stone-600/80';

  return (
    <div className={`relative group ${className}`}>
      {/* Top-left corner */}
      <span
        style={{ width: cornerSize, height: cornerSize }}
        className={`absolute -top-1 -left-1 border-t-2 border-l-2 pointer-events-none transition-colors duration-200 ${bracketColor}`}
        aria-hidden="true"
      />
      {/* Top-right corner */}
      <span
        style={{ width: cornerSize, height: cornerSize }}
        className={`absolute -top-1 -right-1 border-t-2 border-r-2 pointer-events-none transition-colors duration-200 ${bracketColor}`}
        aria-hidden="true"
      />
      {/* Bottom-left corner */}
      <span
        style={{ width: cornerSize, height: cornerSize }}
        className={`absolute -bottom-1 -left-1 border-b-2 border-l-2 pointer-events-none transition-colors duration-200 ${bracketColor}`}
        aria-hidden="true"
      />
      {/* Bottom-right corner */}
      <span
        style={{ width: cornerSize, height: cornerSize }}
        className={`absolute -bottom-1 -right-1 border-b-2 border-r-2 pointer-events-none transition-colors duration-200 ${bracketColor}`}
        aria-hidden="true"
      />

      {/* Frame label bar if provided */}
      {(frameLabel || badge) && (
        <div className="flex items-center justify-between px-2.5 py-1 text-[10px] font-mono text-stone-500 border-b border-stone-200/60 dark:border-stone-800/80 bg-stone-50/70 dark:bg-stone-900/60 select-none">
          <span className="tracking-widest uppercase truncate">{frameLabel}</span>
          {badge && (
            <span className="font-semibold text-[#E54D2E] dark:text-[#FF5733] shrink-0">
              {badge}
            </span>
          )}
        </div>
      )}

      {children}
    </div>
  );
}

export default ViewfinderFrame;
