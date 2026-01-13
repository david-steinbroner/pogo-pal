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
    initUploadButton();
    initFilters();
    initPvpFilters();
    initFiltersToggle();
    initCardFilters();
    initSegmentedControl();
    initSortableHeaders();
    initTeamFilters();
    initTradeToggle();
    initModeSelector();
    PogoSources.initSourcesLinks();
  });

  // ============================================
  // File Upload Handling
  // ============================================

  function initUploadButton() {
    const uploadBtn = document.getElementById('uploadBtn');
    const fileInput = document.getElementById('fileInput');

    if (uploadBtn && fileInput) {
      uploadBtn.addEventListener('click', function() {
        fileInput.click();
      });

      fileInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
          processFile(file);
        }
      });
    }
  }

  // Show/hide views for landing vs results
  function showResultsView() {
    document.getElementById('landingSection').hidden = true;
    document.getElementById('minimalHeader').hidden = false;
    document.getElementById('resultsMain').hidden = false;
    document.getElementById('resultsFooter').hidden = false;
  }

  function showLandingView() {
    document.getElementById('landingSection').hidden = false;
    document.getElementById('minimalHeader').hidden = true;
    document.getElementById('resultsMain').hidden = true;
    document.getElementById('resultsFooter').hidden = true;
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
    // Switch from landing to results view
    showResultsView();

    document.getElementById('resultsSection').hidden = false;
    updateSummaryCards(results.summary);

    // Set default filter to Safe to Transfer (most actionable)
    document.getElementById('filterVerdict').value = 'SAFE_TRANSFER';

    // Render table sorted by default filter
    renderTable(results.pokemon, 'SAFE_TRANSFER');
    updateResultsCount();
  }

  function updateSummaryCards(summary) {
    document.getElementById('countTransfer').textContent = summary.safeTransfer;
    document.getElementById('countTrade').textContent = summary.tradeCandidates;
    document.getElementById('countRaider').textContent = summary.topRaiders;
    document.getElementById('countPvp').textContent = summary.topPvp;
    document.getElementById('countAll').textContent = summary.total;
  }

  function renderTable(pokemon, filter, opponentType, teamFilters) {
    filter = filter || 'all';
    opponentType = opponentType || '';
    teamFilters = teamFilters || {};
    const tbody = document.getElementById('resultsBody');

    // Filter Pokemon by verdict
    let filtered = pokemon;
    if (filter !== 'all') {
      filtered = pokemon.filter(function(p) {
        return p.triage.verdict === filter;
      });
    }

    // Apply Max CP filter
    if (teamFilters.maxCP) {
      filtered = filtered.filter(function(p) {
        return (p.cp || 0) <= teamFilters.maxCP;
      });
    }

    // Apply Type filter
    if (teamFilters.selectedTypes && teamFilters.selectedTypes.length > 0) {
      filtered = filtered.filter(function(p) {
        var types = PogoTriage.getPokemonTypes ? PogoTriage.getPokemonTypes(p) : [];
        if (types.length === 0) return true; // If no type data, include by default
        // Match if Pokemon has ANY of the selected types
        return teamFilters.selectedTypes.some(function(t) {
          return types.includes(t);
        });
      });
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
        var segment = card.dataset.segment;
        var wasSelected = card.classList.contains('selected');

        // Deselect all cards in the same segment
        cards.forEach(function(c) {
          if (c.dataset.segment === segment) {
            c.classList.remove('selected');
          }
        });

        if (wasSelected) {
          // Clicking already-selected card: deselect and show default for segment
          var defaultFilter = getDefaultFilterForSegment(segment);
          document.getElementById('filterVerdict').value = defaultFilter;
        } else {
          // Select this card and filter to its verdict
          card.classList.add('selected');
          document.getElementById('filterVerdict').value = filter;
        }

        // Update team filters visibility based on card selection
        updateTeamFiltersVisibility();

        applyFilters();
      });
    });
  }

  // Show/hide team filters based on segment and card selection
  function updateTeamFiltersVisibility() {
    var teamFilters = document.getElementById('teamFilters');
    if (!teamFilters) return;

    var currentSegment = document.querySelector('.segment-btn.active');
    var segment = currentSegment ? currentSegment.dataset.segment : '';
    var anyCardSelected = document.querySelector('.summary-card.selected') !== null;

    // Show filters on My Teams tab when any card is selected
    if (segment === 'my-teams' && anyCardSelected) {
      teamFilters.hidden = false;
    } else {
      teamFilters.hidden = true;
      resetTeamFilters();
    }
  }

  // Reset team filters to default state
  function resetTeamFilters() {
    var leagueSelect = document.getElementById('filterLeague');
    var maxCPSelect = document.getElementById('filterMaxCP');
    var customCPInput = document.getElementById('filterCustomCP');
    var fightingAgainst = document.getElementById('filterFightingAgainst');

    if (leagueSelect) leagueSelect.value = '';
    if (maxCPSelect) maxCPSelect.value = '';
    if (customCPInput) {
      customCPInput.value = '';
      customCPInput.hidden = true;
    }
    if (fightingAgainst) fightingAgainst.value = '';

    document.querySelectorAll('.type-checkbox input').forEach(function(cb) {
      cb.checked = false;
    });
    updateTypeFilterButtonText();
  }

  // Update type filter button text based on selections
  function updateTypeFilterButtonText() {
    var typeCheckboxes = document.querySelectorAll('.type-checkbox input:checked');
    var typeFilterBtn = document.getElementById('typeFilterBtn');
    if (!typeFilterBtn) return;

    if (typeCheckboxes.length === 0) {
      typeFilterBtn.textContent = 'All Types';
    } else if (typeCheckboxes.length <= 2) {
      var types = Array.from(typeCheckboxes).map(function(cb) { return cb.value; });
      typeFilterBtn.textContent = types.join(', ');
    } else {
      typeFilterBtn.textContent = typeCheckboxes.length + ' types selected';
    }
  }

  // Get selected types from checkboxes
  function getSelectedTypes() {
    var typeCheckboxes = document.querySelectorAll('.type-checkbox input:checked');
    return Array.from(typeCheckboxes).map(function(cb) { return cb.value; });
  }

  // Get the default filter when no card is selected for a segment
  function getDefaultFilterForSegment(segment) {
    switch (segment) {
      case 'transfer-trade':
        return 'SAFE_TRANSFER';
      case 'my-teams':
        return 'TOP_RAIDER';
      case 'all':
        return 'all';
      default:
        return 'all';
    }
  }

  // Clear all card selections
  function clearCardSelections() {
    document.querySelectorAll('.summary-card.selected').forEach(function(card) {
      card.classList.remove('selected');
    });
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

        // Clear any card selections when switching segments
        clearCardSelections();

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

        // Show/hide trade toggle based on segment
        var tradeToggle = document.getElementById('tradePartnerToggle');
        if (tradeToggle) {
          if (segment === 'transfer-trade') {
            tradeToggle.classList.add('visible');
          } else {
            tradeToggle.classList.remove('visible');
          }
        }

        // Update team filters visibility (depends on segment AND card selection)
        updateTeamFiltersVisibility();

        applyFilters();
      });
    });

    // Initialize with first segment
    var firstBtn = document.querySelector('.segment-btn.active');
    if (firstBtn) {
      firstBtn.click();
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
  // Team Filters
  // ============================================

  function initTeamFilters() {
    var leagueSelect = document.getElementById('filterLeague');
    var maxCPSelect = document.getElementById('filterMaxCP');
    var customCPInput = document.getElementById('filterCustomCP');
    var fightingAgainst = document.getElementById('filterFightingAgainst');
    var typeFilterBtn = document.getElementById('typeFilterBtn');
    var typeFilterDropdown = document.getElementById('typeFilterDropdown');
    var typeClearBtn = document.querySelector('.type-clear-btn');
    var typeDoneBtn = document.querySelector('.type-done-btn');
    var typeCheckboxes = document.querySelectorAll('.type-checkbox input');

    if (!leagueSelect) return;

    // Fighting against dropdown
    if (fightingAgainst) {
      fightingAgainst.addEventListener('change', applyFilters);
    }

    // League dropdown - also sets max CP automatically
    leagueSelect.addEventListener('change', function() {
      var value = leagueSelect.value;
      if (value && value !== 'unlimited') {
        // Auto-set max CP when league is selected
        maxCPSelect.value = value;
        customCPInput.hidden = true;
      } else if (value === 'unlimited') {
        maxCPSelect.value = '';
        customCPInput.hidden = true;
      }
      applyFilters();
    });

    // Max CP dropdown
    maxCPSelect.addEventListener('change', function() {
      if (maxCPSelect.value === 'custom') {
        customCPInput.hidden = false;
        customCPInput.focus();
      } else {
        customCPInput.hidden = true;
        applyFilters();
      }
    });

    // Custom CP input
    customCPInput.addEventListener('input', function() {
      applyFilters();
    });

    // Type filter button - toggle dropdown
    typeFilterBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      typeFilterDropdown.hidden = !typeFilterDropdown.hidden;
    });

    // Prevent dropdown from closing when clicking inside it
    typeFilterDropdown.addEventListener('click', function(e) {
      e.stopPropagation();
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
      if (!typeFilterDropdown.contains(e.target) && e.target !== typeFilterBtn) {
        typeFilterDropdown.hidden = true;
      }
    });

    // Type checkboxes - update button text
    typeCheckboxes.forEach(function(cb) {
      cb.addEventListener('change', function() {
        updateTypeFilterButtonText();
      });
    });

    // Clear button
    typeClearBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      typeCheckboxes.forEach(function(cb) { cb.checked = false; });
      updateTypeFilterButtonText();
      applyFilters();
    });

    // Done button - explicitly close and apply
    typeDoneBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      typeFilterDropdown.hidden = true;
      applyFilters();
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
        await analyzeAndRender();
      }
    });
  }

  // ============================================
  // Mode Selector (Casual/Optimization)
  // ============================================

  function initModeSelector() {
    const selector = document.getElementById('modeSelector');
    const dropdown = document.getElementById('modeDropdown');

    if (!selector || !dropdown) return;

    // Load saved preference
    const saved = localStorage.getItem('pogo-triage-mode');
    if (saved === 'optimization') {
      currentMode = 'optimization';
      selector.textContent = 'Optimization mode';
      document.querySelector('.mode-option[data-mode="casual"]').classList.remove('active');
      document.querySelector('.mode-option[data-mode="optimization"]').classList.add('active');
    }

    // Toggle dropdown on click
    selector.parentElement.addEventListener('click', function(e) {
      e.stopPropagation();
      dropdown.hidden = !dropdown.hidden;
    });

    // Handle mode option clicks
    document.querySelectorAll('.mode-option').forEach(function(btn) {
      btn.addEventListener('click', async function(e) {
        e.stopPropagation();
        const mode = btn.dataset.mode;
        currentMode = mode;

        // Update active state
        document.querySelectorAll('.mode-option').forEach(function(b) {
          b.classList.remove('active');
        });
        btn.classList.add('active');

        // Update selector text
        selector.textContent = mode === 'casual' ? 'Casual mode' : 'Optimization mode';
        dropdown.hidden = true;

        // Save preference
        localStorage.setItem('pogo-triage-mode', mode);

        // Re-analyze if we have data
        if (currentParsedPokemon && currentParsedPokemon.length > 0) {
          await analyzeAndRender();
        }
      });
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', function() {
      dropdown.hidden = true;
    });
  }

  window.filterByVerdict = function(verdict) {
    document.getElementById('filterVerdict').value = verdict;
    applyFilters();
  };

  function applyFilters() {
    if (!currentResults) return;

    var verdictFilter = document.getElementById('filterVerdict').value;
    var fightingAgainst = document.getElementById('filterFightingAgainst');
    var opponentType = fightingAgainst ? fightingAgainst.value : '';
    var searchFilter = document.getElementById('searchInput').value.toLowerCase().trim();

    // Get team filters (Max CP and Type)
    var maxCPSelect = document.getElementById('filterMaxCP');
    var customCPInput = document.getElementById('filterCustomCP');
    var maxCP = null;

    if (maxCPSelect && maxCPSelect.value === 'custom') {
      maxCP = parseInt(customCPInput.value) || null;
    } else if (maxCPSelect && maxCPSelect.value) {
      maxCP = parseInt(maxCPSelect.value);
    }

    var selectedTypes = getSelectedTypes();

    // Build team filters object
    var teamFilters = {
      maxCP: maxCP,
      selectedTypes: selectedTypes
    };

    // Re-render table with new filters
    renderTable(currentResults.pokemon, verdictFilter, opponentType, teamFilters);

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
  // Utility Functions
  // ============================================

  function setStatus(message, type) {
    const status = document.getElementById('status');
    if (!status) return;

    status.textContent = message;
    status.className = 'status' + (type ? ' ' + type : '');

    // Show status when there's a message, hide on success (results will show instead)
    if (type === 'success') {
      status.hidden = true;
    } else {
      status.hidden = !message;
    }
  }

  function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

})();
