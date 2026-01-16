/**
 * PoGO Pal - Main Application Entry Point
 * Orchestrates initialization and CSV processing
 */

import { state, setResults } from './state.js';
import { parseCSV, normalizeSpeciesName } from './csv/parseCsv.js';
import { detectCSVMapping, extractSpeciesName, extractTypesFromRow, computeIVPct, gradeForScore } from './csv/mapping.js';
import { parseNumber } from './csv/parseCsv.js';
import * as dom from './ui/dom.js';
import * as render from './ui/render.js';
import * as events from './ui/events.js';

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
    render.showParseError('No rows found in that CSV.', 'Make sure you exported from PokeGenie as CSV (not screenshots), then try again.');
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
    const headerSample = Object.keys(parsed[0] || {}).slice(0, 12).join(', ');
    render.showParseError('Could not find Pokemon names in that CSV.', `I looked for columns like <code>Name</code>, <code>Pokemon</code>, <code>Species</code>. First headers: <code>${headerSample || '-'}</code>`);
    try { render.renderCSVMetaDebug(meta, parsed[0] || null, { force: true, reason: 'missing name column' }); } catch (e) {}
    return;
  }

  if (missingName > 0 && missingName >= Math.ceil(parsed.length * 0.6)) {
    render.showParseError('This CSV has very few recognizable Pokemon names.', 'Try exporting again from PokeGenie as a full Pokemon list CSV (not a battle log or a summary export).');
    try { render.renderCSVMetaDebug(meta, parsed[0] || null, { force: true, reason: 'names not detected' }); } catch (e) {}
  }

  if (unknownTypes > 0 && unknownTypes >= Math.ceil(out.length * 0.6)) {
    render.showParseError('Parsed rows, but many types could not be inferred.', 'We fall back to a built-in species->type map. If you see lots of "-", your names may include forms we don\'t recognize yet.');
    try { render.renderCSVMetaDebug(meta, parsed[0] || null, { force: true, reason: 'types missing' }); } catch (e) {}
  }

  setResults(out);
  render.updateView();
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

    console.log('[PoGO] CSV selected:', file.name, file.size, 'bytes');
    window.__pogoCSVMeta = Object.assign({}, window.__pogoCSVMeta || {}, { fileName: file.name, fileSize: file.size });

    const reader = new FileReader();
    reader.onload = () => {
      try {
        console.log('[PoGO] CSV loaded, parsing...');
        buildFromCSV(String(reader.result || ''));
        console.log('[PoGO] Parse complete. Rows:', state.allResults.length);
      } catch (err) {
        console.error('[PoGO] Parse failed:', err);
        const msg = String((err && err.message) ? err.message : err)
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;');
        render.showParseError('Could not parse that CSV.', `Error: <code>${msg}</code><br/>If it came from PokeGenie, try exporting again as CSV and re-uploading.`);
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
 * Initialize the application
 */
function init() {
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

  console.log('[PoGO] App initialized');
}

// Run on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
