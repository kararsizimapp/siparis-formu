/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Trash2, 
  Sparkles, 
  Phone, 
  User, 
  Info, 
  Trophy, 
  Clipboard, 
  PlusCircle, 
  FileSpreadsheet,
  Download,
  CheckCircle2,
  ListOrdered,
  Shirt,
  Scissors
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { OrderItem } from '../types';
import { filterPlayerName, filterNumbersOnly, toTurkishUpperCase } from '../utils';

// Standard sizes configured according to exact user instructions (excluding "-" empty size)
const SIZES_ADULT = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL', '5XL'];
const SIZES_CHILD = ['4 Yaş', '6 Yaş', '8 Yaş', '10 Yaş', '12 Yaş', '14 Yaş'];
const ALL_SIZES = ['YOK', ...SIZES_ADULT, ...SIZES_CHILD];

// Socks color options
const SOCKS_OPTIONS = [
  'YOK',
  'BEYAZ',
  'KIRMIZI',
  'SİYAH',
  'YEŞİL',
  'LACİVERT',
  'SAKS MAVİ',
  'BORDO',
  'SARI',
  'TURUNCU',
  'TURKUAZ',
  'GRİ',
  'NEON SARI',
  'NEON TURUNCU',
  'FUŞYA',
  'MOR',
  'NEON YEŞİL',
  'BUZ MAVİ'
];

export default function CustomerForm() {
  // General Info Fields (Turkish character optimization)
  const [teamName, setTeamName] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  // Table items - initialized with template rows using YOK as clear defaults
  const [items, setItems] = useState<OrderItem[]>([
    { id: '1', no: '10', adet: 1, adiSoyadi: 'AHMET YILMAZ', ustBedeni: 'M', altBedeni: 'M', corap: 'BEYAZ' },
    { id: '2', no: '7', adet: 1, adiSoyadi: 'MUSTAFA CAN', ustBedeni: 'L', altBedeni: 'L', corap: 'SİYAH' },
    { id: '3', no: '1', adet: 1, adiSoyadi: 'BURAK ŞAHİN', ustBedeni: 'XL', altBedeni: 'XL', corap: 'YOK' },
    { id: '4', no: '', adet: 1, adiSoyadi: '', ustBedeni: 'YOK', altBedeni: 'YOK', corap: 'YOK' },
    { id: '5', no: '', adet: 1, adiSoyadi: '', ustBedeni: 'YOK', altBedeni: 'YOK', corap: 'YOK' },
  ]);

  // Bulk paste drawer state
  const [showPasteZone, setShowPasteZone] = useState(false);
  const [pasteContent, setPasteContent] = useState('');
  const [pasteError, setPasteError] = useState('');

  // Dynamic status calculates
  const totalUniformCount = items.reduce((acc, item) => acc + (Number(item.adet) || 0), 0);

  // Computations for cumulative shirts (üst), shorts (alt), and socks (çorap) counts
  const totalUstCount = items.reduce((acc, item) => {
    const isPlayerFilled = item.adiSoyadi.trim() !== '';
    const hasUstSizeSelected = item.ustBedeni !== 'YOK';
    return (isPlayerFilled && hasUstSizeSelected) ? acc + (Number(item.adet) || 0) : acc;
  }, 0);

  const totalAltCount = items.reduce((acc, item) => {
    const isPlayerFilled = item.adiSoyadi.trim() !== '';
    const hasAltSizeSelected = item.altBedeni !== 'YOK';
    return (isPlayerFilled && hasAltSizeSelected) ? acc + (Number(item.adet) || 0) : acc;
  }, 0);

  const totalCorapCount = items.reduce((acc, item) => {
    const isPlayerFilled = item.adiSoyadi.trim() !== '';
    const hasCorapSelected = item.corap && item.corap !== 'YOK';
    return (isPlayerFilled && hasCorapSelected) ? acc + (Number(item.adet) || 0) : acc;
  }, 0);

  // Add a new raw order item line
  const handleAddRow = () => {
    const newItem: OrderItem = {
      id: Math.random().toString(36).substring(2, 9),
      no: '',
      adet: 1,
      adiSoyadi: '',
      ustBedeni: 'YOK',
      altBedeni: 'YOK',
      corap: 'YOK',
    };
    setItems([...items, newItem]);
  };

  // Add multiple blank rows for speed
  const handlePulseBlankRows = (count: number) => {
    const newLines: OrderItem[] = Array.from({ length: count }).map(() => ({
      id: Math.random().toString(36).substring(2, 9),
      no: '',
      adet: 1,
      adiSoyadi: '',
      ustBedeni: 'YOK',
      altBedeni: 'YOK',
      corap: 'YOK',
    }));
    setItems([...items, ...newLines]);
  };

  // Delete an order item row
  const handleDeleteRow = (id: string) => {
    if (items.length <= 1) {
      // Keep at least one row active
      setItems([{ id: '1', no: '', adet: 1, adiSoyadi: '', ustBedeni: 'YOK', altBedeni: 'YOK', corap: 'YOK' }]);
      return;
    }
    setItems(items.filter(item => item.id !== id));
  };

  // Handle cell field mutations with filters
  const handleItemChange = (id: string, field: keyof OrderItem, value: any) => {
    setItems(items.map(item => {
      if (item.id === id) {
        let cleanValue = value;
        if (field === 'adiSoyadi') {
          cleanValue = filterPlayerName(value); // Letters & space only, converted to Uppercase
        } else if (field === 'no') {
          cleanValue = filterNumbersOnly(value).slice(0, 3); // Max 3 digit number (jersey no)
        } else if (field === 'adet') {
          const num = parseInt(value, 10);
          cleanValue = isNaN(num) || num < 1 ? 1 : num;
        }
        return { ...item, [field]: cleanValue };
      }
      return item;
    }));
  };

  // Bulk paste text parser (handles TSV-Excel, CSV, or raw text lists)
  const handleParsePaste = () => {
    if (!pasteContent.trim()) {
      setPasteError('Lütfen listenizi buraya yapıştırın.');
      return;
    }

    try {
      const lines = pasteContent.split('\n');
      const parsedItems: OrderItem[] = [];

      lines.forEach(line => {
        if (!line.trim()) return;

        // Split on common separators: tabs (excel copy), commas, semicolons, dashes, or multiple spaces
        let parts: string[] = [];
        if (line.includes('\t')) {
          parts = line.split('\t');
        } else if (line.includes(',')) {
          parts = line.split(',');
        } else if (line.includes(';')) {
          parts = line.split(';');
        } else if (line.includes('-')) {
          parts = line.split('-');
        } else {
          // fallback to spaces
          parts = line.split(/\s+/).filter(Boolean);
        }

        // Clean parts
        const cleanedParts = parts.map(p => p.trim());

        // We expect format: [JerseyNo] [Name] [UpperSize] [LowerSize] [Socks] or variations
        let no = '';
        let name = '';
        let ust = 'YOK';
        let alt = 'YOK';
        let corapVal = 'YOK';
        let adetVal = 1;

        if (cleanedParts.length >= 1) {
          // Identify fields intelligently
          const firstPartNum = filterNumbersOnly(cleanedParts[0]);
          if (firstPartNum && cleanedParts[0].length <= 3) {
            no = firstPartNum;
            if (cleanedParts.length >= 2) {
              name = filterPlayerName(cleanedParts[1]);
            }
            if (cleanedParts.length >= 3) {
              ust = toTurkishUpperCase(cleanedParts[2]);
              if (!ALL_SIZES.includes(ust)) ust = 'YOK';
            }
            if (cleanedParts.length >= 4) {
              alt = toTurkishUpperCase(cleanedParts[3]);
              if (!ALL_SIZES.includes(alt)) alt = 'YOK';
            }
            if (cleanedParts.length >= 5) {
              corapVal = toTurkishUpperCase(cleanedParts[4]);
              if (!SOCKS_OPTIONS.includes(corapVal)) corapVal = 'YOK';
            }
          } else {
            // First part might be player name
            name = filterPlayerName(cleanedParts[0]);
            if (cleanedParts.length >= 2) {
              const secondPartNum = filterNumbersOnly(cleanedParts[1]);
              if (secondPartNum) {
                no = secondPartNum;
              } else {
                ust = toTurkishUpperCase(cleanedParts[1]);
                if (!ALL_SIZES.includes(ust)) ust = 'YOK';
              }
            }
            if (cleanedParts.length >= 3) {
              alt = toTurkishUpperCase(cleanedParts[2]);
              if (!ALL_SIZES.includes(alt)) alt = 'YOK';
            }
            if (cleanedParts.length >= 4) {
              corapVal = toTurkishUpperCase(cleanedParts[3]);
              if (!SOCKS_OPTIONS.includes(corapVal)) corapVal = 'YOK';
            }
          }
        }

        if (name) {
          parsedItems.push({
            id: Math.random().toString(36).substring(2, 9),
            no,
            adet: adetVal,
            adiSoyadi: name,
            ustBedeni: ust,
            altBedeni: alt,
            corap: corapVal
          });
        }
      });

      if (parsedItems.length === 0) {
        setPasteError('Liste formatı anlaşılamadı. Lütfen örneklere uygun biçimde girin.');
        return;
      }

      // Merge on active lines
      const activeCurrent = items.filter(item => item.adiSoyadi.trim() !== '');
      setItems([...activeCurrent, ...parsedItems]);
      setPasteContent('');
      setPasteError('');
      setShowPasteZone(false);
    } catch (e) {
      setPasteError('Ayrıştırma sırasında beklenmeyen bir hata oluştu.');
    }
  };

  // Direct Excel download logic 
  const handleExportExcel = () => {
    const finalItems = items.filter(item => 
      item.no.trim() !== '' || 
      item.adiSoyadi.trim() !== '' || 
      item.ustBedeni !== 'YOK' || 
      item.altBedeni !== 'YOK' ||
      (item.corap && item.corap !== 'YOK')
    );

    if (finalItems.length === 0) {
      alert('İndirmek için lütfen aşağıdaki tabloya en az bir satır oyuncu bilgisi giriniz.');
      return;
    }

    // Build imalat layout array (beautiful format for team manufacturing department)
    const excelRows = [
      { 'A': 'KİTFORMA İMALAT SİPARİŞ FORMU', 'B': '', 'C': '', 'D': '', 'E': '', 'F': '', 'G': '' },
      { 'A': 'Takım / Kulüp Adı / Cari Adı:', 'B': toTurkishUpperCase(teamName.trim() || 'BELİRTİLMEDİ'), 'C': '', 'D': '', 'E': '', 'F': '', 'G': '' },
      { 'A': 'Yetkili:', 'B': toTurkishUpperCase(customerName.trim() || 'BELİRTİLMEDİ'), 'C': '', 'D': '', 'E': '', 'F': '', 'G': '' },
      { 'A': 'İrtibat:', 'B': customerPhone.trim() || 'BELİRTİLMEDİ', 'C': '', 'D': '', 'E': '', 'F': '', 'G': '' },
      { 'A': 'Toplam Üst Forma Sayısı:', 'B': `${totalUstCount} Adet`, 'C': '', 'D': '', 'E': '', 'F': '', 'G': '' },
      { 'A': 'Toplam Şort Sayısı:', 'B': `${totalAltCount} Adet`, 'C': '', 'D': '', 'E': '', 'F': '', 'G': '' },
      { 'A': 'Toplam Çorap:', 'B': `${totalCorapCount} Adet`, 'C': '', 'D': '', 'E': '', 'F': '', 'G': '' },
      { 'A': '', 'B': '', 'C': '', 'D': '', 'E': '', 'F': '', 'G': '' }, // Sep Line
      { 'A': 'SIRA', 'B': 'NUMARA', 'C': 'ADET', 'D': 'ADI SOYADI', 'E': 'ÜST BEDEN', 'F': 'ALT BEDEN', 'G': 'ÇORAP' }
    ];

    finalItems.forEach((item, index) => {
      excelRows.push({
        'A': (index + 1).toString(),
        'B': item.no || '-',
        'C': (item.adet || 1).toString(),
        'D': toTurkishUpperCase(item.adiSoyadi),
        'E': item.ustBedeni,
        'F': item.altBedeni,
        'G': item.corap || 'YOK'
      });
    });

    const worksheet = XLSX.utils.json_to_sheet(excelRows, { skipHeader: true });

    // Set auto-columns sizing
    worksheet['!cols'] = [
      { wch: 8 },  // SIRA
      { wch: 15 }, // NUMARA
      { wch: 10 }, // ADET
      { wch: 35 }, // ADI SOYADI
      { wch: 16 }, // ÜST
      { wch: 16 }, // ALT
      { wch: 18 }  // ÇORAP
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sipariş Listesi');

    // Create file and download
    const rawTeam = teamName.trim() || 'KitForma';
    const cleanName = toTurkishUpperCase(rawTeam).replace(/[^a-zA-Z0-9çğışöüÇĞİŞÖÜ]/g, '_');
    const filename = `${cleanName}_Siparis_Listesi.xlsx`;

    XLSX.writeFile(workbook, filename);
  };

  // Clear entire table to start from scratch
  const handleClearTable = () => {
    if (window.confirm('Tüm sipariş tablosunu temizlemek istediğinizden emin misiniz?')) {
      setItems([{ id: '1', no: '', adet: 1, adiSoyadi: '', ustBedeni: 'YOK', altBedeni: 'YOK', corap: 'YOK' }]);
    }
  };

  return (
    <div className="w-full space-y-8" id="siparis-formu-root">

      {/* COPING TOOL BULK PASTE DRAW */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-purple-50 text-purple-650 p-2.5 rounded-lg shrink-0">
              <Sparkles className="w-5 h-5 text-purple-600 animate-pulse" />
            </div>
            <div>
              <h4 className="font-display font-bold text-sm text-slate-850">Excel veya WhatsApp'tan Kopyalayıp Yapıştır</h4>
              <p className="text-[11px] text-slate-400 font-sans">Uzun oyuncu listelerini tek seferde aktarmak için burayı kullanın.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowPasteZone(!showPasteZone)}
            className="bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold font-sans text-xs px-4 py-2 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer self-start sm:self-auto select-none"
          >
            <Clipboard className="w-3.5 h-3.5" />
            {showPasteZone ? 'Biçimi Kapat' : 'Hızlı Giriş Panelini Aç'}
          </button>
        </div>

        {showPasteZone && (
          <div className="border-t border-dashed border-slate-200 mt-4 pt-4">
            <p className="text-xs text-slate-500 font-sans mb-3">
              Aşağıdaki kutuya bilgileri her satıra bir oyuncu gelecek şekilde yazıp yapıştırın. Sistem girdilerinizden numara, isim, beden ve çorapları otomatik eşleştirecektir.
              <br />
              <span className="font-semibold text-slate-700">Örnek Format:</span> 
              <code className="text-indigo-650 font-mono text-[10px] ml-1 bg-indigo-50 px-1.5 py-0.5 rounded">10 - AHMET YILMAZ - XL - YOK</code> veya 
              <code className="text-indigo-650 font-mono text-[10px] ml-1 bg-indigo-50 px-1.5 py-0.5 rounded">7, MUSTAFA CAN, M, L, SİYAH</code>
            </p>
            
            <textarea
              rows={4}
              placeholder="📋 Örnek:&#10;10 - HAKAN SANSAL - XL - YOK - SİYAH&#10;7 - SABRİ GÜNEL - 5XL - YOK - GRİ&#10;1 - RÜŞTÜ ARSLAN - XXL - XL - BEYAZ"
              value={pasteContent}
              onChange={(e) => setPasteContent(e.target.value)}
              className="w-full bg-slate-50 font-mono text-xs border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all placeholder:text-slate-400 placeholder:text-xs"
            />
            
            {pasteError && (
              <p className="text-[11px] text-red-500 font-medium mt-1 uppercase">{pasteError}</p>
            )}

            <div className="flex justify-end gap-2 mt-3">
              <button
                type="button"
                onClick={() => {
                  setShowPasteZone(false);
                  setPasteError('');
                }}
                className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700 cursor-pointer"
              >
                İptal
              </button>
              <button
                type="button"
                onClick={handleParsePaste}
                className="bg-purple-600 hover:bg-purple-700 text-white font-sans text-xs font-bold px-4 py-1.5 rounded-lg transition-all cursor-pointer"
              >
                Kayıtları Ayrıştır ve Ekle
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MAIN DATA GRID TABLE - SLEEK INTERFACE THEME */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden">
        
        {/* Table Banner details */}
        <div className="bg-slate-900 px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-white">
          <div className="space-y-0.5">
            <h3 className="font-display font-bold text-base text-white flex items-center gap-1.5">
              <ListOrdered className="w-4 h-4 text-indigo-400" />
              Oyuncu Bilgileri Listesi
            </h3>
            <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">
              {teamName || 'YENİ TAKIM'} {customerName ? `• ${customerName}` : ''}
            </p>
          </div>
          
          {/* Detailed summary widget at top of table too */}
          <div className="flex flex-wrap items-center gap-4 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 self-start sm:self-auto">
            <div className="text-center sm:text-right">
              <span className="text-[9px] uppercase text-slate-400 font-bold block leading-none">Forma (Üst)</span>
              <span className="text-xs font-mono font-bold text-indigo-300 leading-none">{totalUstCount} Adet</span>
            </div>
            
            <div className="border-l border-slate-700 h-6"></div>

            <div className="text-center sm:text-right">
              <span className="text-[9px] uppercase text-slate-400 font-bold block leading-none">Şort (Alt)</span>
              <span className="text-xs font-mono font-bold text-sky-300 leading-none">{totalAltCount} Adet</span>
            </div>

            <div className="border-l border-slate-700 h-6"></div>

            <div className="text-center sm:text-right">
              <span className="text-[9px] uppercase text-slate-400 font-bold block leading-none">Çorap</span>
              <span className="text-xs font-mono font-bold text-amber-300 leading-none">{totalCorapCount} Adet</span>
            </div>

            <div className="border-l border-slate-700 h-6"></div>

            <div className="text-center sm:text-right">
              <span className="text-[9px] uppercase text-slate-400 font-bold block leading-none">Genel Adet</span>
              <span className="text-xs font-mono font-bold text-emerald-450 leading-none">{totalUniformCount} Adet</span>
            </div>
          </div>
        </div>

        {/* Visual Spreadsheet Grid Layout */}
        <div className="overflow-x-auto w-full">
          <table className="w-full min-w-[850px] border-collapse relative">
            <thead>
              <tr className="bg-slate-100 text-slate-600 text-[11px] uppercase tracking-wider font-bold border-b border-slate-200">
                <th className="w-12 border-r border-slate-200 py-3 text-center">Sıra</th>
                <th className="w-[100px] border-r border-slate-200 py-3 text-center">SIRT NO</th>
                <th className="w-[80px] border-r border-slate-200 py-3 text-center">ADET</th>
                <th className="border-r border-slate-200 py-3 px-4 text-left">OYUNCU ADI SOYADI</th>
                <th className="w-[130px] border-r border-slate-200 py-3 text-center">ÜST BEDEN</th>
                <th className="w-[130px] border-r border-slate-200 py-3 text-center">ALT ŞORT BEDEN</th>
                <th className="w-[140px] border-r border-slate-200 py-3 text-center">ÇORAP</th>
                <th className="w-[100px] border-r border-slate-200 py-3 text-center">DURUM</th>
                <th className="w-12 py-3 text-center">Kaldır</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => {
                const hasName = item.adiSoyadi.trim() !== '';
                return (
                  <tr 
                    key={item.id} 
                    className={`hover:bg-slate-50 transition-colors border-b border-slate-100 ${
                      hasName ? 'bg-indigo-50/15' : 'bg-transparent'
                    }`}
                  >
                    {/* Index */}
                    <td className="border-r border-slate-150 text-slate-400 font-mono text-[11px] text-center font-bold bg-slate-50/50">
                      {(index + 1).toString().padStart(2, '0')}
                    </td>

                    {/* Uniform Back Number (NO) */}
                    <td className="border-r border-slate-150 p-1 text-center bg-transparent">
                      <input
                        type="text"
                        placeholder="10"
                        value={item.no}
                        maxLength={3}
                        onChange={(e) => handleItemChange(item.id, 'no', e.target.value)}
                        className="w-full bg-slate-50/40 hover:bg-slate-100/55 focus:bg-white text-center text-slate-900 font-bold font-mono py-2 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 border-0 text-sm"
                      />
                    </td>

                    {/* Order Volume Quantity (ADET) */}
                    <td className="border-r border-slate-150 p-1 text-center bg-transparent">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleItemChange(item.id, 'adet', (item.adet || 1) - 1)}
                          className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-xs select-none cursor-pointer"
                        >
                          -
                        </button>
                        <span className="w-5 text-center text-slate-800 font-mono font-bold text-xs">
                          {item.adet}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleItemChange(item.id, 'adet', (item.adet || 1) + 1)}
                          className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-xs select-none cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </td>

                    {/* Name fields + click-to-be "İSİMSİZ" badge choice */}
                    <td className="border-r border-slate-150 p-1">
                      <div className="flex items-center gap-1.5 w-full">
                        <input
                          type="text"
                          placeholder="ÖRN: MEHMET CAN"
                          value={item.adiSoyadi}
                          onChange={(e) => handleItemChange(item.id, 'adiSoyadi', e.target.value)}
                          className="flex-grow bg-slate-50/40 hover:bg-slate-100/55 focus:bg-white px-3 py-2 text-slate-800 font-bold font-sans placeholder:font-normal placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded border-0 text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => handleItemChange(item.id, 'adiSoyadi', item.adiSoyadi === 'İSİMSİZ' ? '' : 'İSİMSİZ')}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all select-none cursor-pointer ${
                            item.adiSoyadi === 'İSİMSİZ' 
                              ? 'bg-indigo-600 border-indigo-700 text-white shadow-sm' 
                              : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-600'
                          }`}
                        >
                          İSİMSİZ
                        </button>
                      </div>
                    </td>

                    {/* UPPER TOP SIZE - Removed the hyphen "-" option */}
                    <td className="border-r border-slate-150 p-1 text-center">
                      <select
                        value={item.ustBedeni}
                        onChange={(e) => handleItemChange(item.id, 'ustBedeni', e.target.value)}
                        className="bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer w-full max-w-[120px]"
                      >
                        <option value="YOK">YOK</option>
                        <optgroup label="Yetişkin Bedenler (XS - 5XL)">
                          {SIZES_ADULT.map(sz => <option key={`ust-ad-${sz}`} value={sz}>{sz}</option>)}
                        </optgroup>
                        <optgroup label="Çocuk Bedenleri (4 - 14 Yaş)">
                          {SIZES_CHILD.map(sz => <option key={`ust-ch-${sz}`} value={sz}>{sz}</option>)}
                        </optgroup>
                      </select>
                    </td>

                    {/* LOWER SHORTS SIZE - Removed the hyphen "-" option */}
                    <td className="border-r border-slate-150 p-1 text-center">
                      <select
                        value={item.altBedeni}
                        onChange={(e) => handleItemChange(item.id, 'altBedeni', e.target.value)}
                        className="bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer w-full max-w-[120px]"
                      >
                        <option value="YOK">YOK</option>
                        <optgroup label="Yetişkin Bedenler (XS - 5XL)">
                          {SIZES_ADULT.map(sz => <option key={`alt-ad-${sz}`} value={sz}>{sz}</option>)}
                        </optgroup>
                        <optgroup label="Çocuk Bedenleri (4 - 14 Yaş)">
                          {SIZES_CHILD.map(sz => <option key={`alt-ch-${sz}`} value={sz}>{sz}</option>)}
                        </optgroup>
                      </select>
                    </td>

                    {/* SOCKS OPTION */}
                    <td className="border-r border-slate-150 p-1 text-center">
                      <select
                        value={item.corap || 'YOK'}
                        onChange={(e) => handleItemChange(item.id, 'corap', e.target.value)}
                        className="bg-slate-50 border border-slate-200 rounded px-2 py-1.5 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer w-full max-w-[130px]"
                      >
                        {SOCKS_OPTIONS.map(opt => (
                          <option key={`socks-opt-${opt}`} value={opt}>
                            {opt === 'YOK' ? 'YOK (Çorapsız)' : opt}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* STATUS APPROVED CHECKMARK ("onay tiki olmalı yeşil bir hata yok ise") */}
                    <td className="border-r border-slate-150 p-1 text-center font-bold">
                      {hasName ? (
                        <div className="flex items-center justify-center gap-1 text-emerald-600 font-sans font-bold text-xs">
                          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                          <span>Hazır</span>
                        </div>
                      ) : (
                        <span className="text-slate-300 font-sans text-xs">-</span>
                      )}
                    </td>

                    {/* Delete Icon Button cell */}
                    <td className="p-1 text-center">
                      <button
                        type="button"
                        onClick={() => handleDeleteRow(item.id)}
                        className="text-slate-400 hover:text-red-500 p-1.5 rounded hover:bg-red-50 transition-colors cursor-pointer select-none"
                        title="Satırı Sil"
                      >
                        <Trash2 className="w-4 h-4 mx-auto" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* BOTTOM TOOLBAR ACTION BAR */}
        <div className="bg-slate-50 border-t border-slate-200 p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleAddRow}
              className="bg-slate-900 hover:bg-slate-800 text-white font-sans text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 cursor-pointer transition-all active:scale-[0.98] shadow-sm select-none"
            >
              <PlusCircle className="w-4 h-4 text-slate-400" />
              Yeni Satır Ekle
            </button>

            <button
              type="button"
              onClick={() => handlePulseBlankRows(5)}
              className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-sans text-xs font-bold px-3 py-2.5 rounded-xl cursor-pointer transition-all active:scale-[0.98] select-none"
            >
              + 5 Satır Ekle
            </button>

            <button
              type="button"
              onClick={() => handlePulseBlankRows(10)}
              className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-sans text-xs font-bold px-3 py-2.5 rounded-xl cursor-pointer transition-all active:scale-[0.98] select-none"
            >
              + 10 Satır Ekle
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleClearTable}
              className="border border-slate-200 hover:bg-red-50 text-slate-500 hover:text-red-650 font-sans text-xs font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer mr-1 select-none"
            >
              Tüm Tabloyu Temizle
            </button>

            <button
              type="button"
              onClick={handleExportExcel}
              className="bg-indigo-650 lg:bg-indigo-600 hover:bg-indigo-700 text-white font-sans font-bold px-6 py-2.5 rounded-xl shadow-lg shadow-indigo-100 flex items-center gap-2 cursor-pointer transition-all active:scale-[0.98] select-none"
            >
              <FileSpreadsheet className="w-4 h-4" />
              EXCEL OLARAK İNDİR (.xlsx)
            </button>
          </div>
        </div>

      </div>

      {/* DETAILED RATIO TOTAL RECAP WIDGET ("en altta toplam adetler vs yazmalı şort sayısı üst sayısı") */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        
        <div className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-indigo-50/70 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
            <Shirt className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block font-mono">Toplam Üst Forma Sayısı</span>
            <span className="text-xl font-mono font-black text-slate-900">{totalUstCount} <span className="text-xs font-sans font-bold text-slate-400">Adet</span></span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-sky-50/70 border border-sky-100 text-sky-600 flex items-center justify-center shrink-0">
            <Scissors className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block font-mono">Toplam Şort Sayısı</span>
            <span className="text-xl font-mono font-black text-slate-900">{totalAltCount} <span className="text-xs font-sans font-bold text-slate-400">Adet</span></span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-amber-50/70 border border-amber-100 text-amber-600 flex items-center justify-center shrink-0">
            <Info className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block font-mono">Toplam Çorap</span>
            <span className="text-xl font-mono font-black text-slate-900">{totalCorapCount} <span className="text-xs font-sans font-bold text-slate-400">Adet</span></span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-emerald-50/70 border border-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block font-mono">Genel Sipariş Toplamı</span>
            <span className="text-xl font-mono font-black text-emerald-600">{totalUniformCount} <span className="text-xs font-sans font-bold text-emerald-500">Adet</span></span>
          </div>
        </div>

      </div>

    </div>
  );
}
