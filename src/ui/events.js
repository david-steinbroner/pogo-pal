/**
 * PoGO Pal - Event Handlers
 * User interaction handlers and event wiring
 */

import { state, toggleType, clearSelectedTypes, toggleVsType, clearVsTypes, addVsPokemon, removeVsPokemon, clearVsPokemon, setSortState, cycleTheme } from '../state.js';
import * as dom from './dom.js';
import * as render from './render.js';
import { searchPokemonFlat, getExactMatch, getBestFuzzySuggestion, highlightMatch } from './pokemonSearch.js';

// Sentry breadcrumb helper (no-op if Sentry unavailable)
function addBreadcrumb(message, data = {}) {
  if (window.Sentry) {
    Sentry.addBreadcrumb({
      category: 'user-action',
      message,
      data,
      level: 'info',
    });
  }
}

// Owner mode constants
const OWNER_PASSCODE = 'pogopal2026';
let versionTapCount = 0;
let versionTapTimer = null;

// IndexedDB for feedback storage
const DB_NAME = 'PoGOPalFeedback';
const DB_VERSION = 1;
const STORE_NAME = 'submissions';

function openFeedbackDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}

async function saveFeedback(data) {
  const db = await openFeedbackDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.add(data);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function getAllFeedback() {
  const db = await openFeedbackDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function clearAllFeedback() {
  const db = await openFeedbackDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.clear();
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

async function getFeedbackCount() {
  const db = await openFeedbackDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.count();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Passcode modal functions
function showPasscodeModal() {
  if (!dom.passcodeModal || !dom.passcodeModalBackdrop) return;
  dom.passcodeModalBackdrop.hidden = false;
  dom.passcodeModal.hidden = false;
  if (dom.passcodeInput) {
    dom.passcodeInput.value = '';
    dom.passcodeInput.focus();
  }
  if (dom.passcodeError) dom.passcodeError.hidden = true;
  document.body.classList.add('no-scroll');
}

function hidePasscodeModal() {
  if (dom.passcodeModal) dom.passcodeModal.hidden = true;
  if (dom.passcodeModalBackdrop) dom.passcodeModalBackdrop.hidden = true;
  document.body.classList.remove('no-scroll');
}

function checkPasscode() {
  const input = dom.passcodeInput?.value || '';
  if (input === OWNER_PASSCODE) {
    localStorage.setItem('ownerMode', '1');
    hidePasscodeModal();
    enableOwnerMode();
  } else {
    if (dom.passcodeError) dom.passcodeError.hidden = false;
  }
}

async function enableOwnerMode() {
  if (dom.ownerControls) dom.ownerControls.hidden = false;
  await updateFeedbackCount();
}

async function updateFeedbackCount() {
  if (!dom.feedbackCount) return;
  try {
    const count = await getFeedbackCount();
    dom.feedbackCount.textContent = `${count} saved submission${count !== 1 ? 's' : ''}`;
  } catch (err) {
    dom.feedbackCount.textContent = '? submissions';
  }
}

// Feedback form functions
function showFeedbackStatus(message, type) {
  if (!dom.feedbackStatus) return;
  dom.feedbackStatus.textContent = message;
  dom.feedbackStatus.className = `feedback-status ${type}`;
  dom.feedbackStatus.hidden = false;
  setTimeout(() => {
    if (dom.feedbackStatus) dom.feedbackStatus.hidden = true;
  }, 3000);
}

function resetFeedbackForm() {
  // Clear rating
  if (dom.feedbackRating) {
    dom.feedbackRating.querySelectorAll('.rating-btn').forEach(b => b.classList.remove('is-selected'));
  }
  // Clear checkboxes
  if (dom.feedbackIssues) {
    dom.feedbackIssues.querySelectorAll('input').forEach(cb => cb.checked = false);
  }
  // Hide other issue input
  if (dom.feedbackOtherIssue) {
    dom.feedbackOtherIssue.hidden = true;
    dom.feedbackOtherIssue.value = '';
  }
  // Reset radio to "not sure"
  if (dom.feedbackWhere) {
    const notSure = dom.feedbackWhere.querySelector('input[value="not-sure"]');
    if (notSure) notSure.checked = true;
  }
  // Clear textarea
  if (dom.feedbackText) dom.feedbackText.value = '';
  // Clear file input
  if (dom.feedbackAttachment) dom.feedbackAttachment.value = '';
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve({ name: file.name, type: file.type, data: reader.result });
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function submitFeedback() {
  // Gather form data
  const rating = dom.feedbackRating?.querySelector('.rating-btn.is-selected')?.dataset.rating || null;

  const issues = [];
  dom.feedbackIssues?.querySelectorAll('input:checked').forEach(cb => issues.push(cb.value));

  const where = dom.feedbackWhere?.querySelector('input:checked')?.value || 'not-sure';
  const otherIssueText = dom.feedbackOtherIssue?.value || '';
  const freeformText = dom.feedbackText?.value || '';

  // Get attachment as base64 (if any)
  let attachment = null;
  const file = dom.feedbackAttachment?.files[0];
  if (file) {
    attachment = await fileToBase64(file);
  }

  // Get app context
  const activeTab = document.querySelector('.window-tab.is-active')?.textContent || 'Unknown';
  const selectedTypes = Array.from(document.querySelectorAll('#vsHeaderPills .type-pill')).map(p => p.textContent);

  const submission = {
    timestamp: new Date().toISOString(),
    appVersion: dom.versionTag?.textContent || 'unknown',
    activeTab,
    selectedOpponentTypes: selectedTypes,
    url: window.location.href,
    userAgent: navigator.userAgent,
    rating: rating ? parseInt(rating, 10) : null,
    issues,
    where,
    otherIssueText,
    freeformText,
    attachment
  };

  try {
    await saveFeedback(submission);
    showFeedbackStatus('Thanks for your feedback!', 'success');
    resetFeedbackForm();
    await updateFeedbackCount();
    addBreadcrumb('feedback_submitted', { rating, issues: issues.length });
  } catch (err) {
    showFeedbackStatus('Failed to save feedback', 'error');
    console.error('[PoGO] Feedback save error:', err);
  }
}

async function exportFeedback() {
  try {
    const submissions = await getAllFeedback();
    const json = JSON.stringify(submissions, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pogo-pal-feedback-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    addBreadcrumb('feedback_exported', { count: submissions.length });
  } catch (err) {
    console.error('[PoGO] Export error:', err);
  }
}

async function clearFeedback() {
  if (!confirm('Clear all saved feedback? This cannot be undone.')) return;
  try {
    await clearAllFeedback();
    await updateFeedbackCount();
    addBreadcrumb('feedback_cleared');
  } catch (err) {
    console.error('[PoGO] Clear error:', err);
  }
}

// Initialize owner mode on load
function initOwnerMode() {
  const urlParams = new URLSearchParams(window.location.search);
  const hasDebugParam = urlParams.get('debug') === '1';
  const hasOwnerFlag = localStorage.getItem('ownerMode') === '1';

  if (hasOwnerFlag) {
    enableOwnerMode();
  } else if (hasDebugParam) {
    // debug=1 triggers passcode prompt, doesn't auto-enable
    showPasscodeModal();
  }
}

// Sheet management
let activeSheet = null;
let activeTrigger = null;

export function openSheetFor(sheetEl, triggerEl) {
  activeSheet = sheetEl;
  activeTrigger = triggerEl || null;
  sheetEl.hidden = false;
  dom.backdrop.hidden = false;
  document.body.classList.add('no-scroll');
  const firstBtn = sheetEl.querySelector('button');
  if (firstBtn) {
    try { firstBtn.focus(); } catch (_) {}
  }
}

export function closeActiveSheet() {
  if (activeSheet) activeSheet.hidden = true;
  if (dom.backdrop) dom.backdrop.hidden = true;
  document.body.classList.remove('no-scroll');
  if (activeTrigger) {
    try { activeTrigger.focus(); } catch (_) {}
  }
  activeSheet = null;
  activeTrigger = null;
}

export function openSheet() {
  addBreadcrumb('open_type_picker');
  openSheetFor(dom.sheet, dom.typesOpenBtn);
}

export function closeSheet() {
  closeActiveSheet();
}

// Mode switching
export function setModeUI(mode, isInitial = false) {
  const m = (mode === 'vs' || mode === 'collection' || mode === 'trade') ? mode : 'collection';
  const isVS = m === 'vs';
  const isCollection = m === 'collection';
  const isTrade = m === 'trade';

  // Update Sentry view tag
  if (window.Sentry) {
    Sentry.setTag('view', m);
  }

  // Add breadcrumb for view switch (skip initial load)
  if (!isInitial) {
    addBreadcrumb('switch_view', { view: m });
  }

  const setTab = (btn, on) => {
    if (!btn) return;
    btn.classList.toggle('is-active', !!on);
    btn.setAttribute('aria-selected', on ? 'true' : 'false');
  };
  setTab(dom.modeVsBtn, isVS);
  setTab(dom.modeCollectionBtn, isCollection);
  setTab(dom.modeTradeBtn, isTrade);

  // Show/hide view wrappers
  if (dom.viewVersus) dom.viewVersus.hidden = !isVS;
  if (dom.collectionView) dom.collectionView.hidden = !isCollection;
  if (dom.viewTrade) dom.viewTrade.hidden = !isTrade;

  if (!isCollection && activeSheet && !activeSheet.hidden) closeSheet();

  render.updateStickyMetrics();
  render.updateScrollState();
}

// VS sub-tab switcher
export function setVsSubTab(subTab) {
  console.log('[setVsSubTab]', subTab);
  const isTypes = subTab === 'types';
  const isPokemon = subTab === 'pokemon';

  const setTab = (btn, on) => {
    if (!btn) return;
    btn.classList.toggle('is-active', !!on);
    btn.setAttribute('aria-selected', on ? 'true' : 'false');
  };

  setTab(dom.vsSubTabTypes, isTypes);
  setTab(dom.vsSubTabPokemon, isPokemon);

  if (dom.vsSubViewTypes) dom.vsSubViewTypes.hidden = !isTypes;
  if (dom.vsSubViewPokemon) dom.vsSubViewPokemon.hidden = !isPokemon;

  // Render initial state when switching to Pokemon tab
  if (isPokemon) {
    render.syncVsPokemonUI();
  }
}

// Type toggle handler for collection filter
export function handleTypeToggle(typeName) {
  toggleType(typeName);
  render.renderActiveStrip();
  render.syncGridSelectionUI();
  render.updateView();
}

// VS type toggle handler
export function handleVsTypeToggle(typeName) {
  addBreadcrumb('select_type', { type: typeName });
  const success = toggleVsType(typeName);
  if (!success) {
    // Max 3 types reached - flash the selected pills to indicate limit
    const headerPills = document.getElementById('vsHeaderPills');
    if (headerPills) {
      headerPills.classList.add('flash-error');
      setTimeout(() => headerPills.classList.remove('flash-error'), 800);
    }
    // Also flash the selected pills in the grid
    const gridPills = document.querySelectorAll('#vsTypeGrid .type-pill.is-selected');
    gridPills.forEach(pill => {
      pill.classList.add('flash-error');
      setTimeout(() => pill.classList.remove('flash-error'), 800);
    });
    return;
  }
  render.syncVsUI();
}

// Sort handler
export function handleHeaderClick(e) {
  const th = e.currentTarget;
  const key = th.dataset.key;
  if (!key) return;

  if (state.sortState.key === key) {
    const newDir = state.sortState.dir === 'asc' ? 'desc' : 'asc';
    setSortState(key, newDir);
  } else {
    const numKeys = new Set(['score', 'cp', 'iv', 'grade']);
    const dir = numKeys.has(key) ? 'desc' : 'asc';
    setSortState(key, dir);
  }

  render.updateView();
}

// Drawer management
export function openDrawer() {
  if (!dom.infoDrawer || !dom.drawerBackdrop) return;
  // Close upload drawer if open (with try-catch for safety)
  try { closeUploadDrawer(); } catch (_) {}
  dom.infoDrawer.classList.add('open');
  dom.infoDrawer.setAttribute('aria-hidden', 'false');
  dom.drawerBackdrop.hidden = false;
  document.body.classList.add('no-scroll');
  if (dom.infoBtn) dom.infoBtn.classList.add('is-active');
}

export function closeDrawer() {
  if (!dom.infoDrawer) return;
  dom.infoDrawer.classList.remove('open');
  dom.infoDrawer.setAttribute('aria-hidden', 'true');
  if (dom.drawerBackdrop) dom.drawerBackdrop.hidden = true;
  document.body.classList.remove('no-scroll');
  if (dom.infoBtn) dom.infoBtn.classList.remove('is-active');
}

// Upload drawer management
export function openUploadDrawer() {
  if (!dom.uploadDrawer || !dom.drawerBackdrop) return;
  // Close info drawer if open (with try-catch for safety)
  try { closeDrawer(); } catch (_) {}
  // Reset upload status when opening
  if (dom.uploadStatus) dom.uploadStatus.hidden = true;
  dom.uploadDrawer.classList.add('open');
  dom.uploadDrawer.setAttribute('aria-hidden', 'false');
  dom.drawerBackdrop.hidden = false;
  document.body.classList.add('no-scroll');
  if (dom.uploadBtn) dom.uploadBtn.classList.add('is-active');
}

export function closeUploadDrawer() {
  if (!dom.uploadDrawer) return;
  dom.uploadDrawer.classList.remove('open');
  dom.uploadDrawer.setAttribute('aria-hidden', 'true');
  // Only hide backdrop if info drawer is also closed
  const infoOpen = dom.infoDrawer && dom.infoDrawer.classList.contains('open');
  if (dom.drawerBackdrop && !infoOpen) {
    dom.drawerBackdrop.hidden = true;
  }
  document.body.classList.remove('no-scroll');
  if (dom.uploadBtn) dom.uploadBtn.classList.remove('is-active');
}

// Scroll throttle
let _raf = 0;
export function onScrollOrResize() {
  if (_raf) return;
  _raf = requestAnimationFrame(() => {
    _raf = 0;
    render.updateStickyMetrics();
  });
}

// Wire all event listeners
export function wireEvents() {
  // Global error handlers
  window.addEventListener('error', (e) => {
    console.log('[global] error', e.message, e.filename, e.lineno, e.colno, e.error);
  });
  window.addEventListener('unhandledrejection', (e) => {
    console.log('[global] unhandledrejection', e.reason);
  });

  // Mode tabs
  if (dom.modeVsBtn) {
    dom.modeVsBtn.addEventListener('click', () => {
      state.currentMode = 'vs';
      setModeUI('vs');
    });
  }
  if (dom.modeCollectionBtn) {
    dom.modeCollectionBtn.addEventListener('click', () => {
      state.currentMode = 'collection';
      setModeUI('collection');
    });
  }
  if (dom.modeTradeBtn) {
    dom.modeTradeBtn.addEventListener('click', () => {
      state.currentMode = 'trade';
      setModeUI('trade');
    });
  }

  // VS sub-tabs
  if (dom.vsSubTabTypes) {
    dom.vsSubTabTypes.addEventListener('click', () => {
      setVsSubTab('types');
    });
  }
  if (dom.vsSubTabPokemon) {
    dom.vsSubTabPokemon.addEventListener('click', () => {
      setVsSubTab('pokemon');
    });
  }

  // Upload button - opens upload drawer instead of file picker
  if (dom.uploadBtn) {
    dom.uploadBtn.addEventListener('click', openUploadDrawer);
  }

  // Dark mode toggle - cycles through system → light → dark
  if (dom.darkModeBtn) {
    dom.darkModeBtn.addEventListener('click', () => {
      const newTheme = cycleTheme();
      addBreadcrumb('toggle_theme', { theme: newTheme });
    });
  }

  // Upload drawer close button
  if (dom.uploadDrawerCloseBtn) {
    dom.uploadDrawerCloseBtn.addEventListener('click', closeUploadDrawer);
  }

  // Upload drawer "Choose File" button - triggers actual file picker
  if (dom.uploadDrawerBtn && dom.fileInput) {
    dom.uploadDrawerBtn.addEventListener('click', () => dom.fileInput.click());
  }

  // Type sheet controls
  if (dom.typesOpenBtn) {
    dom.typesOpenBtn.addEventListener('click', openSheet);
  }
  if (dom.doneBtn) {
    dom.doneBtn.addEventListener('click', closeSheet);
  }
  if (dom.backdrop) {
    dom.backdrop.addEventListener('click', closeSheet);
  }
  if (dom.sheetClearBtn) {
    dom.sheetClearBtn.addEventListener('click', () => {
      clearSelectedTypes();
      render.renderActiveStrip();
      render.syncGridSelectionUI();
      render.updateView();
    });
  }
  if (dom.selectAllBtn) {
    dom.selectAllBtn.addEventListener('click', () => {
      clearSelectedTypes();
      render.renderActiveStrip();
      render.syncGridSelectionUI();
      render.updateView();
      try { render.syncVsUI(); } catch (_) {}
    });
  }
  if (dom.clearBtn) {
    dom.clearBtn.addEventListener('click', () => {
      clearSelectedTypes();
      render.renderActiveStrip();
      render.syncGridSelectionUI();
      render.updateView();
    });
  }

  // Type grid clicks (delegated)
  if (dom.gridEl) {
    dom.gridEl.addEventListener('click', (e) => {
      const btn = e.target.closest('button.type-pill');
      if (btn && btn.dataset.type) {
        handleTypeToggle(btn.dataset.type);
      }
    });
  }

  // Active icons strip clicks (remove filter)
  if (dom.activeIconsEl) {
    dom.activeIconsEl.addEventListener('click', (e) => {
      const chip = e.target.closest('.icon-chip-btn');
      if (chip && chip.dataset.type) {
        handleTypeToggle(chip.dataset.type);
      }
    });
  }

  // VS mode events - use pointerup for iOS Safari reliability with click fallback
  if (dom.vsGridEl) {
    let vsGridHandled = false;

    dom.vsGridEl.addEventListener('pointerup', (e) => {
      const btn = e.target.closest('button.type-pill');
      if (btn && btn.dataset.type) {
        vsGridHandled = true;
        handleVsTypeToggle(btn.dataset.type);
      }
    });

    dom.vsGridEl.addEventListener('click', (e) => {
      // Skip if already handled by pointerup (avoid double-trigger)
      if (vsGridHandled) { vsGridHandled = false; return; }
      const btn = e.target.closest('button.type-pill');
      if (btn && btn.dataset.type) {
        handleVsTypeToggle(btn.dataset.type);
      }
    });
  }
  if (dom.vsClearBtn) {
    dom.vsClearBtn.addEventListener('click', () => {
      addBreadcrumb('clear_types');
      clearVsTypes();
      // Ensure type grid stays visible when clearing
      const typeGridSection = document.getElementById('vsTypeGridSection');
      if (typeGridSection) typeGridSection.hidden = false;
      render.syncVsUI();
    });
  }

  // VS Opponent selector Done button
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('#vsDoneBtn');
    if (!btn) return;

    e.preventDefault();
    e.stopPropagation();

    const typeGridSection = document.getElementById('vsTypeGridSection');
    if (!typeGridSection) return;

    // Validate at least 1 type selected
    if (state.vsSelectedTypes.size === 0) {
      const helperText = document.querySelector('.opponent-instructions .helper-text');
      if (helperText) {
        helperText.classList.add('flash-error');
        setTimeout(() => helperText.classList.remove('flash-error'), 800);
      }
      return;
    }

    // Collapse type grid and show recommendations
    typeGridSection.hidden = true;
    render.syncVsUI();
  });

  // Opponent header click - expands when collapsed, removes pill when expanded
  const opponentHeader = document.getElementById('vsOpponentHeader');
  if (opponentHeader) {
    opponentHeader.addEventListener('click', (e) => {
      const typeGridSection = document.getElementById('vsTypeGridSection');
      if (!typeGridSection) return;

      const isCollapsed = typeGridSection.hidden;

      if (isCollapsed) {
        // Collapsed: expand the section (show type grid)
        typeGridSection.hidden = false;
        render.syncVsUI();
      } else {
        // Expanded: check if a pill was clicked to remove it
        const pill = e.target.closest('.type-pill');
        if (pill && pill.dataset.type) {
          handleVsTypeToggle(pill.dataset.type);
        }
      }
    });
  }

  // VS Pokemon search - typeahead input handler
  if (dom.vsPokemonSearchInput) {
    // Track current highlighted index for keyboard navigation
    let highlightedIndex = -1;

    // Recently searched Pokemon (session-only, max 3)
    const recentSearches = [];
    let recentSearchTimer = null;

    // Helper: Add Pokemon to recent searches
    function addToRecent(pokemon) {
      // Remove if already exists (to move to front)
      const existingIdx = recentSearches.findIndex(p => p.name === pokemon.name);
      if (existingIdx !== -1) {
        recentSearches.splice(existingIdx, 1);
      }
      // Add to front
      recentSearches.unshift(pokemon);
      // Keep max 3
      if (recentSearches.length > 3) {
        recentSearches.pop();
      }
    }

    // Helper: Select a Pokemon and clear input
    function selectPokemon(name, displayName) {
      const added = addVsPokemon(name, displayName);
      if (added) {
        addBreadcrumb('add_pokemon', { name });
        // Add to recent searches
        const pokemon = state.vsSelectedPokemon.find(p => p.name === name);
        if (pokemon) {
          addToRecent({ name: pokemon.name, displayName: pokemon.displayName, types: pokemon.types });
        }
        dom.vsPokemonSearchInput.value = '';
        hideSearchResults();
        render.syncVsPokemonUI();
      }
    }

    // Helper: Hide search results dropdown
    function hideSearchResults() {
      if (dom.vsPokemonSearchResults) {
        dom.vsPokemonSearchResults.hidden = true;
        dom.vsPokemonSearchResults.innerHTML = '';
      }
      highlightedIndex = -1;
      // Clear recent search timer
      if (recentSearchTimer) {
        clearTimeout(recentSearchTimer);
        recentSearchTimer = null;
      }
    }

    // Helper: Render recent searches
    function renderRecentSearches() {
      const ul = dom.vsPokemonSearchResults;
      if (!ul || recentSearches.length === 0) return;

      ul.innerHTML = '';
      highlightedIndex = -1;

      // Header
      const header = document.createElement('li');
      header.className = 'search-section-header';
      header.textContent = 'Recent';
      ul.appendChild(header);

      // Recent items
      recentSearches.forEach((pokemon, idx) => {
        const li = document.createElement('li');
        li.className = 'search-result-item';
        li.dataset.name = pokemon.name;
        li.dataset.displayName = pokemon.displayName;
        li.dataset.index = idx;

        // Name (no highlight for recent)
        const nameSpan = document.createElement('span');
        nameSpan.className = 'result-name';
        nameSpan.textContent = pokemon.displayName;

        // Type badges
        const typesSpan = document.createElement('span');
        typesSpan.className = 'result-types';
        pokemon.types.forEach(t => {
          const badge = render.createTypeIcon(t, 'sm');
          typesSpan.appendChild(badge);
          const typeLabel = document.createElement('span');
          typeLabel.textContent = ' ' + t + ' ';
          typesSpan.appendChild(typeLabel);
        });

        li.appendChild(nameSpan);
        li.appendChild(typesSpan);
        ul.appendChild(li);
      });

      ul.hidden = false;
    }

    // Helper: Start timer to show recent searches
    function startRecentSearchTimer() {
      if (recentSearchTimer) clearTimeout(recentSearchTimer);
      recentSearchTimer = setTimeout(() => {
        const query = dom.vsPokemonSearchInput.value.trim();
        // Only show if input is empty and we have recent searches
        if (query.length === 0 && recentSearches.length > 0) {
          renderRecentSearches();
        }
      }, 2000);
    }

    // Helper: Render search results
    function renderSearchResults(results, query) {
      const ul = dom.vsPokemonSearchResults;
      if (!ul) return;

      ul.innerHTML = '';
      highlightedIndex = -1;

      if (results.length === 0) {
        ul.innerHTML = '<li class="search-no-results">No match. Try fewer letters.</li>';
        ul.hidden = false;
        return;
      }

      results.forEach((pokemon, idx) => {
        const li = document.createElement('li');
        li.className = 'search-result-item';
        li.dataset.name = pokemon.name;
        li.dataset.displayName = pokemon.displayName;
        li.dataset.index = idx;

        // Name with highlighted match
        const nameSpan = document.createElement('span');
        nameSpan.className = 'result-name';
        nameSpan.innerHTML = highlightMatch(pokemon.displayName, query);

        // Type badges
        const typesSpan = document.createElement('span');
        typesSpan.className = 'result-types';
        pokemon.types.forEach(t => {
          const badge = render.createTypeIcon(t, 'sm');
          typesSpan.appendChild(badge);
          const typeLabel = document.createElement('span');
          typeLabel.textContent = ' ' + t + ' ';
          typesSpan.appendChild(typeLabel);
        });

        li.appendChild(nameSpan);
        li.appendChild(typesSpan);
        ul.appendChild(li);
      });

      ul.hidden = false;
    }

    // Helper: Show confirm suggestion for fuzzy match
    function showConfirmSuggestion(pokemon) {
      const ul = dom.vsPokemonSearchResults;
      if (!ul) return;

      ul.innerHTML = '';
      const li = document.createElement('li');
      li.className = 'search-confirm-row';
      li.innerHTML = `No exact match. Add <strong>${pokemon.displayName}</strong>?`;
      const btn = document.createElement('button');
      btn.className = 'confirm-btn';
      btn.textContent = 'Add';
      btn.onclick = (e) => {
        e.stopPropagation();
        selectPokemon(pokemon.name, pokemon.displayName);
      };
      li.appendChild(btn);
      ul.appendChild(li);
      ul.hidden = false;
    }

    // Input handler - update results on keystroke
    dom.vsPokemonSearchInput.addEventListener('input', (e) => {
      // Clear recent search timer when user types
      if (recentSearchTimer) {
        clearTimeout(recentSearchTimer);
        recentSearchTimer = null;
      }

      const query = e.target.value.trim();
      if (query.length < 1) {
        hideSearchResults();
        // Start timer to show recent searches after 2 seconds of no input
        startRecentSearchTimer();
        return;
      }
      const results = searchPokemonFlat(query, 10);
      renderSearchResults(results, query);
    });

    // Focus handler - start timer to show recent searches
    dom.vsPokemonSearchInput.addEventListener('focus', () => {
      const query = dom.vsPokemonSearchInput.value.trim();
      // Only start timer if input is empty
      if (query.length === 0) {
        startRecentSearchTimer();
      }
    });

    // Keydown handler - Enter + Arrow keys
    dom.vsPokemonSearchInput.addEventListener('keydown', (e) => {
      const items = dom.vsPokemonSearchResults?.querySelectorAll('.search-result-item') || [];

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (items.length > 0) {
          highlightedIndex = Math.min(highlightedIndex + 1, items.length - 1);
          items.forEach((item, i) => item.classList.toggle('highlighted', i === highlightedIndex));
          items[highlightedIndex]?.scrollIntoView({ block: 'nearest' });
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (items.length > 0) {
          highlightedIndex = Math.max(highlightedIndex - 1, 0);
          items.forEach((item, i) => item.classList.toggle('highlighted', i === highlightedIndex));
          items[highlightedIndex]?.scrollIntoView({ block: 'nearest' });
        }
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const query = e.target.value.trim();
        if (!query) return;

        // If item highlighted, select it
        if (highlightedIndex >= 0 && items[highlightedIndex]) {
          const item = items[highlightedIndex];
          selectPokemon(item.dataset.name, item.dataset.displayName);
          return;
        }

        // Check for exact match
        const exact = getExactMatch(query);
        if (exact) {
          selectPokemon(exact.name, exact.displayName);
          return;
        }

        // Check for close fuzzy suggestion
        const fuzzy = getBestFuzzySuggestion(query);
        if (fuzzy && fuzzy.distance <= 2) {
          showConfirmSuggestion(fuzzy);
        } else {
          // No good match
          const ul = dom.vsPokemonSearchResults;
          if (ul) {
            ul.innerHTML = '<li class="search-no-results">No match. Try fewer letters.</li>';
            ul.hidden = false;
          }
        }
      } else if (e.key === 'Escape') {
        hideSearchResults();
        e.target.blur();
      }
    });

    // Result click handler
    if (dom.vsPokemonSearchResults) {
      dom.vsPokemonSearchResults.addEventListener('click', (e) => {
        const item = e.target.closest('.search-result-item');
        if (item) {
          selectPokemon(item.dataset.name, item.dataset.displayName);
        }
      });
    }

    // Click outside to close results
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.pokemon-selector-row')) {
        hideSearchResults();
      }
    });

    // iOS Keyboard: Adjust search results max-height when keyboard is visible
    // This ensures results remain visible and scrollable above the keyboard
    function updateSearchResultsMaxHeight() {
      if (!dom.vsPokemonSearchResults) return;

      const vv = window.visualViewport;
      if (vv && window.__keyboardMode) {
        // Calculate available height from input position to viewport bottom
        const input = dom.vsPokemonSearchInput;
        const inputRect = input.getBoundingClientRect();
        const inputBottom = inputRect.bottom;
        const viewportBottom = vv.height + vv.offsetTop;
        const availableHeight = viewportBottom - inputBottom - 20; // 20px buffer

        // Clamp between 120px min and 280px max
        const maxHeight = Math.max(120, Math.min(280, availableHeight));
        dom.vsPokemonSearchResults.style.setProperty('--search-results-max-height', `${maxHeight}px`);
      } else {
        // Reset to default when keyboard is not visible
        dom.vsPokemonSearchResults.style.removeProperty('--search-results-max-height');
      }
    }

    // Listen for visualViewport changes to adjust results height
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', updateSearchResultsMaxHeight);
    }

    // Also update on focus (keyboard just opened)
    dom.vsPokemonSearchInput.addEventListener('focus', () => {
      // Small delay to let keyboard animation start
      setTimeout(updateSearchResultsMaxHeight, 100);
    });

    dom.vsPokemonSearchInput.addEventListener('blur', () => {
      // Reset max-height when input loses focus
      setTimeout(() => {
        if (dom.vsPokemonSearchResults) {
          dom.vsPokemonSearchResults.style.removeProperty('--search-results-max-height');
        }
      }, 200);
    });
  }

  // VS Pokemon clear button
  if (dom.vsPokemonClearBtn) {
    dom.vsPokemonClearBtn.addEventListener('click', () => {
      addBreadcrumb('clear_pokemon');
      clearVsPokemon();
      // Clear search input
      if (dom.vsPokemonSearchInput) dom.vsPokemonSearchInput.value = '';
      if (dom.vsPokemonSearchResults) {
        dom.vsPokemonSearchResults.hidden = true;
        dom.vsPokemonSearchResults.innerHTML = '';
      }
      // Show selector, hide recommendations
      const selectorBody = document.getElementById('vsPokemonSelectorBody');
      if (selectorBody) selectorBody.hidden = false;
      if (dom.vsPokemonRecommendationsEl) dom.vsPokemonRecommendationsEl.hidden = true;
      render.syncVsPokemonUI();
    });
  }

  // VS Pokemon Done button
  if (dom.vsPokemonDoneBtn) {
    dom.vsPokemonDoneBtn.addEventListener('click', () => {
      // Validate at least 1 Pokemon selected
      if (state.vsSelectedPokemon.length === 0) {
        const helperText = document.querySelector('#vsPokemonSelectorBody .pokemon-selector-helper');
        if (helperText) {
          helperText.classList.add('flash-error');
          setTimeout(() => helperText.classList.remove('flash-error'), 800);
        }
        return;
      }

      addBreadcrumb('pokemon_done', { count: state.vsSelectedPokemon.length });

      // Hide selector, show recommendations
      const selectorBody = document.getElementById('vsPokemonSelectorBody');
      if (selectorBody) selectorBody.hidden = true;
      if (dom.vsPokemonRecommendationsEl) dom.vsPokemonRecommendationsEl.hidden = false;

      // Clear search input and results
      if (dom.vsPokemonSearchInput) dom.vsPokemonSearchInput.value = '';
      if (dom.vsPokemonSearchResults) {
        dom.vsPokemonSearchResults.hidden = true;
        dom.vsPokemonSearchResults.innerHTML = '';
      }

      render.syncVsPokemonUI();
    });
  }

  // Undo toast helper for Pokemon removal
  let undoToastTimeout = null;
  function showUndoToast(pokemon) {
    const toast = dom.pokemonUndoToast;
    if (!toast) return;

    // Clear any existing timeout
    if (undoToastTimeout) clearTimeout(undoToastTimeout);

    toast.innerHTML = `Removed ${pokemon.displayName}. `;
    const btn = document.createElement('button');
    btn.className = 'undo-btn';
    btn.textContent = 'Undo';
    btn.onclick = () => {
      if (undoToastTimeout) clearTimeout(undoToastTimeout);
      addVsPokemon(pokemon.name, pokemon.displayName);
      addBreadcrumb('undo_remove_pokemon', { name: pokemon.name });
      render.syncVsPokemonUI();
      toast.hidden = true;
    };
    toast.appendChild(btn);
    toast.hidden = false;

    // Auto-hide after 4 seconds
    undoToastTimeout = setTimeout(() => {
      toast.hidden = true;
    }, 4000);
  }

  // VS Pokemon header click - expands when collapsed, removes Pokemon when expanded
  const pokemonHeader = document.getElementById('vsPokemonOpponentHeader');
  if (pokemonHeader) {
    pokemonHeader.addEventListener('click', (e) => {
      const selectorBody = document.getElementById('vsPokemonSelectorBody');
      if (!selectorBody) return;

      const isCollapsed = selectorBody.hidden;

      if (isCollapsed) {
        // Collapsed: expand (show selector) and auto-focus search input
        selectorBody.hidden = false;
        if (dom.vsPokemonRecommendationsEl) dom.vsPokemonRecommendationsEl.hidden = true;
        render.syncVsPokemonUI();
        // Focus search input after brief delay to let UI update
        setTimeout(() => {
          if (dom.vsPokemonSearchInput) {
            dom.vsPokemonSearchInput.focus();
          }
        }, 50);
      } else {
        // Expanded: check if a pill was clicked to remove it
        const pill = e.target.closest('[data-pokemon]');
        if (pill && pill.dataset.pokemon) {
          // Find the Pokemon data before removing
          const pokemonData = state.vsSelectedPokemon.find(
            p => p.name.toLowerCase() === pill.dataset.pokemon.toLowerCase()
          );
          removeVsPokemon(pill.dataset.pokemon);
          addBreadcrumb('remove_pokemon', { name: pill.dataset.pokemon });
          render.syncVsPokemonUI();
          // Show undo toast
          if (pokemonData) {
            showUndoToast(pokemonData);
          }
        }
      }
    });
  }

  // Tap empty area in Pokemon header pills → focus search input
  // Triggers when clicking anywhere in the pills container that isn't a Pokemon pill
  if (dom.vsPokemonHeaderPills) {
    dom.vsPokemonHeaderPills.addEventListener('click', (e) => {
      // If user clicked on an actual Pokemon pill, don't focus search (let removal handler work)
      const clickedPill = e.target.closest('.pokemon-header-pill');
      if (clickedPill) return;

      // Only focus if selector is visible (not collapsed)
      const selectorBody = document.getElementById('vsPokemonSelectorBody');
      if (selectorBody && !selectorBody.hidden && dom.vsPokemonSearchInput) {
        dom.vsPokemonSearchInput.focus();
      }
    });
  }

  // Error modal
  if (dom.errorModal && dom.errorModalBackdrop) {
    dom.errorModalBackdrop.addEventListener('click', render.hideError);
    dom.errorModal.addEventListener('click', (e) => {
      if (e.target === dom.errorModal) render.hideError();
    });
    if (dom.errorModalClose) {
      dom.errorModalClose.addEventListener('click', render.hideError);
    }
  }

  // Collapsible sections - reusable toggle handler
  document.querySelectorAll('.collapsible-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const section = btn.closest('.collapsible-section');
      if (!section) return;

      const isCollapsed = section.classList.toggle('collapsed');
      btn.textContent = isCollapsed ? '+' : '−';
      btn.setAttribute('aria-expanded', String(!isCollapsed));

      // Sync VS UI when collapsible sections change
      render.syncVsUI();
    });
  });

  // Tappable section headers - click entire header to toggle collapse
  document.querySelectorAll('.tappable-header').forEach(header => {
    header.addEventListener('click', () => {
      const section = header.closest('.collapsible-section');
      if (!section) return;

      section.classList.toggle('collapsed');
    });
  });

  // Table header sorting (Collection tab - currently placeholder)
  // Guard: dom.tableHeaders may be empty array if no table exists
  if (dom.tableHeaders && dom.tableHeaders.length) {
    dom.tableHeaders.forEach(th => th.addEventListener('click', handleHeaderClick));
  }

  // Info drawer
  if (dom.infoBtn) {
    dom.infoBtn.addEventListener('click', () => {
      const isOpen = dom.infoDrawer && dom.infoDrawer.classList.contains('open');
      if (isOpen) closeDrawer(); else openDrawer();
    });
  }
  if (dom.drawerBackdrop) {
    dom.drawerBackdrop.addEventListener('click', () => {
      // Close whichever drawer is open
      if (dom.infoDrawer?.classList.contains('open')) closeDrawer();
      if (dom.uploadDrawer?.classList.contains('open')) closeUploadDrawer();
    });
  }
  if (dom.drawerCloseBtn) {
    dom.drawerCloseBtn.addEventListener('click', closeDrawer);
  }

  // Version tap-to-copy + owner unlock gesture (7 taps)
  if (dom.versionCopyBtn && dom.versionTag) {
    dom.versionCopyBtn.addEventListener('click', async () => {
      const version = dom.versionTag.textContent;
      try {
        await navigator.clipboard.writeText(version);
        if (dom.versionCopied) {
          dom.versionCopied.hidden = false;
          setTimeout(() => { dom.versionCopied.hidden = true; }, 1500);
        }
      } catch (err) {
        // Fallback for older browsers - just select the text
        console.log('[PoGO] Clipboard API not available');
      }

      // Owner unlock gesture: 7 taps within 3 seconds
      versionTapCount++;
      if (versionTapTimer) clearTimeout(versionTapTimer);
      versionTapTimer = setTimeout(() => { versionTapCount = 0; }, 3000);

      if (versionTapCount >= 7) {
        versionTapCount = 0;
        if (versionTapTimer) clearTimeout(versionTapTimer);
        showPasscodeModal();
      }
    });
  }

  // Passcode modal events
  if (dom.passcodeModalBackdrop) {
    dom.passcodeModalBackdrop.addEventListener('click', hidePasscodeModal);
  }
  if (dom.passcodeModalClose) {
    dom.passcodeModalClose.addEventListener('click', hidePasscodeModal);
  }
  if (dom.passcodeSubmitBtn) {
    dom.passcodeSubmitBtn.addEventListener('click', checkPasscode);
  }
  if (dom.passcodeInput) {
    dom.passcodeInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') checkPasscode();
    });
  }

  // Feedback form events
  if (dom.feedbackRating) {
    dom.feedbackRating.addEventListener('click', (e) => {
      const btn = e.target.closest('.rating-btn');
      if (!btn) return;
      dom.feedbackRating.querySelectorAll('.rating-btn').forEach(b => b.classList.remove('is-selected'));
      btn.classList.add('is-selected');
    });
  }

  // Show/hide "other" text input based on checkbox
  if (dom.feedbackIssues) {
    dom.feedbackIssues.addEventListener('change', (e) => {
      if (e.target.value === 'other') {
        if (dom.feedbackOtherIssue) {
          dom.feedbackOtherIssue.hidden = !e.target.checked;
        }
      }
    });
  }

  // Submit feedback
  if (dom.feedbackSubmitBtn) {
    dom.feedbackSubmitBtn.addEventListener('click', submitFeedback);
  }

  // Owner controls
  if (dom.exportFeedbackBtn) {
    dom.exportFeedbackBtn.addEventListener('click', exportFeedback);
  }
  if (dom.clearFeedbackBtn) {
    dom.clearFeedbackBtn.addEventListener('click', clearFeedback);
  }

  // Keyboard
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (activeSheet && !activeSheet.hidden) closeSheet();
      if (dom.infoDrawer && dom.infoDrawer.classList.contains('open')) closeDrawer();
      if (dom.uploadDrawer && dom.uploadDrawer.classList.contains('open')) closeUploadDrawer();
      if (dom.errorModal && !dom.errorModal.hidden) {
        render.hideError();
      }
      if (dom.passcodeModal && !dom.passcodeModal.hidden) {
        hidePasscodeModal();
      }
    }
  });

  // Scroll/resize
  window.addEventListener('resize', onScrollOrResize);
  window.addEventListener('scroll', onScrollOrResize, { passive: true });

  // Carousel dot navigation (delegated)
  const carouselDots = document.getElementById('carouselDots');
  if (carouselDots) {
    carouselDots.addEventListener('click', (e) => {
      const dot = e.target.closest('.carousel-dot');
      if (dot && dot.dataset.index !== undefined) {
        e.preventDefault();
        const index = parseInt(dot.dataset.index, 10);
        if (!isNaN(index)) {
          render.updateCarousel(index);
        }
      }
    });
  }

  // Carousel swipe navigation (touch)
  // Use vsRecommendations container with capture phase to ensure we get events
  // even when touching interactive elements like type pills
  const carouselContainer = document.getElementById('vsRecommendations');
  if (carouselContainer) {
    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;

    carouselContainer.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      touchStartTime = Date.now();
    }, { passive: true, capture: true });

    carouselContainer.addEventListener('touchend', (e) => {
      if (!e.changedTouches.length) return;

      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      const deltaX = touchEndX - touchStartX;
      const deltaY = touchEndY - touchStartY;
      const elapsed = Date.now() - touchStartTime;

      // Minimum swipe distance threshold (50px)
      // Only trigger if horizontal movement > vertical (not a scroll)
      // Also check it's a quick swipe (under 500ms) to avoid slow drags
      if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY) && elapsed < 500) {
        if (deltaX < 0) {
          render.carouselNext();  // Swipe left → next slide
        } else {
          render.carouselPrev();  // Swipe right → prev slide
        }
      }
    }, { passive: true, capture: true });
  }

  // Pokemon carousel dot navigation (delegated)
  if (dom.pokemonCarouselDots) {
    dom.pokemonCarouselDots.addEventListener('click', (e) => {
      const dot = e.target.closest('.carousel-dot');
      if (dot && dot.dataset.index !== undefined) {
        e.preventDefault();
        const index = parseInt(dot.dataset.index, 10);
        if (!isNaN(index)) {
          render.updatePokemonCarousel(index);
        }
      }
    });
  }

  // Pokemon carousel swipe navigation (touch)
  if (dom.vsPokemonRecommendationsEl) {
    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;
    let pokemonCarouselIndex = 0;

    dom.vsPokemonRecommendationsEl.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      touchStartTime = Date.now();
    }, { passive: true, capture: true });

    dom.vsPokemonRecommendationsEl.addEventListener('touchend', (e) => {
      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      const deltaX = touchEndX - touchStartX;
      const deltaY = touchEndY - touchStartY;
      const duration = Date.now() - touchStartTime;

      // Quick horizontal swipe with minimal vertical movement
      const isHorizontalSwipe = Math.abs(deltaX) > 50 && Math.abs(deltaY) < 80 && duration < 500;

      if (isHorizontalSwipe) {
        if (deltaX < 0) {
          pokemonCarouselIndex = Math.min(1, pokemonCarouselIndex + 1);
        } else {
          pokemonCarouselIndex = Math.max(0, pokemonCarouselIndex - 1);
        }
        render.updatePokemonCarousel(pokemonCarouselIndex);
      }
    }, { passive: true, capture: true });
  }

  // Initialize owner mode (check localStorage or ?debug=1)
  initOwnerMode();
}

