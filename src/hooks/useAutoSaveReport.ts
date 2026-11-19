import { useCallback, useEffect, useRef, useState } from 'react';
import type { ReportInputData } from '../core/types.ts';
import { saveActiveReport, type SaveReportResult } from '../services/storage.ts';

export type AutoSaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export interface AutoSaveState {
  status: AutoSaveStatus;
  lastSavedAt: string | null;
  error: string | null;
}

export interface DebouncedAutoSaver<T> {
  schedule: (value: T) => void;
  flush: () => SaveReportResult | null;
  cancel: () => void;
  hasPending: () => boolean;
}

export function createDebouncedAutoSaver<T>(
  saveFn: (value: T) => SaveReportResult,
  delayMs = 500,
  onStateChange?: (state: AutoSaveState) => void
): DebouncedAutoSaver<T> {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let pendingValue: T | null = null;
  let pending = false;

  const flush = (): SaveReportResult | null => {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
    if (!pending || pendingValue === null) {
      return null;
    }

    const valueToSave = pendingValue;
    pending = false;
    pendingValue = null;

    const result = saveFn(valueToSave);
    if (result.ok) {
      onStateChange?.({
        status: 'saved',
        lastSavedAt: result.savedAt,
        error: null,
      });
    } else {
      onStateChange?.({
        status: 'error',
        lastSavedAt: null,
        error: result.error || 'Unable to save draft to localStorage.',
      });
    }
    return result;
  };

  const schedule = (value: T) => {
    pendingValue = value;
    pending = true;
    onStateChange?.({
      status: 'saving',
      lastSavedAt: null,
      error: null,
    });

    if (timer !== null) {
      clearTimeout(timer);
    }
    timer = setTimeout(() => {
      flush();
    }, delayMs);
  };

  const cancel = () => {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
  };

  return {
    schedule,
    flush,
    cancel,
    hasPending: () => pending,
  };
}

export function useAutoSaveReport(
  report: ReportInputData,
  initialSavedAt: string | null,
  options?: {
    delayMs?: number;
    onError?: (message: string) => void;
  }
) {
  const delayMs = options?.delayMs ?? 500;
  const onErrorRef = useRef(options?.onError);
  onErrorRef.current = options?.onError;

  const [state, setState] = useState<AutoSaveState>(() => ({
    status: initialSavedAt ? 'saved' : 'idle',
    lastSavedAt: initialSavedAt,
    error: null,
  }));

  const isFirstRenderRef = useRef(true);
  const lastSavedAtRef = useRef<string | null>(initialSavedAt);

  const saverRef = useRef<DebouncedAutoSaver<ReportInputData> | null>(null);
  if (!saverRef.current) {
    saverRef.current = createDebouncedAutoSaver(saveActiveReport, delayMs, (next) => {
      if (next.status === 'saved') {
        lastSavedAtRef.current = next.lastSavedAt;
        setState(next);
      } else if (next.status === 'saving') {
        setState((prev) => ({
          status: 'saving',
          lastSavedAt: prev.lastSavedAt ?? lastSavedAtRef.current,
          error: null,
        }));
      } else if (next.status === 'error') {
        setState({
          status: 'error',
          lastSavedAt: lastSavedAtRef.current,
          error: next.error,
        });
        if (next.error) {
          onErrorRef.current?.(next.error);
        }
      }
    });
  }

  // Schedule debounced save whenever report mutates after initial mount
  useEffect(() => {
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      return;
    }
    saverRef.current?.schedule(report);
  }, [report]);

  // Flush pending changes synchronously during session interruptions (tab close, refresh, hide)
  useEffect(() => {
    const handleInterrupt = () => {
      saverRef.current?.flush();
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        saverRef.current?.flush();
      }
    };

    window.addEventListener('pagehide', handleInterrupt);
    window.addEventListener('beforeunload', handleInterrupt);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('pagehide', handleInterrupt);
      window.removeEventListener('beforeunload', handleInterrupt);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      saverRef.current?.flush();
      saverRef.current?.cancel();
    };
  }, []);

  const flushNow = useCallback(() => {
    saverRef.current?.flush();
  }, []);

  return {
    ...state,
    flushNow,
  };
}
