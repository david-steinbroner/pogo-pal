/**
 * PoGO Pal - Application State
 * Single source of truth for app state
 */

// Type definitions for reference
export const TYPES = [
  { name: 'Normal',   colorVar: '--t-normal'   },
  { name: 'Fire',     colorVar: '--t-fire'     },
  { name: 'Water',    colorVar: '--t-water'    },
  { name: 'Electric', colorVar: '--t-electric' },
  { name: 'Grass',    colorVar: '--t-grass'    },
  { name: 'Ice',      colorVar: '--t-ice'      },
  { name: 'Fighting', colorVar: '--t-fighting' },
  { name: 'Poison',   colorVar: '--t-poison'   },
  { name: 'Ground',   colorVar: '--t-ground'   },
  { name: 'Flying',   colorVar: '--t-flying'   },
  { name: 'Psychic',  colorVar: '--t-psychic'  },
  { name: 'Bug',      colorVar: '--t-bug'      },
  { name: 'Rock',     colorVar: '--t-rock'     },
  { name: 'Ghost',    colorVar: '--t-ghost'    },
  { name: 'Dragon',   colorVar: '--t-dragon'   },
  { name: 'Dark',     colorVar: '--t-dark'     },
  { name: 'Steel',    colorVar: '--t-steel'    },
  { name: 'Fairy',    colorVar: '--t-fairy'    },
];

export const TOTAL_TYPES = 18;

// Type effectiveness chart (Pokemon GO multipliers)
export const TYPE_CHART = {
  Normal:   { super: [], resist: ['Rock','Steel'], immune: ['Ghost'] },
  Fire:     { super: ['Grass','Ice','Bug','Steel'], resist: ['Fire','Water','Rock','Dragon'], immune: [] },
  Water:    { super: ['Fire','Ground','Rock'], resist: ['Water','Grass','Dragon'], immune: [] },
  Electric: { super: ['Water','Flying'], resist: ['Electric','Grass','Dragon'], immune: ['Ground'] },
  Grass:    { super: ['Water','Ground','Rock'], resist: ['Fire','Grass','Poison','Flying','Bug','Dragon','Steel'], immune: [] },
  Ice:      { super: ['Grass','Ground','Flying','Dragon'], resist: ['Fire','Water','Ice','Steel'], immune: [] },
  Fighting: { super: ['Normal','Ice','Rock','Dark','Steel'], resist: ['Poison','Flying','Psychic','Bug','Fairy'], immune: ['Ghost'] },
  Poison:   { super: ['Grass','Fairy'], resist: ['Poison','Ground','Rock','Ghost'], immune: ['Steel'] },
  Ground:   { super: ['Fire','Electric','Poison','Rock','Steel'], resist: ['Grass','Bug'], immune: ['Flying'] },
  Flying:   { super: ['Grass','Fighting','Bug'], resist: ['Electric','Rock','Steel'], immune: [] },
  Psychic:  { super: ['Fighting','Poison'], resist: ['Psychic','Steel'], immune: ['Dark'] },
  Bug:      { super: ['Grass','Psychic','Dark'], resist: ['Fire','Fighting','Poison','Flying','Ghost','Steel','Fairy'], immune: [] },
  Rock:     { super: ['Fire','Ice','Flying','Bug'], resist: ['Fighting','Ground','Steel'], immune: [] },
  Ghost:    { super: ['Psychic','Ghost'], resist: ['Dark'], immune: ['Normal'] },
  Dragon:   { super: ['Dragon'], resist: ['Steel'], immune: ['Fairy'] },
  Dark:     { super: ['Psychic','Ghost'], resist: ['Fighting','Dark','Fairy'], immune: [] },
  Steel:    { super: ['Ice','Rock','Fairy'], resist: ['Fire','Water','Electric','Steel'], immune: [] },
  Fairy:    { super: ['Fighting','Dragon','Dark'], resist: ['Fire','Poison','Steel'], immune: [] },
};

// Application state
export const state = {
  // Current mode: 'collection' | 'vs' | 'trade'
  currentMode: 'collection',

  // Collection filter state (Set of selected type names, empty = all)
  selectedTypes: new Set(),

  // VS mode state (Set of opponent type names, max 3)
  vsSelectedTypes: new Set(),

  // Pokemon data
  allResults: [],
  rawPokemon: null,

  // Sort state
  sortState: { key: 'score', dir: 'desc' },

  // Debug mode (via URL param or localStorage)
  debugMode: false,

  // Last filtered count for display
  lastVisibleCount: 0,
};

// Initialize debug mode
function getDebugMode() {
  try {
    const qs = new URLSearchParams(window.location.search);
    const q = String(qs.get('debug') || '').toLowerCase();
    if (q === '1' || q === 'true' || q === 'yes') return true;
  } catch (e) { /* ignore */ }

  try {
    const ls = String(localStorage.getItem('pogoDebug') || '').toLowerCase();
    if (ls === '1' || ls === 'true' || ls === 'yes') return true;
  } catch (e) { /* ignore */ }

  return false;
}

state.debugMode = getDebugMode();

// State update functions
export function setMode(mode) {
  const valid = ['collection', 'vs', 'trade'];
  state.currentMode = valid.includes(mode) ? mode : 'collection';
}

export function toggleType(typeName) {
  if (state.selectedTypes.has(typeName)) {
    state.selectedTypes.delete(typeName);
  } else {
    state.selectedTypes.add(typeName);
  }
}

export function clearSelectedTypes() {
  state.selectedTypes.clear();
}

export function toggleVsType(typeName) {
  if (state.vsSelectedTypes.has(typeName)) {
    state.vsSelectedTypes.delete(typeName);
  } else {
    if (state.vsSelectedTypes.size >= 3) return false;
    state.vsSelectedTypes.add(typeName);
  }
  return true;
}

export function clearVsTypes() {
  state.vsSelectedTypes.clear();
}

export function setResults(results) {
  state.allResults = Array.isArray(results) ? results : [];
}

export function setSortState(key, dir) {
  state.sortState = { key, dir };
}

export function typeMeta(name) {
  return TYPES.find(t => t.name === name);
}
