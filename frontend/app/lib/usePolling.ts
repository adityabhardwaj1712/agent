import { useEffect, useRef } from 'react';

/**
 * A robust polling hook that ensures proper cleanup and prevents memory leaks.
 * @param callback The function to execute on each interval
 * @param delay The interval in milliseconds. If null, polling stops.
 * @param immediate If true, the callback will be executed immediately on start.
 */
export function usePolling(callback: () => void, delay: number | null, immediate = false) {
  const savedCallback = useRef(callback);

  // Remember the latest callback if it changes.
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Set up the interval.
  useEffect(() => {
    if (delay !== null) {
      if (immediate) {
        savedCallback.current();
      }
      
      const id = setInterval(() => {
        savedCallback.current();
      }, delay);
      
      return () => clearInterval(id);
    }
  }, [delay, immediate]);
}
