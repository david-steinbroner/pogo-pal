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
}

export function closeDrawer() {
  if (!dom.infoDrawer || !dom.drawerBackdrop) return;
  dom.infoDrawer.classList.remove('open');
  dom.infoDrawer.setAttribute('aria-hidden', 'true');
  dom.drawerBackdrop.hidden = true;
  document.body.classList.remove('no-scroll');
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
  if (dom.vsSelectedEl) {
    dom.vsSelectedEl.addEventListener('click', (e) => {
      const chip = e.target.closest('.type-pill');
      if (chip && chip.dataset.type) {
        handleVsTypeToggle(chip.dataset.type);
      }
    });
  }
  if (dom.vsClearBtn) {
    dom.vsClearBtn.addEventListener('click', () => {
      clearVsTypes();
      // Reopen the picker when clearing
      const picker = document.getElementById('vsTypePicker');
      if (picker) picker.open = true;
      render.syncVsUI();
    });
  }

  // VS type picker Done/Edit toggle button
  const vsDoneBtn = document.getElementById('vsDoneBtn');
  const vsTypePicker = document.getElementById('vsTypePicker');
  if (vsDoneBtn && vsTypePicker) {
    vsDoneBtn.addEventListener('click', () => {
      if (vsTypePicker.open) {
        // Trying to close - validate at least 1 type selected
        if (state.vsSelectedTypes.size === 0) {
          const vsSub = document.getElementById('vsSub');
          if (vsSub) {
            // Scroll to the section header
            vsSub.scrollIntoView({ behavior: 'smooth', block: 'start' });
            // Flash red twice
            vsSub.classList.add('flash-error');
            setTimeout(() => vsSub.classList.remove('flash-error'), 800);
          }
          return;
        }
        vsTypePicker.open = false;
        vsDoneBtn.textContent = 'Edit';
      } else {
        // Open
        vsTypePicker.open = true;
        vsDoneBtn.textContent = 'Done';
      }
    });
  }

  // VS info modal
  if (dom.vsInfoBtn && dom.vsModal && dom.vsModalBackdrop) {
    const openModal = () => {
      dom.vsModal.hidden = false;
      dom.vsModalBackdrop.hidden = false;
      document.body.style.overflow = 'hidden';
    };
    const closeModal = () => {
      dom.vsModal.hidden = true;
      dom.vsModalBackdrop.hidden = true;
      document.body.style.overflow = '';
    };
    dom.vsInfoBtn.addEventListener('click', openModal);
    dom.vsModalBackdrop.addEventListener('click', closeModal);
    if (dom.vsModalClose) {
      dom.vsModalClose.addEventListener('click', closeModal);
    }
  }

  // VS empty state upload buttons
  if (dom.vsTopUploadBtn && dom.fileInput) {
    dom.vsTopUploadBtn.addEventListener('click', () => dom.fileInput.click());
  }
  if (dom.vsRiskyUploadBtn && dom.fileInput) {
    dom.vsRiskyUploadBtn.addEventListener('click', () => dom.fileInput.click());
  }

  // VS "pick types" CTA buttons - scroll to type picker
  const scrollToTypePicker = () => {
    if (dom.vsSubEl) {
      dom.vsSubEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };
  if (dom.vsPickPromptEl) {
    dom.vsPickPromptEl.addEventListener('click', scrollToTypePicker);
  }
  if (dom.vsTopPickTypesCtaEl) {
    dom.vsTopPickTypesCtaEl.addEventListener('click', scrollToTypePicker);
  }
  if (dom.vsRiskyPickTypesCtaEl) {
    dom.vsRiskyPickTypesCtaEl.addEventListener('click', scrollToTypePicker);
  }

  // Collapsible sections - reusable toggle handler
  document.querySelectorAll('.collapsible-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const section = btn.closest('.collapsible-section');
      if (!section) return;

      const isCollapsed = section.classList.toggle('collapsed');
      btn.textContent = isCollapsed ? '+' : '−';
      btn.setAttribute('aria-expanded', String(!isCollapsed));
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
      if (dom.vsModal && !dom.vsModal.hidden) {
        dom.vsModal.hidden = true;
        dom.vsModalBackdrop.hidden = true;
        document.body.style.overflow = '';
      }
    }
  });

  // Scroll/resize
  window.addEventListener('resize', onScrollOrResize);
  window.addEventListener('scroll', onScrollOrResize, { passive: true });
}
