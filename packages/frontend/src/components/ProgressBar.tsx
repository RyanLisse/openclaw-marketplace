'use client';

import type { AsyncOperationState } from '@/hooks/useAsyncOperation';

type ProgressBarProps = {
  state: AsyncOperationState;
  /** Optional label above the bar */
  label?: string;
  className?: string;
};

const PROGRESS_MESSAGES: Array<{ min: number; message: string }> = [
  { min: 0, message: 'Starting…' },
  { min: 10, message: 'Processing…' },
  { min: 50, message: 'Embedding…' },
  { min: 75, message: 'Matching…' },
  { min: 100, message: 'Done' },
];

function getStatusMessage(progress: number, isFailed: boolean, error: string | null): string {
  if (isFailed && error) return `Failed: ${error}`;
  if (isFailed) return 'Failed';
  for (let i = PROGRESS_MESSAGES.length - 1; i >= 0; i--) {
    if (progress >= PROGRESS_MESSAGES[i].min) return PROGRESS_MESSAGES[i].message;
  }
  return PROGRESS_MESSAGES[0].message;
}

export function ProgressBar({ state, label, className = '' }: ProgressBarProps) {
  const { progress, isFailed, error } = state;
  const message = getStatusMessage(progress, isFailed, error);

  return (
    <div className={className}>
      {label && (
        <div className="mb-1 flex items-center justify-between text-sm">
          <span className="text-gray-400">{label}</span>
          <span className={isFailed ? 'text-red-400' : 'text-gray-400'}>{message}</span>
        </div>
      )}
      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-800">
        <div
          className={`h-full transition-all duration-300 ${
            isFailed ? 'bg-red-500' : 'bg-blue-500'
          }`}
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
      {!label && (
        <p className={`mt-1 text-sm ${isFailed ? 'text-red-400' : 'text-gray-400'}`}>{message}</p>
      )}
    </div>
  );
}
