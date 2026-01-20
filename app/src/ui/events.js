/**
 * PoGO Pal - Event Handlers
 * User interaction handlers and event wiring
 */

import { state, toggleType, clearSelectedTypes, toggleVsType, clearVsTypes, setSortState } from '../state.js?v=35';
import * as dom from './dom.js?v=35';
import * as render from './render.js?v=35';

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

  // Upload button - opens upload drawer instead of file picker
  if (dom.uploadBtn) {
    dom.uploadBtn.addEventListener('click', openUploadDrawer);
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

  // VS upload prompt button - opens upload drawer
  if (dom.vsUploadPromptBtn) {
    dom.vsUploadPromptBtn.addEventListener('click', openUploadDrawer);
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
    dom.drawerBackdrop.addEventListener('click', () => {
      // Close whichever drawer is open
      if (dom.infoDrawer?.classList.contains('open')) closeDrawer();
      if (dom.uploadDrawer?.classList.contains('open')) closeUploadDrawer();
    });
  }
  if (dom.drawerCloseBtn) {
    dom.drawerCloseBtn.addEventListener('click', closeDrawer);
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

