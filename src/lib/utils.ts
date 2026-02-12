import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function shallowEqual(objA: any, objB: any): boolean {
  if (objA === objB) return true;
  if (typeof objA !== 'object' || objA === null || typeof objB !== 'object' || objB === null) {
    return false;
  }
  const keysA = Object.keys(objA);
  const keysB = Object.keys(objB);
  if (keysA.length !== keysB.length) return false;
  for (let i = 0; i < keysA.length; i++) {
    if (!Object.prototype.hasOwnProperty.call(objB, keysA[i]) || objA[keysA[i]] !== objB[keysA[i]]) {
      return false;
    }
  }
  return true;
}

export const getHandColorClasses = (handConfig: string) => {
  const lower = handConfig.toLowerCase();
  if (lower.includes('left')) {
    return "border-blue-500/30 text-blue-600 dark:text-blue-400 data-[state=on]:bg-blue-600 data-[state=on]:text-white data-[state=on]:border-blue-600";
  }
  if (lower.includes('right')) {
    return "border-orange-500/30 text-orange-600 dark:text-orange-400 data-[state=on]:bg-orange-600 data-[state=on]:text-white data-[state=on]:border-orange-600";
  }
  // "together", "contrary", "staggered" all involve both hands
  return "border-emerald-500/30 text-emerald-600 dark:text-emerald-400 data-[state=on]:bg-emerald-600 data-[state=on]:text-white data-[state=on]:border-emerald-600";
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