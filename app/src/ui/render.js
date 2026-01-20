/**
 * PoGO Pal - Render Functions
 * UI rendering and display updates
 */

import { state, TYPES, TOTAL_TYPES, TYPE_CHART, typeMeta, setCarouselIndex } from '../state.js?v=35';
import { detectCSVMapping } from '../csv/mapping.js?v=35';
import { getBudgetCounters, getCountersPerType, getWeakCounters, getWeakCountersPerType } from '../data/budgetCounters.js?v=35';
import * as dom from './dom.js?v=35';

// SVG icons for types
export function svgForType(type) {
  const common = 'viewBox="0 0 24 24" aria-hidden="true" focusable="false"';
  const wrap = (inner) => `<svg ${common}>${inner}</svg>`;

  switch (type) {
    case 'Water':
      return wrap('<path d="M12 2C9 6.6 6 10 6 14.2A6 6 0 0 0 12 20a6 6 0 0 0 6-5.8C18 10 15 6.6 12 2z"/>');
    case 'Fire':
      return wrap('<path d="M12 2c1.6 3.2.8 5.4-.6 6.9C9.7 10.7 9 12 9 13.6A3.2 3.2 0 0 0 12.2 17c1.9 0 3.4-1.4 3.4-3.3 0-1.4-.7-2.4-1.8-3.8.2 1.2-.6 2.1-1.6 2.3-.6-2.4.4-4.1 2.1-5.8C15.4 4.9 15.1 3.4 12 2z"/>');
    case 'Grass':
      return wrap('<path d="M20 4c-6 0-10 3-12 8-1 3-1 6-1 8h3c0-2 .1-3.7.6-5.4C12.6 10.5 15.6 8 20 8V4z"/><path d="M4 12c4.2.2 7.2 2.4 8.8 6.6.2.5.3 1 .4 1.4H9c-.2-.5-.4-1.1-.7-1.7C7.3 16 5.8 14.7 4 14.3V12z"/>');
    case 'Electric':
      return wrap('<path d="M13 2 4 13h7l-1 9 10-13h-7l0-7z"/>');
    case 'Ice':
      return wrap('<path d="M12 2v20M4 6l16 12M4 18 20 6" stroke="white" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M6 5l2 1M18 19l-2-1M6 19l2-1M18 5l-2 1" stroke="white" stroke-width="2" fill="none" stroke-linecap="round"/>');
    case 'Fighting':
      return wrap('<path d="M7 12c0-2 1.5-3.5 3.5-3.5h1C14.4 8.5 16 10 16 12v7H7v-7z"/><path d="M9 7c0-1.2 1-2 2.2-2H14c1.2 0 2 .8 2 2v2H9V7z"/>');
    case 'Poison':
      return wrap('<path d="M12 3c3 2 5 4.7 5 7.7A5 5 0 0 1 12 16a5 5 0 0 1-5-5.3C7 7.7 9 5 12 3z"/><path d="M8 19h8" stroke="white" stroke-width="2" fill="none" stroke-linecap="round"/>');
    case 'Ground':
      return wrap('<path d="M3 18h18v2H3z"/><path d="M6 18c1.4-4.5 3.7-7 6-7s4.6 2.5 6 7H6z"/>');
    case 'Flying':
      return wrap('<path d="M4 13c5-6 11-6 16 0-3-1.3-5.8-.8-8 1.6C9.8 12.2 7 11.7 4 13z"/><path d="M12 14c.5 2.5 2.2 4.6 5 6-2.9-.6-5.1-1.9-6.6-3.6C8.6 17.7 6.5 19 4 19c3.5-1.2 6.2-2.9 8-5z"/>');
    case 'Psychic':
      return wrap('<path d="M12 4c4.2 0 7 2.9 7 6.7S16.2 19 12 19s-7-4.4-7-8.3C5 6.9 7.8 4 12 4z"/><circle cx="12" cy="11" r="2.2" fill="#000" opacity="0.22"/><path d="M8 11c1.2-1.8 2.6-2.7 4-2.7s2.8.9 4 2.7c-1.2 1.8-2.6 2.7-4 2.7S9.2 12.8 8 11z" fill="#000" opacity="0.22"/>');
    case 'Bug':
      return wrap('<path d="M12 6c2.2 0 4 1.8 4 4v8H8v-8c0-2.2 1.8-4 4-4z"/><path d="M8 11H4M20 11h-4M9 5 7 3m8 2 2-2" stroke="white" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M10 6c0-1.1.9-2 2-2s2 .9 2 2" fill="none" stroke="white" stroke-width="2" stroke-linecap="round"/>');
    case 'Rock':
      return wrap('<path d="M7 21 3 14l4-8h10l4 8-4 7H7z"/><path d="M7 6l5 4 5-4" fill="#000" opacity="0.18"/>');
    case 'Ghost':
      return wrap('<path d="M12 3c3.3 0 6 2.7 6 6v12l-2-1-2 1-2-1-2 1-2-1-2 1V9c0-3.3 2.7-6 6-6z"/><circle cx="10" cy="10" r="1.2" fill="#000" opacity="0.25"/><circle cx="14" cy="10" r="1.2" fill="#000" opacity="0.25"/>');
    case 'Dragon':
      return wrap('<path d="M19 6c-3.5 0-6.5 2.2-8.3 5.3L9 10l1 3-3 1 2 2-1 4 4-2 2 2 1-3 3-1-2-2 1-4 2-1c.3-.8.4-1.6.4-2.4C20 6.6 19.6 6 19 6z"/>');
    case 'Dark':
      return wrap('<path d="M14.5 3.5A8 8 0 0 0 8 18.5 7 7 0 1 1 14.5 3.5z"/>');
    case 'Steel':
      return wrap('<path d="M12 2 21 7v10l-9 5-9-5V7l9-5z"/><path d="M12 7v10M7.5 9.5 16.5 14.5" stroke="#000" opacity="0.18" stroke-width="2"/>');
    case 'Fairy':
      return wrap('<path d="M12 2l2.2 6.6H21l-5.4 3.9 2.1 6.5L12 15.6 6.3 19l2.1-6.5L3 8.6h6.8L12 2z"/>');
    case 'Normal':
    default:
      return wrap('<circle cx="12" cy="12" r="7"/>');
  }
}

// Get types from a row
export function rowTypeList(row) {
  if (row._typesArr && Array.isArray(row._typesArr)) return row._typesArr;
  if (!row.types || row.types === '-') return [];
  return String(row.types).split(/\s*\/\s*/).filter(Boolean);
}

// Render the type grid in the sheet
export function renderGrid() {
  if (!dom.gridEl) return;
  dom.gridEl.innerHTML = '';

  // Sort types alphabetically for the grid
  const sortedTypes = [...TYPES].sort((a, b) => a.name.localeCompare(b.name));

  sortedTypes.forEach(t => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'type-pill';
    btn.dataset.type = t.name;

    const icon = document.createElement('span');
    icon.className = 'icon-chip';
    icon.style.background = `var(${t.colorVar})`;
    icon.innerHTML = svgForType(t.name);

    const label = document.createElement('span');
    label.className = 'type-name';
    label.textContent = t.name;

    btn.appendChild(icon);
    btn.appendChild(label);
    dom.gridEl.appendChild(btn);
  });
}

// Sync grid selection UI
export function syncGridSelectionUI() {
  if (!dom.gridEl) return;
  dom.gridEl.querySelectorAll('button.type-pill').forEach(btn => {
    const t = btn.dataset.type;
    const on = state.selectedTypes.has(t);
    btn.classList.toggle('is-selected', on);
    btn.setAttribute('aria-pressed', String(on));
  });
}

// Render active filter strip
export function renderActiveStrip() {
  if (!dom.activeIconsEl || !dom.activeAllEl || !dom.clearBtn) return;

  dom.activeIconsEl.innerHTML = '';

  if (state.selectedTypes.size === 0) {
    dom.activeAllEl.hidden = false;
    dom.activeIconsEl.appendChild(dom.activeAllEl);
    dom.clearBtn.hidden = true;
    return;
  }

  dom.activeAllEl.hidden = true;
  dom.clearBtn.hidden = false;

  Array.from(state.selectedTypes).forEach(typeName => {
    const meta = typeMeta(typeName);
    if (!meta) return;

    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'icon-chip icon-chip-btn is-selected';
    chip.style.background = `var(${meta.colorVar})`;
    chip.innerHTML = svgForType(typeName);
    chip.title = typeName;
    chip.dataset.type = typeName;

    dom.activeIconsEl.appendChild(chip);
  });
}

// Render showing line
export function renderShowingLine() {
  if (!dom.showingTypesEl || !dom.showingCountEl) return;

  if (state.selectedTypes.size === 0) {
    dom.showingTypesEl.textContent = 'All types';
  } else {
    dom.showingTypesEl.textContent = Array.from(state.selectedTypes).join(', ');
  }

  const total = state.allResults.length;
  const visible = state.lastVisibleCount;
  dom.showingCountEl.textContent = `(${visible} of ${total})`;
}

// Render collection summary
export function renderCollectionSummary() {
  if (!dom.collectionCountEl || !dom.collectionCoverageEl) return;

  if (!state.allResults || state.allResults.length === 0) {
    dom.collectionCountEl.textContent = '-';
    dom.collectionCoverageEl.textContent = `-/${TOTAL_TYPES}`;
    return;
  }

  const covered = new Set();
  state.allResults.forEach(r => rowTypeList(r).forEach(t => covered.add(t)));

  dom.collectionCountEl.textContent = String(state.allResults.length);
  dom.collectionCoverageEl.textContent = `${covered.size}/${TOTAL_TYPES}`;
}

// Render table
export function renderTable(rows) {
  if (!dom.tableBody) return;
  dom.tableBody.innerHTML = '';

  rows.forEach(row => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${row.name}</td>
      <td class="mono">${row.score}</td>
      <td>${row.grade}</td>
      <td class="mono">${row.cp}</td>
      <td class="mono">${row.iv}</td>
      <td>${row.types}</td>
    `;
    dom.tableBody.appendChild(tr);
  });
}

// Compare function for sorting
function gradeRank(g) {
  const map = { 'S': 10, 'A+': 9, 'A': 8, 'B+': 7, 'B': 6, 'C+': 5, 'C': 4, 'D': 3, 'F': 2 };
  return map[g] ?? 0;
}

function compare(a, b, key) {
  const av = a[key];
  const bv = b[key];

  if (key === 'grade') {
    return gradeRank(av) - gradeRank(bv);
  }

  const numKeys = new Set(['score', 'cp', 'iv']);
  if (numKeys.has(key)) return (Number(av) || 0) - (Number(bv) || 0);

  return String(av).localeCompare(String(bv));
}

// Render sort indicators
export function renderSortIndicators() {
  dom.tableHeaders.forEach(th => {
    const ind = th.querySelector('.sort-ind');
    if (!ind) return;

    if (th.dataset.key !== state.sortState.key) {
      ind.textContent = '';
      ind.style.opacity = '0.55';
      return;
    }

    ind.style.opacity = '0.9';
    ind.textContent = state.sortState.dir === 'asc' ? '▲' : '▼';
  });
}

// Render sorted table
export function renderSortedTable(rows) {
  const { key, dir } = state.sortState;
  const sorted = rows.slice().sort((a, b) => {
    const delta = compare(a, b, key);
    return dir === 'asc' ? delta : -delta;
  });
  renderTable(sorted);
  renderSortIndicators();
}

// Get filtered rows
export function getFilteredRows() {
  if (state.selectedTypes.size === 0) return state.allResults;
  return state.allResults.filter(r => rowTypeList(r).some(t => state.selectedTypes.has(t)));
}

// Main view update
export function updateView() {
  const filtered = getFilteredRows();
  state.lastVisibleCount = filtered.length;
  renderShowingLine();
  renderCollectionSummary();
  renderSortedTable(filtered);
}

// Error modal display (reusable app-wide)
export function showError(title, body) {
  if (!dom.errorModal || !dom.errorModalBackdrop) return;
  if (dom.errorTitle) dom.errorTitle.textContent = title || 'Error';
  if (dom.errorBody) dom.errorBody.innerHTML = body || '';
  dom.errorModalBackdrop.hidden = false;
  dom.errorModal.hidden = false;
  document.body.classList.add('no-scroll');
}

export function hideError() {
  if (dom.errorModal) dom.errorModal.hidden = true;
  if (dom.errorModalBackdrop) dom.errorModalBackdrop.hidden = true;
  document.body.classList.remove('no-scroll');
}

// Legacy alias for backwards compatibility
export function showParseError(title, body) {
  showError(title, body);
}

export function hideParseError() {
  hideError();
}

// CSV debug panel
export function renderCSVMetaDebug(meta, firstRow, opts) {
  if (!dom.csvDebugEl) return;

  const force = !!(opts && opts.force);
  const reason = (opts && opts.reason) ? String(opts.reason) : '';

  if (!meta || !meta.headers || !meta.headers.length) {
    dom.csvDebugEl.hidden = true;
    return;
  }

  // Gate: debug panel is hidden unless debug mode is on, or we explicitly force it
  if (!state.debugMode && !force) {
    dom.csvDebugEl.hidden = true;
    return;
  }

  const fileLabel = meta.fileName ? meta.fileName : 'CSV';
  const rowsLabel = (typeof meta.rows === 'number') ? `${meta.rows} rows` : '';
  const colsLabel = `${meta.headers.length} cols`;
  const reasonLabel = reason ? ` | ${reason}` : '';
  if (dom.csvDebugSummaryEl) {
    dom.csvDebugSummaryEl.textContent = `(${[fileLabel, rowsLabel, colsLabel].filter(Boolean).join(' | ')}${reasonLabel})`;
  }

  // Headers chips
  if (dom.csvHeadersEl) {
    dom.csvHeadersEl.innerHTML = '';
    const max = 28;
    meta.headers.slice(0, max).forEach(h => {
      const d = document.createElement('div');
      d.className = 'debug-chip';
      d.title = String(h);
      d.textContent = String(h);
      dom.csvHeadersEl.appendChild(d);
    });
    if (meta.headers.length > max) {
      const d = document.createElement('div');
      d.className = 'debug-chip';
      d.textContent = `+${meta.headers.length - max} more`;
      dom.csvHeadersEl.appendChild(d);
    }
  }

  const mapping = detectCSVMapping(meta.headers);
  if (dom.csvMappingEl) {
    const lines = [];
    const add = (label, key) => {
      const v = mapping[key] ? `"${mapping[key]}"` : '(not found)';
      lines.push(`${label}: ${v}`);
    };
    add('name', 'name');
    add('cp', 'cp');
    add('ivPercent', 'ivPercent');
    add('ivString', 'ivString');
    add('atkIV', 'atkIV');
    add('defIV', 'defIV');
    add('staIV', 'staIV');
    add('type1', 'type1');
    add('type2', 'type2');
    add('types', 'types');
    lines.push('');
    lines.push('Note: If types are not present in the CSV, we fall back to a built-in species->type map.');
    dom.csvMappingEl.textContent = lines.join('\n');
  }

  if (dom.csvSampleEl) {
    const r = firstRow || {};
    const lines = [];
    const addSample = (header) => {
      if (!header) return;
      const raw = r[header];
      const value = (raw == null) ? '' : String(raw);
      lines.push(`${header}: ${value}`);
    };

    Object.values(mapping).filter(Boolean).forEach(h => addSample(h));
    if (!lines.length) {
      const keys = Object.keys(r).slice(0, 10);
      keys.forEach(k => lines.push(`${k}: ${String(r[k] ?? '')}`));
    }
    dom.csvSampleEl.textContent = lines.join('\n');
  }

  dom.csvDebugEl.hidden = false;
}

// VS mode rendering
export function renderVsGrid() {
  if (!dom.vsGridEl) return;
  dom.vsGridEl.innerHTML = '';

  // Sort types alphabetically for the grid
  const sortedTypes = [...TYPES].sort((a, b) => a.name.localeCompare(b.name));

  sortedTypes.forEach(t => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'type-pill';
    btn.dataset.type = t.name;

    const icon = document.createElement('span');
    icon.className = 'icon-chip';
    icon.style.background = `var(${t.colorVar})`;
    icon.innerHTML = svgForType(t.name);

    const label = document.createElement('span');
    label.className = 'type-name';
    label.textContent = t.name;

    btn.appendChild(icon);
    btn.appendChild(label);
    dom.vsGridEl.appendChild(btn);
  });
}

export function syncVsGridSelectionUI() {
  if (!dom.vsGridEl) return;
  dom.vsGridEl.querySelectorAll('button.type-pill').forEach(btn => {
    const t = btn.dataset.type;
    const on = state.vsSelectedTypes.has(t);
    btn.classList.toggle('is-selected', on);
    btn.setAttribute('aria-pressed', String(on));
  });
}

/**
 * Render selected opponent type pills in the in-panel header
 */
export function renderVsHeaderPills() {
  const container = document.getElementById('vsHeaderPills');
  if (!container) return;
  container.innerHTML = '';

  const list = Array.from(state.vsSelectedTypes);
  if (!list.length) return;

  list.forEach(t => {
    const pill = createTypePill(t, true); // button for interaction
    pill.classList.add('is-selected');
    container.appendChild(pill);
  });
}

export function renderTypePills(container, types) {
  if (!container) return;
  container.innerHTML = '';
  if (!types || !types.length) {
    container.innerHTML = '<span class="mono" style="opacity:.8">-</span>';
    return;
  }

  types.forEach(t => {
    container.appendChild(createTypePill(t));
  });
}

// Type effectiveness helpers
function eff(att, def) {
  const ch = TYPE_CHART[att];
  if (!ch) return 1.0;
  if (ch.super.includes(def)) return 1.6;
  if (ch.resist.includes(def)) return 0.625;
  if (ch.immune.includes(def)) return 0.39;
  return 1.0;
}

function mult(att, defs) {
  let m = 1.0;
  for (const d of defs) {
    m *= eff(att, d);
  }
  return m;
}

function combinedAttackMult(attType, oppTypes) {
  let m = 1.0;
  for (const t of oppTypes) {
    m *= eff(attType, t);
  }
  return m;
}

export function computeMoveGuidance(oppTypes) {
  const scored = TYPES.map(t => {
    const m = combinedAttackMult(t.name, oppTypes);
    return { type: t.name, mult: m };
  }).sort((a, b) => b.mult - a.mult);

  const bring = scored.slice(0, 5).map(s => s.type);
  const avoid = scored.slice(-5).reverse().map(s => s.type);
  return { bring, avoid, scored };
}

export function computeAvoidBodies(oppTypes) {
  const scored = TYPES.map(t => {
    let worst = 1.0;
    for (const opp of oppTypes) {
      worst = Math.max(worst, eff(opp, t.name));
    }
    return { type: t.name, worst };
  }).sort((a, b) => b.worst - a.worst);

  const bad = scored.filter(s => s.worst >= 1.6).slice(0, 6).map(s => s.type);
  return bad;
}

/**
 * Compute Pokemon types that RESIST opponent attacks (good to bring).
 * Returns types with lowest incoming damage multipliers from opponent moves.
 */
export function computeBringBodies(oppTypes) {
  const scored = TYPES.map(t => {
    let best = 1.0;
    for (const opp of oppTypes) {
      best = Math.min(best, eff(opp, t.name));
    }
    return { type: t.name, best };
  }).sort((a, b) => a.best - b.best);

  return scored.filter(s => s.best < 1.0).slice(0, 6).map(s => s.type);
}

/**
 * Get types that RESIST each opponent type (good to bring) - grouped by opponent
 */
function getBringTypesPerOpp(oppTypes) {
  const result = {};
  oppTypes.forEach(oppType => {
    // Find types that resist this opponent type (take less damage)
    const resistTypes = TYPES.filter(t => eff(oppType, t.name) < 1.0)
      .sort((a, b) => eff(oppType, a.name) - eff(oppType, b.name))
      .map(t => t.name);
    result[oppType] = resistTypes.slice(0, 3);
  });
  return result;
}

/**
 * Get types that are WEAK to each opponent type (avoid) - grouped by opponent
 */
function getAvoidTypesPerOpp(oppTypes) {
  const result = {};
  oppTypes.forEach(oppType => {
    const chart = TYPE_CHART[oppType];
    // Types that this opponent deals super effective damage to
    result[oppType] = (chart?.super || []).slice(0, 3);
  });
  return result;
}

/**
 * Get move types that are SUPER EFFECTIVE against each opponent type (bring) - grouped by opponent
 */
function getBringMovesPerOpp(oppTypes) {
  const result = {};
  oppTypes.forEach(oppType => {
    // Find move types that deal super effective damage to this opponent
    const effectiveMoves = TYPES.filter(t => {
      const chart = TYPE_CHART[t.name];
      return chart?.super?.includes(oppType);
    }).map(t => t.name);
    result[oppType] = effectiveMoves.slice(0, 3);
  });
  return result;
}

/**
 * Get move types that are NOT EFFECTIVE against each opponent type (avoid) - grouped by opponent
 */
function getAvoidMovesPerOpp(oppTypes) {
  const result = {};
  oppTypes.forEach(oppType => {
    // Find move types that deal not very effective or no damage to this opponent
    const weakMoves = TYPES.filter(t => {
      const chart = TYPE_CHART[t.name];
      return chart?.weak?.includes(oppType) || chart?.immune?.includes(oppType);
    }).map(t => t.name);
    result[oppType] = weakMoves.slice(0, 3);
  });
  return result;
}

export function scoreRosterAgainst(oppTypes) {
  const roster = Array.isArray(state.allResults) ? state.allResults : [];
  const scored = [];

  for (const row of roster) {
    const defTypes = rowTypeList(row);
    if (!defTypes.length) continue;

    let incomingWorst = 1.0;
    for (const opp of oppTypes) {
      incomingWorst = Math.max(incomingWorst, mult(opp, defTypes));
    }

    let offenseBest = 1.0;
    for (const myT of defTypes) {
      offenseBest = Math.max(offenseBest, combinedAttackMult(myT, oppTypes));
    }

    const cp = Number(row.cp) || 0;

    scored.push({
      row,
      defTypes,
      incomingWorst,
      offenseBest,
      cp
    });
  }

  scored.sort((a, b) => {
    if (a.incomingWorst !== b.incomingWorst) return a.incomingWorst - b.incomingWorst;
    if (a.offenseBest !== b.offenseBest) return b.offenseBest - a.offenseBest;
    return b.cp - a.cp;
  });

  return scored;
}

/**
 * Compute contextual matchups for a Pokemon against selected opponent types.
 * @param {string[]} pokeTypes - The Pokemon's own types
 * @param {string[]} oppTypes - Selected opponent types
 * @returns {{ strong: string[], weak: string[] }} Opponent types this Pokemon is strong/weak against
 */
function computeMatchups(pokeTypes, oppTypes) {
  if (!oppTypes || !oppTypes.length) return { strong: [], weak: [] };

  const strong = [];
  const weak = [];

  for (const opp of oppTypes) {
    let dominated = false;  // We dominate this opponent type
    let vulnerable = false; // We're vulnerable to this opponent type

    for (const poke of pokeTypes) {
      // Check if we deal super effective damage to opponent
      if (eff(poke, opp) >= 1.6) dominated = true;
      // Check if we resist opponent's attacks
      if (eff(opp, poke) < 1.0) dominated = true;
      // Check if opponent deals super effective damage to us
      if (eff(opp, poke) >= 1.6) vulnerable = true;
    }

    if (dominated && !vulnerable) strong.push(opp);
    else if (vulnerable && !dominated) weak.push(opp);
    // If both or neither, skip (neutral matchup)
  }

  return { strong, weak };
}

// ============================================
// FLIP CARD IMPLEMENTATION
// ============================================

// Counter for unique card IDs
let cardIdCounter = 0;

/**
 * Create a type icon element
 * @param {string} typeName - Type name
 * @param {string} size - 'normal' (20px) or 'mini' (14px)
 */
function createTypeIcon(typeName, size = 'normal') {
  const icon = document.createElement('span');
  icon.className = size === 'mini' ? 'icon-chip icon-chip-mini' : 'icon-chip';
  const m = typeMeta(typeName);
  if (m) icon.style.background = `var(${m.colorVar})`;
  icon.innerHTML = svgForType(typeName);
  return icon;
}

/**
 * Render mini type pills with truncation
 * @param {HTMLElement} container - Container element
 * @param {string[]} types - Array of type names
 * @param {number} maxShow - Max pills to show before "+N"
 */
function renderMiniPills(container, types, maxShow = 4) {
  container.innerHTML = '';

  if (!types || !types.length) {
    const none = document.createElement('span');
    none.className = 'matchup-none mono';
    none.textContent = '–';
    container.appendChild(none);
    return;
  }

  const show = types.slice(0, maxShow);
  const overflow = types.length - maxShow;

  show.forEach(t => {
    const pill = document.createElement('span');
    pill.className = 'type-pill-mini';
    pill.appendChild(createTypeIcon(t, 'mini'));
    const label = document.createElement('span');
    label.className = 'type-pill-mini-label';
    label.textContent = t;
    pill.appendChild(label);
    container.appendChild(pill);
  });

  if (overflow > 0) {
    const more = document.createElement('span');
    more.className = 'matchup-overflow mono';
    more.textContent = `+${overflow}`;
    container.appendChild(more);
  }
}

/**
 * Create the FRONT face of the flip card (scan view)
 */
function createFrontFace(row, typesArr, cp, oppTypes) {
  const face = document.createElement('div');
  face.className = 'flip-card-face flip-card-front';

  // Line 1: CP (top-right)
  const cpEl = document.createElement('div');
  cpEl.className = 'poke-cp mono';
  cpEl.textContent = (typeof cp === 'number' && cp > 0) ? `CP ${cp}` : '';
  face.appendChild(cpEl);

  // Center group: Name + Type pills together (so they center as a unit)
  const centerGroup = document.createElement('div');
  centerGroup.className = 'poke-center-group';

  // Name
  const nameEl = document.createElement('div');
  nameEl.className = 'poke-name-line';
  const nameText = row.name || '-';
  if (nameText.length > 14) nameEl.classList.add('very-long-name');
  else if (nameText.length > 10) nameEl.classList.add('long-name');
  nameEl.textContent = nameText;
  centerGroup.appendChild(nameEl);

  // Type mini pills
  if (typesArr && typesArr.length > 0) {
    const typeRow = document.createElement('div');
    typeRow.className = 'poke-type-line';
    typesArr.forEach(t => {
      const pill = document.createElement('span');
      pill.className = 'type-pill-mini';
      pill.appendChild(createTypeIcon(t, 'mini'));
      const label = document.createElement('span');
      label.className = 'type-pill-mini-label';
      label.textContent = t;
      pill.appendChild(label);
      typeRow.appendChild(pill);
    });
    centerGroup.appendChild(typeRow);
  }

  face.appendChild(centerGroup);

  // Line 4: Matchup icons row (strong left, weak right)
  if (oppTypes && oppTypes.length > 0) {
    const matchups = computeMatchups(typesArr || [], oppTypes);
    const matchupRow = document.createElement('div');
    matchupRow.className = 'poke-matchup-icons';

    // Strong icons (left)
    const strongEl = document.createElement('span');
    strongEl.className = 'matchup-icons-strong';
    const strongCaret = document.createElement('span');
    strongCaret.className = 'matchup-caret';
    strongCaret.textContent = '▲';
    strongEl.appendChild(strongCaret);
    if (matchups.strong.length > 0) {
      matchups.strong.slice(0, 3).forEach(t => strongEl.appendChild(createTypeIcon(t, 'mini')));
    } else {
      const dash = document.createElement('span');
      dash.className = 'matchup-dash';
      dash.textContent = '–';
      strongEl.appendChild(dash);
    }

    // Weak icons (right)
    const weakEl = document.createElement('span');
    weakEl.className = 'matchup-icons-weak';
    const weakCaret = document.createElement('span');
    weakCaret.className = 'matchup-caret';
    weakCaret.textContent = '▼';
    weakEl.appendChild(weakCaret);
    if (matchups.weak.length > 0) {
      matchups.weak.slice(0, 3).forEach(t => weakEl.appendChild(createTypeIcon(t, 'mini')));
    } else {
      const dash = document.createElement('span');
      dash.className = 'matchup-dash';
      dash.textContent = '–';
      weakEl.appendChild(dash);
    }

    matchupRow.appendChild(strongEl);
    matchupRow.appendChild(weakEl);
    face.appendChild(matchupRow);
  }

  return face;
}

/**
 * Create the BACK face of the flip card (detail view)
 * Shows only Strong/Weak against sections - no header
 */
function createBackFace(row, typesArr, oppTypes) {
  const face = document.createElement('div');
  face.className = 'flip-card-face flip-card-back';

  // Only Strong/Weak sections - no header
  if (oppTypes && oppTypes.length > 0) {
    const matchups = computeMatchups(typesArr || [], oppTypes);

    // Strong against section (positioned at top)
    const strongSection = document.createElement('div');
    strongSection.className = 'matchup-detail strong-section';
    const strongLabel = document.createElement('div');
    strongLabel.className = 'matchup-label strong';
    strongLabel.textContent = 'Strong against';
    strongSection.appendChild(strongLabel);
    const strongPills = document.createElement('div');
    strongPills.className = 'matchup-pills';
    renderMiniPills(strongPills, matchups.strong, 3);
    strongSection.appendChild(strongPills);
    face.appendChild(strongSection);

    // Weak against section (positioned at bottom)
    const weakSection = document.createElement('div');
    weakSection.className = 'matchup-detail weak-section';
    const weakLabel = document.createElement('div');
    weakLabel.className = 'matchup-label weak';
    weakLabel.textContent = 'Weak against';
    weakSection.appendChild(weakLabel);
    const weakPills = document.createElement('div');
    weakPills.className = 'matchup-pills';
    renderMiniPills(weakPills, matchups.weak, 3);
    weakSection.appendChild(weakPills);
    face.appendChild(weakSection);
  } else {
    // No opponent types - show placeholder
    const placeholder = document.createElement('div');
    placeholder.className = 'flip-back-placeholder mono';
    placeholder.textContent = 'CHOOSE OPPONENT TYPE(S)\nPick up to 3 to see results.';
    face.appendChild(placeholder);
  }

  return face;
}

/**
 * Create a simple Pokemon card (no flip interaction)
 * Shows: Name + Type pills + CP
 * @param {Object} row - Pokemon data (must have .name)
 * @param {string[]} typesArr - Pokemon's types
 * @param {number|null} cp - Combat Power (null for general counters)
 */
export function makeSimpleCard(row, typesArr, cp) {
  const card = document.createElement('div');
  card.className = 'simple-card';

  // Center group: Name + Type pills (positioned at top)
  const centerGroup = document.createElement('div');
  centerGroup.className = 'simple-card-center';

  // Line 2: Pokemon name
  const nameEl = document.createElement('div');
  nameEl.className = 'simple-card-name';
  const nameText = row.name || '-';
  if (nameText.length > 12) nameEl.classList.add('long-name');
  nameEl.textContent = nameText;
  centerGroup.appendChild(nameEl);

  // Line 3: Type pills
  if (typesArr && typesArr.length > 0) {
    const typeRow = document.createElement('div');
    typeRow.className = 'simple-card-types';
    typesArr.forEach(t => {
      const pill = document.createElement('span');
      pill.className = 'type-pill-mini';
      pill.appendChild(createTypeIcon(t, 'mini'));
      const label = document.createElement('span');
      label.className = 'type-pill-mini-label';
      label.textContent = t;
      pill.appendChild(label);
      typeRow.appendChild(pill);
    });
    centerGroup.appendChild(typeRow);
  }

  card.appendChild(centerGroup);

  return card;
}

/**
 * Create a placeholder card with contextual message
 * Used when no results exist for a column
 * @param {string} message - Message to display
 */
export function makePlaceholderCard(message) {
  const card = document.createElement('div');
  card.className = 'simple-card simple-card--placeholder';

  const text = document.createElement('div');
  text.className = 'simple-card-placeholder-text mono';
  text.textContent = message;
  card.appendChild(text);

  return card;
}

/**
 * Create a type pill element (reusable helper)
 * @param {string} typeName - Type name
 * @param {boolean} asButton - Create as button (clickable) or span
 * @returns {HTMLElement} The type pill element
 */
export function createTypePill(typeName, asButton = false) {
  const pill = document.createElement(asButton ? 'button' : 'span');
  pill.className = 'type-pill';
  if (asButton) pill.type = 'button';
  pill.dataset.type = typeName;

  const meta = typeMeta(typeName);
  const icon = document.createElement('span');
  icon.className = 'icon-chip';
  if (meta) icon.style.background = `var(${meta.colorVar})`;
  icon.innerHTML = svgForType(typeName);

  const label = document.createElement('span');
  label.className = 'type-name';
  label.textContent = typeName;

  pill.appendChild(icon);
  pill.appendChild(label);
  return pill;
}

/**
 * Render counters in a column layout grouped by opponent type
 * @param {HTMLElement} container - Container element
 * @param {string[]} oppTypes - Selected opponent types (column headers)
 * @param {Object} countersByType - Map of oppType -> array of counters
 */
export function renderColumnLayout(container, oppTypes, countersByType) {
  container.innerHTML = '';
  container.classList.add('type-columns');

  // Create a column for each opponent type (directly in container)
  oppTypes.forEach(oppType => {
    const column = document.createElement('div');
    column.className = 'type-column';

    // Column header - up arrow only (matches upload icon arrow style)
    const header = document.createElement('div');
    header.className = 'type-column-header';

    const arrow = document.createElement('div');
    arrow.className = 'type-column-arrow';
    arrow.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 17V8.83l-2.59 2.58L7 10l5-5 5 5-1.41 1.41L13 8.83V17h-2z"/></svg>';
    header.appendChild(arrow);

    column.appendChild(header);

    // Cards for this column
    const cardsContainer = document.createElement('div');
    cardsContainer.className = 'type-column-cards';
    const typeCounters = countersByType[oppType] || [];

    if (typeCounters.length === 0) {
      // Show placeholder card with contextual message
      const message = `NO STRONG MATCHUPS\n${oppType} has no super-effective targets.`;
      const placeholder = makePlaceholderCard(message);
      cardsContainer.appendChild(placeholder);
    } else {
      typeCounters.forEach(c => {
        const card = makeSimpleCard({ name: c.name }, c.types, c.cp || null);
        cardsContainer.appendChild(card);
      });
    }
    column.appendChild(cardsContainer);

    container.appendChild(column);
  });
}

/**
 * Render type pills in a column layout grouped by opponent type
 * @param {HTMLElement} container - Container element
 * @param {string[]} oppTypes - Selected opponent types (column headers)
 * @param {Object} typesByOpp - Map of oppType -> array of type names
 */
function renderTypePillColumnLayout(container, oppTypes, typesByOpp) {
  container.innerHTML = '';
  container.classList.add('type-columns');

  oppTypes.forEach(oppType => {
    const column = document.createElement('div');
    column.className = 'type-column';

    // Column header - up arrow
    const header = document.createElement('div');
    header.className = 'type-column-header';
    const arrow = document.createElement('div');
    arrow.className = 'type-column-arrow';
    arrow.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 17V8.83l-2.59 2.58L7 10l5-5 5 5-1.41 1.41L13 8.83V17h-2z"/></svg>';
    header.appendChild(arrow);
    column.appendChild(header);

    // Type pills for this column
    const pillsContainer = document.createElement('div');
    pillsContainer.className = 'type-column-pills';
    const types = typesByOpp[oppType] || [];

    if (types.length === 0) {
      const message = `NO RESISTS\nNothing resists ${oppType}.`;
      const placeholder = makePlaceholderCard(message);
      pillsContainer.appendChild(placeholder);
    } else {
      types.forEach(t => {
        const pill = createTypePill(t);
        pill.classList.add('type-pill--block');
        pillsContainer.appendChild(pill);
      });
    }
    column.appendChild(pillsContainer);

    container.appendChild(column);
  });
}

/**
 * Create a flip card for Pokemon picks (LEGACY - keeping for roster picks)
 * @param {Object} row - Pokemon data (must have .name)
 * @param {string[]} typesArr - Pokemon's types
 * @param {number|null} cp - Combat Power (null for general counters)
 * @param {string[]} oppTypes - Selected opponent types for matchup calc
 */
export function makePokePickCard(row, typesArr, cp, oppTypes = []) {
  // Use simple card now
  return makeSimpleCard(row, typesArr, cp);
}

/**
 * Get user's best Pokemon grouped by opponent type
 */
function getRosterCountersPerType(oppTypes, perType = 3) {
  const roster = Array.isArray(state.allResults) ? state.allResults : [];
  if (!roster.length) return {};

  const result = {};
  oppTypes.forEach(oppType => {
    // Score each Pokemon against this specific opponent type
    const scored = roster.map(row => {
      const defTypes = rowTypeList(row);
      if (!defTypes.length) return null;

      // Incoming damage from this opponent type
      let incoming = 1.0;
      defTypes.forEach(d => { incoming *= eff(oppType, d); });

      // Outgoing damage to this opponent type
      let outgoing = 1.0;
      defTypes.forEach(d => { outgoing = Math.max(outgoing, eff(d, oppType)); });

      return { row, defTypes, incoming, outgoing, cp: Number(row.cp) || 0 };
    }).filter(Boolean);

    // Sort: low incoming (resist), high outgoing (super effective), high CP
    scored.sort((a, b) => {
      if (a.incoming !== b.incoming) return a.incoming - b.incoming;
      if (a.outgoing !== b.outgoing) return b.outgoing - a.outgoing;
      return b.cp - a.cp;
    });

    result[oppType] = scored.slice(0, perType).map(s => ({
      name: s.row.name,
      types: s.defTypes,
      cp: s.cp
    }));
  });

  return result;
}

/**
 * Get user's worst (risky) Pokemon grouped by opponent type
 */
function getRiskyRosterPerType(oppTypes, perType = 3) {
  const roster = Array.isArray(state.allResults) ? state.allResults : [];
  if (!roster.length) return {};

  const result = {};
  oppTypes.forEach(oppType => {
    const scored = roster.map(row => {
      const defTypes = rowTypeList(row);
      if (!defTypes.length) return null;

      let incoming = 1.0;
      defTypes.forEach(d => { incoming *= eff(oppType, d); });

      return { row, defTypes, incoming, cp: Number(row.cp) || 0 };
    }).filter(Boolean);

    // Sort: HIGH incoming (weak to opponent), then by CP
    scored.sort((a, b) => {
      if (a.incoming !== b.incoming) return b.incoming - a.incoming;
      return b.cp - a.cp;
    });

    // Only include if actually weak (incoming >= 1.6)
    const weak = scored.filter(s => s.incoming >= 1.6);
    result[oppType] = weak.slice(0, perType).map(s => ({
      name: s.row.name,
      types: s.defTypes,
      cp: s.cp
    }));
  });

  return result;
}

export function renderRosterPicks(oppTypes) {
  if (!dom.vsTopPicksEl || !dom.vsRiskyPicksEl) return;

  // BRING - best Pokemon per opponent type
  const bringByType = getRosterCountersPerType(oppTypes, 3);
  renderColumnLayout(dom.vsTopPicksEl, oppTypes, bringByType);

  // DON'T BRING - risky Pokemon per opponent type
  const riskyByType = getRiskyRosterPerType(oppTypes, 3);
  renderColumnLayout(dom.vsRiskyPicksEl, oppTypes, riskyByType);
}

export function renderBudgetCounters(oppTypes) {
  // Render BRING counters in column layout (ARE WEAK AGAINST section)
  if (dom.vsBudgetPicksEl) {
    // Get exactly 3 counters per type
    const countersByType = getCountersPerType(oppTypes, 3);
    renderColumnLayout(dom.vsBudgetPicksEl, oppTypes, countersByType);
  }

  // Render AVOID counters in ARE STRONG AGAINST section
  if (dom.vsStrongAgainstPicksEl) {
    const weakByType = getWeakCountersPerType(oppTypes, 3);
    renderColumnLayout(dom.vsStrongAgainstPicksEl, oppTypes, weakByType);
  }

  // Show/hide the Strong Against container
  if (dom.vsStrongAgainstContainerEl) {
    dom.vsStrongAgainstContainerEl.hidden = oppTypes.length === 0;
  }
}

export function renderVsBrief(oppTypes) {
  // Move Types - use column layout grouped by opponent type
  const bringMoves = getBringMovesPerOpp(oppTypes);
  renderTypePillColumnLayout(dom.vsBringMovesEl, oppTypes, bringMoves);

  const avoidMoves = getAvoidMovesPerOpp(oppTypes);
  renderTypePillColumnLayout(dom.vsAvoidMovesEl, oppTypes, avoidMoves);

  // Pokemon Types - use column layout grouped by opponent type
  const bringTypes = getBringTypesPerOpp(oppTypes);
  renderTypePillColumnLayout(dom.vsBringBodiesEl, oppTypes, bringTypes);

  const avoidTypes = getAvoidTypesPerOpp(oppTypes);
  renderTypePillColumnLayout(dom.vsAvoidBodiesEl, oppTypes, avoidTypes);
}

// Helper to programmatically set collapse state
function setCollapsed(el, collapsed) {
  if (!el) return;
  el.classList.toggle('collapsed', collapsed);
  const btn = el.querySelector('.collapsible-toggle');
  if (btn) {
    btn.textContent = collapsed ? '+' : '−';
    btn.setAttribute('aria-expanded', String(!collapsed));
  }
}

/**
 * Render top arrows between opponent header and recommendations
 * Shows when opponent section is collapsed
 */
function renderTopArrows(oppTypes, isConfirmed) {
  // Get or create the top arrows container
  let container = document.getElementById('vsTopArrows');

  if (!isConfirmed || oppTypes.length === 0) {
    // Hide/remove arrows when not confirmed
    if (container) container.hidden = true;
    return;
  }

  // Create container if it doesn't exist
  if (!container) {
    container = document.createElement('div');
    container.id = 'vsTopArrows';
    container.className = 'vs-top-arrows';
    // Insert at the start of vsRecommendations
    if (dom.vsRecommendationsEl) {
      dom.vsRecommendationsEl.insertBefore(container, dom.vsRecommendationsEl.firstChild);
    }
  }

  container.hidden = false;
  container.innerHTML = '';

  // Create 3 columns with arrows (matching opponent type count)
  oppTypes.forEach(() => {
    const arrowCol = document.createElement('div');
    arrowCol.className = 'vs-top-arrow-col';
    arrowCol.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 17V8.83l-2.59 2.58L7 10l5-5 5 5-1.41 1.41L13 8.83V17h-2z"/></svg>';
    container.appendChild(arrowCol);
  });
}

export function syncVsUI() {
  const oppTypes = Array.from(state.vsSelectedTypes);

  renderVsHeaderPills();
  syncVsGridSelectionUI();

  const hasTypes = oppTypes.length > 0;
  const hasRoster = Array.isArray(state.allResults) && state.allResults.length > 0;

  // Check if user has confirmed selection (type grid is hidden = Done was clicked)
  const typeGridSection = document.getElementById('vsTypeGridSection');
  const isConfirmed = typeGridSection && typeGridSection.hidden;

  // Toggle type grid vs recommendations visibility
  if (dom.vsRecommendationsEl) {
    dom.vsRecommendationsEl.hidden = !isConfirmed;
    dom.vsRecommendationsEl.classList.toggle('has-roster', hasRoster);
  }

  // Toggle padding on panel body when recommendations visible
  const panelBody = document.getElementById('vsPanelBody');
  if (panelBody) {
    panelBody.classList.toggle('recs-visible', isConfirmed);
  }

  // Toggle expanded state on opponent header (expanded when type grid visible)
  const opponentHeader = document.getElementById('vsOpponentHeader');
  if (opponentHeader) {
    opponentHeader.classList.toggle('is-expanded', !isConfirmed);
  }

  // Render top arrows between opponent header and recommendations
  renderTopArrows(oppTypes, isConfirmed);

  if (!isConfirmed) {
    updateScrollState();
    return;
  }

  // Types selected - render type effectiveness (Pokemon Types + Move Types)
  renderVsBrief(oppTypes);

  // Your Pokemon section - toggle content based on CSV
  if (dom.vsPokeRecoResultsEl) dom.vsPokeRecoResultsEl.hidden = !hasRoster;
  if (dom.vsUploadPromptEl) dom.vsUploadPromptEl.hidden = hasRoster;

  if (hasRoster) {
    renderRosterPicks(oppTypes);
  }

  // General Pokemon - render budget counters
  renderBudgetCounters(oppTypes);
  if (dom.vsBudgetSectionEl) dom.vsBudgetSectionEl.hidden = false;

  updateScrollState();
}

// Sticky metrics
export function updateStickyMetrics() {
  const appbar = document.querySelector('.appbar');
  const modebar = document.querySelector('.modebar');
  const utilbar = document.querySelector('.utility-row');
  const collectionbar = document.querySelector('.collectionbar');
  const filterzone = document.querySelector('.filterzone');

  const appH = Math.round(appbar ? appbar.getBoundingClientRect().height : 0);
  const modeH = Math.round(modebar ? modebar.getBoundingClientRect().height : 0);
  const utilH = Math.round(utilbar ? utilbar.getBoundingClientRect().height : 0);
  const colH = Math.round(collectionbar ? collectionbar.getBoundingClientRect().height : 0);
  const filH = Math.round(filterzone ? filterzone.getBoundingClientRect().height : 0);

  document.documentElement.style.setProperty('--appbar-real-h', `${appH}px`);
  document.documentElement.style.setProperty('--modebar-real-h', `${modeH}px`);
  document.documentElement.style.setProperty('--utilbar-real-h', `${utilH}px`);
  document.documentElement.style.setProperty('--collectionbar-real-h', `${colH}px`);
  document.documentElement.style.setProperty('--filterzone-real-h', `${filH}px`);

  const stackH = appH + modeH + utilH + colH + filH;
  document.documentElement.style.setProperty('--sticky-stack-h', `${stackH}px`);
  document.documentElement.style.setProperty('--sticky-offset', `${stackH}px`);

  updateTableHeaderTop();
}

export function updateTableHeaderTop() {
  const thead = document.querySelector('thead');
  if (!thead) return;

  const stackH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--sticky-stack-h')) || 0;
  const rect = thead.getBoundingClientRect();

  const shouldStick = rect.top <= stackH + 1;
  document.documentElement.style.setProperty('--table-sticky-top', shouldStick ? `${stackH}px` : '0px');
}

/**
 * Manage scroll state based on content
 * Prevents scrolling in empty states (all tabs show "coming soon" or VS has no results)
 */
export function updateScrollState() {
  const mode = state.currentMode;
  let isEmpty = true;

  if (mode === 'vs') {
    // VS tab: only scrollable when types are selected AND there's content
    const hasTypes = state.vsSelectedTypes.size > 0;
    const hasRoster = state.allResults.length > 0;
    // Allow scroll only when both conditions met (recommendations visible)
    isEmpty = !(hasTypes && hasRoster);
  } else {
    // Collection and Trade tabs are "coming soon" - always empty state
    isEmpty = true;
  }

  document.documentElement.classList.toggle('empty-state', isEmpty);
}

/**
 * Update carousel to show specific slide
 * @param {number} index - Slide index (0-6)
 */
export function updateCarousel(index) {
  const track = document.getElementById('carouselTrack');
  if (!track) return;

  // Clamp index to valid range
  const clampedIndex = Math.max(0, Math.min(6, index));

  // Update state
  setCarouselIndex(clampedIndex);

  // Slide the carousel track
  track.style.transform = `translateX(-${clampedIndex * 100}%)`;

  // Update dot indicators
  const dots = document.querySelectorAll('.carousel-dot');
  dots.forEach((dot, i) => {
    dot.classList.toggle('is-active', i === clampedIndex);
  });
}

/**
 * Navigate carousel to next slide
 */
export function carouselNext() {
  updateCarousel(state.carouselIndex + 1);
}

/**
 * Navigate carousel to previous slide
 */
export function carouselPrev() {
  updateCarousel(state.carouselIndex - 1);
}

/**
 * Reset carousel to first slide
 */
export function resetCarousel() {
  updateCarousel(0);
}
