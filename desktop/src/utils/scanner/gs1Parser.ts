/**
 * POS/WMS tizimlari uchun GS1 Parser
 * GS1 DataMatrix, Digital Link, EAN, QR ni tahlil qiladi
 * 
 * Zavoddan yangi mahsulotlar qo'shishda ishlatiladi
 * Haqiqiylikni tekshirmaydi, sertifikatsiya haqida da'vo qilmaydi
 */

// GS (Group Separator) - ASCII 29
const GS = '\x1D';

// Tahlil natijasi
export interface GS1ParseResult {
  // Asosiy maydonlar
  gtin?: string;          // AI 01 - GTIN-14
  serial?: string;        // AI 21 - Seriya raqami
  batch?: string;         // AI 10 - Partiya raqami
  expiry?: string;        // AI 17 - Yaroqlilik muddati (YYMMDD)
  
  // Qo'shimcha maydonlar
  productionDate?: string; // AI 11 - Ishlab chiqarilgan sana
  weight?: string;         // AI 310x - Og'irlik
  
  // Asl ma'lumotlar
  raw: string;
  barcode: string;         // Qidirish uchun kod (GTIN yoki raw)
  
  // Formatlangan ma'lumotlar
  expiryFormatted?: string; // DD.MM.YYYY
}

/**
 * Har qanday kodni tahlil qiladi va ma'lumotlarni ajratib oladi
 * Qo'llab-quvvatlaydi: GS1 DataMatrix, Digital Link, EAN, QR
 */
export function parseGS1Code(raw: string): GS1ParseResult {
  if (!raw) {
    return { raw: '', barcode: '' };
  }

  const result: GS1ParseResult = {
    raw,
    barcode: raw.trim(),
  };

  // Tahlil qilish uchun boshqaruv belgilarini olib tashlash
  const cleaned = raw.replace(/[\x00-\x1F]/g, '');

  // 1. GS1 Digital Link (URL)
  if (cleaned.startsWith('http')) {
    parseDigitalLink(cleaned, result);
    return result;
  }

  // 2. GS1 DataMatrix (AI mavjud)
  if (/01\d{14}/.test(cleaned)) {
    parseDataMatrix(raw, result);
    return result;
  }

  // 3. Oddiy EAN-13
  if (/^\d{13}$/.test(cleaned)) {
    result.gtin = '0' + cleaned;
    result.barcode = cleaned;
    return result;
  }

  // 4. Oddiy EAN-8
  if (/^\d{8}$/.test(cleaned)) {
    result.gtin = '000000' + cleaned;
    result.barcode = cleaned;
    return result;
  }

  // 5. GTIN-14
  if (/^\d{14}$/.test(cleaned)) {
    result.gtin = cleaned;
    result.barcode = cleaned;
    return result;
  }

  // 6. Raqamli kod bilan QR
  const numericMatch = cleaned.match(/\d{8,14}/);
  if (numericMatch) {
    result.barcode = numericMatch[0];
  }

  return result;
}

/**
 * GS1 Digital Link URL ni tahlil qiladi
 */
function parseDigitalLink(url: string, result: GS1ParseResult): void {
  try {
    const u = new URL(url);
    const parts = u.pathname.split('/').filter(Boolean);

    for (let i = 0; i < parts.length - 1; i += 2) {
      const ai = parts[i];
      const value = decodeURIComponent(parts[i + 1] || '');

      switch (ai) {
        case '01':
          result.gtin = normalizeGTIN(value);
          result.barcode = result.gtin;
          break;
        case '21':
          result.serial = value;
          break;
        case '10':
          result.batch = value;
          break;
        case '17':
          result.expiry = value;
          result.expiryFormatted = formatExpiry(value);
          break;
      }
    }

    // Query parametrlarini ham tekshirish
    if (u.searchParams.has('01')) {
      result.gtin = normalizeGTIN(u.searchParams.get('01')!);
      result.barcode = result.gtin;
    }
    if (u.searchParams.has('21')) result.serial = u.searchParams.get('21')!;
    if (u.searchParams.has('10')) result.batch = u.searchParams.get('10')!;
    if (u.searchParams.has('17')) {
      result.expiry = u.searchParams.get('17')!;
      result.expiryFormatted = formatExpiry(result.expiry);
    }
  } catch {
    // Noto'g'ri URL
  }
}


/**
 * GS1 DataMatrix ni tahlil qiladi
 */
function parseDataMatrix(raw: string, result: GS1ParseResult): void {
  // ]d2 prefiksini olib tashlash (agar mavjud bo'lsa)
  let data = raw.replace(/^\]d2/i, '');
  
  // GS ni split uchun markerga almashtirish
  const parts = data.split(GS);
  
  for (const part of parts) {
    parseAI(part, result);
  }
  
  // Agar GTIN topilsa — barcode sifatida ishlatish
  if (result.gtin) {
    result.barcode = result.gtin;
  }
}

/**
 * Application Identifier ni tahlil qiladi
 */
function parseAI(data: string, result: GS1ParseResult): void {
  if (!data || data.length < 2) return;

  // AI 01 - GTIN (14 raqam)
  const gtin = data.match(/01(\d{14})/);
  if (gtin) {
    result.gtin = gtin[1];
  }

  // AI 21 - Serial (o'zgaruvchan uzunlik)
  const serial = data.match(/21([^\x1D]+)/);
  if (serial) {
    result.serial = serial[1];
  }

  // AI 10 - Batch/Lot (o'zgaruvchan uzunlik)
  const batch = data.match(/10([^\x1D]+)/);
  if (batch) {
    result.batch = batch[1];
  }

  // AI 17 - Yaroqlilik muddati (6 raqam YYMMDD)
  const expiry = data.match(/17(\d{6})/);
  if (expiry) {
    result.expiry = expiry[1];
    result.expiryFormatted = formatExpiry(expiry[1]);
  }

  // AI 11 - Ishlab chiqarilgan sana (6 raqam YYMMDD)
  const prodDate = data.match(/11(\d{6})/);
  if (prodDate) {
    result.productionDate = prodDate[1];
  }
}

/**
 * GTIN ni 14 raqamga normalizatsiya qiladi
 */
function normalizeGTIN(gtin: string): string {
  const digits = gtin.replace(/\D/g, '');
  if (digits.length === 13) return '0' + digits;
  if (digits.length === 8) return '000000' + digits;
  if (digits.length === 12) return '00' + digits;
  return digits.padStart(14, '0');
}

/**
 * Sanani YYMMDD dan DD.MM.YYYY ga formatlaydi
 */
function formatExpiry(yymmdd: string): string {
  if (!yymmdd || yymmdd.length !== 6) return '';
  
  const yy = parseInt(yymmdd.substring(0, 2), 10);
  const mm = yymmdd.substring(2, 4);
  const dd = yymmdd.substring(4, 6);
  
  // 00-49 = 2000-2049, 50-99 = 1950-1999
  const year = yy < 50 ? 2000 + yy : 1900 + yy;
  
  return `${dd}.${mm}.${year}`;
}

/**
 * Sanani input[type=date] uchun ISO formatga o'zgartiradi
 */
export function expiryToISO(yymmdd: string): string {
  if (!yymmdd || yymmdd.length !== 6) return '';
  
  const yy = parseInt(yymmdd.substring(0, 2), 10);
  const mm = yymmdd.substring(2, 4);
  const dd = yymmdd.substring(4, 6);
  
  const year = yy < 50 ? 2000 + yy : 1900 + yy;
  
  return `${year}-${mm}-${dd}`;
}
