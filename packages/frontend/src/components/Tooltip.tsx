'use client';

import { useState, useRef, useEffect } from 'react';

type TooltipProps = {
  content: string;
  children: React.ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
};

export function Tooltip({ content, children, side = 'top' }: TooltipProps) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [open]);

  return (
    <span ref={wrapperRef} className="relative inline-flex items-center gap-1">
      {children}
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          setOpen((o) => !o);
        }}
        className="inline-flex text-gray-500 hover:text-gray-400 focus:outline-none"
        aria-label="Help"
      >
        <QuestionMarkCircleIcon className="h-4 w-4" />
      </button>
      {open && (
        <div
          className={`absolute z-50 max-w-xs rounded border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-gray-200 shadow-lg ${
            side === 'top' ? 'bottom-full left-0 mb-1' : ''
          } ${side === 'bottom' ? 'top-full left-0 mt-1' : ''} ${
            side === 'left' ? 'right-full top-0 mr-1' : ''
          } ${side === 'right' ? 'left-full top-0 ml-1' : ''}`}
          role="tooltip"
        >
          {content}
        </div>
      )}
    </span>
  );
}

function QuestionMarkCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}
