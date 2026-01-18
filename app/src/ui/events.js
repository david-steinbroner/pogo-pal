/**
 * PoGO Pal - Event Handlers
 * User interaction handlers and event wiring
 */

import { state, toggleType, clearSelectedTypes, toggleVsType, clearVsTypes, setSortState } from '../state.js';
import * as dom from './dom.js';
import * as render from './render.js';

// Sheet management
let activeSheet = null;
let activeTrigger = null;

export function openSheetFor(sheetEl, triggerEl) {
  activeSheet = sheetEl;
  activeTrigger = triggerEl || null;
  sheetEl.hidden = false;
  dom.backdrop.hidden = false;
  document.body.style.overflow = 'hidden';
  const firstBtn = sheetEl.querySelector('button');
  if (firstBtn) {
    try { firstBtn.focus(); } catch (_) {}
  }
}

export function closeActiveSheet() {
  if (activeSheet) activeSheet.hidden = true;
  if (dom.backdrop) dom.backdrop.hidden = true;
  document.body.style.overflow = '';
  if (activeTrigger) {
    try { activeTrigger.focus(); } catch (_) {}
  }
  activeSheet = null;
  activeTrigger = null;
}

export function openSheet() {
  openSheetFor(dom.sheet, dom.typesOpenBtn);
}

export function closeSheet() {
  closeActiveSheet();
}

// Mode switching
export function setModeUI(mode) {
  const m = (mode === 'vs' || mode === 'collection' || mode === 'trade') ? mode : 'collection';
  const isVS = m === 'vs';
  const isCollection = m === 'collection';
  const isTrade = m === 'trade';

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

// Type toggle handler for collection filter
export function handleTypeToggle(typeName) {
  toggleType(typeName);
  render.renderActiveStrip();
  render.syncGridSelectionUI();
  render.updateView();
}

// VS type toggle handler
export function handleVsTypeToggle(typeName) {
  toggleVsType(typeName);
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
  dom.infoDrawer.classList.add('open');
  dom.infoDrawer.setAttribute('aria-hidden', 'false');
  dom.drawerBackdrop.hidden = false;
  document.body.classList.add('no-scroll');
  if (dom.infoBtn) dom.infoBtn.classList.add('is-active');
}

export function closeDrawer() {
  if (!dom.infoDrawer || !dom.drawerBackdrop) return;
  dom.infoDrawer.classList.remove('open');
  dom.infoDrawer.setAttribute('aria-hidden', 'true');
  dom.drawerBackdrop.hidden = true;
  document.body.classList.remove('no-scroll');
  if (dom.infoBtn) dom.infoBtn.classList.remove('is-active');
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

  // Upload button
  if (dom.uploadBtn && dom.fileInput) {
    dom.uploadBtn.addEventListener('click', () => dom.fileInput.click());
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

  // VS mode events
  if (dom.vsGridEl) {
    dom.vsGridEl.addEventListener('click', (e) => {
      const btn = e.target.closest('button.type-pill');
      if (btn && btn.dataset.type) {
        handleVsTypeToggle(btn.dataset.type);
      }
    });
  }
  if (dom.vsClearBtn) {
    dom.vsClearBtn.addEventListener('click', () => {
      clearVsTypes();
      // Ensure section stays expanded when clearing
      const section = document.getElementById('vsOpponentSection');
      if (section && section.classList.contains('collapsed')) {
        section.classList.remove('collapsed');
      }
      render.syncVsUI();
    });
  }

  // VS Opponent selector Done button - using event delegation for mobile reliability
  document.addEventListener('click', (e) => {
    const doneBtn = e.target.closest('#vsDoneBtn');
    if (!doneBtn) return;

    const section = document.getElementById('vsOpponentSection');
    if (!section) return;

    const isCollapsed = section.classList.contains('collapsed');

    if (!isCollapsed) {
      // Trying to collapse - validate at least 1 type selected
      if (state.vsSelectedTypes.size === 0) {
        const header = section.querySelector('.panel-subtitle');
        if (header) {
          header.classList.add('flash-error');
          setTimeout(() => header.classList.remove('flash-error'), 800);
        }
        return;
      }
      // Collapse the section
      section.classList.add('collapsed');
      render.syncVsUI();
    }
  });

  // Opponent header click - expands when collapsed, removes pill when expanded
  const opponentHeader = document.querySelector('#vsOpponentSection .opponent-header');
  if (opponentHeader) {
    opponentHeader.addEventListener('click', (e) => {
      const section = document.getElementById('vsOpponentSection');
      if (!section) return;

      const isCollapsed = section.classList.contains('collapsed');

      if (isCollapsed) {
        // Collapsed: expand the section
        section.classList.remove('collapsed');
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

  // Sticky header click - expands the opponent section
  if (dom.vsStickyHeader) {
    dom.vsStickyHeader.addEventListener('click', (e) => {
      const section = document.getElementById('vsOpponentSection');
      if (!section) return;

      // Check if a pill was clicked to remove it
      const pill = e.target.closest('.type-pill');
      if (pill && pill.dataset.type) {
        handleVsTypeToggle(pill.dataset.type);
        // If removing last type, also expand
        if (state.vsSelectedTypes.size === 0) {
          section.classList.remove('collapsed');
          render.syncVsUI();
        }
        return;
      }

      // Otherwise, expand the section
      section.classList.remove('collapsed');
      render.syncVsUI();
    });
  }

  // VS upload prompt button
  if (dom.vsUploadPromptBtn && dom.fileInput) {
    dom.vsUploadPromptBtn.addEventListener('click', () => dom.fileInput.click());
  }

  // Error modal (reusable app-wide)
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

      // If this is the opponent section, sync UI to show/hide results
      if (section.id === 'vsOpponentSection') {
        render.syncVsUI();
      }
    });
  });

  // Table header sorting
  dom.tableHeaders.forEach(th => th.addEventListener('click', handleHeaderClick));

  // Info drawer
  if (dom.infoBtn) {
    dom.infoBtn.addEventListener('click', () => {
      const isOpen = dom.infoDrawer && dom.infoDrawer.classList.contains('open');
      if (isOpen) closeDrawer(); else openDrawer();
    });
  }
  if (dom.drawerBackdrop) {
    dom.drawerBackdrop.addEventListener('click', closeDrawer);
  }
  if (dom.drawerCloseBtn) {
    dom.drawerCloseBtn.addEventListener('click', closeDrawer);
  }

  // Keyboard
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (activeSheet && !activeSheet.hidden) closeSheet();
      if (dom.infoDrawer && dom.infoDrawer.classList.contains('open')) closeDrawer();
      if (dom.errorModal && !dom.errorModal.hidden) {
        render.hideError();
      }
    }
  });

  // Scroll/resize
  window.addEventListener('resize', onScrollOrResize);
  window.addEventListener('scroll', onScrollOrResize, { passive: true });
}

// ============================================
// TEMPORARY DEBUG SNIPPET - Remove after diagnosis
// Enable in console: window.__VS_DEBUG = true
// ============================================
(function setupVsHeaderDebug(){
  const q = (sel) => document.querySelector(sel);

  function styleSummary(el){
    if(!el) return null;
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return {
      tag: el.tagName.toLowerCase(),
      id: el.id || null,
      class: el.className || null,
      rect: { top: Math.round(r.top), left: Math.round(r.left), width: Math.round(r.width), height: Math.round(r.height) },
      position: cs.position,
      top: cs.top,
      zIndex: cs.zIndex,
      overflow: `${cs.overflow}/${cs.overflowX}/${cs.overflowY}`,
      background: cs.backgroundColor,
      opacity: cs.opacity,
      transform: cs.transform,
      filter: cs.filter,
      isolation: cs.isolation,
      backdropFilter: cs.backdropFilter || cs.webkitBackdropFilter || null,
      borderRadius: cs.borderRadius,
      boxShadow: cs.boxShadow,
      marginTop: cs.marginTop,
      paddingTop: cs.paddingTop
    };
  }

  function dump(reason){
    if(!window.__VS_DEBUG) return;

    const nodes = {
      appWindow: q('.app-window'),
      windowTabs: q('.window-tabs'),
      windowContent: q('.window-content'),
      windowTopScrim: q('.window-top-scrim'),
      vsStickyHeader: q('.vs-sticky-header'),
      vsPanel: q('.vs-panel'),
      vsOpponentSection: q('#vsOpponentSection'),
      opponentHeader: q('#vsOpponentSection .opponent-header') || q('.opponent-header'),
      panelSectionHeader: q('#vsOpponentSection .panel-section-header'),
    };

    const scrollEl = nodes.windowContent;
    console.group(`[VS HEADER DEBUG] ${reason}`);
    console.log('scrollTop windowContent:', scrollEl ? Math.round(scrollEl.scrollTop) : null);
    console.log('scrollTop document:', Math.round(document.documentElement.scrollTop || document.body.scrollTop || 0));
    console.log('vsOpponentSection.collapsed:', q('#vsOpponentSection')?.classList.contains('collapsed'));
    console.log('vsStickyHeader.hidden:', q('.vs-sticky-header')?.hidden);
    Object.entries(nodes).forEach(([k, el]) => console.log(k, styleSummary(el)));
    console.groupEnd();
  }

  window.__dumpVsHeader = dump;

  window.addEventListener('load', () => dump('load'));
  window.addEventListener('resize', () => dump('resize'));

  document.addEventListener('click', (e) => {
    const t = e.target;
    const isDone = t && (t.id === 'vsDoneBtn' || (t.closest && t.closest('#vsDoneBtn')));
    const isHeader = t && (t.classList && t.classList.contains('opponent-header') || (t.closest && t.closest('.opponent-header')));
    const isStickyHeader = t && (t.closest && t.closest('.vs-sticky-header'));
    if(isDone) setTimeout(() => dump('after Done click'), 50);
    if(isHeader) setTimeout(() => dump('after header click'), 50);
    if(isStickyHeader) setTimeout(() => dump('after sticky header click'), 50);
  }, true);

  const wc = q('.window-content');
  if(wc){
    let last = 0;
    wc.addEventListener('scroll', () => {
      if(!window.__VS_DEBUG) return;
      if(wc.scrollTop > 100 && last <= 100){
        last = wc.scrollTop;
        dump('after scroll > 100px');
      } else if (wc.scrollTop <= 100){
        last = wc.scrollTop;
      }
    }, { passive: true });
  }
})();
