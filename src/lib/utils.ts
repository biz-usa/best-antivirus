import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function deepMerge<T extends Record<string, any>>(target: T, source: Partial<T>): T {
  const output = { ...target };

  if (target && typeof target === 'object' && source && typeof source === 'object') {
    Object.keys(source).forEach(key => {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key]) && target[key] && typeof target[key] === 'object' && !Array.isArray(target[key])) {
        // If both are objects (and not arrays), deep merge
        output[key] = deepMerge(target[key], source[key] as Partial<T[typeof key]>);
      } else {
        // Otherwise, directly assign (source overwrites target for primitives and arrays)
        output[key] = source[key];
      }
    });
  }

  return output;
}
