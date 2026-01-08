import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines class names using clsx and tailwind-merge.
 * This ensures Tailwind classes are properly merged without conflicts.
 *
 * Usage:
 * ```tsx
 * cn("px-4 py-2", isActive && "bg-primary", className)
 * ```
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function base64ToHex(base64: string): string {
  const binary = atob(base64);
  let hex = "";

  for (let i = 0; i < binary.length; i++) {
    const byte = binary.charCodeAt(i);
    hex += byte.toString(16).padStart(2, "0");
  }

  return hex.toUpperCase();
}
