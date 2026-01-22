/**
 * PoGO Pal - Render Functions
 * UI rendering and display updates
 */

import { state, TYPES, TYPE_CHART, typeMeta, setCarouselIndex } from '../state.js';
import { getCountersPerType, getWeakCountersPerType } from '../data/budgetCounters.js';
import * as dom from './dom.js';

// Popup state
let popupTimeout = null;
let activePopupTrigger = null;

/**
 * Check if popup is currently visible
 */
function isPopupVisible() {
  return dom.pokePopup && !dom.pokePopup.hidden && dom.pokePopup.classList.contains('is-visible');
}

/**
 * Show Pokemon info popup at tap location
 * @param {string} pokeName - Pokemon name
 * @param {string[]} pokeTypes - Pokemon's types
 * @param {string} oppType - Opponent type this counter is effective against
 * @param {number} x - X position (from tap)
 * @param {number} y - Y position (from tap)
 * @param {HTMLElement} triggerEl - Element that triggered the popup (for toggle behavior)
 * @param {string} popupMode - 'best_counters' or 'worst_counters'
 */
export function showPokePopup(pokeName, pokeTypes, oppType, x, y, triggerEl = null, popupMode = 'best_counters') {
  if (!dom.pokePopup || !dom.pokePopupText) return;

  // Clear any existing timeout
  if (popupTimeout) {
    clearTimeout(popupTimeout);
    popupTimeout = null;
  }

  // Remove active state from previous trigger
  if (activePopupTrigger) {
    activePopupTrigger.classList.remove('is-popup-active');
  }

  // Track which element triggered this popup
  activePopupTrigger = triggerEl;

  // Add active state to current trigger
  if (triggerEl) {
    triggerEl.classList.add('is-popup-active');
  }

  // Build popup content with pressed type pills
  const pokeType = pokeTypes && pokeTypes[0] ? pokeTypes[0] : 'Normal';
  const pokePill = createPopupPill(pokeType);
  const oppPill = createPopupPill(oppType);

  dom.pokePopupText.innerHTML = '';

  if (popupMode === 'worst_counters') {
    // Worst Counters: "[pokemon] [pill] is weak against [pill] Pokémon."
    dom.pokePopupText.appendChild(document.createTextNode(`${pokeName} `));
    dom.pokePopupText.appendChild(pokePill);
    dom.pokePopupText.appendChild(document.createTextNode(` is weak against `));
    dom.pokePopupText.appendChild(oppPill);
    dom.pokePopupText.appendChild(document.createTextNode(` Pokémon.`));
  } else {
    // Best Counters: "[pokemon] [pill] will perform well against [pill] Pokémon."
    dom.pokePopupText.appendChild(document.createTextNode(`${pokeName} `));
    dom.pokePopupText.appendChild(pokePill);
    dom.pokePopupText.appendChild(document.createTextNode(` will perform well against `));
    dom.pokePopupText.appendChild(oppPill);
    dom.pokePopupText.appendChild(document.createTextNode(` Pokémon.`));
  }

  // Position popup near tap, but keep on screen
  const popup = dom.pokePopup;
  popup.hidden = false;

  // Get popup dimensions after content is set
  const popupRect = popup.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  // Position above the tap point, centered horizontally
  let left = x - popupRect.width / 2;
  let top = y - popupRect.height - 12;

  // Keep on screen
  if (left < 8) left = 8;
  if (left + popupRect.width > viewportWidth - 8) left = viewportWidth - popupRect.width - 8;
  if (top < 8) top = y + 24; // Show below if not enough room above

  popup.style.left = `${left}px`;
  popup.style.top = `${top}px`;

  // Show with animation
  requestAnimationFrame(() => {
    popup.classList.add('is-visible');
  });
}

/**
 * Hide Pokemon info popup
 */
export function hidePokePopup() {
  if (!dom.pokePopup) return;
  dom.pokePopup.classList.remove('is-visible');

  // Remove active state from trigger
  if (activePopupTrigger) {
    activePopupTrigger.classList.remove('is-popup-active');
  }
  activePopupTrigger = null;

  popupTimeout = setTimeout(() => {
    dom.pokePopup.hidden = true;
  }, 150);
}

/**
 * Show type icon popup (for Best Counter Types / Super Effective Move Types)
 * @param {string} typeName - The type being shown
 * @param {string} oppType - Opponent type
 * @param {string} popupMode - 'counter_types' or 'move_types'
 * @param {number} x - X position
 * @param {number} y - Y position
 * @param {HTMLElement} triggerEl - Element that triggered the popup (for toggle behavior)
 */
export function showTypePopup(typeName, oppType, popupMode, x, y, triggerEl = null) {
  if (!dom.pokePopup || !dom.pokePopupText) return;

  if (popupTimeout) {
    clearTimeout(popupTimeout);
    popupTimeout = null;
  }

  // Remove active state from previous trigger
  if (activePopupTrigger) {
    activePopupTrigger.classList.remove('is-popup-active');
  }

  // Track which element triggered this popup
  activePopupTrigger = triggerEl;

  // Add active state to current trigger
  if (triggerEl) {
    triggerEl.classList.add('is-popup-active');
  }

  const typePill = createPopupPill(typeName);
  const oppPill = createPopupPill(oppType);

  dom.pokePopupText.innerHTML = '';

  // Format: "[pill] Pokémon will perform well against [pill] Pokémon."
  dom.pokePopupText.appendChild(typePill);
  dom.pokePopupText.appendChild(document.createTextNode(` Pokémon will perform well against `));
  dom.pokePopupText.appendChild(oppPill);
  dom.pokePopupText.appendChild(document.createTextNode(` Pokémon.`));

  const popup = dom.pokePopup;
  popup.hidden = false;

  const popupRect = popup.getBoundingClientRect();
  const viewportWidth = window.innerWidth;

  let left = x - popupRect.width / 2;
  let top = y - popupRect.height - 12;

  if (left < 8) left = 8;
  if (left + popupRect.width > viewportWidth - 8) left = viewportWidth - popupRect.width - 8;
  if (top < 8) top = y + 24;

  popup.style.left = `${left}px`;
  popup.style.top = `${top}px`;

  requestAnimationFrame(() => {
    popup.classList.add('is-visible');
  });
}

// Capture phase handler to intercept taps when popup is open
// This ensures outside taps only close the popup without triggering other actions
document.addEventListener('touchstart', (e) => {
  if (!isPopupVisible()) return;

  // If tap is inside popup, allow it
  if (dom.pokePopup.contains(e.target)) return;

  // If tap is on the active trigger element, let it through (for toggle behavior)
  if (activePopupTrigger && (activePopupTrigger === e.target || activePopupTrigger.contains(e.target))) return;

  // Otherwise, consume the tap and close popup
  e.preventDefault();
  e.stopPropagation();
  hidePokePopup();
}, { capture: true, passive: false });

document.addEventListener('click', (e) => {
  if (!isPopupVisible()) return;

  // If click is inside popup, allow it
  if (dom.pokePopup.contains(e.target)) return;

  // If click is on the active trigger element, let it through (for toggle behavior)
  if (activePopupTrigger && (activePopupTrigger === e.target || activePopupTrigger.contains(e.target))) return;

  // Otherwise, consume the click and close popup
  e.preventDefault();
  e.stopPropagation();
  hidePokePopup();
}, { capture: true });

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

// Get filtered rows
export function getFilteredRows() {
  if (state.selectedTypes.size === 0) return state.allResults;
  return state.allResults.filter(r => rowTypeList(r).some(t => state.selectedTypes.has(t)));
}

// Main view update (placeholder for future Collection tab implementation)
export function updateView() {
  const filtered = getFilteredRows();
  state.lastVisibleCount = filtered.length;
}

// Error modal display
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

// Alias for CSV parse errors
export function hideParseError() {
  hideError();
}

// CSV debug display (no-op, debug panel removed)
export function renderCSVMetaDebug() {}

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
 * Always shows 3 pill slots - selected types + empty placeholders
 */
export function renderVsHeaderPills() {
  const container = document.getElementById('vsHeaderPills');
  if (!container) return;
  container.innerHTML = '';

  const list = Array.from(state.vsSelectedTypes);
  const maxSlots = 3;

  // Render selected type pills
  list.forEach(t => {
    const pill = createTypePill(t, true); // button for interaction
    pill.classList.add('is-selected');
    container.appendChild(pill);
  });

  // Fill remaining slots with terminal-style placeholder lines
  for (let i = list.length; i < maxSlots; i++) {
    const placeholder = document.createElement('span');
    placeholder.className = 'type-slot-line';
    container.appendChild(placeholder);
  }
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
 * Create inline type pill for popups (always pressed state)
 * Uses standard .type-pill structure for consistency
 * @param {string} typeName - Type name
 */
function createPopupPill(typeName) {
  const pill = document.createElement('span');
  pill.className = 'type-pill is-selected';
  pill.dataset.type = typeName;

  const icon = document.createElement('span');
  icon.className = 'icon-chip';
  const m = typeMeta(typeName);
  if (m) icon.style.background = `var(${m.colorVar})`;
  icon.innerHTML = svgForType(typeName);

  const label = document.createElement('span');
  label.className = 'type-name';
  label.textContent = typeName;

  pill.appendChild(icon);
  pill.appendChild(label);
  return pill;
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
 * @param {string} oppType - Opponent type this counter is effective against (for popup)
 * @param {string} popupMode - 'best_counters' or 'worst_counters'
 */
export function makeSimpleCard(row, typesArr, cp, oppType = null, popupMode = 'best_counters') {
  const card = document.createElement('div');
  card.className = 'simple-card';

  // Pokemon name only - pill style
  const nameEl = document.createElement('span');
  nameEl.className = 'simple-card-name';
  nameEl.textContent = row.name || '-';
  card.appendChild(nameEl);

  // Add press-and-hold handler for popup if oppType is provided
  if (oppType) {
    const pokeName = row.name || 'Pokemon';
    const pokeTypes = typesArr || [];

    card.addEventListener('touchstart', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const touch = e.touches[0];
      showPokePopup(pokeName, pokeTypes, oppType, touch.clientX, touch.clientY, card, popupMode);
    }, { passive: false });

    card.addEventListener('touchend', (e) => {
      e.stopPropagation();
      hidePokePopup();
    }, { passive: false });

    card.addEventListener('touchcancel', () => {
      hidePokePopup();
    }, { passive: false });

    // Mouse support for desktop
    card.addEventListener('mousedown', (e) => {
      showPokePopup(pokeName, pokeTypes, oppType, e.clientX, e.clientY, card, popupMode);
    });

    card.addEventListener('mouseup', () => {
      hidePokePopup();
    });

    card.addEventListener('mouseleave', () => {
      hidePokePopup();
    });
  }

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
 * @param {string} popupMode - 'best_counters' or 'worst_counters'
 */
export function renderColumnLayout(container, oppTypes, countersByType, popupMode = 'best_counters') {
  container.innerHTML = '';
  container.classList.add('type-columns');

  // Create a column for each opponent type (directly in container)
  oppTypes.forEach(oppType => {
    const column = document.createElement('div');
    column.className = 'type-column';

    // Column header - type icon (matches opponent header pills)
    const header = document.createElement('div');
    header.className = 'type-column-header';

    const icon = createTypeIcon(oppType);
    icon.classList.add('type-column-icon');
    header.appendChild(icon);

    column.appendChild(header);

    // Cards for this column
    const cardsContainer = document.createElement('div');
    cardsContainer.className = 'type-column-cards';
    const typeCounters = countersByType[oppType] || [];

    if (typeCounters.length === 0) {
      // Show placeholder card with contextual message
      const message = popupMode === 'worst_counters'
        ? `NO WEAK MATCHUPS\n${oppType} has no clear weaknesses.`
        : `NO STRONG MATCHUPS\n${oppType} has no super-effective targets.`;
      const placeholder = makePlaceholderCard(message);
      cardsContainer.appendChild(placeholder);
    } else {
      typeCounters.forEach(c => {
        const card = makeSimpleCard({ name: c.name }, c.types, c.cp || null, oppType, popupMode);
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

    // Column header - type icon (matches opponent header pills)
    const header = document.createElement('div');
    header.className = 'type-column-header';
    const icon = createTypeIcon(oppType);
    icon.classList.add('type-column-icon');
    header.appendChild(icon);
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
 * Render type icons only (no labels) in a horizontal row per column
 * Used for compact display where space is limited
 * @param {HTMLElement} container - Container element
 * @param {string[]} oppTypes - Selected opponent types (column headers)
 * @param {Object} typesByOpp - Map of oppType -> array of type names
 * @param {string|null} popupMode - Optional popup mode: 'counter_types' or 'move_types'
 */
function renderTypeIconColumnLayout(container, oppTypes, typesByOpp, popupMode = null) {
  container.innerHTML = '';
  container.classList.add('type-columns');

  oppTypes.forEach(oppType => {
    const column = document.createElement('div');
    column.className = 'type-column';

    // Column header - type icon (matches opponent header pills)
    const header = document.createElement('div');
    header.className = 'type-column-header';
    const headerIcon = createTypeIcon(oppType);
    headerIcon.classList.add('type-column-icon');
    header.appendChild(headerIcon);
    column.appendChild(header);

    // Icons row for this column (horizontal layout)
    const iconsContainer = document.createElement('div');
    iconsContainer.className = 'type-column-icons';
    const types = typesByOpp[oppType] || [];

    if (types.length === 0) {
      const noneIcon = document.createElement('span');
      noneIcon.className = 'type-icon-none';
      noneIcon.textContent = '—';
      iconsContainer.appendChild(noneIcon);
    } else {
      types.forEach(t => {
        const icon = createTypeIcon(t);
        icon.classList.add('type-result-icon');

        // Attach press-and-hold popup handlers if popupMode specified
        if (popupMode) {
          icon.addEventListener('touchstart', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const touch = e.touches[0];
            showTypePopup(t, oppType, popupMode, touch.clientX, touch.clientY, icon);
          }, { passive: false });

          icon.addEventListener('touchend', (e) => {
            e.stopPropagation();
            hidePokePopup();
          }, { passive: false });

          icon.addEventListener('touchcancel', () => {
            hidePokePopup();
          }, { passive: false });

          // Mouse support for desktop
          icon.addEventListener('mousedown', (e) => {
            showTypePopup(t, oppType, popupMode, e.clientX, e.clientY, icon);
          });

          icon.addEventListener('mouseup', () => {
            hidePokePopup();
          });

          icon.addEventListener('mouseleave', () => {
            hidePokePopup();
          });
        }

        iconsContainer.appendChild(icon);
      });
    }
    column.appendChild(iconsContainer);

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

export function renderBudgetCounters(oppTypes) {
  // Render BRING counters in column layout (Best Counters section)
  if (dom.vsBudgetPicksEl) {
    // Get exactly 3 counters per type
    const countersByType = getCountersPerType(oppTypes, 3);
    renderColumnLayout(dom.vsBudgetPicksEl, oppTypes, countersByType, 'best_counters');
  }

  // Render AVOID counters in Worst Counters section
  if (dom.vsStrongAgainstPicksEl) {
    const weakByType = getWeakCountersPerType(oppTypes, 3);
    renderColumnLayout(dom.vsStrongAgainstPicksEl, oppTypes, weakByType, 'worst_counters');
  }

  // Show/hide the Strong Against container
  if (dom.vsStrongAgainstContainerEl) {
    dom.vsStrongAgainstContainerEl.hidden = oppTypes.length === 0;
  }
}

export function renderVsBrief(oppTypes) {
  // Move Types - use icon-only layout for compact display
  const bringMoves = getBringMovesPerOpp(oppTypes);
  renderTypeIconColumnLayout(dom.vsBringMovesEl, oppTypes, bringMoves, 'move_types');

  const avoidMoves = getAvoidMovesPerOpp(oppTypes);
  renderTypeIconColumnLayout(dom.vsAvoidMovesEl, oppTypes, avoidMoves, 'worst_move_types');

  // Pokemon Types - use icon-only layout for compact display
  const bringTypes = getBringTypesPerOpp(oppTypes);
  renderTypeIconColumnLayout(dom.vsBringBodiesEl, oppTypes, bringTypes, 'counter_types');

  const avoidTypes = getAvoidTypesPerOpp(oppTypes);
  renderTypeIconColumnLayout(dom.vsAvoidBodiesEl, oppTypes, avoidTypes, 'worst_counter_types');
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
 * DISABLED - carousel track now attaches directly below collapsed opponent header
 */
function renderTopArrows(oppTypes, isConfirmed) {
  // Remove existing container if present
  const container = document.getElementById('vsTopArrows');
  if (container) container.remove();
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

  // General Pokemon - render budget counters
  renderBudgetCounters(oppTypes);
  if (dom.vsBudgetSectionEl) dom.vsBudgetSectionEl.hidden = false;

  updateScrollState();
}

// Sticky metrics - only appbar exists now
export function updateStickyMetrics() {
  const appbar = document.querySelector('.appbar');
  const appH = Math.round(appbar ? appbar.getBoundingClientRect().height : 0);

  document.documentElement.style.setProperty('--appbar-real-h', `${appH}px`);
  document.documentElement.style.setProperty('--sticky-stack-h', `${appH}px`);
  document.documentElement.style.setProperty('--sticky-offset', `${appH}px`);

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
 * @param {number} index - Slide index (0-1)
 */
export function updateCarousel(index) {
  const track = document.getElementById('carouselTrack');
  if (!track) return;

  // Clamp index to valid range (2 slides: 0 and 1)
  const clampedIndex = Math.max(0, Math.min(1, index));

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
