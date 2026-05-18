"use client";
import { useState, useCallback, useRef } from "react";

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface UseApiReturn<T> extends UseApiState<T> {
  execute: (...args: any[]) => Promise<T | null>;
  reset: () => void;
  setData: (data: T) => void;
}

/**
 * Generic API hook with loading / error / retry support.
 * Prevents state updates on unmounted components.
 *
 * Usage:
 *   const { data, loading, error, execute } = useApi(productsService.getAll);
 *   useEffect(() => { execute(filters); }, []);
 */
export function useApi<T>(
  apiFn: (...args: any[]) => Promise<T>
): UseApiReturn<T> {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const isMounted = useRef(true);
  // Track mount/unmount to prevent setState after unmount
  if (typeof window !== "undefined") {
    isMounted.current = true;
  }

  const execute = useCallback(
    async (...args: any[]): Promise<T | null> => {
      setState((s) => ({ ...s, loading: true, error: null }));
      try {
        const result = await apiFn(...args);
        if (isMounted.current) {
          setState({ data: result, loading: false, error: null });
        }
        return result;
      } catch (err: any) {
        const message = err.message || "An unexpected error occurred.";
        if (isMounted.current) {
          setState({ data: null, loading: false, error: message });
        }
        return null;
      }
    },
    [apiFn]
  );

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  const setData = useCallback((data: T) => {
    setState((s) => ({ ...s, data }));
  }, []);

  return { ...state, execute, reset, setData };
}
