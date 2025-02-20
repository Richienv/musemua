import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const calculateDuration = (startTime: string, endTime: string): number => {
  const start = parseInt(startTime);
  const end = parseInt(endTime);
  return end - start; // Calculate actual hours without adding 1
};

export const calculateTotalPrice = (price: number, hours: number): number => {
  return price * hours;
};
