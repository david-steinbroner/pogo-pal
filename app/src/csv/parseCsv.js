/**
 * PoGO Pal - CSV Parsing
 * Handles parsing CSV text into structured data
 */

// Global meta storage for debug display
window.__pogoCSVMeta = null;

/**
 * Parse a locale-tolerant number (handles "93,3" or "1.234,5" formats)
 */
export function parseNumber(v) {
  if (v == null) return null;
  let s = String(v).trim();
  if (!s) return null;

  // Locale tolerance:
  // - "93,3" -> 93.3
  // - "1.234,5" -> 1234.5
  // - "1,234.5" -> 1234.5
  if (s.includes(',') && !s.includes('.')) {
    s = s.replace(',', '.');
  } else if (s.includes(',') && s.includes('.')) {
    const lastComma = s.lastIndexOf(',');
    const lastDot = s.lastIndexOf('.');
    if (lastComma > lastDot) {
      // dot as thousands, comma as decimal
      s = s.replace(/\./g, '').replace(',', '.');
    } else {
      // comma as thousands
      s = s.replace(/,/g, '');
    }
  }

  const n = Number(s.replace(/[^0-9.\-]/g, ''));
  return Number.isFinite(n) ? n : null;
}

/**
 * Normalize species name (remove shadow/purified prefixes, forms, etc.)
 */
export function normalizeSpeciesName(raw) {
  let s = String(raw || '').trim();

  // Common prefixes / tags
  s = s.replace(/^shadow\s+/i, '').replace(/^purified\s+/i, '');
  s = s.replace(/\bshadow\b/i, '').replace(/\bpurified\b/i, '').trim();

  // Remove form/costume in parentheses: "Giratina (Altered)"
  s = s.replace(/\s*\([^\)]*\)\s*/g, ' ').trim();

  // Normalize separators
  s = s.replace(/\s+–\s+/g, ' - ').replace(/\s+—\s+/g, ' - ');

  // If the string contains a form after a dash, keep the base species before the dash
  if (s.includes(' - ')) {
    s = s.split(' - ')[0].trim();
  }

  // Strip stray symbols
  s = s.replace(/[★☆]/g, '').trim();

  return s;
}

/**
 * Create canonical key for pokedex lookup
 */
export function canonKey(name) {
  if (!name) return '';
  const cleaned = normalizeSpeciesName(String(name));
  const noAccents = cleaned.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
  return noAccents
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[\(\)\[\]\{\}\.!,]/g, '')
    .replace(/[\s\-_:]+/g, '')
    .trim();
}

/**
 * Parse CSV text into array of row objects
 * Uses PapaParse if available, falls back to simple parser
 */
export function parseCSV(text) {
  const raw = String(text || '');

  // Prefer PapaParse if available (more robust: quotes, commas, odd delimiters)
  if (window.Papa && typeof window.Papa.parse === 'function') {
    const res = window.Papa.parse(raw, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false,
      transformHeader: (h) => String(h || '').replace(/^\uFEFF/, '').trim()
    });

    if (res.errors && res.errors.length) {
      const sample = res.errors.slice(0, 3)
        .map(e => `${e.code || 'Error'} at row ${e.row}: ${e.message}`)
        .join(' | ');
      throw new Error(`CSV parse error: ${sample}`);
    }

    const headers = (res.meta && Array.isArray(res.meta.fields))
      ? res.meta.fields
      : Object.keys((res.data && res.data[0]) || {});

    window.__pogoCSVMeta = {
      headers,
      delimiter: (res.meta && res.meta.delimiter) ? res.meta.delimiter : null,
      rows: Array.isArray(res.data) ? res.data.length : 0,
      parseEngine: 'papaparse'
    };

    return Array.isArray(res.data) ? res.data : [];
  }

  // Fallback: small, quote-aware CSV parser
  const rows = [];
  const lines = raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter(l => l.trim().length);

  if (!lines.length) {
    window.__pogoCSVMeta = {
      headers: [],
      delimiter: ',',
      rows: 0,
      parseEngine: 'fallback'
    };
    return [];
  }

  function splitLine(line) {
    const out = [];
    let cur = '';
    let inQ = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQ && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQ = !inQ;
        }
      } else if (ch === ',' && !inQ) {
        out.push(cur);
        cur = '';
      } else {
        cur += ch;
      }
    }
    out.push(cur);
    return out.map(s => s.trim());
  }

  const headers = splitLine(lines[0]).map(h => h.replace(/^\uFEFF/, ''));
  window.__pogoCSVMeta = {
    headers,
    delimiter: ',',
    rows: Math.max(0, lines.length - 1),
    parseEngine: 'fallback'
  };

  for (let li = 1; li < lines.length; li++) {
    const cols = splitLine(lines[li]);
    if (cols.length === 1 && !cols[0]) continue;
    const obj = {};
    for (let i = 0; i < headers.length; i++) {
      obj[headers[i]] = cols[i] ?? '';
    }
    rows.push(obj);
  }

  return rows;
}
