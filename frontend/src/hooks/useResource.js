import { useCallback, useEffect, useState } from 'react';

// Hook generico de carga: ejecuta `fetcher` y expone { data, loading, error, reload }.
// El `fetcher` debe ser estable (useCallback) para evitar bucles.
export function useResource(fetcher) {
  const [state, setState] = useState({ data: null, loading: true, error: null });

  const reload = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const data = await fetcher();
      setState({ data, loading: false, error: null });
    } catch (error) {
      setState({ data: null, loading: false, error });
    }
  }, [fetcher]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { ...state, reload };
}
