import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function shallowEqual(objA: unknown, objB: unknown): boolean {
  if (objA === objB) return true;
  if (typeof objA !== 'object' || objA === null || typeof objB !== 'object' || objB === null) {
    return false;
  }
  const a = objA as Record<string, unknown>;
  const b = objB as Record<string, unknown>;
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  for (let i = 0; i < keysA.length; i++) {
    if (!Object.prototype.hasOwnProperty.call(b, keysA[i]) || a[keysA[i]] !== b[keysA[i]]) {
      return false;
    }
  }
  return true;
}

export const getHandColorClasses = (handConfig: string) => {
  const lower = handConfig.toLowerCase();
  if (lower.includes('left')) {
    return "border-sky-500/25 text-sky-700 dark:text-sky-300 data-[state=on]:border-sky-500/50 data-[state=on]:bg-sky-500/15 data-[state=on]:text-sky-800 dark:data-[state=on]:text-sky-200 data-[state=on]:shadow-none";
  }
  if (lower.includes('right')) {
    return "border-amber-500/25 text-amber-700 dark:text-amber-300 data-[state=on]:border-amber-500/50 data-[state=on]:bg-amber-500/15 data-[state=on]:text-amber-800 dark:data-[state=on]:text-amber-200 data-[state=on]:shadow-none";
  }
  // "together", "contrary", "staggered" all involve both hands
  return "border-emerald-500/25 text-emerald-700 dark:text-emerald-300 data-[state=on]:border-emerald-500/50 data-[state=on]:bg-emerald-500/15 data-[state=on]:text-emerald-800 dark:data-[state=on]:text-emerald-200 data-[state=on]:shadow-none";
};

export const getCategoryColorClasses = (category: string) => {
  const lower = category.toLowerCase();
  if (lower.includes('arpeggio') || lower.includes('7th')) {
    return "bg-rose-500/10 text-rose-600 border-rose-500/20 dark:text-rose-400";
  }
  if (lower.includes('scale') || lower.includes('chromatic')) {
    return "bg-indigo-500/10 text-indigo-600 border-indigo-500/20 dark:text-indigo-400";
  }
  if (lower.includes('dohnanyi')) {
    return "bg-cyan-500/10 text-cyan-600 border-cyan-500/20 dark:text-cyan-400";
  }
  if (lower.includes('hanon')) {
    return "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400";
  }
  return "bg-primary/10 text-primary border-primary/20";
};