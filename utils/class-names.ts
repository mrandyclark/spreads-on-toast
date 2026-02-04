import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility function for combining class names with intelligent Tailwind CSS merging.
 * Combines clsx for conditional classes with twMerge for proper Tailwind class deduplication.
 *
 * @param inputs - Class values to combine
 * @returns Combined and merged class string
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
