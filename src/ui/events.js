/**
 * PoGO Pal - Event Handlers
 * User interaction handlers and event wiring
 */

import { state, toggleType, clearSelectedTypes, toggleVsType, clearVsTypes, setSortState, cycleTheme } from '../state.js';
import * as dom from './dom.js';
import * as render from './render.js';

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

  // Version tap-to-copy
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
    });
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
}

