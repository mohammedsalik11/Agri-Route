'use client';

import React from 'react';

interface SimulatedBadgeProps {
  label?: string;
  tooltip?: string;
}

export const SimulatedBadge: React.FC<SimulatedBadgeProps> = ({
  label = 'SIMULATED',
  tooltip = 'Real state machine and business logic; external partner rail simulated for prototype honesty.',
}) => {
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider bg-amber-100 text-amber-900 border border-amber-300 uppercase cursor-help"
      title={tooltip}
    >
      <span>⚙️</span>
      {label}
    </span>
  );
};
