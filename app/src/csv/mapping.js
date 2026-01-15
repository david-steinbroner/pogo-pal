/**
 * PoGO Pal - CSV Mapping
 * Header detection and field extraction for various CSV formats
 */

import { parseNumber, normalizeSpeciesName, canonKey } from './parseCsv.js';
import { TYPES } from '../state.js';
import { POKEDEX_TYPES } from './pokedex.js';

// Helper: strip diacritics
function _stripDiacritics(s) {
  try {
    return String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  } catch (e) {
    return String(s || '');
  }
}

// Helper: normalize header for matching
function _normHeader(s) {
  return _stripDiacritics(s).trim().toLowerCase().replace(/[^a-z0-9%]/g, '');
}

// Helper: find first matching header from candidates
function _firstHeaderMatch(headers, candidates) {
  const normed = headers.map(h => ({ h, n: _normHeader(h) }));
  for (const cand of candidates) {
    if (cand instanceof RegExp) {
      const hit = headers.find(h => cand.test(String(h)));
      if (hit) return hit;
      continue;
    }
    const cn = _normHeader(cand);
    // exact match
    let hit = normed.find(x => x.n === cn);
    if (hit) return hit.h;
    // contains match
    hit = normed.find(x => x.n.includes(cn) || cn.includes(x.n));
    if (hit) return hit.h;
  }
  return null;
}

/**
 * Detect CSV column mapping from headers
 */
export function detectCSVMapping(headers) {
  const h = Array.isArray(headers) ? headers : [];
  const m = {};

  m.name = _firstHeaderMatch(h, [
    'Pokemon', 'Pokémon', 'Name', 'Species', 'Pokemon Name', 'Pokémon Name',
    /pokemon/i, /species/i, /name/i
  ]);
  m.cp = _firstHeaderMatch(h, ['CP', 'Combat Power', 'CombatPower', /\bcp\b/i]);
  m.ivPercent = _firstHeaderMatch(h, [
    'IV%', 'IV %', 'IV Percent', 'IVPercent', 'IV Percentage', /iv\s*%/i
  ]);
  m.ivString = _firstHeaderMatch(h, [
    'IVs', 'IVs (Atk/Def/Sta)', 'IVs (A/D/S)', 'IV Spread', 'IV (A/D/S)',
    /\bivs\b/i, /atk\s*\/\s*def\s*\/\s*sta/i, /atk\/def\/sta/i
  ]);
  m.atkIV = _firstHeaderMatch(h, [
    'Atk IV', 'Attack IV', 'ATK IV', 'IV Atk', 'IV Attack',
    /atk\s*iv/i, /attack\s*iv/i
  ]);
  m.defIV = _firstHeaderMatch(h, [
    'Def IV', 'Defense IV', 'DEF IV', 'IV Def', 'IV Defense',
    /def\s*iv/i, /defense\s*iv/i
  ]);
  m.staIV = _firstHeaderMatch(h, [
    'Sta IV', 'Stamina IV', 'STA IV', 'IV Sta', 'IV Stamina', 'HP IV', 'IV HP',
    /sta\s*iv/i, /stamina\s*iv/i, /hp\s*iv/i
  ]);
  m.type1 = _firstHeaderMatch(h, [
    'Type 1', 'Type1', 'Primary Type', 'PrimaryType',
    /type\s*1/i, /primary\s*type/i
  ]);
  m.type2 = _firstHeaderMatch(h, [
    'Type 2', 'Type2', 'Secondary Type', 'SecondaryType',
    /type\s*2/i, /secondary\s*type/i
  ]);
  m.types = _firstHeaderMatch(h, ['Types', 'Typing', /\btypes\b/i, /typing/i]);
  m.fastMove = _firstHeaderMatch(h, [
    'Fast Move', 'Quick Move', 'Fast Attack', 'Fast',
    /fast\s*move/i, /quick\s*move/i
  ]);
  m.chargedMove = _firstHeaderMatch(h, [
    'Charged Move', 'Charge Move', 'Charge', 'Charged',
    /charged\s*move/i, /charge\s*move/i
  ]);

  return m;
}

/**
 * Get types for a species name from pokedex
 */
export function typesForName(name) {
  const key = canonKey(name);
  const t = POKEDEX_TYPES[key];
  return Array.isArray(t) ? t : [];
}

/**
 * Normalize type label to match our type names
 */
export function normalizeTypeLabel(raw) {
  const s = String(raw || '').trim();
  if (!s) return null;
  // Accept "WATER", "water", "Water"
  const t = s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
  return TYPES.some(x => x.name === t) ? t : null;
}

/**
 * Extract types from a CSV row
 */
export function extractTypesFromRow(row, fallbackName, mapping) {
  const t1Key = mapping && mapping.type1 ? mapping.type1 : null;
  const t2Key = mapping && mapping.type2 ? mapping.type2 : null;
  const typesKey = mapping && mapping.types ? mapping.types : null;

  const t1 = normalizeTypeLabel(
    t1Key ? row[t1Key] : (row['Type 1'] ?? row['Type1'] ?? row['type1'] ?? row['Primary Type'] ?? row['primary_type'])
  );
  const t2 = normalizeTypeLabel(
    t2Key ? row[t2Key] : (row['Type 2'] ?? row['Type2'] ?? row['type2'] ?? row['Secondary Type'] ?? row['secondary_type'])
  );

  if (t1 || t2) {
    return [t1, t2].filter(Boolean);
  }

  // Try combined field: "Water / Flying" or "Water,Flying"
  const combined =
    (typesKey ? row[typesKey] : null) ??
    row['Types'] ?? row['Type'] ?? row['Typing'] ?? row['types'] ?? row['type'] ?? '';

  if (combined) {
    const parts = String(combined)
      .split(/[\/|,;·]/g)
      .map(p => normalizeTypeLabel(p))
      .filter(Boolean);
    if (parts.length) return Array.from(new Set(parts)).slice(0, 2);
  }

  // Fallback to local species -> types map
  return typesForName(fallbackName);
}

/**
 * Extract species name from a CSV row
 */
export function extractSpeciesName(row, mapping) {
  const mapped = (mapping && mapping.name) ? row[mapping.name] : null;
  const mappedStr = String(mapped || '').trim();
  if (mappedStr) return mappedStr;

  const candidates = [
    row['Name'], row['Pokemon'], row['Pokémon'], row['Species'], row['Species Name'], row['SpeciesName'],
    row['Pokemon Name'], row['Pokémon Name'], row['PokemonName'], row['pokemon'], row['pokemon_name'], row['species']
  ];

  for (const c of candidates) {
    const s = String(c || '').trim();
    if (s) return s;
  }
  return '';
}

/**
 * Compute IV percentage from a CSV row
 */
export function computeIVPct(row, mapping) {
  // Prefer mapped headers, then fall back to common names
  const ivPctRaw = (mapping && mapping.ivPercent) ? row[mapping.ivPercent] : null;
  const ivStrRaw = (mapping && mapping.ivString) ? row[mapping.ivString] : null;

  // Some exports include an explicit IV% column
  const ivCol =
    ivPctRaw ??
    row['IV%'] ?? row['IV %'] ?? row['IV Percent'] ?? row['IVPercent'] ?? row['IV Percentage'] ??
    row['iv%'] ?? row['iv percent'];

  // Some exports put a combined IV string like "15/14/13"
  const ivMaybeCombined =
    ivStrRaw ??
    row['IVs'] ?? row['IV'] ?? row['Iv'] ?? row['iv'];

  const combined = (v) => {
    if (v == null) return null;
    const s = String(v).trim();
    const mm = s.match(/^\s*(\d{1,2})\s*\/\s*(\d{1,2})\s*\/\s*(\d{1,2})\s*$/);
    if (!mm) return null;
    const a = Number(mm[1]), d = Number(mm[2]), st = Number(mm[3]);
    if (!Number.isFinite(a) || !Number.isFinite(d) || !Number.isFinite(st)) return null;
    return Math.round(((a + d + st) / 45) * 100);
  };

  const combinedPct = combined(ivMaybeCombined);
  if (combinedPct != null) return Math.max(0, Math.min(100, combinedPct));

  // Percent column if present
  const ivPct = parseNumber(ivCol);
  if (ivPct != null) return Math.max(0, Math.min(100, ivPct));

  // If combined field looks like a percent already (e.g. 93.3), accept it
  const ivLoose = parseNumber(ivMaybeCombined);
  if (ivLoose != null && ivLoose > 15 && ivLoose <= 100) return Math.max(0, Math.min(100, ivLoose));

  // Try separate atk/def/sta IV columns
  const atkRaw = (mapping && mapping.atkIV) ? row[mapping.atkIV] : null;
  const defRaw = (mapping && mapping.defIV) ? row[mapping.defIV] : null;
  const staRaw = (mapping && mapping.staIV) ? row[mapping.staIV] : null;

  const atk = parseNumber(
    atkRaw ??
    row['Atk'] ?? row['ATK'] ?? row['Attack'] ??
    row['Atk IV'] ?? row['ATK IV'] ?? row['Attack IV'] ??
    row['IV Atk'] ?? row['IV ATK'] ?? row['IV Attack']
  );
  const def = parseNumber(
    defRaw ??
    row['Def'] ?? row['DEF'] ?? row['Defense'] ??
    row['Def IV'] ?? row['DEF IV'] ?? row['Defense IV'] ??
    row['IV Def'] ?? row['IV DEF'] ?? row['IV Defense']
  );
  const sta = parseNumber(
    staRaw ??
    row['Sta'] ?? row['STA'] ?? row['Stamina'] ??
    row['Sta IV'] ?? row['STA IV'] ?? row['Stamina IV'] ??
    row['IV Sta'] ?? row['IV STA'] ?? row['IV Stamina'] ??
    row['HP IV']
  );

  if (atk == null || def == null || sta == null) return null;
  return Math.round(((atk + def + sta) / 45) * 100);
}

/**
 * Compute grade from score
 */
export function gradeForScore(score) {
  const s = Number(score);
  if (!Number.isFinite(s)) return '-';
  if (s >= 98) return 'S';
  if (s >= 95) return 'A+';
  if (s >= 90) return 'A';
  if (s >= 85) return 'B+';
  if (s >= 80) return 'B';
  if (s >= 75) return 'C+';
  if (s >= 70) return 'C';
  if (s >= 60) return 'D';
  return 'F';
}
