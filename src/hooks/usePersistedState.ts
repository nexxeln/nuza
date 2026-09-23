import { useEffect, useState } from "react";

/**
 * Like useState, but the value is read from and written to localStorage
 * under `key`, so it survives app restarts. Falls back to `defaultValue`
 * if nothing is stored yet or the stored value can't be parsed.
 */
export function usePersistedState<T>(key: string, defaultValue: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const saved = localStorage.getItem(key);
      return saved !== null ? (JSON.parse(saved) as T) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue] as const;
}
