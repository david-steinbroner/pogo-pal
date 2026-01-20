/**
 * PoGO Pal - Main Application Entry Point
 * Orchestrates initialization and CSV processing
 */

// Cache-bust: v36
import { state, setResults } from './state.js?v=36';
import { parseCSV, normalizeSpeciesName } from './csv/parseCsv.js?v=35';
import { detectCSVMapping, extractSpeciesName, extractTypesFromRow, computeIVPct, gradeForScore } from './csv/mapping.js?v=35';
import { parseNumber } from './csv/parseCsv.js?v=35';
import * as dom from './ui/dom.js?v=35';
import * as render from './ui/render.js?v=35';
import * as events from './ui/events.js?v=35';

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

  // If opponent types already selected, navigate carousel to Your Pokemon slide
  if (state.vsSelectedTypes.size > 0) {
    setTimeout(() => {
      render.updateCarousel(6); // Slide 6 = Your Pokemon
    }, 100);
  }
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

    console.log('[PoGO] CSV selected:', file.name, file.size, 'bytes');
    window.__pogoCSVMeta = Object.assign({}, window.__pogoCSVMeta || {}, { fileName: file.name, fileSize: file.size });

    const reader = new FileReader();
    reader.onload = () => {
      try {
        console.log('[PoGO] CSV loaded, parsing...');
        buildFromCSV(String(reader.result || ''));
        console.log('[PoGO] Parse complete. Rows:', state.allResults.length);
        // Close upload drawer after successful load
        events.closeUploadDrawer();
      } catch (err) {
        console.error('[PoGO] Parse failed:', err);
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
 * Initialize the application
 */
function init() {
  // Configure Sentry error tracking (with double-init guard)
  if (window.Sentry && !window.__SENTRY_INITIALIZED__) {
    window.__SENTRY_INITIALIZED__ = true;

    Sentry.init({
      dsn: 'https://d7a20243d8fd94dd9b415a266d1b19c4@o4510342078529536.ingest.us.sentry.io/4510744994643968',
      environment: location.hostname === 'pogo-pal.pages.dev' ? 'production' : 'development',
      release: 'pogo-pal@2.0.72',

      integrations: [
        Sentry.browserTracingIntegration(),
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
  }

  try {
    console.log('[PoGO] Initializing app...');

    // Wire all event listeners
    events.wireEvents();

    // Wire file input separately
    wireFileInput();

    // Initial renders
    render.renderGrid();
    render.renderActiveStrip();
    render.renderVsGrid();
    render.syncVsUI();

    // Set initial mode
    events.setModeUI('vs');

    // Update sticky metrics and view
    render.updateStickyMetrics();
    render.updateView();
    render.updateScrollState();

    console.log('[PoGO] App initialized');
  } catch (err) {
    console.error('[PoGO] Init error:', err);
    showInitError();
    if (window.Sentry) Sentry.captureException(err);
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
