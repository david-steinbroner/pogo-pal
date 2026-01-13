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

  // Final evolutions - Pokemon that cannot evolve further (focused on meta-relevant species)
  const FINAL_EVOLUTIONS = [
    // Gen 1 Final Evolutions
    'Venusaur', 'Charizard', 'Blastoise', 'Butterfree', 'Beedrill', 'Pidgeot', 'Raticate',
    'Fearow', 'Arbok', 'Raichu', 'Sandslash', 'Nidoqueen', 'Nidoking', 'Clefable', 'Ninetales',
    'Wigglytuff', 'Vileplume', 'Parasect', 'Venomoth', 'Dugtrio', 'Persian', 'Golduck',
    'Primeape', 'Arcanine', 'Poliwrath', 'Alakazam', 'Machamp', 'Victreebel', 'Tentacruel',
    'Golem', 'Rapidash', 'Slowbro', 'Magneton', 'Dodrio', 'Dewgong', 'Muk', 'Cloyster',
    'Gengar', 'Hypno', 'Kingler', 'Electrode', 'Exeggutor', 'Marowak', 'Hitmonlee',
    'Hitmonchan', 'Weezing', 'Rhydon', 'Chansey', 'Tangela', 'Kangaskhan', 'Seaking',
    'Starmie', 'Mr. Mime', 'Scyther', 'Jynx', 'Electabuzz', 'Magmar', 'Pinsir', 'Tauros',
    'Gyarados', 'Lapras', 'Vaporeon', 'Jolteon', 'Flareon', 'Omastar', 'Kabutops',
    'Aerodactyl', 'Snorlax', 'Dragonite',
    // Gen 1 Legendaries
    'Articuno', 'Zapdos', 'Moltres', 'Mewtwo', 'Mew',
    // Gen 2 Final Evolutions
    'Meganium', 'Typhlosion', 'Feraligatr', 'Furret', 'Noctowl', 'Ledian', 'Ariados',
    'Crobat', 'Lanturn', 'Xatu', 'Ampharos', 'Bellossom', 'Azumarill', 'Sudowoodo',
    'Politoed', 'Jumpluff', 'Sunflora', 'Quagsire', 'Espeon', 'Umbreon', 'Slowking',
    'Forretress', 'Steelix', 'Granbull', 'Scizor', 'Heracross', 'Ursaring',
    'Magcargo', 'Piloswine', 'Corsola', 'Octillery', 'Delibird', 'Mantine',
    'Skarmory', 'Houndoom', 'Kingdra', 'Donphan', 'Porygon2', 'Stantler', 'Hitmontop',
    'Miltank', 'Blissey', 'Tyranitar',
    // Gen 2 Legendaries
    'Raikou', 'Entei', 'Suicune', 'Lugia', 'Ho-Oh', 'Celebi',
    // Gen 3 Final Evolutions
    'Sceptile', 'Blaziken', 'Swampert', 'Mightyena', 'Linoone', 'Beautifly', 'Dustox',
    'Ludicolo', 'Shiftry', 'Swellow', 'Pelipper', 'Gardevoir', 'Masquerain', 'Breloom',
    'Slaking', 'Ninjask', 'Shedinja', 'Exploud', 'Hariyama', 'Delcatty', 'Sableye',
    'Mawile', 'Aggron', 'Medicham', 'Manectric', 'Plusle', 'Minun', 'Volbeat', 'Illumise',
    'Roselia', 'Swalot', 'Sharpedo', 'Wailord', 'Camerupt', 'Torkoal', 'Grumpig',
    'Spinda', 'Flygon', 'Cacturne', 'Altaria', 'Zangoose', 'Seviper', 'Lunatone',
    'Solrock', 'Whiscash', 'Crawdaunt', 'Claydol', 'Cradily', 'Armaldo', 'Milotic',
    'Castform', 'Banette', 'Dusclops', 'Tropius', 'Chimecho', 'Absol', 'Glalie',
    'Walrein', 'Huntail', 'Gorebyss', 'Relicanth', 'Luvdisc', 'Salamence', 'Metagross',
    // Gen 3 Legendaries
    'Regirock', 'Regice', 'Registeel', 'Latias', 'Latios', 'Kyogre', 'Groudon',
    'Rayquaza', 'Jirachi', 'Deoxys',
    // Gen 4 Final Evolutions
    'Torterra', 'Infernape', 'Empoleon', 'Staraptor', 'Bibarel', 'Kricketune',
    'Luxray', 'Roserade', 'Rampardos', 'Bastiodon', 'Wormadam', 'Mothim', 'Vespiquen',
    'Pachirisu', 'Floatzel', 'Cherrim', 'Gastrodon', 'Ambipom', 'Drifblim', 'Lopunny',
    'Mismagius', 'Honchkrow', 'Purugly', 'Skuntank', 'Bronzong', 'Spiritomb', 'Garchomp',
    'Lucario', 'Hippowdon', 'Drapion', 'Toxicroak', 'Carnivine', 'Lumineon', 'Abomasnow',
    'Weavile', 'Magnezone', 'Lickilicky', 'Rhyperior', 'Tangrowth', 'Electivire',
    'Magmortar', 'Togekiss', 'Yanmega', 'Leafeon', 'Glaceon', 'Gliscor', 'Mamoswine',
    'Porygon-Z', 'Gallade', 'Probopass', 'Dusknoir', 'Froslass', 'Rotom',
    // Gen 4 Legendaries
    'Uxie', 'Mesprit', 'Azelf', 'Dialga', 'Palkia', 'Heatran', 'Regigigas',
    'Giratina', 'Cresselia', 'Phione', 'Manaphy', 'Darkrai', 'Shaymin', 'Arceus',
    // Gen 5 Final Evolutions
    'Serperior', 'Emboar', 'Samurott', 'Watchog', 'Stoutland', 'Liepard', 'Simisage',
    'Simisear', 'Simipour', 'Musharna', 'Unfezant', 'Zebstrika', 'Gigalith', 'Swoobat',
    'Excadrill', 'Audino', 'Conkeldurr', 'Seismitoad', 'Throh', 'Sawk', 'Leavanny',
    'Scolipede', 'Whimsicott', 'Lilligant', 'Krookodile', 'Darmanitan', 'Crustle',
    'Scrafty', 'Sigilyph', 'Cofagrigus', 'Carracosta', 'Archeops', 'Garbodor',
    'Zoroark', 'Cinccino', 'Gothitelle', 'Reuniclus', 'Swanna', 'Vanilluxe',
    'Sawsbuck', 'Emolga', 'Escavalier', 'Amoonguss', 'Jellicent', 'Alomomola',
    'Galvantula', 'Ferrothorn', 'Klinklang', 'Eelektross', 'Beheeyem', 'Chandelure',
    'Haxorus', 'Beartic', 'Cryogonal', 'Accelgor', 'Stunfisk', 'Mienshao', 'Druddigon',
    'Golurk', 'Bisharp', 'Bouffalant', 'Braviary', 'Mandibuzz', 'Heatmor', 'Durant',
    'Hydreigon', 'Volcarona',
    // Gen 5 Legendaries
    'Cobalion', 'Terrakion', 'Virizion', 'Tornadus', 'Thundurus', 'Reshiram',
    'Zekrom', 'Landorus', 'Kyurem', 'Keldeo', 'Meloetta', 'Genesect',
    // Gen 6 Final Evolutions
    'Chesnaught', 'Delphox', 'Greninja', 'Diggersby', 'Talonflame', 'Vivillon',
    'Pyroar', 'Florges', 'Gogoat', 'Pangoro', 'Furfrou', 'Meowstic', 'Aegislash',
    'Aromatisse', 'Slurpuff', 'Malamar', 'Barbaracle', 'Dragalge', 'Clawitzer',
    'Heliolisk', 'Tyrantrum', 'Aurorus', 'Sylveon', 'Hawlucha', 'Dedenne', 'Carbink',
    'Goodra', 'Klefki', 'Trevenant', 'Gourgeist', 'Avalugg', 'Noivern',
    // Gen 6 Legendaries
    'Xerneas', 'Yveltal', 'Zygarde', 'Diancie', 'Hoopa', 'Volcanion',
    // Gen 7 Final Evolutions
    'Decidueye', 'Incineroar', 'Primarina', 'Toucannon', 'Gumshoos', 'Vikavolt',
    'Crabominable', 'Oricorio', 'Ribombee', 'Lycanroc', 'Wishiwashi', 'Toxapex',
    'Mudsdale', 'Araquanid', 'Lurantis', 'Shiinotic', 'Salazzle', 'Bewear',
    'Tsareena', 'Comfey', 'Oranguru', 'Passimian', 'Golisopod', 'Palossand',
    'Pyukumuku', 'Silvally', 'Minior', 'Komala', 'Turtonator', 'Togedemaru',
    'Mimikyu', 'Bruxish', 'Drampa', 'Dhelmise', 'Kommo-o',
    // Gen 7 Legendaries
    'Tapu Koko', 'Tapu Lele', 'Tapu Bulu', 'Tapu Fini', 'Cosmog', 'Cosmoem',
    'Solgaleo', 'Lunala', 'Nihilego', 'Buzzwole', 'Pheromosa', 'Xurkitree',
    'Celesteela', 'Kartana', 'Guzzlord', 'Necrozma', 'Magearna', 'Marshadow',
    'Poipole', 'Naganadel', 'Stakataka', 'Blacephalon', 'Zeraora', 'Meltan', 'Melmetal',
    // Gen 8 Final Evolutions
    'Rillaboom', 'Cinderace', 'Inteleon', 'Greedent', 'Corviknight', 'Orbeetle',
    'Thievul', 'Eldegoss', 'Dubwool', 'Drednaw', 'Boltund', 'Coalossal', 'Flapple',
    'Appletun', 'Sandaconda', 'Cramorant', 'Barraskewda', 'Toxtricity', 'Centiskorch',
    'Grapploct', 'Polteageist', 'Hatterene', 'Grimmsnarl', 'Obstagoon', 'Perrserker',
    'Cursola', 'Sirfetch\'d', 'Mr. Rime', 'Runerigus', 'Alcremie', 'Falinks',
    'Pincurchin', 'Frosmoth', 'Stonjourner', 'Eiscue', 'Indeedee', 'Morpeko',
    'Copperajah', 'Dracozolt', 'Arctozolt', 'Dracovish', 'Arctovish', 'Duraludon',
    'Dragapult',
    // Gen 8 Legendaries
    'Zacian', 'Zamazenta', 'Eternatus', 'Kubfu', 'Urshifu', 'Zarude', 'Regieleki',
    'Regidrago', 'Glastrier', 'Spectrier', 'Calyrex',
    // Regional variants that are final
    'Alolan Raticate', 'Alolan Raichu', 'Alolan Sandslash', 'Alolan Ninetales',
    'Alolan Dugtrio', 'Alolan Persian', 'Alolan Golem', 'Alolan Muk', 'Alolan Exeggutor',
    'Alolan Marowak', 'Galarian Rapidash', 'Galarian Slowbro', 'Galarian Slowking',
    'Galarian Weezing', 'Galarian Mr. Mime', 'Galarian Articuno', 'Galarian Zapdos',
    'Galarian Moltres', 'Hisuian Typhlosion', 'Hisuian Samurott', 'Hisuian Decidueye',
    'Hisuian Arcanine', 'Hisuian Electrode', 'Hisuian Lilligant', 'Hisuian Goodra',
    'Hisuian Avalugg', 'Hisuian Braviary', 'Hisuian Zoroark'
  ];

  // Single-stage Pokemon - Pokemon that don't evolve at all
  const SINGLE_STAGE_POKEMON = [
    // Gen 1
    'Farfetch\'d', 'Kangaskhan', 'Pinsir', 'Tauros', 'Ditto', 'Aerodactyl', 'Snorlax',
    'Articuno', 'Zapdos', 'Moltres', 'Mewtwo', 'Mew',
    // Gen 2
    'Unown', 'Girafarig', 'Dunsparce', 'Qwilfish', 'Shuckle', 'Heracross', 'Corsola',
    'Delibird', 'Skarmory', 'Stantler', 'Smeargle', 'Miltank',
    'Raikou', 'Entei', 'Suicune', 'Lugia', 'Ho-Oh', 'Celebi',
    // Gen 3
    'Sableye', 'Mawile', 'Plusle', 'Minun', 'Volbeat', 'Illumise', 'Torkoal',
    'Spinda', 'Zangoose', 'Seviper', 'Lunatone', 'Solrock', 'Castform', 'Kecleon',
    'Tropius', 'Absol', 'Relicanth', 'Luvdisc',
    'Regirock', 'Regice', 'Registeel', 'Latias', 'Latios', 'Kyogre', 'Groudon',
    'Rayquaza', 'Jirachi', 'Deoxys',
    // Gen 4
    'Pachirisu', 'Chatot', 'Spiritomb', 'Carnivine', 'Rotom',
    'Uxie', 'Mesprit', 'Azelf', 'Dialga', 'Palkia', 'Heatran', 'Regigigas',
    'Giratina', 'Cresselia', 'Phione', 'Manaphy', 'Darkrai', 'Shaymin', 'Arceus',
    // Gen 5
    'Audino', 'Throh', 'Sawk', 'Basculin', 'Maractus', 'Sigilyph', 'Emolga',
    'Alomomola', 'Cryogonal', 'Stunfisk', 'Druddigon', 'Bouffalant', 'Heatmor', 'Durant',
    'Cobalion', 'Terrakion', 'Virizion', 'Tornadus', 'Thundurus', 'Reshiram',
    'Zekrom', 'Landorus', 'Kyurem', 'Keldeo', 'Meloetta', 'Genesect',
    // Gen 6
    'Furfrou', 'Hawlucha', 'Dedenne', 'Carbink', 'Klefki',
    'Xerneas', 'Yveltal', 'Zygarde', 'Diancie', 'Hoopa', 'Volcanion',
    // Gen 7
    'Oricorio', 'Wishiwashi', 'Comfey', 'Oranguru', 'Passimian', 'Pyukumuku',
    'Minior', 'Komala', 'Turtonator', 'Togedemaru', 'Mimikyu', 'Bruxish', 'Drampa', 'Dhelmise',
    'Tapu Koko', 'Tapu Lele', 'Tapu Bulu', 'Tapu Fini',
    'Nihilego', 'Buzzwole', 'Pheromosa', 'Xurkitree', 'Celesteela', 'Kartana',
    'Guzzlord', 'Necrozma', 'Magearna', 'Marshadow', 'Stakataka', 'Blacephalon', 'Zeraora',
    // Gen 8
    'Cramorant', 'Falinks', 'Pincurchin', 'Stonjourner', 'Eiscue', 'Indeedee', 'Morpeko',
    'Dracozolt', 'Arctozolt', 'Dracovish', 'Arctovish',
    'Zacian', 'Zamazenta', 'Eternatus', 'Zarude', 'Regieleki', 'Regidrago',
    'Glastrier', 'Spectrier', 'Calyrex'
  ];

  // CP thresholds for battle-ready determination
  const BATTLE_READY_CP = {
    greatLeague: { min: 1400, max: 1500 },
    ultraLeague: { min: 2400, max: 2500 },
    raids: { min: 2500 } // Minimum CP to be raid-ready
  };

  /**
   * Check if a Pokemon is a final evolution (can't evolve further)
   */
  function isFinalEvolution(pokemon) {
    const name = pokemon.name;
    const form = pokemon.form || '';

    // Check direct name match
    if (FINAL_EVOLUTIONS.includes(name)) return true;
    if (SINGLE_STAGE_POKEMON.includes(name)) return true;

    // Check with form (e.g., "Alolan Ninetales")
    if (form) {
      const formName = form.includes('Alolan') ? `Alolan ${name}` :
                       form.includes('Galarian') ? `Galarian ${name}` :
                       form.includes('Hisuian') ? `Hisuian ${name}` : null;
      if (formName && (FINAL_EVOLUTIONS.includes(formName) || SINGLE_STAGE_POKEMON.includes(formName))) {
        return true;
      }
    }

    return false;
  }

  /**
   * Calculate PvP readiness score (0-100)
   * Higher = more battle-ready
   */
  function calculatePvPReadiness(pokemon, league) {
    let score = 0;
    const cpLimits = league === 'great' ? BATTLE_READY_CP.greatLeague : BATTLE_READY_CP.ultraLeague;
    const cp = pokemon.cp || 0;

    // 50 points for being final evolution
    if (isFinalEvolution(pokemon)) {
      score += 50;
    }

    // 30 points for CP near the cap
    if (cp >= cpLimits.min && cp <= cpLimits.max) {
      // Perfect CP range
      score += 30;
    } else if (cp >= cpLimits.min * 0.9 && cp < cpLimits.min) {
      // Close to cap (90%+)
      score += 20;
    } else if (cp >= cpLimits.min * 0.75) {
      // Moderate CP (75%+)
      score += 10;
    }
    // Below 75% of cap = 0 points

    // 20 points for IV ranking (if available)
    const rank = league === 'great' ? pokemon.greatLeague?.rank : pokemon.ultraLeague?.rank;
    if (rank) {
      if (rank <= 50) score += 20;
      else if (rank <= 100) score += 15;
      else if (rank <= 500) score += 10;
      else if (rank <= 1000) score += 5;
    }

    return score;
  }

  /**
   * Calculate Raid readiness score (0-100)
   * Higher = more battle-ready
   */
  function calculateRaidReadiness(pokemon) {
    let score = 0;
    const cp = pokemon.cp || 0;

    // 50 points for being final evolution
    if (isFinalEvolution(pokemon)) {
      score += 50;
    }

    // 30 points for high CP
    if (cp >= 3000) {
      score += 30;
    } else if (cp >= BATTLE_READY_CP.raids.min) {
      score += 20;
    } else if (cp >= 2000) {
      score += 10;
    }
    // Below 2000 CP = 0 points for raids

    // 20 points for Attack IV
    const atkIv = pokemon.atkIv;
    if (atkIv !== null) {
      if (atkIv === 15) score += 20;
      else if (atkIv >= 14) score += 15;
      else if (atkIv >= 12) score += 10;
      else if (atkIv >= 10) score += 5;
    }

    return score;
  }

  /**
   * Get readiness description for display
   */
  function getReadinessDescription(pokemon, type, league = null) {
    const isFinal = isFinalEvolution(pokemon);
    const cp = pokemon.cp || 0;

    if (type === 'pvp') {
      const cpLimits = league === 'great' ? BATTLE_READY_CP.greatLeague : BATTLE_READY_CP.ultraLeague;
      const leagueName = league === 'great' ? 'Great' : 'Ultra';

      if (isFinal && cp >= cpLimits.min) {
        return `Battle-ready for ${leagueName} League`;
      } else if (isFinal) {
        return `Final evolution, needs powering up for ${leagueName}`;
      } else if (cp >= cpLimits.min) {
        return `Good CP but needs to evolve first`;
      } else {
        return `Needs evolution and power-up`;
      }
    } else {
      // Raids
      if (isFinal && cp >= 3000) {
        return 'Battle-ready for raids';
      } else if (isFinal && cp >= BATTLE_READY_CP.raids.min) {
        return 'Usable for raids, could use more power-up';
      } else if (isFinal) {
        return 'Final evolution, needs powering up';
      } else if (cp >= BATTLE_READY_CP.raids.min) {
        return 'Good CP but needs to evolve first';
      } else {
        return 'Needs evolution and power-up';
      }
    }
  }

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
   * NEW: Prioritizes battle-ready Pokemon (final evolution + high CP)
   * Returns { isTopRaider: bool, type: string, rank: number, reason: string, readiness: string }
   */
  function getTopRaiderInfo(pokemon, allPokemon) {
    const attackType = getAttackType(pokemon);

    if (!attackType) {
      return { isTopRaider: false };
    }

    // Get all Pokemon with this attack type
    const sameTypeAttackers = allPokemon.filter(p => getAttackType(p) === attackType);

    // Sort by battle-readiness (primary), then Attack IV (secondary), then CP (tertiary)
    sameTypeAttackers.sort((a, b) => {
      // First: battle readiness score
      const aReadiness = calculateRaidReadiness(a);
      const bReadiness = calculateRaidReadiness(b);
      if (bReadiness !== aReadiness) return bReadiness - aReadiness;

      // Second: Attack IV
      const aAtk = a.atkIv !== null ? a.atkIv : -1;
      const bAtk = b.atkIv !== null ? b.atkIv : -1;
      if (bAtk !== aAtk) return bAtk - aAtk;

      // Third: CP
      const aCp = a.cp || 0;
      const bCp = b.cp || 0;
      return bCp - aCp;
    });

    // Find this Pokemon's rank
    const rank = sameTypeAttackers.findIndex(p => p.id === pokemon.id) + 1;

    if (rank > 0 && rank <= THRESHOLDS.topRaiderCount) {
      const readiness = getReadinessDescription(pokemon, 'raid');
      const atkIv = pokemon.atkIv !== null ? pokemon.atkIv : '?';
      return {
        isTopRaider: true,
        type: attackType,
        rank: rank,
        reason: `#${rank} ${attackType} attacker (${atkIv} Atk)`,
        readiness: readiness
      };
    }

    return { isTopRaider: false };
  }

  /**
   * Check if this Pokemon is one of the user's top PvP Pokemon
   * NEW: Prioritizes battle-ready Pokemon (final evolution + near CP cap)
   * Returns { isTopPvP: bool, league: string, leagueRank: number, userRank: number, reason: string, details: string, readiness: string }
   */
  function getTopPvPInfo(pokemon, allPokemon) {
    // Get league rankings
    const glRank = pokemon.greatLeague?.rank;
    const ulRank = pokemon.ultraLeague?.rank;

    // Sort all Pokemon by battle-readiness for GL, then IV rank as tiebreaker
    const glSorted = allPokemon
      .filter(p => p.greatLeague?.rank)
      .sort((a, b) => {
        const aReadiness = calculatePvPReadiness(a, 'great');
        const bReadiness = calculatePvPReadiness(b, 'great');
        if (bReadiness !== aReadiness) return bReadiness - aReadiness;
        return a.greatLeague.rank - b.greatLeague.rank;
      });

    const glPosition = glSorted.findIndex(p => p.id === pokemon.id) + 1;

    // Sort all Pokemon by battle-readiness for UL, then IV rank as tiebreaker
    const ulSorted = allPokemon
      .filter(p => p.ultraLeague?.rank)
      .sort((a, b) => {
        const aReadiness = calculatePvPReadiness(a, 'ultra');
        const bReadiness = calculatePvPReadiness(b, 'ultra');
        if (bReadiness !== aReadiness) return bReadiness - aReadiness;
        return a.ultraLeague.rank - b.ultraLeague.rank;
      });

    const ulPosition = ulSorted.findIndex(p => p.id === pokemon.id) + 1;

    // Check if top N in either league (prefer league where Pokemon is more battle-ready)
    const glReadiness = calculatePvPReadiness(pokemon, 'great');
    const ulReadiness = calculatePvPReadiness(pokemon, 'ultra');

    // Decide which league to show based on readiness, position, and rank
    let bestLeague = null;
    let bestPosition = 0;
    let bestRank = null;
    let bestReadiness = 0;

    if (glPosition > 0 && glPosition <= THRESHOLDS.topPvpCount && glRank) {
      bestLeague = 'great';
      bestPosition = glPosition;
      bestRank = glRank;
      bestReadiness = glReadiness;
    }

    if (ulPosition > 0 && ulPosition <= THRESHOLDS.topPvpCount && ulRank) {
      // Prefer UL if more battle-ready there, or if not in GL top
      if (!bestLeague || ulReadiness > bestReadiness) {
        bestLeague = 'ultra';
        bestPosition = ulPosition;
        bestRank = ulRank;
        bestReadiness = ulReadiness;
      }
    }

    if (bestLeague) {
      const leagueName = bestLeague === 'great' ? 'Great' : 'Ultra';
      const readiness = getReadinessDescription(pokemon, 'pvp', bestLeague);
      const isFinal = isFinalEvolution(pokemon);
      const cp = pokemon.cp || 0;
      const cpLimits = bestLeague === 'great' ? BATTLE_READY_CP.greatLeague : BATTLE_READY_CP.ultraLeague;

      // Build reason string - highlight if battle-ready
      let reason;
      if (isFinal && cp >= cpLimits.min) {
        reason = `#${bestPosition} ${leagueName} League (ready!)`;
      } else if (isFinal) {
        reason = `#${bestPosition} ${leagueName} League (needs CP)`;
      } else {
        reason = `#${bestPosition} ${leagueName} (needs evolve)`;
      }

      const percentile = ((4096 - bestRank) / 4096 * 100).toFixed(1);
      let details = `Rank #${bestRank} IVs (top ${percentile}%). `;
      details += readiness + '.';

      return {
        isTopPvP: true,
        league: leagueName,
        leagueRank: bestRank,
        userRank: bestPosition,
        reason: reason,
        details: details,
        readiness: readiness
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
      let details = `One of your best ${raiderInfo.type}-type attackers for raids. `;
      details += raiderInfo.readiness + '.';
      return {
        verdict: VERDICTS.TOP_RAIDER,
        reason: raiderInfo.reason,
        details: details,
        attackType: raiderInfo.type,
        typeRank: raiderInfo.rank,
        readiness: raiderInfo.readiness
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
        leagueRank: pvpInfo.leagueRank,
        readiness: pvpInfo.readiness
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
