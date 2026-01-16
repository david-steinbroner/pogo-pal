/**
 * PoGO Pal - Render Functions
 * UI rendering and display updates
 */

import { state, TYPES, TOTAL_TYPES, TYPE_CHART, typeMeta } from '../state.js';
import { detectCSVMapping } from '../csv/mapping.js';
import * as dom from './dom.js';

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

  TYPES.forEach(t => {
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

// Error display
export function showParseError(title, meta) {
  if (!dom.parseErrorEl) return;
  const metaHtml = meta ? `<div class="error-meta">${meta}</div>` : '';
  dom.parseErrorEl.innerHTML = `<div class="error-title">${title}</div>${metaHtml}`;
  dom.parseErrorEl.hidden = false;
}

export function hideParseError() {
  if (dom.parseErrorEl) dom.parseErrorEl.hidden = true;
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

  TYPES.forEach(t => {
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

export function syncVsTypePickerLabel() {
  const det = document.getElementById('vsTypePicker');
  const btn = document.getElementById('vsDoneBtn');
  if (!det || !btn) return;
  btn.textContent = det.open ? 'Done' : 'Edit';
}

export function renderVsSelectedChips() {
  if (!dom.vsSelectedEl) return;
  dom.vsSelectedEl.innerHTML = '';

  const list = Array.from(state.vsSelectedTypes);
  if (!list.length) return;

  list.forEach(t => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'type-pill';
    chip.title = 'Remove';
    chip.dataset.type = t;

    const icon = document.createElement('span');
    icon.className = 'icon-chip';
    const meta = typeMeta(t);
    if (meta) icon.style.background = `var(${meta.colorVar})`;
    icon.innerHTML = svgForType(t);

    const label = document.createElement('span');
    label.textContent = t;

    chip.appendChild(icon);
    chip.appendChild(label);
    dom.vsSelectedEl.appendChild(chip);
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
    const pill = document.createElement('span');
    pill.className = 'type-pill';
    const meta = typeMeta(t);

    const icon = document.createElement('span');
    icon.className = 'icon-chip';
    if (meta) icon.style.background = `var(${meta.colorVar})`;
    icon.innerHTML = svgForType(t);

    const label = document.createElement('span');
    label.textContent = t;

    pill.appendChild(icon);
    pill.appendChild(label);
    container.appendChild(pill);
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

export function makePokePickCard(row, typesArr, cp) {
  const card = document.createElement('div');
  card.className = 'poke-card';

  const name = document.createElement('div');
  const nameText = row.name || '-';
  name.className = 'poke-name';
  // Dynamic font scaling for long names
  if (nameText.length > 14) {
    name.classList.add('very-long-name');
  } else if (nameText.length > 10) {
    name.classList.add('long-name');
  }
  name.textContent = nameText;

  const meta = document.createElement('div');
  meta.className = 'poke-meta mono';
  meta.textContent = `CP ${cp || 0}`;

  const types = document.createElement('div');
  types.className = 'poke-types';

  (typesArr || []).forEach(t => {
    const chip = document.createElement('span');
    chip.className = 'type-pill';

    const icon = document.createElement('span');
    icon.className = 'icon-chip';
    const m = typeMeta(t);
    if (m) icon.style.background = `var(${m.colorVar})`;
    icon.innerHTML = svgForType(t);

    const label = document.createElement('span');
    label.className = 'type-name';
    label.textContent = t;

    chip.appendChild(icon);
    chip.appendChild(label);
    types.appendChild(chip);
  });

  card.appendChild(name);
  card.appendChild(meta);
  card.appendChild(types);

  return card;
}

export function renderRosterPicks(oppTypes) {
  if (!dom.vsTopPicksEl || !dom.vsRiskyPicksEl) return;

  dom.vsTopPicksEl.innerHTML = '';
  dom.vsRiskyPicksEl.innerHTML = '';

  if (dom.vsRosterNoteEl) {
    dom.vsRosterNoteEl.hidden = true;
    dom.vsRosterNoteEl.textContent = '';
  }

  const scored = scoreRosterAgainst(oppTypes);
  const offenseOk = scored.filter(s => s.offenseBest >= 1.0);
  const source = offenseOk.length >= 3 ? offenseOk : scored;

  const top = source.slice(0, 6);

  const topKeys = new Set(top.map(s => `${s.row.name}||${s.cp}||${s.defTypes.join(',')}`));
  const risky = scored
    .filter(s => !topKeys.has(`${s.row.name}||${s.cp}||${s.defTypes.join(',')}`))
    .filter(s => s.incomingWorst >= 1.6 || s.offenseBest < 1.0)
    .sort((a, b) => b.cp - a.cp)
    .slice(0, 6);

  if (dom.vsRosterNoteEl) {
    const weakRoster = offenseOk.length < 3;
    if (weakRoster) {
      dom.vsRosterNoteEl.hidden = false;
      dom.vsRosterNoteEl.textContent = 'Limited counters found: showing your safest picks (plus CP) even if damage may be neutral.';
    }
  }

  top.forEach(s => dom.vsTopPicksEl.appendChild(makePokePickCard(s.row, s.defTypes, s.cp)));
  risky.forEach(s => dom.vsRiskyPicksEl.appendChild(makePokePickCard(s.row, s.defTypes, s.cp)));
}

export function renderVsBrief(oppTypes) {
  const guidance = computeMoveGuidance(oppTypes);
  const avoidBodies = computeAvoidBodies(oppTypes);
  const bringBodies = computeBringBodies(oppTypes);

  renderTypePills(dom.vsBringMovesEl, guidance.bring);
  renderTypePills(dom.vsAvoidMovesEl, guidance.avoid);
  renderTypePills(dom.vsBringBodiesEl, bringBodies);
  renderTypePills(dom.vsAvoidBodiesEl, avoidBodies);
}

export function syncVsUI() {
  const oppTypes = Array.from(state.vsSelectedTypes);

  renderVsSelectedChips();
  syncVsGridSelectionUI();

  // Sync the Done/Edit label based on details open state
  syncVsTypePickerLabel();

  const hasTypes = oppTypes.length > 0;
  const hasRoster = Array.isArray(state.allResults) && state.allResults.length > 0;

  // Hide everything below CLEAR/DONE when no types selected
  if (dom.vsRecommendationsEl) dom.vsRecommendationsEl.hidden = !hasTypes;

  if (!hasTypes) {
    updateScrollState();
    return;
  }

  // Types selected - render Section 1
  renderVsBrief(oppTypes);

  // Section 2: show results if CSV, otherwise show upload prompt
  if (dom.vsPokeRecoResultsEl) dom.vsPokeRecoResultsEl.hidden = !hasRoster;
  if (dom.vsUploadPromptEl) dom.vsUploadPromptEl.hidden = hasRoster;

  if (hasRoster) {
    renderRosterPicks(oppTypes);
  }

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
