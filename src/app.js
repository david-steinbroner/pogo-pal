/**
 * PoGO Pal - Main Application Entry Point
 * Orchestrates initialization and CSV processing
 */

// Internal imports: NO query params (cache-busting only in index.html entry point)
import { state, setResults, initTheme } from './state.js';
import { parseCSV, normalizeSpeciesName } from './csv/parseCsv.js';
import { detectCSVMapping, extractSpeciesName, extractTypesFromRow, computeIVPct, gradeForScore } from './csv/mapping.js';
import { parseNumber } from './csv/parseCsv.js';
import * as dom from './ui/dom.js';
import * as render from './ui/render.js';
import * as events from './ui/events.js';
import { initViewportFit } from './ui/viewport-fit.js';

/**
 * Build Pokemon data from CSV text
 */
function buildFromCSV(csvText) {
  render.hideParseError();

  const parsed = parseCSV(csvText);
  state.rawPokemon = parsed;

  const meta = Object.assign({}, window.__pogoCSVMeta || {}, {
    rows: parsed.length,
    headers: (window.__pogoCSVMeta && window.__pogoCSVMeta.headers && window.__pogoCSVMeta.headers.length)
      ? window.__pogoCSVMeta.headers
      : Object.keys(parsed[0] || {})
  });
  window.__pogoCSVMeta = meta;

  const mapping = detectCSVMapping(meta.headers);

  // Debug: log headers and mapping for troubleshooting
  console.log('[PoGO] CSV Headers:', meta.headers);
  console.log('[PoGO] Detected mapping:', mapping);
  if (parsed[0]) {
    console.log('[PoGO] First row sample:', parsed[0]);
    console.log('[PoGO] Name column value:', mapping.name ? parsed[0][mapping.name] : 'NO MAPPING');
  }

  // Render debug (gated)
  try {
    render.renderCSVMetaDebug(meta, parsed[0] || null, { force: false });
  } catch (e) {
    console.warn('[PoGO] debug render failed', e);
  }

  if (!parsed.length) {
    render.showError('Invalid CSV Format', 'This doesn\'t look like a Poke Genie export. Please export your Pokémon list from Poke Genie and try again.');
    try { render.renderCSVMetaDebug(meta, null, { force: true, reason: 'no rows' }); } catch (e) {}
    return;
  }

  const out = [];
  let missingName = 0;
  let unknownTypes = 0;

  for (const r of parsed) {
    const rawName = extractSpeciesName(r, mapping);
    if (!rawName) { missingName++; continue; }

    const name = normalizeSpeciesName(rawName);

    const cp = parseNumber(
      (mapping && mapping.cp) ? r[mapping.cp] :
      (r['CP'] ?? r['Cp'] ?? r['cp'] ?? r['Combat Power'] ?? r['combat_power'])
    );

    const iv = computeIVPct(r, mapping);

    const t = extractTypesFromRow(r, name, mapping);
    if (!t || !t.length) unknownTypes++;

    const score = iv == null ? 0 : Math.round(iv);
    const grade = gradeForScore(score);

    // Keep extras for future features
    const fastMoveRaw = (mapping && mapping.fastMove) ? r[mapping.fastMove] : (r['Fast Move'] ?? r['Quick Move'] ?? r['Fast Attack']);
    const chargedMoveRaw = (mapping && mapping.chargedMove) ? r[mapping.chargedMove] : (r['Charged Move'] ?? r['Charge Move'] ?? r['Charge']);

    const isShadow = /shadow/i.test(String(r['Shadow'] ?? r['Is Shadow'] ?? r['shadow'] ?? rawName ?? ''));
    const isPurified = /purif/i.test(String(r['Purified'] ?? r['Is Purified'] ?? r['purified'] ?? ''));

    out.push({
      name,
      score,
      grade,
      cp: cp ?? 0,
      iv: iv == null ? 0 : Math.round(iv),
      types: (t && t.length) ? t.join(' / ') : '-',
      _typesArr: (t && t.length) ? t : [],
      _fastMove: fastMoveRaw ? String(fastMoveRaw).trim() : '',
      _chargedMove: chargedMoveRaw ? String(chargedMoveRaw).trim() : '',
      _isShadow: !!isShadow,
      _isPurified: !!isPurified
    });
  }

  if (!out.length) {
    render.showError('Invalid CSV Format', 'This doesn\'t look like a Poke Genie export. Could not find Pokémon names in your file. Please export your Pokémon list from Poke Genie and try again.');
    try { render.renderCSVMetaDebug(meta, parsed[0] || null, { force: true, reason: 'missing name column' }); } catch (e) {}
    return;
  }

  if (missingName > 0 && missingName >= Math.ceil(parsed.length * 0.6)) {
    render.showError('Invalid CSV Format', 'This CSV has very few recognizable Pokémon names. Please export a full Pokémon list from Poke Genie (not a battle log or summary) and try again.');
    try { render.renderCSVMetaDebug(meta, parsed[0] || null, { force: true, reason: 'names not detected' }); } catch (e) {}
  }

  if (unknownTypes > 0 && unknownTypes >= Math.ceil(out.length * 0.6)) {
    // This is a warning, not a blocking error - just log it
    console.warn('[PoGO] Many types could not be inferred from species names');
    try { render.renderCSVMetaDebug(meta, parsed[0] || null, { force: true, reason: 'types missing' }); } catch (e) {}
  }

  setResults(out);
  render.updateView();
  render.syncVsUI();
}

/**
 * Wire file input handler
 */
function wireFileInput() {
  if (!dom.fileInput) {
    console.warn('[PoGO] fileInput not found');
    return;
  }

  dom.fileInput.addEventListener('change', (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    // Guard against missing PapaParse (CDN failure or blocked)
    if (!window.Papa) {
      console.error('[PoGO] PapaParse not available');
      render.showError('CSV Parser Unavailable', 'Please refresh the page and try again.');
      if (window.Sentry) Sentry.captureMessage('PapaParse missing on CSV upload attempt', 'error');
      return;
    }

    console.log('[PoGO] CSV selected, size:', file.size, 'bytes');
    window.__pogoCSVMeta = Object.assign({}, window.__pogoCSVMeta || {}, { fileSize: file.size });

    // Breadcrumb: CSV upload started (no filename for privacy)
    if (window.Sentry) {
      Sentry.addBreadcrumb({
        category: 'user-action',
        message: 'csv_upload_started',
        level: 'info',
      });
    }

    const reader = new FileReader();
    reader.onload = () => {
      try {
        console.log('[PoGO] CSV loaded, parsing...');
        buildFromCSV(String(reader.result || ''));
        console.log('[PoGO] Parse complete. Rows:', state.allResults.length);

        // Breadcrumb: CSV parse success (row count only, no contents)
        if (window.Sentry) {
          Sentry.addBreadcrumb({
            category: 'user-action',
            message: 'csv_parse_ok',
            data: { rowCount: state.allResults.length },
            level: 'info',
          });
        }

        // Close upload drawer after successful load
        events.closeUploadDrawer();
      } catch (err) {
        console.error('[PoGO] Parse failed:', err);

        // Breadcrumb: CSV parse failed (error type only, no contents)
        if (window.Sentry) {
          Sentry.addBreadcrumb({
            category: 'user-action',
            message: 'csv_parse_failed',
            data: { errorType: err.name || 'Unknown' },
            level: 'warning',
          });
        }

        render.showError('Invalid CSV Format', 'This doesn\'t look like a Poke Genie export. Please export your Pokémon list from Poke Genie and try again.');
        try {
          const meta = window.__pogoCSVMeta || null;
          if (meta && meta.headers && meta.headers.length) {
            render.renderCSVMetaDebug(meta, null, { force: true, reason: 'parse failed' });
          }
        } catch (e) {}
      }
    };
    reader.onerror = () => {
      console.error('[PoGO] FileReader error', reader.error);
    };
    reader.readAsText(file);
    // Reset so same file can be re-uploaded
    e.target.value = '';
  });
}

/**
 * Show fatal init error UI
 */
function showInitError() {
  const el = document.getElementById('initError');
  if (el) el.hidden = false;
}

/**
 * Debug mode: verify tap target compliance
 * Checks ALL visible instances of each selector and reports the worst.
 * Logs computed hit area sizes to console and warns if below --tap-target-min.
 */
function verifyTapTargets() {
  const TAP_MIN = 44; // --tap-target-min in px
  const components = [
    { name: '.icon-btn', selector: '.icon-btn' },
    { name: '.sheet-btn', selector: '.sheet-btn' },
    { name: '.window-tab', selector: '.window-tab' },
    { name: '.carousel-dot', selector: '.carousel-dot' },
    { name: '.drawer-close-btn', selector: '.drawer-close-btn' },
  ];

  console.group('[PoGO Debug] Tap Target Compliance Check');
  let allPass = true;

  /**
   * Check if element is visible and interactive
   */
  function isVisible(el) {
    // Skip if hidden attribute or aria-hidden
    if (el.hidden || el.getAttribute('aria-hidden') === 'true') return false;

    const style = getComputedStyle(el);
    // Skip if display:none or visibility:hidden
    if (style.display === 'none' || style.visibility === 'hidden') return false;

    const rect = el.getBoundingClientRect();
    // Skip if zero-size (collapsed/unmounted)
    if (rect.width === 0 && rect.height === 0) return false;

    // Skip if not in layout (offsetParent null) unless position:fixed
    if (el.offsetParent === null && style.position !== 'fixed') return false;

    return true;
  }

  /**
   * Measure hit area for an element
   */
  function measureHitArea(el) {
    const pseudoStyle = getComputedStyle(el, '::before');
    const minW = parseFloat(pseudoStyle.minWidth) || 0;
    const minH = parseFloat(pseudoStyle.minHeight) || 0;

    const rect = el.getBoundingClientRect();
    // Hit area is max of pseudo min-size and actual element size
    const hitW = Math.max(minW, rect.width);
    const hitH = Math.max(minH, rect.height);

    return { hitW, hitH, rect, minW, minH };
  }

  /**
   * Get identifier string for an element
   */
  function getNodeId(el) {
    const tag = el.tagName.toLowerCase();
    const id = el.id ? `#${el.id}` : '';
    const classes = el.className ? `.${el.className.split(' ').join('.')}` : '';
    const text = (el.textContent || '').trim().slice(0, 20);
    return `<${tag}${id}${classes}> "${text}"`;
  }

  components.forEach(({ name, selector }) => {
    const allEls = document.querySelectorAll(selector);
    if (allEls.length === 0) {
      console.log(`${name}: NOT FOUND in DOM`);
      return;
    }

    // Filter to visible elements
    const visibleEls = Array.from(allEls).filter(isVisible);
    const hiddenCount = allEls.length - visibleEls.length;

    if (visibleEls.length === 0) {
      console.log(`${name}: 0 visible (${allEls.length} total, ${hiddenCount} hidden/filtered)`);
      return;
    }

    // Measure all visible elements
    const measurements = visibleEls.map(el => {
      const { hitW, hitH, rect, minW, minH } = measureHitArea(el);
      const pass = hitW >= TAP_MIN && hitH >= TAP_MIN;
      return { el, hitW, hitH, rect, minW, minH, pass };
    });

    // Find worst (smallest hit area)
    const worst = measurements.reduce((a, b) => {
      const areaA = a.hitW * a.hitH;
      const areaB = b.hitW * b.hitH;
      return areaA < areaB ? a : b;
    });

    const allVisible = measurements.every(m => m.pass);
    const failCount = measurements.filter(m => !m.pass).length;

    if (!allVisible) allPass = false;

    // Summary line
    console.log(
      `${name}: ${allVisible ? '✅' : '❌'} ` +
      `${visibleEls.length} visible, ${hiddenCount} hidden, ` +
      `worst: ${Math.round(worst.hitW)}x${Math.round(worst.hitH)}px` +
      (failCount > 0 ? ` (${failCount} FAIL)` : '')
    );

    // Detail for failures or multiple visible
    if (!allVisible || visibleEls.length > 1) {
      console.group(`  ${name} details`);
      measurements.forEach((m, i) => {
        const status = m.pass ? '✅' : '❌';
        console.log(
          `  [${i}] ${status} ${Math.round(m.hitW)}x${Math.round(m.hitH)}px ` +
          `(rect: ${Math.round(m.rect.width)}x${Math.round(m.rect.height)}, ` +
          `::before min: ${Math.round(m.minW)}x${Math.round(m.minH)}) ` +
          getNodeId(m.el)
        );
      });
      console.groupEnd();
    }
  });

  console.log(allPass ? '✅ All tap targets compliant' : '❌ Some tap targets below minimum');
  console.groupEnd();
  return allPass;
}

/**
 * Initialize the application
 */
function init() {
  // Configure Sentry error tracking (with double-init guard)
  if (window.Sentry && !window.__SENTRY_INITIALIZED__) {
    window.__SENTRY_INITIALIZED__ = true;

    Sentry.init({
      dsn: 'https://d7a20243d8fd94dd9b415a266d1b19c4@o4510342078529536.ingest.us.sentry.io/4510744994643968',
      environment: location.hostname === 'pogo-pal.pages.dev' ? 'production' : 'development',
      release: 'pogo-pal@3.3.26',

      integrations: [
        Sentry.browserTracingIntegration({
          // Set readable transaction name for page loads only
          beforeStartSpan: (context) => {
            if (context.op === 'pageload') {
              return { ...context, name: 'Page Load: PoGO Pal' };
            }
            return context;
          },
        }),
        Sentry.replayIntegration({
          maskAllText: true,
          blockAllMedia: true,
        }),
      ],

      // Performance tracing: sample 10% of transactions
      tracesSampleRate: 0.1,

      // Session replay: only capture replays when errors occur
      replaysSessionSampleRate: 0.0,
      replaysOnErrorSampleRate: 1.0,

      // Ignore noisy browser errors
      ignoreErrors: [
        'ResizeObserver loop limit exceeded',
        'ResizeObserver loop completed with undelivered notifications',
      ],

      // Ignore errors from browser extensions
      denyUrls: [
        /extensions\//i,
        /^chrome:\/\//i,
        /^chrome-extension:\/\//i,
        /^moz-extension:\/\//i,
        /^safari-extension:\/\//i,
      ],

      // Redact large payloads and sensitive keys
      beforeSend(event) {
        const SENSITIVE_KEYS = ['csv', 'rows', 'data', 'file', 'content', 'rawPokemon'];
        const MAX_PAYLOAD_SIZE = 10000;

        // Redact request data
        if (event.request && event.request.data) {
          if (typeof event.request.data === 'string' && event.request.data.length > MAX_PAYLOAD_SIZE) {
            event.request.data = '[REDACTED - large payload]';
          }
        }

        // Redact sensitive keys in extra/contexts
        function redactObj(obj) {
          if (!obj || typeof obj !== 'object') return;
          for (const key of Object.keys(obj)) {
            if (SENSITIVE_KEYS.includes(key.toLowerCase())) {
              obj[key] = '[REDACTED]';
            } else if (typeof obj[key] === 'string' && obj[key].length > MAX_PAYLOAD_SIZE) {
              obj[key] = '[REDACTED - large value]';
            } else if (typeof obj[key] === 'object') {
              redactObj(obj[key]);
            }
          }
        }
        redactObj(event.extra);
        redactObj(event.contexts);

        return event;
      },
    });

    // Set app version tag for filtering
    Sentry.setTag('app_version', 'pogo-pal@3.3.26');
  }

  // Sentry breadcrumb helper
  function addBreadcrumb(message, data = {}) {
    if (window.Sentry) {
      Sentry.addBreadcrumb({ category: 'boot', message, data, level: 'info' });
    }
    console.log(`[PoGO] ${message}`, Object.keys(data).length ? data : '');
  }

  try {
    addBreadcrumb('boot:start');

    // Initialize theme from localStorage/system preference
    initTheme();
    addBreadcrumb('boot:theme-ready');

    // Wire all event listeners (critical - must succeed for app to work)
    events.wireEvents();
    addBreadcrumb('boot:events-wired');

    // Wire file input separately
    wireFileInput();

    // Initial renders (critical)
    render.renderGrid();
    render.renderActiveStrip();
    render.renderVsGrid();
    render.syncVsUI();
    addBreadcrumb('boot:render-complete');

    // Set initial mode (isInitial=true to skip breadcrumb on first load)
    events.setModeUI('vs', true);

    // Non-critical: sticky metrics (don't crash app if this fails)
    try {
      render.updateStickyMetrics();
      addBreadcrumb('boot:sticky-metrics-ok');
    } catch (metricsErr) {
      console.warn('[PoGO] Sticky metrics failed (non-fatal):', metricsErr);
      if (window.Sentry) {
        Sentry.captureException(metricsErr, {
          level: 'warning',
          tags: { subsystem: 'sticky-metrics' },
          extra: { domNodesExist: { tableHeaders: !!document.querySelector('th.sortable') } }
        });
      }
    }

    // Non-critical: view/scroll state
    try {
      render.updateView();
      render.updateScrollState();
    } catch (viewErr) {
      console.warn('[PoGO] View update failed (non-fatal):', viewErr);
      if (window.Sentry) Sentry.captureException(viewErr, { level: 'warning', tags: { subsystem: 'view-state' } });
    }

    // Non-critical: viewport scaling for in-app browsers
    try {
      initViewportFit();
      addBreadcrumb('boot:viewport-fit-ok');
    } catch (vpErr) {
      console.warn('[PoGO] Viewport fit failed (non-fatal):', vpErr);
      if (window.Sentry) Sentry.captureException(vpErr, { level: 'warning', tags: { subsystem: 'viewport-fit' } });
    }

    addBreadcrumb('boot:complete');

    // Debug mode: verify tap target compliance
    if (state.debugMode) {
      verifyTapTargets();
      // Expose for manual console testing (only in debug mode)
      window.verifyTapTargets = verifyTapTargets;
    }
  } catch (err) {
    console.error('[PoGO] Init error:', err);
    addBreadcrumb('boot:fatal-error', { error: err.message });
    showInitError();
    if (window.Sentry) {
      Sentry.captureException(err, {
        tags: { subsystem: 'boot', fatal: 'true' },
        extra: {
          activeTab: state.currentMode,
          domNodesExist: {
            sheet: !!document.getElementById('typesSheet'),
            vsGrid: !!document.getElementById('vsTypeGrid'),
            tableHeaders: !!document.querySelector('th.sortable')
          }
        }
      });
    }
  }
}

// Run on DOM ready - slight delay to avoid extension conflicts
function safeInit() {
  requestAnimationFrame(() => {
    try {
      init();
    } catch (err) {
      console.error('[PoGO] Safe init error:', err);
      showInitError();
      if (window.Sentry) Sentry.captureException(err);
    }
  });
}

// Global error handlers for uncaught errors (including from extensions)
window.addEventListener('error', (event) => {
  // Only report our own errors to Sentry (extensions are filtered by denyUrls)
  if (window.Sentry && event.filename && event.filename.includes(location.origin)) {
    Sentry.captureException(event.error || new Error(event.message));
  }
});

window.addEventListener('unhandledrejection', (event) => {
  if (window.Sentry) {
    Sentry.captureException(event.reason || new Error('Unhandled promise rejection'));
  }
});

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', safeInit);
} else {
  safeInit();
}
