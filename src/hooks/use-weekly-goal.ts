import { useCallback, useEffect, useState } from 'react';

const KEY = 'scales.weeklyGoalMinutes';
const DEFAULT_GOAL = 120;

/**
 * Weekly practice target. Stored on the device for now; when the profile
 * table is wired up this can move server-side without changing the UI.
 */
export const useWeeklyGoal = () => {
  const [goal, setGoalState] = useState(DEFAULT_GOAL);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(KEY);
      const parsed = raw ? Number.parseInt(raw, 10) : Number.NaN;
      if (Number.isFinite(parsed) && parsed >= 15 && parsed <= 1000) {
        setGoalState(parsed);
      }
    } catch {
      // storage unavailable — keep the default
    }
  }, []);

  const setGoal = useCallback((next: number) => {
    const value = Number.isFinite(next)
      ? Math.max(15, Math.min(1000, Math.round(next)))
      : DEFAULT_GOAL;
    setGoalState(value);
    try {
      window.localStorage.setItem(KEY, String(value));
    } catch {
      // storage unavailable — keep it in memory
    }
  }, []);

  return { goal, setGoal };
};