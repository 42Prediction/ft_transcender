import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * The platform serves 42 Luanda, so all human-facing dates/times render in
 * Angola local time (WAT, UTC+1) regardless of the viewer's browser locale.
 * Timestamps are stored/transported as UTC; pass this to `toLocale*` options.
 */
export const LUANDA_TZ = 'Africa/Luanda';
