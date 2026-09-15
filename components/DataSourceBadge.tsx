'use client';

import React from 'react';

interface DataSourceBadgeProps {
  source: 'LIVE' | 'CACHED';
  date?: string;
}

export const DataSourceBadge: React.FC<DataSourceBadgeProps> = ({ source, date }) => {
  const isLive = source === 'LIVE';

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
        isLive
          ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
          : 'bg-slate-100 text-slate-700 border-slate-300'
      }`}
      title={isLive ? 'Live data from Agmarknet API' : `Cached snapshot fallback ${date ? `(${date})` : ''}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          isLive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
        }`}
      />
      {isLive ? 'LIVE' : 'CACHED'}
      {date && !isLive && <span className="opacity-75 font-normal">· {date}</span>}
    </span>
  );
};
