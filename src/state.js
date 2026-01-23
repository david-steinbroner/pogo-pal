/**
 * PoGO Pal - Application State
 * Single source of truth for app state
 */

import { typesForName } from './csv/mapping.js';

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

  // VS Pokemon mode state (array of {name, displayName, types}, max 3)
  vsSelectedPokemon: [],

  // Pokemon data
  allResults: [],
  rawPokemon: null,

  // Sort state
  sortState: { key: 'score', dir: 'desc' },

  // Debug mode (via URL param or localStorage)
  debugMode: false,

  // Last filtered count for display
  lastVisibleCount: 0,

  // VS carousel index (0-6 for 7 sections)
  carouselIndex: 0,
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

// Theme mode: 'light' | 'dark' | 'system'
// Cycle order: system → light → dark → system
const THEME_CYCLE = ['system', 'light', 'dark'];
const THEME_STORAGE_KEY = 'pogoTheme';

function getStoredTheme() {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored && THEME_CYCLE.includes(stored)) return stored;
  } catch (e) { /* ignore */ }
  return 'system';
}

function applyTheme(theme) {
  const html = document.documentElement;
  html.setAttribute('data-theme', theme);
  state.themeMode = theme;
}

export function initTheme() {
  const theme = getStoredTheme();
  applyTheme(theme);
}

export function cycleTheme() {
  const current = state.themeMode || 'system';
  const currentIndex = THEME_CYCLE.indexOf(current);
  const nextIndex = (currentIndex + 1) % THEME_CYCLE.length;
  const nextTheme = THEME_CYCLE[nextIndex];

  applyTheme(nextTheme);

  try {
    localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
  } catch (e) { /* ignore */ }

  return nextTheme;
}

state.themeMode = 'system';

// State update functions
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

// VS Pokemon mode functions
export function addVsPokemon(name, displayName) {
  // Check if already selected
  const existing = state.vsSelectedPokemon.find(p => p.name.toLowerCase() === name.toLowerCase());
  if (existing) return false;

  // Enforce max 3
  if (state.vsSelectedPokemon.length >= 3) return false;

  // Look up types from pokedex
  const types = typesForName(name);
  if (!types || types.length === 0) return false;

  state.vsSelectedPokemon.push({
    name: name.toLowerCase(),
    displayName: displayName || name.charAt(0).toUpperCase() + name.slice(1).toLowerCase(),
    types: types
  });
  return true;
}

export function removeVsPokemon(name) {
  const index = state.vsSelectedPokemon.findIndex(p => p.name.toLowerCase() === name.toLowerCase());
  if (index !== -1) {
    state.vsSelectedPokemon.splice(index, 1);
    return true;
  }
  return false;
}

export function clearVsPokemon() {
  state.vsSelectedPokemon = [];
}

export function setResults(results) {
  state.allResults = Array.isArray(results) ? results : [];
}

export function setSortState(key, dir) {
  state.sortState = { key, dir };
}

export function setCarouselIndex(index) {
  state.carouselIndex = Math.max(0, Math.min(6, index));
}

export function typeMeta(name) {
  return TYPES.find(t => t.name === name);
}
