'use client';

import { useState } from 'react';

interface FormTooltipProps {
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  children: React.ReactNode;
}

export default function FormTooltip({
  content,
  position = 'top',
  children,
}: FormTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-gray-900 border-x-transparent border-b-transparent',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-gray-900 border-x-transparent border-t-transparent',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-gray-900 border-y-transparent border-r-transparent',
    right: 'right-full top-1/2 -translate-y-1/2 border-r-gray-900 border-y-transparent border-l-transparent',
  };

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onFocus={() => setIsVisible(true)}
        onBlur={() => setIsVisible(false)}
      >
        {children}
      </div>

      {isVisible && (
        <div
          className={`absolute z-50 ${positionClasses[position]} pointer-events-none`}
          role="tooltip"
        >
          <div className="bg-gray-900 text-white text-sm rounded-lg px-3 py-2 max-w-xs shadow-lg">
            {content}
            <div
              className={`absolute w-0 h-0 border-4 ${arrowClasses[position]}`}
              aria-hidden="true"
            />
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Label wrapper with integrated tooltip
 */
interface FormLabelWithTooltipProps {
  label: string;
  tooltip: string;
  required?: boolean;
  htmlFor?: string;
}

export function FormLabelWithTooltip({
  label,
  tooltip,
  required = false,
  htmlFor,
}: FormLabelWithTooltipProps) {
  return (
    <label htmlFor={htmlFor} className="flex items-center gap-2 mb-2 text-sm font-medium text-gray-700">
      <span>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </span>
      <FormTooltip content={tooltip}>
        <button
          type="button"
          className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-600 text-xs"
          aria-label="Help"
        >
          ?
        </button>
      </FormTooltip>
    </label>
  );
}
