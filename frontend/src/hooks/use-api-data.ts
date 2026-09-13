"use client";

import { useCallback, useEffect, useState } from "react";

interface Result<T> {
  key: string | null;
  data?: T;
  error?: Error;
}

/**
 * Loads data from the API and reloads whenever `deps` change.
 * Keeps the previous data while reloading, so tables don't flash empty between pages.
 */
export function useApiData<T>(load: () => Promise<T>, deps: unknown[]) {
  const [reloadCount, setReloadCount] = useState(0);
  const key = JSON.stringify([...deps, reloadCount]);
  const [result, setResult] = useState<Result<T>>({ key: null });

  useEffect(() => {
    let cancelled = false;
    load()
      .then((data) => {
        if (!cancelled) setResult({ key, data });
      })
      .catch((error: Error) => {
        if (!cancelled) setResult((previous) => ({ key, data: previous.data, error }));
      });
    return () => {
      cancelled = true;
    };
    // `key` already captures every dependency; `load` is a new function on each render by design
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const reload = useCallback(() => setReloadCount((count) => count + 1), []);

  return {
    data: result.data,
    error: result.key === key ? result.error : undefined,
    loading: result.key !== key,
    reload,
  };
}
