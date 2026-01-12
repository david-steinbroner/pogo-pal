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
    initCardFilters();
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
    updateSummaryCards(results.summary);

    // Set default filter to Safe to Transfer (most actionable)
    document.getElementById('filterVerdict').value = 'SAFE_TRANSFER';

    // Render table sorted by default filter
    renderTable(results.pokemon, 'SAFE_TRANSFER');
    updateResultsCount();

    // Scroll to results
    document.getElementById('resultsSection').scrollIntoView({ behavior: 'smooth' });
  }

  function updateSummaryCards(summary) {
    document.getElementById('countTransfer').textContent = summary.safeTransfer;
    document.getElementById('countTrade').textContent = summary.tradeCandidates;
    document.getElementById('countRaider').textContent = summary.topRaiders;
    document.getElementById('countPvp').textContent = summary.topPvp;
    document.getElementById('countKeep').textContent = summary.keep;
  }

  function renderTable(pokemon, filter) {
    filter = filter || 'all';
    const tbody = document.getElementById('resultsBody');

    // Filter Pokemon
    let filtered = pokemon;
    if (filter !== 'all') {
      filtered = pokemon.filter(function(p) {
        return p.triage.verdict === filter;
      });
    }

    // Sort by relevance based on filter
    filtered = sortByVerdict(filtered, filter);

    // Build table rows
    tbody.innerHTML = filtered.map(function(p) {
      return renderRow(p);
    }).join('');

    // Show empty state if needed
    if (filtered.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="empty-state">' + getEmptyStateMessage(filter) + '</td></tr>';
    }
  }

  function sortByVerdict(pokemon, filter) {
    switch (filter) {
      case 'SAFE_TRANSFER':
        // Sort by IV% ascending (worst first - easiest to let go)
        return pokemon.slice().sort(function(a, b) {
          return (a.ivPercent || 0) - (b.ivPercent || 0);
        });

      case 'TRADE_CANDIDATE':
        // Sort by CP descending (highest value trades first)
        return pokemon.slice().sort(function(a, b) {
          return (b.cp || 0) - (a.cp || 0);
        });

      case 'TOP_RAIDER':
        // Sort by attack type, then rank within type
        return pokemon.slice().sort(function(a, b) {
          var aType = a.triage.attackType || 'ZZZ';
          var bType = b.triage.attackType || 'ZZZ';
          if (aType !== bType) {
            return aType.localeCompare(bType);
          }
          return (a.triage.typeRank || 99) - (b.triage.typeRank || 99);
        });

      case 'TOP_PVP':
        // Sort by league rank ascending (best first)
        return pokemon.slice().sort(function(a, b) {
          var aRank = a.triage.leagueRank || 9999;
          var bRank = b.triage.leagueRank || 9999;
          return aRank - bRank;
        });

      default:
        // Default: sort by name
        return pokemon.slice().sort(function(a, b) {
          return a.name.localeCompare(b.name);
        });
    }
  }

  function getEmptyStateMessage(verdict) {
    var messages = {
      'SAFE_TRANSFER': "Great news! We didn't find any Pokemon that are clearly safe to transfer. Your collection is well-curated!",
      'TRADE_CANDIDATE': "No obvious trade candidates found. Your Pokemon are either keepers or transfer material.",
      'TOP_RAIDER': "We couldn't identify top raiders. This might happen if your Pokemon don't have attack moves recorded.",
      'TOP_PVP': "No top PvP Pokemon identified. Try scanning more Pokemon with Poke Genie to get PvP rank data.",
      'KEEP': "All your Pokemon have been categorized into other groups!"
    };
    return messages[verdict] || "No Pokemon in this category.";
  }

  function renderRow(pokemon) {
    var verdict = pokemon.triage.verdict;
    var verdictDisplay = PogoTriage.getVerdictDisplay(verdict);
    var badges = getBadges(pokemon);

    var ivStr = pokemon.atkIv !== null
      ? pokemon.atkIv + '/' + pokemon.defIv + '/' + pokemon.staIv
      : '?/?/?';

    var escapedDetails = escapeHtml(pokemon.triage.details || '');
    var pokemonName = escapeHtml(pokemon.name);
    var formStr = pokemon.form ? ' <span class="form">(' + escapeHtml(pokemon.form) + ')</span>' : '';

    // Convert verdict to CSS class (e.g., TOP_RAIDER -> top-raider)
    var verdictClass = verdict.toLowerCase().replace(/_/g, '-');

    return '<tr data-verdict="' + verdict + '" data-name="' + pokemonName.toLowerCase() + '">' +
      '<td>' +
        '<strong>' + pokemonName + '</strong>' + formStr +
        badges +
      '</td>' +
      '<td>' + (pokemon.cp || '?') + '</td>' +
      '<td class="ivs">' + ivStr + '</td>' +
      '<td>' +
        '<span class="verdict verdict-' + verdictClass + '">' +
          verdictDisplay.icon + ' ' + verdictDisplay.label +
        '</span>' +
      '</td>' +
      '<td>' +
        '<span class="reason">' + escapeHtml(pokemon.triage.reason) + '</span>' +
        (escapedDetails ? '<button class="details-btn" onclick="showDetails(\'' + pokemonName + '\', \'' + escapedDetails.replace(/'/g, "\\'") + '\')">?</button>' : '') +
      '</td>' +
    '</tr>';
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
    document.getElementById('searchInput').addEventListener('input', applySearchFilter);
  }

  function initCardFilters() {
    var cards = document.querySelectorAll('.summary-card[data-filter]');
    cards.forEach(function(card) {
      card.addEventListener('click', function() {
        var filter = card.dataset.filter;
        document.getElementById('filterVerdict').value = filter;
        applyFilters();
      });
    });
  }

  window.filterByVerdict = function(verdict) {
    document.getElementById('filterVerdict').value = verdict;
    applyFilters();
  };

  function applyFilters() {
    if (!currentResults) return;

    var verdictFilter = document.getElementById('filterVerdict').value;
    var searchFilter = document.getElementById('searchInput').value.toLowerCase().trim();

    // Re-render table with new filter
    renderTable(currentResults.pokemon, verdictFilter);

    // Apply search filter on top if present
    if (searchFilter) {
      applySearchFilter();
    }

    updateResultsCount();
  }

  function applySearchFilter() {
    var searchFilter = document.getElementById('searchInput').value.toLowerCase().trim();

    var rows = document.querySelectorAll('#resultsBody tr');
    rows.forEach(function(row) {
      if (row.classList.contains('empty-state')) return;
      var matchesSearch = !searchFilter || (row.dataset.name && row.dataset.name.includes(searchFilter));
      row.hidden = !matchesSearch;
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
    var safeTransfer = pokemon.filter(function(p) { return p.triage.verdict === 'SAFE_TRANSFER'; });
    var tradeCandidates = pokemon.filter(function(p) { return p.triage.verdict === 'TRADE_CANDIDATE'; });
    var topRaiders = pokemon.filter(function(p) { return p.triage.verdict === 'TOP_RAIDER'; });
    var topPvp = pokemon.filter(function(p) { return p.triage.verdict === 'TOP_PVP'; });

    var text = 'PoGO Tools - Action Checklist\n';
    text += 'Generated: ' + new Date().toLocaleDateString() + '\n';
    text += '======================================\n\n';

    // Safe to Transfer section
    text += 'SAFE TO TRANSFER (' + safeTransfer.length + ' Pokemon)\n';
    text += '--------------------------------------\n';
    text += 'These are duplicates or low-IV Pokemon you can safely transfer:\n\n';

    if (safeTransfer.length === 0) {
      text += '  (none - your collection is already optimized!)\n';
    } else {
      safeTransfer.forEach(function(p) {
        var form = p.form ? ' (' + p.form + ')' : '';
        text += '  - ' + p.name + form + ' CP ' + p.cp + ' - ' + p.triage.reason + '\n';
      });
    }

    text += '\n';

    // Trade Candidates section
    text += 'TRADE CANDIDATES (' + tradeCandidates.length + ' Pokemon)\n';
    text += '--------------------------------------\n';
    text += 'Good for lucky trades with friends:\n\n';

    if (tradeCandidates.length === 0) {
      text += '  (none identified)\n';
    } else {
      tradeCandidates.forEach(function(p) {
        var form = p.form ? ' (' + p.form + ')' : '';
        text += '  - ' + p.name + form + ' CP ' + p.cp + ' - ' + p.triage.reason + '\n';
      });
    }

    text += '\n';

    // Top Raiders section - grouped by type
    text += 'YOUR TOP RAIDERS (' + topRaiders.length + ' Pokemon)\n';
    text += '--------------------------------------\n';
    text += 'Your best attackers for raids by type:\n';

    if (topRaiders.length === 0) {
      text += '\n  (none identified - try adding more Pokemon with attack moves)\n';
    } else {
      // Group by attack type
      var byType = {};
      topRaiders.forEach(function(p) {
        var type = p.triage.attackType || 'Unknown';
        if (!byType[type]) byType[type] = [];
        byType[type].push(p);
      });

      // Sort types alphabetically and output
      Object.keys(byType).sort().forEach(function(type) {
        var emoji = getTypeEmoji(type);
        text += '\n' + emoji + ' ' + type + ':\n';
        byType[type]
          .sort(function(a, b) { return (a.triage.typeRank || 99) - (b.triage.typeRank || 99); })
          .forEach(function(p) {
            text += '  ' + p.triage.typeRank + '. ' + p.name + ' CP ' + p.cp + ' (' + p.atkIv + '/' + p.defIv + '/' + p.staIv + ')\n';
          });
      });
    }

    text += '\n';

    // Top PvP section - grouped by league
    text += 'YOUR TOP PVP POKEMON (' + topPvp.length + ' Pokemon)\n';
    text += '--------------------------------------\n';
    text += 'Your best Pokemon for GO Battle League:\n';

    if (topPvp.length === 0) {
      text += '\n  (none identified with strong PvP IVs)\n';
    } else {
      // Group by league
      var glPokemon = topPvp.filter(function(p) { return p.triage.league === 'Great'; });
      var ulPokemon = topPvp.filter(function(p) { return p.triage.league === 'Ultra'; });

      if (glPokemon.length > 0) {
        text += '\nGreat League (under 1500 CP):\n';
        glPokemon
          .sort(function(a, b) { return a.triage.leagueRank - b.triage.leagueRank; })
          .forEach(function(p, i) {
            text += '  ' + (i + 1) + '. ' + p.name + ' - Rank #' + p.triage.leagueRank + ' (' + p.atkIv + '/' + p.defIv + '/' + p.staIv + ')\n';
          });
      }

      if (ulPokemon.length > 0) {
        text += '\nUltra League (under 2500 CP):\n';
        ulPokemon
          .sort(function(a, b) { return a.triage.leagueRank - b.triage.leagueRank; })
          .forEach(function(p, i) {
            text += '  ' + (i + 1) + '. ' + p.name + ' - Rank #' + p.triage.leagueRank + ' (' + p.atkIv + '/' + p.defIv + '/' + p.staIv + ')\n';
          });
      }
    }

    text += '\n======================================\n';
    text += 'Everything else in your collection is fine to keep!\n';
    text += 'Total Pokemon analyzed: ' + pokemon.length + '\n';

    return text;
  }

  function getTypeEmoji(type) {
    var emojis = {
      'Normal': '[N]', 'Fire': '[Fire]', 'Water': '[Water]', 'Electric': '[Elec]',
      'Grass': '[Grass]', 'Ice': '[Ice]', 'Fighting': '[Fight]', 'Poison': '[Poison]',
      'Ground': '[Ground]', 'Flying': '[Flying]', 'Psychic': '[Psychic]', 'Bug': '[Bug]',
      'Rock': '[Rock]', 'Ghost': '[Ghost]', 'Dragon': '[Dragon]', 'Dark': '[Dark]',
      'Steel': '[Steel]', 'Fairy': '[Fairy]'
    };
    return emojis[type] || '[?]';
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
