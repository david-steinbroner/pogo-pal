/**
 * Pokemon Triage Logic
 * NEW Philosophy: Keep most things, only flag clear actions
 * Assigns verdicts: TOP_RAIDER, TOP_PVP, SAFE_TRANSFER, TRADE_CANDIDATE, or KEEP
 */

(function() {
  'use strict';

  let metaData = null;

  // Verdict constants - NEW philosophy: Keep most things, only flag clear actions
  const VERDICTS = {
    TOP_RAIDER: 'TOP_RAIDER',       // User's best attackers by type
    TOP_PVP: 'TOP_PVP',             // User's best PvP Pokemon
    SAFE_TRANSFER: 'SAFE_TRANSFER', // Safe to transfer without regret
    TRADE_CANDIDATE: 'TRADE_CANDIDATE', // Worth trading rather than transferring
    KEEP: 'KEEP'                    // Default - fine to keep
  };

  // Thresholds
  const THRESHOLDS = {
    // New thresholds for collection triage
    topRaiderCount: 6,      // Top N Pokemon per attack type for raids
    topPvpCount: 15,        // Top N Pokemon per league for PvP
    lowIvPercent: 50,       // Below this = "terrible IVs"
    commonTrashIvPercent: 80, // Common trash species below this get flagged
    decentIvPercent: 70,    // "Decent" for trade candidate purposes
    // Legacy thresholds (kept for compatibility with legacy functions)
    pvpRank: 100,           // Top 100 rank is "great" for PvP
    masterIvPercent: 96,    // 96%+ for Master League
    raidAttackIv: 14        // 14+ attack for raids
  };

  // Common trash species - very common spawns rarely worth keeping unless high IV
  const COMMON_TRASH_SPECIES = [
    'Pidgey', 'Rattata', 'Spearow', 'Zubat', 'Oddish', 'Paras', 'Venonat',
    'Bellsprout', 'Tentacool', 'Geodude', 'Slowpoke', 'Magnemite', 'Grimer',
    'Shellder', 'Drowzee', 'Voltorb', 'Koffing', 'Goldeen', 'Staryu',
    'Sentret', 'Hoothoot', 'Ledyba', 'Spinarak', 'Natu', 'Marill', 'Hoppip',
    'Sunkern', 'Wooper', 'Murkrow', 'Slugma', 'Swinub', 'Gulpin', 'Numel',
    'Barboach', 'Baltoy', 'Starly', 'Bidoof', 'Kricketot', 'Burmy',
    'Combee', 'Buizel', 'Shellos', 'Stunky', 'Skorupi', 'Patrat', 'Lillipup',
    'Purrloin', 'Pidove', 'Woobat', 'Drilbur', 'Venipede', 'Cottonee',
    'Petilil', 'Dwebble', 'Trubbish', 'Minccino', 'Foongus', 'Ferroseed',
    'Litwick', 'Bunnelby', 'Fletchling', 'Yungoos', 'Pikipek', 'Wooloo',
    'Skwovet', 'Rookidee', 'Blipbug', 'Nickit', 'Gossifleur', 'Chewtle',
    'Weedle', 'Caterpie', 'Wurmple', 'Whismur', 'Zigzagoon', 'Taillow',
    'Wingull', 'Surskit', 'Shroomish', 'Slakoth', 'Nincada', 'Skitty',
    'Meditite', 'Electrike', 'Plusle', 'Minun', 'Illumise', 'Volbeat',
    'Roselia', 'Spoink', 'Swablu', 'Wailmer', 'Cacnea', 'Sewaddle'
  ];

  // Move type mapping for determining attack type
  const MOVE_TYPES = {
    // Electric
    'Thunder Shock': 'Electric', 'Spark': 'Electric', 'Volt Switch': 'Electric',
    'Charge Beam': 'Electric', 'Thunder Fang': 'Electric',
    // Fire
    'Ember': 'Fire', 'Fire Spin': 'Fire', 'Fire Fang': 'Fire', 'Incinerate': 'Fire',
    // Water
    'Water Gun': 'Water', 'Bubble': 'Water', 'Waterfall': 'Water', 'Splash': 'Water',
    // Grass
    'Vine Whip': 'Grass', 'Razor Leaf': 'Grass', 'Bullet Seed': 'Grass', 'Leafage': 'Grass',
    // Fighting
    'Counter': 'Fighting', 'Low Kick': 'Fighting', 'Rock Smash': 'Fighting', 'Karate Chop': 'Fighting',
    // Psychic
    'Confusion': 'Psychic', 'Zen Headbutt': 'Psychic', 'Extrasensory': 'Psychic', 'Psycho Cut': 'Psychic',
    // Ghost
    'Shadow Claw': 'Ghost', 'Hex': 'Ghost', 'Lick': 'Ghost', 'Astonish': 'Ghost',
    // Dark
    'Snarl': 'Dark', 'Bite': 'Dark', 'Feint Attack': 'Dark', 'Sucker Punch': 'Dark',
    // Dragon
    'Dragon Breath': 'Dragon', 'Dragon Tail': 'Dragon',
    // Ice
    'Ice Shard': 'Ice', 'Frost Breath': 'Ice', 'Powder Snow': 'Ice',
    // Rock
    'Rock Throw': 'Rock', 'Smack Down': 'Rock',
    // Ground
    'Mud Shot': 'Ground', 'Mud-Slap': 'Ground',
    // Flying
    'Wing Attack': 'Flying', 'Air Slash': 'Flying', 'Peck': 'Flying', 'Gust': 'Flying',
    // Steel
    'Metal Claw': 'Steel', 'Iron Tail': 'Steel', 'Bullet Punch': 'Steel',
    // Bug
    'Bug Bite': 'Bug', 'Fury Cutter': 'Bug', 'Infestation': 'Bug', 'Struggle Bug': 'Bug',
    // Poison
    'Poison Jab': 'Poison', 'Acid': 'Poison', 'Poison Sting': 'Poison',
    // Fairy
    'Charm': 'Fairy', 'Fairy Wind': 'Fairy',
    // Normal
    'Tackle': 'Normal', 'Scratch': 'Normal', 'Pound': 'Normal', 'Quick Attack': 'Normal', 'Take Down': 'Normal'
  };

  /**
   * Load meta database
   */
  async function loadMetaData() {
    if (metaData) return metaData;

    try {
      // Determine base path
      const basePath = getBasePath();
      const response = await fetch(basePath + 'data/meta-pokemon.json');
      if (!response.ok) throw new Error('Failed to load meta database');
      metaData = await response.json();
      return metaData;
    } catch (err) {
      console.error('Error loading meta data:', err);
      return null;
    }
  }

  /**
   * Get base path for data files
   */
  function getBasePath() {
    const path = window.location.pathname;
    const depth = (path.match(/\//g) || []).length - 1;
    if (depth <= 0) return './';
    return '../'.repeat(depth);
  }

  /**
   * Normalize species name for matching
   */
  function normalizeSpeciesName(name) {
    if (!name) return '';
    return name.toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
  }

  /**
   * Build species ID from Pokemon data
   */
  function buildSpeciesId(pokemon) {
    let id = normalizeSpeciesName(pokemon.name);

    // Handle forms
    if (pokemon.form) {
      const form = pokemon.form.toLowerCase();
      if (form.includes('galar') || form === 'galarian') {
        id += '_galarian';
      } else if (form.includes('alola') || form === 'alolan') {
        id += '_alolan';
      } else if (form.includes('hisui') || form === 'hisuian') {
        id += '_hisuian';
      } else if (form.includes('altered')) {
        id += '_altered';
      } else if (form.includes('origin')) {
        id += '_origin';
      } else if (form !== '') {
        id += '_' + normalizeSpeciesName(form);
      }
    }

    return id;
  }

  /**
   * Find meta entry for a Pokemon
   */
  function findMetaEntry(pokemon) {
    if (!metaData || !metaData.pokemon) return null;

    const speciesId = buildSpeciesId(pokemon);
    const pokedexNumber = pokemon.pokedexNumber;

    // Try exact speciesId match first
    let entry = metaData.pokemon.find(m => m.speciesId === speciesId);
    if (entry) return entry;

    // Try matching by pokedex number and similar name
    const normalizedName = normalizeSpeciesName(pokemon.name);
    entry = metaData.pokemon.find(m => {
      if (m.pokedexNumber !== pokedexNumber) return false;
      const metaName = normalizeSpeciesName(m.speciesName);
      return metaName === normalizedName || metaName.includes(normalizedName);
    });
    if (entry) return entry;

    // Try just by name (for Pokemon without forms in our data)
    entry = metaData.pokemon.find(m =>
      normalizeSpeciesName(m.speciesName) === normalizedName
    );

    return entry || null;
  }

  /**
   * Calculate IV percentage
   */
  function calculateIvPercent(pokemon) {
    if (pokemon.ivPercent !== null && pokemon.ivPercent !== undefined) {
      return pokemon.ivPercent;
    }
    if (pokemon.atkIv !== null && pokemon.defIv !== null && pokemon.staIv !== null) {
      return Math.round(((pokemon.atkIv + pokemon.defIv + pokemon.staIv) / 45) * 1000) / 10;
    }
    return null;
  }

  // ============================================
  // NEW HELPER FUNCTIONS FOR COLLECTION TRIAGE
  // ============================================

  /**
   * Determine what attack type a Pokemon represents
   * Based on fast move if available
   */
  function getAttackType(pokemon) {
    if (pokemon.quickMove && MOVE_TYPES[pokemon.quickMove]) {
      return MOVE_TYPES[pokemon.quickMove];
    }
    // Return null if we can't determine the type
    return null;
  }

  /**
   * Check if this Pokemon is one of the user's top raiders
   * Returns { isTopRaider: bool, type: string, rank: number, reason: string }
   */
  function getTopRaiderInfo(pokemon, allPokemon) {
    const attackType = getAttackType(pokemon);

    if (!attackType) {
      return { isTopRaider: false };
    }

    // Get all Pokemon with this attack type
    const sameTypeAttackers = allPokemon.filter(p => getAttackType(p) === attackType);

    // Sort by Attack IV (primary), then CP (secondary)
    sameTypeAttackers.sort((a, b) => {
      const aAtk = a.atkIv !== null ? a.atkIv : -1;
      const bAtk = b.atkIv !== null ? b.atkIv : -1;
      if (bAtk !== aAtk) return bAtk - aAtk;
      const aCp = a.cp || 0;
      const bCp = b.cp || 0;
      return bCp - aCp;
    });

    // Find this Pokemon's rank
    const rank = sameTypeAttackers.findIndex(p => p.id === pokemon.id) + 1;

    if (rank > 0 && rank <= THRESHOLDS.topRaiderCount) {
      return {
        isTopRaider: true,
        type: attackType,
        rank: rank,
        reason: `Your #${rank} ${attackType} attacker`
      };
    }

    return { isTopRaider: false };
  }

  /**
   * Check if this Pokemon is one of the user's top PvP Pokemon
   * Returns { isTopPvP: bool, league: string, leagueRank: number, userRank: number, reason: string, details: string }
   */
  function getTopPvPInfo(pokemon, allPokemon) {
    // Get Great League ranking
    const glRank = pokemon.greatLeague?.rank;
    const ulRank = pokemon.ultraLeague?.rank;

    // Sort all Pokemon by GL rank
    const glSorted = allPokemon
      .filter(p => p.greatLeague?.rank)
      .sort((a, b) => a.greatLeague.rank - b.greatLeague.rank);

    const glPosition = glSorted.findIndex(p => p.id === pokemon.id) + 1;

    // Sort all Pokemon by UL rank
    const ulSorted = allPokemon
      .filter(p => p.ultraLeague?.rank)
      .sort((a, b) => a.ultraLeague.rank - b.ultraLeague.rank);

    const ulPosition = ulSorted.findIndex(p => p.id === pokemon.id) + 1;

    // Check if top N in either league
    if (glPosition > 0 && glPosition <= THRESHOLDS.topPvpCount && glRank) {
      const percentile = ((4096 - glRank) / 4096 * 100).toFixed(1);
      return {
        isTopPvP: true,
        league: 'Great',
        leagueRank: glRank,
        userRank: glPosition,
        reason: `Rank #${glRank} Great League`,
        details: `Your #${glPosition} best Great League Pokemon. Top ${percentile}% IVs for GL.`
      };
    }

    if (ulPosition > 0 && ulPosition <= THRESHOLDS.topPvpCount && ulRank) {
      const percentile = ((4096 - ulRank) / 4096 * 100).toFixed(1);
      return {
        isTopPvP: true,
        league: 'Ultra',
        leagueRank: ulRank,
        userRank: ulPosition,
        reason: `Rank #${ulRank} Ultra League`,
        details: `Your #${ulPosition} best Ultra League Pokemon. Top ${percentile}% IVs for UL.`
      };
    }

    return { isTopPvP: false };
  }

  /**
   * Check if Pokemon is strictly dominated by another of the same species
   * (Another has equal-or-better IVs in ALL stats AND at least one strictly better)
   */
  function findDominatingPokemon(pokemon, sameSpecies) {
    return sameSpecies.find(other =>
      other.id !== pokemon.id &&
      other.atkIv !== null && pokemon.atkIv !== null &&
      other.defIv !== null && pokemon.defIv !== null &&
      other.staIv !== null && pokemon.staIv !== null &&
      other.atkIv >= pokemon.atkIv &&
      other.defIv >= pokemon.defIv &&
      other.staIv >= pokemon.staIv &&
      (other.level || 1) >= (pokemon.level || 1) &&
      // At least one stat must be STRICTLY better
      (other.atkIv > pokemon.atkIv ||
       other.defIv > pokemon.defIv ||
       other.staIv > pokemon.staIv ||
       (other.level || 1) > (pokemon.level || 1))
    );
  }

  // ============================================
  // LEGACY HELPER FUNCTIONS (kept for compatibility)
  // ============================================

  /**
   * Check if IVs are good for PvP (low attack preferred)
   */
  function isPvpIvGood(pokemon, league) {
    // Check if we have rank data
    if (league === 'great' && pokemon.greatLeague && pokemon.greatLeague.rank) {
      return pokemon.greatLeague.rank <= THRESHOLDS.pvpRank;
    }
    if (league === 'ultra' && pokemon.ultraLeague && pokemon.ultraLeague.rank) {
      return pokemon.ultraLeague.rank <= THRESHOLDS.pvpRank;
    }
    if (league === 'master') {
      const ivPercent = calculateIvPercent(pokemon);
      return ivPercent !== null && ivPercent >= THRESHOLDS.masterIvPercent;
    }

    // Fallback: estimate based on IV pattern (low atk, high def/sta is good for GL/UL)
    if (pokemon.atkIv !== null && pokemon.defIv !== null && pokemon.staIv !== null) {
      if (league === 'great' || league === 'ultra') {
        // Low attack + high def/sta pattern
        return pokemon.atkIv <= 5 && pokemon.defIv >= 12 && pokemon.staIv >= 12;
      }
    }

    return false;
  }

  /**
   * Get PvP rank for display
   */
  function getPvpRank(pokemon, league) {
    if (league === 'great' && pokemon.greatLeague) {
      return pokemon.greatLeague.rank;
    }
    if (league === 'ultra' && pokemon.ultraLeague) {
      return pokemon.ultraLeague.rank;
    }
    if (league === 'master' && pokemon.masterLeague) {
      return pokemon.masterLeague.rank;
    }
    return null;
  }

  /**
   * Evaluate Pokemon for PvP
   */
  function evaluatePvP(pokemon, metaEntry, collection) {
    const result = {
      dominated: [],
      tier: 'not_meta',
      bestLeague: null,
      bestRank: null,
      hasDominator: false,
      dominatedBy: null,
      reason: null,
      details: null
    };

    if (!metaEntry || !metaEntry.pvp || !metaEntry.pvp.dominated || metaEntry.pvp.dominated.length === 0) {
      result.reason = 'Not a PvP meta Pokemon';
      result.details = `${pokemon.name} isn't commonly used in PvP battles. It's either not strong enough competitively or better options exist.`;
      return result;
    }

    result.dominated = metaEntry.pvp.dominated;
    result.tier = metaEntry.pvp.dominatedTier || 'solid_pick';

    // Find best league for this Pokemon
    let bestLeague = null;
    let bestRank = Infinity;

    for (const league of result.dominated) {
      const rank = getPvpRank(pokemon, league);
      if (rank && rank < bestRank) {
        bestRank = rank;
        bestLeague = league;
      } else if (!rank && isPvpIvGood(pokemon, league)) {
        // If no rank data but IVs look good
        if (!bestLeague) {
          bestLeague = league;
          bestRank = null;
        }
      }
    }

    result.bestLeague = bestLeague;
    result.bestRank = bestRank !== Infinity ? bestRank : null;

    // Check for dominators in collection (same species with better rank)
    if (collection && bestLeague) {
      const dominated = findDominator(pokemon, collection, bestLeague);
      if (dominated) {
        result.hasDominator = true;
        result.dominatedBy = dominated;
      }
    }

    // Generate reason and details
    const leagueNames = {
      'great': 'Great League',
      'ultra': 'Ultra League',
      'master': 'Master League'
    };

    if (bestRank && bestRank <= THRESHOLDS.pvpRank) {
      const leagueName = leagueNames[bestLeague] || bestLeague;
      result.reason = `Rank #${bestRank} ${leagueName}${bestRank <= 10 ? ' - excellent!' : ''}`;
      result.details = `This ${pokemon.name} has rank #${bestRank} IVs for ${leagueName} out of 4096 possible combinations. `;

      if (metaEntry.pvp.whyGood) {
        result.details += metaEntry.pvp.whyGood + ' ';
      }

      if (metaEntry.pvp.moveNotes) {
        result.details += metaEntry.pvp.moveNotes;
      }
    } else if (bestLeague) {
      const leagueName = leagueNames[bestLeague] || bestLeague;
      result.reason = `${leagueName} viable, but IVs aren't optimal`;
      result.details = `${pokemon.name} is meta-relevant in ${leagueName}, but this one's IVs aren't in the top 100 ranks. `;

      if (result.hasDominator) {
        result.details += `You have a better one (rank #${getPvpRank(result.dominatedBy, bestLeague)}).`;
      } else {
        result.details += 'Consider catching more to find better IVs.';
      }
    }

    return result;
  }

  /**
   * Find a better Pokemon of same species in collection
   */
  function findDominator(pokemon, collection, league) {
    const myRank = getPvpRank(pokemon, league);
    if (!myRank) return null;

    const dominated = collection.find(other => {
      if (other.id === pokemon.id) return false;
      if (other.name !== pokemon.name) return false;
      if (other.form !== pokemon.form) return false;

      const otherRank = getPvpRank(other, league);
      return otherRank && otherRank < myRank;
    });

    return dominated || null;
  }

  /**
   * Evaluate Pokemon for Raids
   */
  function evaluateRaid(pokemon, metaEntry) {
    const result = {
      dominated: false,
      tier: 'not_useful',
      types: [],
      hasGoodIvs: false,
      reason: null,
      details: null
    };

    if (!metaEntry || !metaEntry.raid || !metaEntry.raid.dominated) {
      result.reason = 'Not useful for raids';
      result.details = `${pokemon.name} doesn't have the attack power needed for raid battles. There are better options available.`;
      return result;
    }

    result.dominated = true;
    result.tier = metaEntry.raid.tier || 'solid_pick';
    result.types = metaEntry.raid.types || [];

    // Check if IVs are good for raids (high attack)
    const atkIv = pokemon.atkIv;
    result.hasGoodIvs = atkIv !== null && atkIv >= THRESHOLDS.raidAttackIv;

    // Shadow bonus consideration
    const isShadow = pokemon.isShadow === true;
    const shadowBonus = isShadow ? ' Shadow Pokemon deal 20% more damage!' : '';

    // Generate reason and details
    const typeList = result.types.slice(0, 3).join(', ');

    if (result.hasGoodIvs) {
      result.reason = `Top ${typeList} raid attacker${isShadow ? ' (Shadow!)' : ''}`;
      result.details = `${pokemon.name} is one of the best attackers against ${typeList} type raid bosses. `;
      result.details += `Your ${pokemon.name} has ${atkIv} Attack IV${atkIv === 15 ? ' (perfect!)' : ', which is great for raids'}. `;

      if (metaEntry.raid.whyGood) {
        result.details += metaEntry.raid.whyGood + ' ';
      }
      if (shadowBonus) {
        result.details += shadowBonus;
      }
      if (metaEntry.raid.moveNotes) {
        result.details += ' ' + metaEntry.raid.moveNotes;
      }
    } else {
      result.reason = `Raid attacker, but low Attack IV (${atkIv || '?'})`;
      result.details = `${pokemon.name} is useful for ${typeList} raids, but this one has ${atkIv !== null ? atkIv : 'unknown'} Attack IV. `;
      result.details += 'Raids prioritize damage output, so 14-15 Attack is preferred. ';
      result.details += 'This could still be useful as a budget option or for trading.';
    }

    return result;
  }

  /**
   * Evaluate special attributes
   */
  function evaluateSpecial(pokemon) {
    const result = {
      isShiny: pokemon.isShiny === true,
      isLucky: pokemon.isLucky === true,
      isShadow: pokemon.isShadow === true,
      isPurified: pokemon.isPurified === true,
      isFavorite: pokemon.isFavorite === true,
      hasLegacyMove: false, // Would need move database to detect
      warnings: []
    };

    if (result.isShadow) {
      result.warnings.push('Shadow Pokemon cost 20% more candy/stardust to power up, but deal 20% more damage.');
    }

    if (result.isPurified) {
      result.warnings.push('Purified Pokemon get Return, which is useful for some PvP builds.');
    }

    if (result.isLucky) {
      result.warnings.push('Lucky Pokemon cost 50% less stardust to power up!');
    }

    return result;
  }

  /**
   * Generate detailed tooltip explanation (LEGACY - kept for compatibility)
   * Note: The new triagePokemon function generates details inline
   */
  function generateDetails(pokemon, verdict) {
    let details = '';

    if (verdict === VERDICTS.TOP_RAIDER) {
      details = `${pokemon.name} is one of your best raiders!`;
    } else if (verdict === VERDICTS.TOP_PVP) {
      details = `${pokemon.name} is one of your best PvP Pokemon!`;
    } else if (verdict === VERDICTS.TRADE_CANDIDATE) {
      details = `This ${pokemon.name} is a good trade candidate.`;
    } else if (verdict === VERDICTS.SAFE_TRANSFER) {
      details = `This ${pokemon.name} is safe to transfer for candy.`;
    } else {
      details = `${pokemon.name} is fine to keep in your collection.`;
    }

    return details;
  }

  /**
   * Main triage function for a single Pokemon
   * NEW Philosophy: Keep most things, only flag clear actions
   */
  function triagePokemon(pokemon, collection) {
    // Step 1: Check if this is a "special" Pokemon (never auto-transfer)
    const isSpecial = pokemon.isShiny || pokemon.isLucky || pokemon.isFavorite;
    const isShadowOrPurified = pokemon.isShadow || pokemon.isPurified;

    // Calculate IV percent if not already present
    const ivPercent = calculateIvPercent(pokemon) || 0;

    // Step 2: Find all Pokemon of the same species in collection
    const sameSpecies = collection.filter(p =>
      p.pokedexNumber === pokemon.pokedexNumber &&
      p.name === pokemon.name &&
      (p.form || '') === (pokemon.form || '')
    );

    // Step 3: Check if this Pokemon is "strictly dominated" by another
    const dominator = findDominatingPokemon(pokemon, sameSpecies);
    const isDominated = dominator !== undefined && dominator !== null;

    // Step 4: Check for Top Raider status
    const raiderInfo = getTopRaiderInfo(pokemon, collection);
    if (raiderInfo.isTopRaider) {
      return {
        verdict: VERDICTS.TOP_RAIDER,
        reason: raiderInfo.reason,
        details: `One of your best ${raiderInfo.type}-type attackers for raids.`,
        attackType: raiderInfo.type,
        typeRank: raiderInfo.rank
      };
    }

    // Step 5: Check for Top PvP status
    const pvpInfo = getTopPvPInfo(pokemon, collection);
    if (pvpInfo.isTopPvP) {
      return {
        verdict: VERDICTS.TOP_PVP,
        reason: pvpInfo.reason,
        details: pvpInfo.details,
        league: pvpInfo.league,
        leagueRank: pvpInfo.leagueRank
      };
    }

    // Step 6: SAFE_TRANSFER checks (only for non-special Pokemon)
    if (!isSpecial && !isShadowOrPurified) {

      // Check if strictly dominated by another
      if (isDominated) {
        return {
          verdict: VERDICTS.SAFE_TRANSFER,
          reason: `You have a better ${pokemon.name}`,
          details: `Your other ${pokemon.name} has ${dominator.atkIv}/${dominator.defIv}/${dominator.staIv} IVs at level ${dominator.level || '?'}. This one has ${pokemon.atkIv}/${pokemon.defIv}/${pokemon.staIv} at level ${pokemon.level || '?'}.`
        };
      }

      // Check for terrible IVs
      if (ivPercent < THRESHOLDS.lowIvPercent) {
        return {
          verdict: VERDICTS.SAFE_TRANSFER,
          reason: `Low IVs (${ivPercent.toFixed(0)}%)`,
          details: `${pokemon.atkIv}/${pokemon.defIv}/${pokemon.staIv} IVs is below average. Not shiny, lucky, or shadow.`
        };
      }

      // Check for common trash with below-average IVs
      if (COMMON_TRASH_SPECIES.includes(pokemon.name) && ivPercent < THRESHOLDS.commonTrashIvPercent) {
        return {
          verdict: VERDICTS.SAFE_TRANSFER,
          reason: 'Common Pokemon with below-average IVs',
          details: `${pokemon.name} is very common. These ${pokemon.atkIv}/${pokemon.defIv}/${pokemon.staIv} IVs aren't worth keeping.`
        };
      }
    }

    // Step 7: TRADE_CANDIDATE checks

    // Shadow Pokemon that is dominated (valuable to others)
    if (pokemon.isShadow && isDominated) {
      return {
        verdict: VERDICTS.TRADE_CANDIDATE,
        reason: 'Shadow duplicate - valuable to traders',
        details: 'Shadow Pokemon deal 20% more damage. Someone else might want this one.'
      };
    }

    // Decent duplicate (both 70%+ IVs)
    if (sameSpecies.length > 1 && ivPercent >= THRESHOLDS.decentIvPercent) {
      const otherDecent = sameSpecies.find(other =>
        other.id !== pokemon.id && (calculateIvPercent(other) || 0) >= THRESHOLDS.decentIvPercent
      );
      if (otherDecent) {
        return {
          verdict: VERDICTS.TRADE_CANDIDATE,
          reason: 'Decent duplicate - lucky trade could improve',
          details: `You have ${sameSpecies.length} ${pokemon.name}. Trading one might get you a lucky version with guaranteed 12/12/12+ IVs.`
        };
      }
    }

    // High CP non-raider (good for trade candy)
    if (pokemon.cp >= 2000 && !raiderInfo.isTopRaider) {
      return {
        verdict: VERDICTS.TRADE_CANDIDATE,
        reason: 'High CP - good candy bonus from trade',
        details: `Trading high-CP Pokemon gives extra candy. This ${pokemon.name} isn't one of your top raiders anyway.`
      };
    }

    // Step 8: Default - KEEP
    return {
      verdict: VERDICTS.KEEP,
      reason: 'Fine to keep',
      details: null
    };
  }

  /**
   * Triage entire collection
   */
  async function triageCollection(pokemonList) {
    await loadMetaData();

    if (!metaData) {
      console.error('Failed to load meta data');
      return {
        pokemon: pokemonList.map(p => ({
          ...p,
          triage: {
            verdict: VERDICTS.KEEP,
            reason: 'Error: Meta database not loaded',
            details: 'Could not load the meta database. Please refresh and try again.',
            evaluation: null,
            warnings: [],
            source: null
          }
        })),
        summary: { topRaiders: 0, topPvp: 0, safeTransfer: 0, tradeCandidates: 0, keep: pokemonList.length, total: pokemonList.length }
      };
    }

    const results = pokemonList.map(pokemon => ({
      ...pokemon,
      triage: triagePokemon(pokemon, pokemonList)
    }));

    const summary = {
      topRaiders: results.filter(p => p.triage.verdict === VERDICTS.TOP_RAIDER).length,
      topPvp: results.filter(p => p.triage.verdict === VERDICTS.TOP_PVP).length,
      safeTransfer: results.filter(p => p.triage.verdict === VERDICTS.SAFE_TRANSFER).length,
      tradeCandidates: results.filter(p => p.triage.verdict === VERDICTS.TRADE_CANDIDATE).length,
      keep: results.filter(p => p.triage.verdict === VERDICTS.KEEP).length,
      total: results.length
    };

    return {
      pokemon: results,
      summary: summary
    };
  }

  /**
   * Get verdict display info (color, icon, label)
   */
  function getVerdictDisplay(verdict) {
    const displays = {
      TOP_RAIDER: {
        label: 'Top Raider',
        color: '#0c5460',
        bgColor: '#d1ecf1',
        icon: '⚔️'
      },
      TOP_PVP: {
        label: 'Top PvP',
        color: '#1e7e34',
        bgColor: '#d4edda',
        icon: '🏆'
      },
      SAFE_TRANSFER: {
        label: 'Safe Transfer',
        color: '#721c24',
        bgColor: '#f8d7da',
        icon: '🗑️'
      },
      TRADE_CANDIDATE: {
        label: 'Trade',
        color: '#856404',
        bgColor: '#fff3cd',
        icon: '🔄'
      },
      KEEP: {
        label: 'Keep',
        color: '#383d41',
        bgColor: '#e2e3e5',
        icon: '✓'
      }
    };
    return displays[verdict] || displays.KEEP;
  }

  // Export for use by other modules
  window.PogoTriage = {
    triagePokemon: triagePokemon,
    triageCollection: triageCollection,
    loadMetaData: loadMetaData,
    getVerdictDisplay: getVerdictDisplay,
    VERDICTS: VERDICTS,
    THRESHOLDS: THRESHOLDS
  };

})();
