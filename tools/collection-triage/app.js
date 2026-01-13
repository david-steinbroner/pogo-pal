/**
 * Collection Triage App
 * Main UI controller for the Collection Triage tool
 */

(function() {
  'use strict';

  let currentResults = null;
  let currentFilename = '';
  let currentParsedPokemon = null; // Store parsed data for re-analysis
  let hasTradePartner = false;
  let currentMode = 'casual'; // 'casual' or 'optimization'

  // Sorting state
  let currentSort = {
    column: null,
    direction: 'asc'
  };

  // League CP presets
  var LEAGUE_PRESETS = {
    great: { min: 0, max: 1500 },
    ultra: { min: 1501, max: 2500 },
    master: { min: 2501, max: 99999 },
    little: { min: 0, max: 500 }
  };

  // All Pokemon types
  var ALL_TYPES = ['Bug', 'Dark', 'Dragon', 'Electric', 'Fairy', 'Fighting',
                   'Fire', 'Flying', 'Ghost', 'Grass', 'Ground', 'Ice',
                   'Normal', 'Poison', 'Psychic', 'Rock', 'Steel', 'Water'];

  // Initialize on DOM ready
  document.addEventListener('DOMContentLoaded', function() {
    initUploadZone();
    initFilters();
    initPvpFilters();
    initFiltersToggle();
    initDownloadButtons();
    initCardFilters();
    initSegmentedControl();
    initSortableHeaders();
    initTradeToggle();
    initModeToggle();
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

      // Store parsed Pokemon for re-analysis when toggle changes
      currentParsedPokemon = parsed.pokemon;

      // Analyze with current trade partner setting
      await analyzeAndRender();

    } catch (error) {
      setStatus('Error: ' + error.message, 'error');
      console.error('Processing error:', error);
    }
  }

  /**
   * Analyze Pokemon with current settings and render results
   */
  async function analyzeAndRender() {
    if (!currentParsedPokemon) return;

    const results = await PogoTriage.triageCollection(currentParsedPokemon, {
      hasTradePartner: hasTradePartner,
      mode: currentMode
    });
    currentResults = results;

    setStatus(`Analyzed ${results.pokemon.length} Pokemon`, 'success');
    renderResults(results);
  }

  // ============================================
  // Results Rendering
  // ============================================

  function renderResults(results) {
    document.getElementById('resultsSection').hidden = false;
    updateSummaryCards(results.summary);

    // Update UI based on current mode
    updateModeUI(currentMode);

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
    document.getElementById('countAll').textContent = summary.total;

    // Update keep count
    const keepSection = document.querySelector('.no-flags-count');
    const keepCount = summary.keep;
    if (keepSection) {
      keepSection.innerHTML = '<span id="countKeep">' + keepCount + '</span> with no special flags';
    }
  }

  function renderTable(pokemon, filter, opponentType, pvpFilters) {
    filter = filter || 'all';
    opponentType = opponentType || '';
    pvpFilters = pvpFilters || null;
    const tbody = document.getElementById('resultsBody');

    // Filter Pokemon by verdict
    let filtered = pokemon;
    if (filter !== 'all') {
      filtered = pokemon.filter(function(p) {
        return p.triage.verdict === filter;
      });
    }

    // Apply PvP filters (CP range and type filters) if on Top PvP view
    if (pvpFilters && filter === 'TOP_PVP') {
      // CP range filter
      if (pvpFilters.minCP > 0 || pvpFilters.maxCP < 99999) {
        filtered = filtered.filter(function(p) {
          var cp = p.cp || 0;
          return cp >= pvpFilters.minCP && cp <= pvpFilters.maxCP;
        });
      }

      // Type filter (include/exclude)
      if (pvpFilters.selectedTypes.length > 0 && pvpFilters.selectedTypes.length < 18) {
        filtered = filtered.filter(function(p) {
          var types = PogoTriage.getPokemonTypes ? PogoTriage.getPokemonTypes(p) : [];
          if (types.length === 0) return true; // If no type data, include by default
          var hasType = types.some(function(t) {
            return pvpFilters.selectedTypes.includes(t);
          });
          return pvpFilters.typeMode === 'include' ? hasType : !hasType;
        });
      }
    }

    // Calculate effectiveness for each Pokemon if opponent type is selected
    if (opponentType) {
      filtered = filtered.map(function(p) {
        return {
          ...p,
          _effectiveness: PogoTriage.getEffectivenessAgainst(p, opponentType)
        };
      });
    }

    // Sort: use custom sort if active, otherwise use default verdict-based sort
    if (currentSort.column) {
      filtered = sortPokemon(filtered);
    } else {
      filtered = sortByVerdict(filtered, filter);
    }

    // If opponent type is selected, sort super effective to top (after verdict sort)
    if (opponentType) {
      filtered = filtered.slice().sort(function(a, b) {
        var aEffective = a._effectiveness ? 1 : 0;
        var bEffective = b._effectiveness ? 1 : 0;
        return bEffective - aEffective; // Super effective first
      });
    }

    // Build table rows
    tbody.innerHTML = filtered.map(function(p) {
      return renderRow(p, opponentType);
    }).join('');

    // Show empty state if needed
    if (filtered.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="empty-state">' + getEmptyStateMessage(filter) + '</td></tr>';
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
        // Sort by tier (best first), then by attack type, then CP descending
        return pokemon.slice().sort(function(a, b) {
          // Tier first (S > A+ > A > B+ > B > C > none)
          var tierOrder = { 'S': 1, 'A+': 2, 'A': 3, 'B+': 4, 'B': 5, 'C': 6 };
          var aTierOrder = tierOrder[a.triage?.tier] || 99;
          var bTierOrder = tierOrder[b.triage?.tier] || 99;
          if (aTierOrder !== bTierOrder) {
            return aTierOrder - bTierOrder;
          }
          // Then by attack type
          var aType = a.triage.attackType || 'ZZZ';
          var bType = b.triage.attackType || 'ZZZ';
          if (aType !== bType) {
            return aType.localeCompare(bType);
          }
          // Within same type, sort by CP descending
          return (b.cp || 0) - (a.cp || 0);
        });

      case 'TOP_PVP':
        // Sort by league, then by readiness, then by PvP rank
        return pokemon.slice().sort(function(a, b) {
          // Group by league first
          var aLeague = a.triage.league || 'ZZZ';
          var bLeague = b.triage.league || 'ZZZ';
          var leagueOrder = { 'Great': 1, 'Ultra': 2, 'Master': 3 };
          var aLeagueOrder = leagueOrder[aLeague] || 99;
          var bLeagueOrder = leagueOrder[bLeague] || 99;
          if (aLeagueOrder !== bLeagueOrder) {
            return aLeagueOrder - bLeagueOrder;
          }
          // Then by readiness (ready first)
          var aReady = (a.triage.readiness || '').includes('ready') ? 0 : 1;
          var bReady = (b.triage.readiness || '').includes('ready') ? 0 : 1;
          if (aReady !== bReady) {
            return aReady - bReady;
          }
          // Then by PvP rank (lower is better)
          var aRank = a.triage.pvpRank || a.triage.leagueRank || 9999;
          var bRank = b.triage.pvpRank || b.triage.leagueRank || 9999;
          return aRank - bRank;
        });

      case 'all':
        // All Pokemon view: sort by tier (best first), then by IV% descending
        return pokemon.slice().sort(function(a, b) {
          // Tier first (S > A+ > A > B+ > B > C > none)
          var tierOrder = { 'S': 1, 'A+': 2, 'A': 3, 'B+': 4, 'B': 5, 'C': 6 };
          var aTierOrder = tierOrder[a.triage?.tier] || 99;
          var bTierOrder = tierOrder[b.triage?.tier] || 99;
          if (aTierOrder !== bTierOrder) {
            return aTierOrder - bTierOrder;
          }
          // Within same tier, sort by IV% descending
          return (b.ivPercent || 0) - (a.ivPercent || 0);
        });

      default:
        // Default: sort by name
        return pokemon.slice().sort(function(a, b) {
          return a.name.localeCompare(b.name);
        });
    }
  }

  function getEmptyStateMessage(verdict) {
    if (currentMode === 'casual') {
      var casualMessages = {
        'SAFE_TRANSFER': "No duplicates found! Every Pokemon is your best of its species.",
        'TRADE_CANDIDATE': "No trade candidates. Turn on 'I have a trade partner' to see duplicates as trade options.",
        'TOP_RAIDER': "Upload more Pokemon to see your best attackers by type.",
        'TOP_PVP': "Upload evolved Pokemon to see your best PvP candidates per league.",
        'KEEP': "All your Pokemon have been categorized!"
      };
      return casualMessages[verdict] || "No Pokemon in this category.";
    }

    var messages = {
      'SAFE_TRANSFER': "No Pokemon clearly safe to transfer. Your collection is well-optimized!",
      'TRADE_CANDIDATE': "No trade candidates found. Turn on 'I have a trade partner' to see options.",
      'TOP_RAIDER': "No top raiders identified. Try Optimization mode and ensure you have high-IV meta-relevant Pokemon.",
      'TOP_PVP': "No top PvP Pokemon found. Need final evolutions with PvP rank data from Poke Genie.",
      'KEEP': "All your Pokemon have been categorized!"
    };
    return messages[verdict] || "No Pokemon in this category.";
  }

  function renderRow(pokemon, opponentType) {
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

    // Render tier badge
    var tier = pokemon.triage.tier || null;
    var tierBadge = renderTierBadge(tier);

    // Check effectiveness (use cached value if available)
    var effectiveness = pokemon._effectiveness || (opponentType ? PogoTriage.getEffectivenessAgainst(pokemon, opponentType) : null);
    var effectivenessBadge = '';
    if (effectiveness) {
      effectivenessBadge = ' <span class="effectiveness-badge">Super Effective</span>';
    }

    // Render league eligibility badges
    var leagueBadges = renderLeagueBadges(pokemon.cp || 0);

    return '<tr data-verdict="' + verdict + '" data-name="' + pokemonName.toLowerCase() + '" data-tier="' + (tier || '') + '">' +
      '<td class="col-pokemon">' +
        '<strong>' + pokemonName + '</strong>' + formStr +
        badges +
      '</td>' +
      '<td class="col-tier">' + tierBadge + '</td>' +
      '<td class="col-league">' + leagueBadges + '</td>' +
      '<td class="col-cp">' + (pokemon.cp || '?') + '</td>' +
      '<td class="col-ivs">' + ivStr + '</td>' +
      '<td class="col-verdict">' +
        '<span class="verdict verdict-' + verdictClass + '">' +
          verdictDisplay.icon + ' ' + verdictDisplay.label +
        '</span>' +
      '</td>' +
      '<td class="col-why">' +
        '<span class="reason">' + escapeHtml(pokemon.triage.reason) + '</span>' +
        effectivenessBadge +
        (escapedDetails ? '<button class="details-btn" onclick="showDetails(\'' + pokemonName + '\', \'' + escapedDetails.replace(/'/g, "\\'") + '\')">?</button>' : '') +
      '</td>' +
    '</tr>';
  }

  /**
   * Render tier badge HTML
   */
  function renderTierBadge(tier) {
    if (!tier) return '<span class="tier-badge tier-none">-</span>';

    var tierClass = 'tier-' + tier.toLowerCase().replace('+', 'plus');
    return '<span class="tier-badge ' + tierClass + '">' + tier + '</span>';
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
    document.getElementById('filterVerdict').addEventListener('change', function() {
      // Show/hide PvP filters based on verdict
      var isPvP = this.value === 'TOP_PVP';
      document.getElementById('pvpFilters').hidden = !isPvP;
      applyFilters();
    });
    document.getElementById('filterOpponentType').addEventListener('change', applyFilters);
    document.getElementById('searchInput').addEventListener('input', applySearchFilter);
  }

  function initPvpFilters() {
    // Generate type checkboxes
    var typeCheckboxes = document.getElementById('typeCheckboxes');
    ALL_TYPES.forEach(function(type) {
      var label = document.createElement('label');
      label.innerHTML = '<input type="checkbox" value="' + type + '" checked><span>' + type + '</span>';
      typeCheckboxes.appendChild(label);
    });

    // League dropdown - updates CP inputs
    document.getElementById('filterLeague').addEventListener('change', function() {
      var preset = LEAGUE_PRESETS[this.value];
      if (preset) {
        document.getElementById('filterMinCP').value = preset.min > 0 ? preset.min : '';
        document.getElementById('filterMaxCP').value = preset.max < 99999 ? preset.max : '';
      } else if (this.value === '' || this.value === 'custom') {
        // Clear for "All Leagues" or "Custom"
        if (this.value === '') {
          document.getElementById('filterMinCP').value = '';
          document.getElementById('filterMaxCP').value = '';
        }
      }
      applyFilters();
    });

    // CP range inputs
    document.getElementById('filterMinCP').addEventListener('input', applyFilters);
    document.getElementById('filterMaxCP').addEventListener('input', applyFilters);

    // Type filter toggle
    document.getElementById('typeFilterToggle').addEventListener('click', function() {
      var content = document.getElementById('typeFilterContent');
      content.hidden = !content.hidden;
      this.textContent = content.hidden ? 'Type Filter ▼' : 'Type Filter ▲';
    });

    // Type mode radio buttons
    document.querySelectorAll('input[name="typeMode"]').forEach(function(radio) {
      radio.addEventListener('change', applyFilters);
    });

    // Select All / Clear All buttons
    document.getElementById('selectAllTypes').addEventListener('click', function() {
      document.querySelectorAll('#typeCheckboxes input[type="checkbox"]').forEach(function(cb) {
        cb.checked = true;
      });
      applyFilters();
    });

    document.getElementById('clearAllTypes').addEventListener('click', function() {
      document.querySelectorAll('#typeCheckboxes input[type="checkbox"]').forEach(function(cb) {
        cb.checked = false;
      });
      applyFilters();
    });

    // Individual type checkboxes
    document.getElementById('typeCheckboxes').addEventListener('change', applyFilters);
  }

  // Get selected types from checkboxes
  function getSelectedTypes() {
    var selected = [];
    document.querySelectorAll('#typeCheckboxes input[type="checkbox"]:checked').forEach(function(cb) {
      selected.push(cb.value);
    });
    return selected;
  }

  // Get Pokemon types from meta entry
  function getPokemonTypes(pokemon) {
    // Try to get types from the triaged data or meta entry
    if (pokemon._types) return pokemon._types;
    // Will be populated during rendering
    return [];
  }

  // Render league eligibility badges
  function renderLeagueBadges(cp) {
    var badges = [];
    if (cp <= 500) badges.push('<span class="league-badge league-lc">LC</span>');
    if (cp <= 1500) badges.push('<span class="league-badge league-gl">GL</span>');
    if (cp > 1500 && cp <= 2500) badges.push('<span class="league-badge league-ul">UL</span>');
    if (cp > 2500) badges.push('<span class="league-badge league-ml">ML</span>');
    return badges.join('');
  }

  function initCardFilters() {
    var cards = document.querySelectorAll('.summary-card[data-filter]');
    cards.forEach(function(card) {
      card.addEventListener('click', function() {
        var filter = card.dataset.filter;
        document.getElementById('filterVerdict').value = filter;
        updateFilterVisibility(filter);
        applyFilters();
      });
    });
  }

  // Update visibility of context-aware filters (Fighting against dropdown)
  function updateFilterVisibility(currentView) {
    var showContextFilters = ['TOP_RAIDER', 'TOP_PVP'].includes(currentView);
    var contextFilters = document.getElementById('contextFilters');
    if (contextFilters) {
      contextFilters.classList.toggle('hidden', !showContextFilters);
    }
  }

  // Initialize mobile filters toggle
  function initFiltersToggle() {
    var toggle = document.getElementById('filtersToggle');
    var content = document.getElementById('filtersContent');

    if (toggle && content) {
      toggle.addEventListener('click', function() {
        var isExpanded = toggle.getAttribute('aria-expanded') === 'true';
        toggle.setAttribute('aria-expanded', !isExpanded);
        content.classList.toggle('expanded', !isExpanded);
      });
    }
  }

  function initSegmentedControl() {
    var segmentBtns = document.querySelectorAll('.segment-btn');
    var cards = document.querySelectorAll('.summary-card[data-segment]');

    segmentBtns.forEach(function(btn) {
      btn.addEventListener('click', function() {
        var segment = btn.dataset.segment;

        // Update active state
        segmentBtns.forEach(function(b) { b.classList.remove('active'); });
        btn.classList.add('active');

        // Show/hide cards based on segment
        cards.forEach(function(card) {
          if (card.dataset.segment === segment) {
            card.classList.remove('hidden');
          } else {
            card.classList.add('hidden');
          }
        });

        // Set default filter for segment
        var filterVerdict = document.getElementById('filterVerdict');
        if (segment === 'transfer-trade') {
          filterVerdict.value = 'SAFE_TRANSFER';
        } else if (segment === 'my-teams') {
          filterVerdict.value = 'TOP_RAIDER';
        } else {
          filterVerdict.value = 'all';
        }

        // Update context filter visibility
        updateFilterVisibility(filterVerdict.value);

        // Update trade partner toggle visibility
        updateTradeToggleVisibility(segment);

        applyFilters();
      });
    });

    // Initialize with first segment
    var firstBtn = document.querySelector('.segment-btn.active');
    if (firstBtn) {
      firstBtn.click();
    }
  }

  // Show/hide trade partner toggle based on current tab
  function updateTradeToggleVisibility(currentTab) {
    var tradeToggle = document.getElementById('tradePartnerToggle');
    if (tradeToggle) {
      tradeToggle.classList.toggle('hidden', currentTab !== 'transfer-trade');
    }
  }

  // ============================================
  // Sortable Headers
  // ============================================

  function initSortableHeaders() {
    const headers = document.querySelectorAll('th.sortable');
    headers.forEach(function(header) {
      header.addEventListener('click', function() {
        const column = header.dataset.sort;
        handleSort(column);
      });
    });
  }

  function handleSort(column) {
    // Toggle direction if same column, otherwise default to desc for numbers, asc for text
    if (currentSort.column === column) {
      currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
    } else {
      currentSort.column = column;
      // Default to descending for CP/IV (highest first), ascending for tier (best first), ascending for name/verdict
      if (column === 'cp' || column === 'ivPercent') {
        currentSort.direction = 'desc';
      } else if (column === 'tier') {
        currentSort.direction = 'asc'; // S tier first
      } else {
        currentSort.direction = 'asc';
      }
    }

    updateSortHeaderUI();
    applyFilters(); // Re-render with new sort
  }

  function updateSortHeaderUI() {
    const headers = document.querySelectorAll('th.sortable');
    headers.forEach(function(header) {
      header.classList.remove('sort-asc', 'sort-desc');
      if (header.dataset.sort === currentSort.column) {
        header.classList.add('sort-' + currentSort.direction);
      }
    });
  }

  function sortPokemon(pokemon) {
    if (!currentSort.column) return pokemon;

    const column = currentSort.column;
    const direction = currentSort.direction;
    const multiplier = direction === 'asc' ? 1 : -1;

    return pokemon.slice().sort(function(a, b) {
      var valueA, valueB;

      switch (column) {
        case 'name':
          valueA = (a.name || '').toLowerCase();
          valueB = (b.name || '').toLowerCase();
          return multiplier * valueA.localeCompare(valueB);

        case 'tier':
          // Custom order for tiers (S is best)
          var tierOrder = {
            'S': 1,
            'A+': 2,
            'A': 3,
            'B+': 4,
            'B': 5,
            'C': 6
          };
          valueA = tierOrder[a.triage?.tier] || 99;
          valueB = tierOrder[b.triage?.tier] || 99;
          return multiplier * (valueA - valueB);

        case 'cp':
          valueA = a.cp || 0;
          valueB = b.cp || 0;
          return multiplier * (valueA - valueB);

        case 'ivPercent':
          valueA = a.ivPercent || 0;
          valueB = b.ivPercent || 0;
          return multiplier * (valueA - valueB);

        case 'verdict':
          // Custom order for verdicts
          var verdictOrder = {
            'TOP_PVP': 1,
            'TOP_RAIDER': 2,
            'TRADE_CANDIDATE': 3,
            'SAFE_TRANSFER': 4,
            'KEEP': 5
          };
          valueA = verdictOrder[a.triage.verdict] || 99;
          valueB = verdictOrder[b.triage.verdict] || 99;
          return multiplier * (valueA - valueB);

        default:
          return 0;
      }
    });
  }

  // ============================================
  // Trade Partner Toggle
  // ============================================

  function initTradeToggle() {
    const toggle = document.getElementById('tradeToggle');
    if (!toggle) return;

    // Load saved preference
    const saved = localStorage.getItem('pogo-has-trade-partner');
    if (saved === 'true') {
      toggle.checked = true;
      hasTradePartner = true;
    }

    // Handle changes
    toggle.addEventListener('change', async function(e) {
      hasTradePartner = e.target.checked;

      // Save preference
      localStorage.setItem('pogo-has-trade-partner', hasTradePartner.toString());

      // Re-analyze if we have data
      if (currentParsedPokemon && currentParsedPokemon.length > 0) {
        setStatus('Re-analyzing with new settings...', 'loading');
        await analyzeAndRender();
      }
    });
  }

  // ============================================
  // Mode Toggle (Casual/Optimization)
  // ============================================

  function initModeToggle() {
    const casualBtn = document.getElementById('modeCasual');
    const optimizationBtn = document.getElementById('modeOptimization');
    const modeHint = document.getElementById('modeHint');

    if (!casualBtn || !optimizationBtn) return;

    // Load saved preference
    const saved = localStorage.getItem('pogo-triage-mode');
    if (saved === 'optimization') {
      currentMode = 'optimization';
      casualBtn.classList.remove('active');
      optimizationBtn.classList.add('active');
      updateModeHint('optimization');
      updateModeUI('optimization');
    } else {
      // Default to casual mode
      updateModeUI('casual');
    }

    // Handle casual button click
    casualBtn.addEventListener('click', async function() {
      if (currentMode === 'casual') return;

      currentMode = 'casual';
      casualBtn.classList.add('active');
      optimizationBtn.classList.remove('active');
      updateModeHint('casual');
      updateModeUI('casual');

      // Save preference
      localStorage.setItem('pogo-triage-mode', 'casual');

      // Re-analyze if we have data
      if (currentParsedPokemon && currentParsedPokemon.length > 0) {
        setStatus('Re-analyzing in Casual mode...', 'loading');
        await analyzeAndRender();
      }
    });

    // Handle optimization button click
    optimizationBtn.addEventListener('click', async function() {
      if (currentMode === 'optimization') return;

      currentMode = 'optimization';
      optimizationBtn.classList.add('active');
      casualBtn.classList.remove('active');
      updateModeHint('optimization');
      updateModeUI('optimization');

      // Save preference
      localStorage.setItem('pogo-triage-mode', 'optimization');

      // Re-analyze if we have data
      if (currentParsedPokemon && currentParsedPokemon.length > 0) {
        setStatus('Re-analyzing in Optimization mode...', 'loading');
        await analyzeAndRender();
      }
    });
  }

  function updateModeHint(mode) {
    const modeHint = document.getElementById('modeHint');
    if (!modeHint) return;

    if (mode === 'casual') {
      modeHint.textContent = 'Simpler analysis - more lenient thresholds for PvP';
    } else {
      modeHint.textContent = 'Strict analysis - precise PvP rank cutoffs';
    }
  }

  /**
   * Update UI elements based on current mode
   * Both modes show all categories - difference is in thresholds
   */
  function updateModeUI(mode) {
    const keepSection = document.querySelector('.summary-secondary');

    // Both modes show all cards - no disabling
    // The difference is in the triage thresholds, not UI visibility

    // Update keep message text based on mode
    if (keepSection) {
      keepSection.dataset.mode = mode;
    }
  }

  window.filterByVerdict = function(verdict) {
    document.getElementById('filterVerdict').value = verdict;
    applyFilters();
  };

  function applyFilters() {
    if (!currentResults) return;

    var verdictFilter = document.getElementById('filterVerdict').value;
    var opponentType = document.getElementById('filterOpponentType').value;
    var searchFilter = document.getElementById('searchInput').value.toLowerCase().trim();

    // Collect PvP filters if on Top PvP view
    var pvpFilters = null;
    if (verdictFilter === 'TOP_PVP') {
      var minCP = parseInt(document.getElementById('filterMinCP').value) || 0;
      var maxCP = parseInt(document.getElementById('filterMaxCP').value) || 99999;
      var typeMode = document.querySelector('input[name="typeMode"]:checked');
      pvpFilters = {
        minCP: minCP,
        maxCP: maxCP,
        typeMode: typeMode ? typeMode.value : 'include',
        selectedTypes: getSelectedTypes()
      };
    }

    // Re-render table with new filters
    renderTable(currentResults.pokemon, verdictFilter, opponentType, pvpFilters);

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
    document.getElementById('exportChecklist').addEventListener('click', exportChecklist);
  }

  // Get local timestamp for filename
  function getLocalTimestamp() {
    var d = new Date();
    var pad = function(n) { return String(n).padStart(2, '0'); };
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + '-' + pad(d.getHours()) + '-' + pad(d.getMinutes());
  }

  // Export checklist with native share on mobile
  async function exportChecklist() {
    if (!currentResults) return;

    var csv = generateChecklistCSV(currentResults.pokemon);
    var filename = 'PoGO-Tools-Checklist-' + getLocalTimestamp() + '.csv';
    var blob = new Blob([csv], { type: 'text/csv' });

    // Try native share on mobile
    if (navigator.share && navigator.canShare) {
      var file = new File([blob], filename, { type: 'text/csv' });
      if (navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: 'PoGO Checklist' });
          return;
        } catch (e) {
          // User cancelled or share failed, fall through to download
        }
      }
    }

    // Fallback: direct download
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Generate CSV format checklist
  function generateChecklistCSV(pokemon) {
    var lines = [];
    lines.push('Category,Pokemon,Form,CP,IVs,Reason');

    var safeTransfer = pokemon.filter(function(p) { return p.triage.verdict === 'SAFE_TRANSFER'; });
    var tradeCandidates = pokemon.filter(function(p) { return p.triage.verdict === 'TRADE_CANDIDATE'; });
    var topRaiders = pokemon.filter(function(p) { return p.triage.verdict === 'TOP_RAIDER'; });
    var topPvp = pokemon.filter(function(p) { return p.triage.verdict === 'TOP_PVP'; });

    safeTransfer.forEach(function(p) {
      lines.push(csvRow('Safe to Transfer', p));
    });

    tradeCandidates.forEach(function(p) {
      lines.push(csvRow('Trade Candidate', p));
    });

    topRaiders.forEach(function(p) {
      lines.push(csvRow('Top Raider', p));
    });

    topPvp.forEach(function(p) {
      lines.push(csvRow('Top PvP', p));
    });

    return lines.join('\n');
  }

  function csvRow(category, p) {
    var ivs = p.atkIv + '/' + p.defIv + '/' + p.staIv;
    var reason = (p.triage.reason || '').replace(/"/g, '""');
    return '"' + category + '","' + (p.name || '') + '","' + (p.form || '') + '",' + (p.cp || '') + ',"' + ivs + '","' + reason + '"';
  }

  // Legacy text format checklist (kept for reference)
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
          .sort(function(a, b) { return (b.cp || 0) - (a.cp || 0); }) // Sort by CP descending
          .forEach(function(p, i) {
            var tier = p.triage.powerTier || 'usable';
            text += '  ' + (i + 1) + '. ' + p.name + ' CP ' + p.cp + ' (' + p.atkIv + '/' + p.defIv + '/' + p.staIv + ') - ' + tier + '\n';
          });
      });
    }

    text += '\n';

    // Top PvP section - grouped by league
    text += 'YOUR TOP PVP POKEMON (' + topPvp.length + ' Pokemon)\n';
    text += '--------------------------------------\n';
    text += 'Your best Pokemon for GO Battle League:\n';

    if (topPvp.length === 0) {
      text += '\n  (none identified - need final evolutions in league CP ranges)\n';
    } else {
      // Group by league
      var glPokemon = topPvp.filter(function(p) { return p.triage.league === 'Great'; });
      var ulPokemon = topPvp.filter(function(p) { return p.triage.league === 'Ultra'; });
      var mlPokemon = topPvp.filter(function(p) { return p.triage.league === 'Master'; });

      if (glPokemon.length > 0) {
        text += '\nGreat League (1000-1500 CP):\n';
        glPokemon
          .sort(function(a, b) {
            // Ready first, then by rank
            var aReady = (a.triage.readiness || '').includes('ready') ? 0 : 1;
            var bReady = (b.triage.readiness || '').includes('ready') ? 0 : 1;
            if (aReady !== bReady) return aReady - bReady;
            return (a.triage.pvpRank || 9999) - (b.triage.pvpRank || 9999);
          })
          .forEach(function(p, i) {
            var rankStr = p.triage.pvpRank ? 'Rank #' + p.triage.pvpRank : '';
            var readiness = p.triage.readiness || '';
            text += '  ' + (i + 1) + '. ' + p.name + ' CP ' + p.cp + ' - ' + readiness + (rankStr ? ' ' + rankStr : '') + '\n';
          });
      }

      if (ulPokemon.length > 0) {
        text += '\nUltra League (1500-2500 CP):\n';
        ulPokemon
          .sort(function(a, b) {
            var aReady = (a.triage.readiness || '').includes('ready') ? 0 : 1;
            var bReady = (b.triage.readiness || '').includes('ready') ? 0 : 1;
            if (aReady !== bReady) return aReady - bReady;
            return (a.triage.pvpRank || 9999) - (b.triage.pvpRank || 9999);
          })
          .forEach(function(p, i) {
            var rankStr = p.triage.pvpRank ? 'Rank #' + p.triage.pvpRank : '';
            var readiness = p.triage.readiness || '';
            text += '  ' + (i + 1) + '. ' + p.name + ' CP ' + p.cp + ' - ' + readiness + (rankStr ? ' ' + rankStr : '') + '\n';
          });
      }

      if (mlPokemon.length > 0) {
        text += '\nMaster League (2500+ CP):\n';
        mlPokemon
          .sort(function(a, b) { return (b.cp || 0) - (a.cp || 0); })
          .forEach(function(p, i) {
            var readiness = p.triage.readiness || '';
            text += '  ' + (i + 1) + '. ' + p.name + ' CP ' + p.cp + ' - ' + readiness + '\n';
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
