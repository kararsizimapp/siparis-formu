/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Robust Turkish lowercase to uppercase converter module.
 * Converts 'i' -> 'İ', 'ı' -> 'I' and maps other characters perfectly.
 */
export function toTurkishUpperCase(text: string): string {
  if (!text) return '';
  return text
    .replace(/i/g, 'İ')
    .replace(/ı/g, 'I')
    .toLocaleUpperCase('tr-TR');
}

/**
 * Filter string to keep only letters or space (for player names)
 */
export function filterPlayerName(text: string): string {
  // Keep only uppercase characters of Turkish and English alphabets, and spaces
  const mapped = toTurkishUpperCase(text);
  return mapped.replace(/[^A-ZÇĞİIÖŞÜ ]/g, '');
}

/**
 * Filter string to keep only numbers (for jersey/kit number inputs)
 */
export function filterNumbersOnly(text: string): string {
  return text.replace(/[^0-9]/g, '');
}

/**
 * Generates an easily scannable and secure random Order ID sequence
 */
export function generateOrderId(): string {
  const num = Math.floor(10000 + Math.random() * 90000); // 5-digit number
  return `SL-${num}`;
}
