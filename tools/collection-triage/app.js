/**
 * Collection Triage App
 * Main UI controller for the Collection Triage tool
 */

(function() {
  'use strict';

  let currentResults = null;
  let currentFilename = '';

  // Initialize on DOM ready
  document.addEventListener('DOMContentLoaded', function() {
    initUploadZone();
    initFilters();
    initDownloadButtons();
    PogoSources.initSourcesLinks();
  });

  // ============================================
  // File Upload Handling
  // ============================================

  function initUploadZone() {
    const zone = document.getElementById('uploadZone');
    const input = document.getElementById('fileInput');

    zone.addEventListener('click', function() {
      input.click();
    });

    zone.addEventListener('dragover', handleDragOver);
    zone.addEventListener('dragleave', handleDragLeave);
    zone.addEventListener('drop', handleDrop);
    input.addEventListener('change', handleFileSelect);
  }

  function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.add('dragover');
  }

  function handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove('dragover');
  }

  function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove('dragover');

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFile(files[0]);
    }
  }

  function handleFileSelect(e) {
    const files = e.target.files;
    if (files.length > 0) {
      processFile(files[0]);
    }
  }

  // ============================================
  // File Processing
  // ============================================

  async function processFile(file) {
    // Validate file type
    if (!file.name.endsWith('.csv')) {
      setStatus('Please upload a CSV file.', 'error');
      return;
    }

    currentFilename = file.name;
    setStatus('Parsing CSV...', 'loading');

    try {
      const text = await file.text();
      const parsed = PogoParser.parseCollection(text, file.name);

      if (parsed.format === 'unknown') {
        setStatus('Unknown CSV format. Please use a Poke Genie or Calcy IV export.', 'error');
        return;
      }

      if (parsed.pokemon.length === 0) {
        setStatus('No Pokemon found in CSV. Please check the file format.', 'error');
        return;
      }

      const formatName = parsed.format === 'pokegenie' ? 'Poke Genie' : 'Calcy IV';
      setStatus(`Detected ${formatName} format. Analyzing ${parsed.pokemon.length} Pokemon...`, 'loading');

      const results = await PogoTriage.triageCollection(parsed.pokemon);
      currentResults = results;

      setStatus(`Analyzed ${results.pokemon.length} Pokemon`, 'success');
      renderResults(results);

    } catch (error) {
      setStatus('Error: ' + error.message, 'error');
      console.error('Processing error:', error);
    }
  }

  // ============================================
  // Results Rendering
  // ============================================

  function renderResults(results) {
    document.getElementById('resultsSection').hidden = false;
    renderSummary(results.summary);
    renderTable(results.pokemon);
    updateResultsCount();

    // Scroll to results
    document.getElementById('resultsSection').scrollIntoView({ behavior: 'smooth' });
  }

  function renderSummary(summary) {
    const html = `
      <div class="summary-card pvp" onclick="filterByVerdict('KEEP_PVP')">
        <div class="count">${summary.keepPvp}</div>
        <div class="label">Keep for PvP</div>
      </div>
      <div class="summary-card raid" onclick="filterByVerdict('KEEP_RAID')">
        <div class="count">${summary.keepRaid}</div>
        <div class="label">Keep for Raids</div>
      </div>
      <div class="summary-card trade" onclick="filterByVerdict('TRADE')">
        <div class="count">${summary.trade}</div>
        <div class="label">Trade Candidates</div>
      </div>
      <div class="summary-card transfer" onclick="filterByVerdict('TRANSFER')">
        <div class="count">${summary.transfer}</div>
        <div class="label">Transfer</div>
      </div>
    `;
    document.getElementById('summary').innerHTML = html;
  }

  function renderTable(pokemon) {
    const tbody = document.getElementById('resultsBody');
    tbody.innerHTML = pokemon.map(function(p) {
      return renderRow(p);
    }).join('');
  }

  function renderRow(pokemon) {
    const verdict = pokemon.triage.verdict;
    const verdictDisplay = PogoTriage.getVerdictDisplay(verdict);
    const badges = getBadges(pokemon);

    const ivStr = pokemon.atkIv !== null
      ? `${pokemon.atkIv}/${pokemon.defIv}/${pokemon.staIv}`
      : '?/?/?';

    const escapedDetails = escapeHtml(pokemon.triage.details || '');
    const pokemonName = escapeHtml(pokemon.name);
    const formStr = pokemon.form ? ` <span class="form">(${escapeHtml(pokemon.form)})</span>` : '';

    return `
      <tr data-verdict="${verdict}" data-name="${pokemonName.toLowerCase()}">
        <td>
          <strong>${pokemonName}</strong>${formStr}
          ${badges}
        </td>
        <td>${pokemon.cp || '?'}</td>
        <td class="ivs">${ivStr}</td>
        <td>
          <span class="verdict verdict-${verdict.toLowerCase().replace('_', '-')}" style="background: ${verdictDisplay.bgColor}; color: ${verdictDisplay.color};">
            ${verdictDisplay.icon} ${verdictDisplay.label}
          </span>
        </td>
        <td>
          <span class="reason">${escapeHtml(pokemon.triage.reason)}</span>
          <button class="details-btn" onclick="showDetails('${pokemonName}', '${escapedDetails.replace(/'/g, "\\'")}')">?</button>
        </td>
      </tr>
    `;
  }

  function getBadges(pokemon) {
    let badges = '';
    if (pokemon.isShadow) badges += '<span class="badge shadow">Shadow</span>';
    if (pokemon.isPurified) badges += '<span class="badge purified">Purified</span>';
    if (pokemon.isLucky) badges += '<span class="badge lucky">Lucky</span>';
    if (pokemon.isShiny) badges += '<span class="badge shiny">Shiny</span>';
    if (pokemon.isFavorite) badges += '<span class="badge favorite">Fav</span>';
    return badges;
  }

  // ============================================
  // Details Modal
  // ============================================

  window.showDetails = function(name, details) {
    document.getElementById('detailsTitle').textContent = name;
    document.getElementById('detailsContent').textContent = details;
    document.getElementById('detailsModal').hidden = false;
  };

  window.hideDetails = function() {
    document.getElementById('detailsModal').hidden = true;
  };

  // Close modal on backdrop click
  document.addEventListener('click', function(e) {
    if (e.target.id === 'detailsModal') {
      hideDetails();
    }
  });

  // Close modal on escape
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      hideDetails();
    }
  });

  // ============================================
  // Filtering
  // ============================================

  function initFilters() {
    document.getElementById('filterVerdict').addEventListener('change', applyFilters);
    document.getElementById('searchInput').addEventListener('input', applyFilters);
  }

  window.filterByVerdict = function(verdict) {
    document.getElementById('filterVerdict').value = verdict;
    applyFilters();
  };

  function applyFilters() {
    const verdictFilter = document.getElementById('filterVerdict').value;
    const searchFilter = document.getElementById('searchInput').value.toLowerCase().trim();

    const rows = document.querySelectorAll('#resultsBody tr');
    rows.forEach(function(row) {
      const matchesVerdict = verdictFilter === 'all' || row.dataset.verdict === verdictFilter;
      const matchesSearch = !searchFilter || row.dataset.name.includes(searchFilter);
      row.hidden = !(matchesVerdict && matchesSearch);
    });

    updateResultsCount();
  }

  function updateResultsCount() {
    const total = document.querySelectorAll('#resultsBody tr').length;
    const visible = document.querySelectorAll('#resultsBody tr:not([hidden])').length;
    const countEl = document.getElementById('resultsCount');

    if (visible === total) {
      countEl.textContent = `${total} Pokemon`;
    } else {
      countEl.textContent = `Showing ${visible} of ${total}`;
    }
  }

  // ============================================
  // Downloads
  // ============================================

  function initDownloadButtons() {
    document.getElementById('downloadChecklist').addEventListener('click', downloadChecklist);
    document.getElementById('downloadJson').addEventListener('click', downloadJson);
  }

  function downloadChecklist() {
    if (!currentResults) return;

    const checklist = generateChecklist(currentResults.pokemon);
    downloadFile(checklist, 'pogo-action-checklist.txt', 'text/plain');
  }

  function generateChecklist(pokemon) {
    let text = '========================================\n';
    text += 'POGO TOOLS - ACTION CHECKLIST\n';
    text += '========================================\n';
    text += 'Generated: ' + new Date().toLocaleString() + '\n';
    text += 'Source: ' + currentFilename + '\n\n';

    // Group by verdict
    const groups = {
      KEEP_PVP: pokemon.filter(function(p) { return p.triage.verdict === 'KEEP_PVP'; }),
      KEEP_RAID: pokemon.filter(function(p) { return p.triage.verdict === 'KEEP_RAID'; }),
      TRADE: pokemon.filter(function(p) { return p.triage.verdict === 'TRADE'; }),
      TRANSFER: pokemon.filter(function(p) { return p.triage.verdict === 'TRANSFER'; })
    };

    // Keep for PvP
    text += '=== TAG AS "PVP" (' + groups.KEEP_PVP.length + ') ===\n';
    if (groups.KEEP_PVP.length === 0) {
      text += '(none)\n';
    } else {
      groups.KEEP_PVP.forEach(function(p) {
        const ivStr = p.atkIv !== null ? `(${p.atkIv}/${p.defIv}/${p.staIv})` : '';
        text += `[ ] ${p.name} CP ${p.cp} ${ivStr}\n`;
        text += `    ${p.triage.reason}\n`;
      });
    }

    // Keep for Raids
    text += '\n=== TAG AS "RAID" (' + groups.KEEP_RAID.length + ') ===\n';
    if (groups.KEEP_RAID.length === 0) {
      text += '(none)\n';
    } else {
      groups.KEEP_RAID.forEach(function(p) {
        const ivStr = p.atkIv !== null ? `(${p.atkIv}/${p.defIv}/${p.staIv})` : '';
        const shadow = p.isShadow ? ' [SHADOW]' : '';
        text += `[ ] ${p.name}${shadow} CP ${p.cp} ${ivStr}\n`;
        text += `    ${p.triage.reason}\n`;
      });
    }

    // Trade candidates
    text += '\n=== TAG AS "TRADE" (' + groups.TRADE.length + ') ===\n';
    if (groups.TRADE.length === 0) {
      text += '(none)\n';
    } else {
      groups.TRADE.forEach(function(p) {
        const special = [];
        if (p.isShiny) special.push('Shiny');
        if (p.isLucky) special.push('Lucky');
        if (p.isShadow) special.push('Shadow');
        const specialStr = special.length > 0 ? ' [' + special.join(', ') + ']' : '';
        text += `[ ] ${p.name}${specialStr} CP ${p.cp}\n`;
      });
    }

    // Transfer
    text += '\n=== SAFE TO TRANSFER (' + groups.TRANSFER.length + ') ===\n';
    text += groups.TRANSFER.length + ' Pokemon can be transferred for candy.\n';
    text += 'In Pokemon GO: Filter by excluding your "PVP", "RAID", and "TRADE" tags\n';
    text += 'to easily find and mass-transfer these Pokemon.\n';

    text += '\n========================================\n';
    text += 'HOW TO USE THIS CHECKLIST:\n';
    text += '========================================\n';
    text += '1. Open Pokemon GO\n';
    text += '2. For each Pokemon above, search by name and CP\n';
    text += '3. Add the appropriate tag (PVP, RAID, or TRADE)\n';
    text += '4. After tagging, use search "!tag" to find untagged Pokemon\n';
    text += '5. Mass-transfer the untagged Pokemon for candy\n';
    text += '\nGenerated by PoGO Tools - https://github.com/david-steinbroner/pogo-tools\n';

    return text;
  }

  function downloadJson() {
    if (!currentResults) return;

    const output = {
      meta: {
        source: 'PoGO Tools Collection Triage',
        filename: currentFilename,
        exportedAt: new Date().toISOString(),
        summary: currentResults.summary
      },
      pokemon: currentResults.pokemon
    };

    downloadFile(JSON.stringify(output, null, 2), 'pogo-triage-results.json', 'application/json');
  }

  function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // ============================================
  // Utility Functions
  // ============================================

  function setStatus(message, type) {
    const status = document.getElementById('status');
    status.textContent = message;
    status.className = 'status' + (type ? ' ' + type : '');
  }

  function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

})();
