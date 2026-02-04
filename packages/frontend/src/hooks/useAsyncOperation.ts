'use client';

import { useQuery } from 'convex/react';
import { api } from 'convex/_generated/api';

export type AsyncOperationState = {
  isLoading: boolean;
  progress: number;
  isComplete: boolean;
  isFailed: boolean;
  result: unknown;
  error: string | null;
  /** Raw operation doc when available */
  operation: { progress: number; status: string; result?: unknown; error?: string } | null | undefined;
};

/**
 * Query async_operations by operationId. Returns loading, progress, completion, and result.
 * Use with ProgressBar for status messages.
 */
export function useAsyncOperation(operationId: string | null): AsyncOperationState {
  const operation = useQuery(
    api.asyncOperations.get,
    operationId ? { operationId } : 'skip'
  );

  if (!operationId) {
    return {
      isLoading: false,
      progress: 0,
      isComplete: false,
      isFailed: false,
      result: null,
      error: null,
      operation: undefined,
    };
  }

  if (operation === undefined) {
    return {
      isLoading: true,
      progress: 0,
      isComplete: false,
      isFailed: false,
      result: null,
      error: null,
      operation: undefined,
    };
  }

  if (operation === null) {
    return {
      isLoading: false,
      progress: 0,
      isComplete: false,
      isFailed: false,
      result: null,
      error: 'Operation not found',
      operation: null,
    };
  }

  return {
    isLoading: operation.status === 'pending' || operation.status === 'in_progress',
    progress: operation.progress ?? 0,
    isComplete: operation.status === 'completed',
    isFailed: operation.status === 'failed',
    result: operation.result ?? null,
    error: operation.error ?? null,
    operation,
  };
}
