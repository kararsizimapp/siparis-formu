/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface OrderItem {
  id: string;
  no: string;          // Player Jersey number (e.g., "7", "10")
  adet: number;        // Quantity (usually 1, editable)
  adiSoyadi: string;   // Name Surname (uppercase)
  ustBedeni: string;   // Upper size
  altBedeni: string;   // Lower size
  corap?: string;      // Socks choice (e.g. "YOK" or "SİYAH", "BEYAZ", etc.)
}

export interface Order {
  id: string;          // Unique Order ID (e.g. "SL-49281")
  teamName: string;    // Takım Adı
  customerName: string;// Sipariş Veren Adı Soyadı
  customerPhone: string;// Telefon
  notes?: string;       // Özel Notlar
  items: OrderItem[];  // Oyuncu listesi satırları
  createdAt: string;   // ISO string or timestamp
  status: 'beklemede' | 'hazirlaniyor' | 'tamamlandi';
}
