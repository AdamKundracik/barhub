import { useState, useEffect, useCallback } from 'react';

const useDebounce = (callback, delay) => {
  const [timer, setTimer] = useState(null);

  const debounceCallback = useCallback(
    (...args) => {
      if (timer) {
        clearTimeout(timer);
      }
      const newTimer = setTimeout(() => {
        callback(...args);
      }, delay);
      setTimer(newTimer);
    },
    [callback, delay, timer]
  );

  useEffect(() => {
    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [timer]);

  return debounceCallback;
};

export default useDebounce;
