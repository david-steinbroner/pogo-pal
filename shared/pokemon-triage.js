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

  // Tier badge colors
  const TIER_COLORS = {
    'S': '#ff6b6b',
    'A+': '#ffa94d',
    'A': '#ffd43b',
    'B+': '#69db7c',
    'B': '#74c0fc',
    'C': '#b197fc'
  };

  // Evolution mapping for tier lookups - maps pre-evolutions to their final forms
  const EVOLUTION_MAP = {
    // Dragon
    'dratini': 'dragonite', 'dragonair': 'dragonite',
    'bagon': 'salamence', 'shelgon': 'salamence',
    'gible': 'garchomp', 'gabite': 'garchomp',
    'axew': 'haxorus', 'fraxure': 'haxorus',
    'deino': 'hydreigon', 'zweilous': 'hydreigon',
    // Fighting
    'machop': 'machamp', 'machoke': 'machamp',
    'makuhita': 'hariyama',
    'timburr': 'conkeldurr', 'gurdurr': 'conkeldurr',
    'riolu': 'lucario',
    // Rock
    'larvitar': 'tyranitar', 'pupitar': 'tyranitar',
    'cranidos': 'rampardos',
    'rhyhorn': 'rhyperior',
    // Electric
    'magnemite': 'magnezone', 'magneton': 'magnezone',
    'elekid': 'electivire', 'electabuzz': 'electivire',
    'shinx': 'luxray', 'luxio': 'luxray',
    // Fire
    'charmander': 'charizard', 'charmeleon': 'charizard',
    'cyndaquil': 'typhlosion', 'quilava': 'typhlosion',
    'torchic': 'blaziken', 'combusken': 'blaziken',
    'chimchar': 'infernape', 'monferno': 'infernape',
    'litwick': 'chandelure', 'lampent': 'chandelure',
    'magby': 'magmortar',
    // Water
    'mudkip': 'swampert', 'marshtomp': 'swampert',
    'totodile': 'feraligatr', 'croconaw': 'feraligatr',
    'squirtle': 'blastoise', 'wartortle': 'blastoise',
    'feebas': 'milotic',
    'piplup': 'empoleon', 'prinplup': 'empoleon',
    'krabby': 'kingler',
    // Psychic
    'abra': 'alakazam', 'kadabra': 'alakazam',
    'ralts': 'gardevoir', 'kirlia': 'gardevoir',
    'beldum': 'metagross', 'metang': 'metagross',
    // Ghost
    'gastly': 'gengar', 'haunter': 'gengar',
    'duskull': 'dusknoir', 'dusclops': 'dusknoir',
    'phantump': 'trevenant',
    // Grass
    'bulbasaur': 'venusaur', 'ivysaur': 'venusaur',
    'chikorita': 'meganium', 'bayleef': 'meganium',
    'treecko': 'sceptile', 'grovyle': 'sceptile',
    'tangela': 'tangrowth',
    'roselia': 'roserade', 'budew': 'roserade',
    // Dark
    'sneasel': 'weavile',
    'poochyena': 'mightyena',
    // Ground
    'trapinch': 'flygon', 'vibrava': 'flygon',
    'hippopotas': 'hippowdon',
    'drilbur': 'excadrill',
    // Bug
    'weedle': 'beedrill', 'kakuna': 'beedrill',
    'scyther': 'scizor',
    'wurmple': 'beautifly',
    'nincada': 'ninjask',
    // Fairy
    'cleffa': 'clefable', 'clefairy': 'clefable',
    'igglybuff': 'wigglytuff', 'jigglypuff': 'wigglytuff',
    'marill': 'azumarill', 'azurill': 'azumarill',
    // Steel
    'aron': 'aggron', 'lairon': 'aggron',
    'onix': 'steelix',
    'bronzor': 'bronzong',
    'shieldon': 'bastiodon',
    // Ice
    'swinub': 'mamoswine', 'piloswine': 'mamoswine',
    // Eevee evolutions
    'eevee': 'espeon' // Default mapping, actual evolution depends on context
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
   * Uses Poke Genie data: if evolution target name matches current name, it's final
   */
  function isFinalEvolution(pokemon) {
    const name = pokemon.name?.toLowerCase();
    if (!name) return false;

    // Primary method: Check Poke Genie evolution targets
    // If the evolution target for any league equals the current name, it's already final
    const glTarget = pokemon.greatLeague?.name?.toLowerCase();
    const ulTarget = pokemon.ultraLeague?.name?.toLowerCase();
    const llTarget = pokemon.littleLeague?.name?.toLowerCase();

    if (glTarget && glTarget === name) return true;
    if (ulTarget && ulTarget === name) return true;
    if (llTarget && llTarget === name) return true;

    // Fallback: Check against known lists
    const originalName = pokemon.name;
    const form = pokemon.form || '';

    if (FINAL_EVOLUTIONS.includes(originalName)) return true;
    if (SINGLE_STAGE_POKEMON.includes(originalName)) return true;

    // Check with form (e.g., "Alolan Ninetales")
    if (form) {
      const formName = form.includes('Alolan') ? `Alolan ${originalName}` :
                       form.includes('Galarian') ? `Galarian ${originalName}` :
                       form.includes('Hisuian') ? `Hisuian ${originalName}` : null;
      if (formName && (FINAL_EVOLUTIONS.includes(formName) || SINGLE_STAGE_POKEMON.includes(formName))) {
        return true;
      }
    }

    // If we have no evolution data at all, check master list
    if (!glTarget && !ulTarget && !llTarget) {
      return FINAL_EVOLUTIONS.includes(originalName) || SINGLE_STAGE_POKEMON.includes(originalName);
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
   * Normalize Pokemon name for meta database lookup
   * Converts "Machamp" -> "machamp", "Giratina (Origin)" -> "giratina origin"
   */
  function normalizeForMetaLookup(name, form) {
    if (!name) return '';
    let normalized = name.toLowerCase().trim();

    // Handle forms - convert to meta database format
    if (form) {
      const formLower = form.toLowerCase();
      if (formLower.includes('origin')) {
        normalized += ' origin';
      } else if (formLower.includes('therian')) {
        normalized += ' therian';
      } else if (formLower.includes('alola') || formLower === 'alolan') {
        normalized += ' alola';
      } else if (formLower.includes('galar') || formLower === 'galarian') {
        normalized += ' galarian';
      } else if (formLower.includes('attack')) {
        normalized += ' attack';
      } else if (formLower.includes('unbound')) {
        normalized += ' unbound';
      }
    }

    return normalized;
  }

  /**
   * Get tier for a Pokemon from the meta database
   * @param {string} pokemonName - The Pokemon's name
   * @param {string} form - The Pokemon's form (optional)
   * @param {boolean} isShadow - Whether this is a shadow Pokemon
   * @returns {string|null} - The tier (S, A+, A, B+, B, C) or null if not in database
   */
  function getTier(pokemonName, form, isShadow) {
    if (!metaData) return null;

    const baseName = normalizeForMetaLookup(pokemonName, form);

    // Check shadow version first if applicable
    if (isShadow) {
      const shadowKey = 'shadow ' + baseName;
      if (metaData[shadowKey]) {
        return metaData[shadowKey].tier;
      }
    }

    // Check base form
    if (metaData[baseName]) {
      return metaData[baseName].tier;
    }

    // Check evolution - look up the evolved form's tier
    const evolvedForm = EVOLUTION_MAP[baseName];
    if (evolvedForm) {
      if (isShadow && metaData['shadow ' + evolvedForm]) {
        return metaData['shadow ' + evolvedForm].tier;
      }
      if (metaData[evolvedForm]) {
        return metaData[evolvedForm].tier;
      }
    }

    return null; // Not in meta database
  }

  /**
   * Get meta entry for a Pokemon (types and tier info)
   * @param {Object} pokemon - The Pokemon object
   * @returns {Object|null} - The meta entry or null
   */
  function getMetaEntry(pokemon) {
    if (!metaData) return null;

    const baseName = normalizeForMetaLookup(pokemon.name, pokemon.form);
    const isShadow = pokemon.isShadow;

    // Check shadow version first if applicable
    if (isShadow) {
      const shadowKey = 'shadow ' + baseName;
      if (metaData[shadowKey]) {
        return { ...metaData[shadowKey], key: shadowKey };
      }
    }

    // Check base form
    if (metaData[baseName]) {
      return { ...metaData[baseName], key: baseName };
    }

    // Check evolution - look up the evolved form
    const evolvedForm = EVOLUTION_MAP[baseName];
    if (evolvedForm) {
      if (isShadow && metaData['shadow ' + evolvedForm]) {
        return { ...metaData['shadow ' + evolvedForm], key: 'shadow ' + evolvedForm, isPreEvolution: true, evolvesTo: evolvedForm };
      }
      if (metaData[evolvedForm]) {
        return { ...metaData[evolvedForm], key: evolvedForm, isPreEvolution: true, evolvesTo: evolvedForm };
      }
    }

    return null;
  }

  /**
   * Render tier badge HTML
   * @param {string} tier - The tier (S, A+, A, B+, B, C) or null
   * @returns {string} - HTML for the tier badge
   */
  function renderTierBadge(tier) {
    if (!tier) return '<span class="tier-badge tier-none">-</span>';

    const tierClass = 'tier-' + tier.toLowerCase().replace('+', 'plus');
    return '<span class="tier-badge ' + tierClass + '">' + tier + '</span>';
  }

  /**
   * Check if Pokemon is a Top Raider based on new tier system
   * @param {Object} pokemon - The Pokemon object
   * @returns {Object} - { isRaider: boolean, tier: string|null, reason: string }
   */
  function isTopRaiderByTier(pokemon) {
    const tier = getTier(pokemon.name, pokemon.form, pokemon.isShadow);
    if (!tier) return { isRaider: false };

    const ivPercent = calculateIvPercent(pokemon) || 0;
    const isFinal = isFinalEvolution(pokemon);
    const cp = pokemon.cp || 0;

    // Shadow Pokemon are always Top Raiders if meta-relevant
    if (pokemon.isShadow) {
      return { isRaider: true, tier: tier, reason: 'Shadow meta Pokemon' };
    }

    // High IV meta Pokemon (80%+)
    if (ivPercent >= 80) {
      return { isRaider: true, tier: tier, reason: 'High IV meta Pokemon' };
    }

    // Already evolved with decent CP (battle-ready)
    if (isFinal && cp >= 1500) {
      return { isRaider: true, tier: tier, reason: 'Battle-ready meta Pokemon' };
    }

    return { isRaider: false };
  }

  // Legacy compatibility functions
  function normalizeSpeciesName(name) {
    if (!name) return '';
    return name.toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
  }

  function buildSpeciesId(pokemon) {
    let id = normalizeSpeciesName(pokemon.name);
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

  function findMetaEntry(pokemon) {
    // Use new lookup method
    return getMetaEntry(pokemon);
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
   * Get raid power tier based on CP
   */
  function getRaidPowerTier(cp) {
    if (cp >= 3000) return 'excellent';
    if (cp >= 2500) return 'great';
    if (cp >= 2000) return 'good';
    return 'usable';
  }

  /**
   * Check if Pokemon is usable for raids
   * INCLUSIVE - if it can contribute, show it
   * No artificial limits - all final evolutions with enough CP qualify
   */
  function getTopRaiderInfo(pokemon) {
    // Must be final evolution or single-stage
    if (!isFinalEvolution(pokemon)) {
      return { isTopRaider: false };
    }

    const cp = pokemon.cp || 0;

    // Must have CP high enough to contribute
    // 1500+ can contribute, 2000+ is solid, 2500+ is great
    if (cp < 1500) {
      return { isTopRaider: false };
    }

    // Determine attack type from moveset
    const attackType = getAttackType(pokemon);

    // Get power tier based on CP
    const powerTier = getRaidPowerTier(cp);

    // Build reason and details
    const typeDisplay = attackType || 'Mixed';
    const atkIv = pokemon.atkIv !== null ? pokemon.atkIv : '?';
    const reason = `${typeDisplay} attacker (${powerTier})`;
    const details = `${cp} CP, ${atkIv} Atk IV`;

    return {
      isTopRaider: true,
      type: attackType,
      powerTier: powerTier,
      reason: reason,
      details: details
    };
  }

  /**
   * Determine best PvP league based on CP
   * More inclusive ranges - if they're close, they qualify
   */
  function getBestLeagueForCP(cp) {
    if (!cp) return null;

    // Great League: 1000-1500
    if (cp >= 1000 && cp <= 1500) {
      return 'Great';
    }

    // Ultra League: 1800-2500
    if (cp >= 1800 && cp <= 2500) {
      return 'Ultra';
    }

    // Master League: 2500+ (no cap)
    if (cp > 2500) {
      return 'Master';
    }

    // Pokemon between 1500-1800 could go either way
    // Put them in Ultra since they'd need powering up anyway
    if (cp > 1500 && cp < 1800) {
      return 'Ultra';
    }

    // Below 1000 - not really usable without significant investment
    return null;
  }

  /**
   * Get human-readable PvP readiness status
   */
  function getPvPReadinessStatus(cp, league) {
    if (league === 'Great') {
      if (cp >= 1400 && cp <= 1500) return 'ready!';
      if (cp >= 1300 && cp < 1400) return 'almost ready';
      return 'needs CP';
    }

    if (league === 'Ultra') {
      if (cp >= 2400 && cp <= 2500) return 'ready!';
      if (cp >= 2200 && cp < 2400) return 'almost ready';
      return 'needs CP';
    }

    if (league === 'Master') {
      if (cp >= 3000) return 'ready!';
      if (cp >= 2700) return 'almost ready';
      return 'needs CP';
    }

    return 'needs CP';
  }

  /**
   * Check if Pokemon is usable for PvP
   * INCLUSIVE - shows everything that COULD be used
   * No "top X" limit - if it fits criteria, it qualifies
   */
  function getTopPvPInfo(pokemon) {
    // Must be final evolution or single-stage
    if (!isFinalEvolution(pokemon)) {
      return { isTopPvP: false };
    }

    const cp = pokemon.cp || 0;

    // Determine which league this Pokemon fits based on CP
    const league = getBestLeagueForCP(cp);

    if (!league) {
      return { isTopPvP: false };
    }

    // Get readiness status
    const readiness = getPvPReadinessStatus(cp, league);

    // Get PvP rank from Poke Genie data if available
    let pvpRank = null;
    if (league === 'Great' && pokemon.greatLeague?.rank) {
      pvpRank = pokemon.greatLeague.rank;
    } else if (league === 'Ultra' && pokemon.ultraLeague?.rank) {
      pvpRank = pokemon.ultraLeague.rank;
    }
    // Master league doesn't use rank the same way

    const rankDisplay = pvpRank ? `Rank #${pvpRank}` : '';
    const percentile = pvpRank ? ((4096 - pvpRank) / 4096 * 100).toFixed(1) : null;

    // Build reason and details
    const reason = `${league} League (${readiness})`;
    let details = '';
    if (rankDisplay) {
      details = `${rankDisplay} IVs (top ${percentile}%). `;
    }
    details += `${cp} CP ${pokemon.name}.`;

    return {
      isTopPvP: true,
      league: league,
      readiness: readiness,
      pvpRank: pvpRank,
      reason: reason,
      details: details
    };
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
   * Check if this Pokemon is dominated by another copy you own
   * A Pokemon is "dominated" if you have another of same species with:
   * - Higher CP AND higher/equal IV%
   * - OR same CP but significantly higher IV%
   */
  function isDominatedDuplicate(pokemon, allPokemon) {
    // Find all Pokemon of same species
    const sameName = allPokemon.filter(p =>
      p.name === pokemon.name &&
      (p.form || '') === (pokemon.form || '') &&
      p.id !== pokemon.id  // Not itself
    );

    if (sameName.length === 0) {
      return { isDominated: false };
    }

    const myIvPercent = calculateIvPercent(pokemon) || 0;
    const myCp = pokemon.cp || 0;

    // Check if any copy is strictly better
    const betterCopy = sameName.find(other => {
      const otherIvPercent = calculateIvPercent(other) || 0;
      const otherCp = other.cp || 0;

      // Dominated if other has higher CP AND equal-or-better IVs
      // OR same CP but significantly higher IV%
      return (
        (otherCp > myCp && otherIvPercent >= myIvPercent) ||
        (otherCp >= myCp && otherIvPercent > myIvPercent + 10)
      );
    });

    if (betterCopy) {
      return {
        isDominated: true,
        betterCopy: betterCopy
      };
    }

    return { isDominated: false };
  }

  /**
   * Check if Pokemon is low value (bad IVs, not useful)
   */
  function isLowValuePokemon(pokemon) {
    const ivPercent = calculateIvPercent(pokemon) || 0;

    // Terrible IVs
    if (ivPercent < THRESHOLDS.lowIvPercent) {
      return {
        isLow: true,
        reason: `Low IVs (${ivPercent.toFixed(0)}%)`,
        details: `${pokemon.atkIv}/${pokemon.defIv}/${pokemon.staIv} IVs is below average.`
      };
    }

    // Common trash with below-average IVs
    if (COMMON_TRASH_SPECIES.includes(pokemon.name) && ivPercent < THRESHOLDS.commonTrashIvPercent) {
      return {
        isLow: true,
        reason: 'Common Pokemon with below-average IVs',
        details: `${pokemon.name} is very common. These IVs aren't worth keeping.`
      };
    }

    return { isLow: false };
  }

  /**
   * CASUAL MODE: Pure storage cleanup - keep best IV% per species, clear rest
   * NO strategic analysis - just duplicate detection
   * @param {Object} pokemon - The Pokemon to triage
   * @param {Array} collection - All Pokemon in the collection
   * @param {Object} speciesBest - Map of species -> best specimen info
   * @param {boolean} hasTradePartner - Whether user has a trade partner
   */
  function triagePokemonCasual(pokemon, collection, speciesBest, hasTradePartner = false) {
    const isSpecial = pokemon.isShiny || pokemon.isLucky || pokemon.isFavorite;
    const speciesKey = getSpeciesKey(pokemon);
    const best = speciesBest[speciesKey];
    const ivPercent = calculateIvPercent(pokemon) || 0;

    // Get tier for display (even in casual mode)
    const tier = getTier(pokemon.name, pokemon.form, pokemon.isShadow);

    // Special Pokemon (shiny, lucky, favorite, shadow, purified) always keep
    if (isSpecial || pokemon.isShadow || pokemon.isPurified) {
      let reasons = [];
      if (pokemon.isShiny) reasons.push('Shiny');
      if (pokemon.isLucky) reasons.push('Lucky');
      if (pokemon.isFavorite) reasons.push('Favorite');
      if (pokemon.isShadow) reasons.push('Shadow');
      if (pokemon.isPurified) reasons.push('Purified');
      return {
        verdict: VERDICTS.KEEP,
        reason: reasons.join(', '),
        details: 'Special Pokemon - keeping regardless of IVs.',
        tier: tier
      };
    }

    // Check if this is the best specimen of this species
    if (best && pokemon.id === best.id) {
      return {
        verdict: VERDICTS.KEEP,
        reason: `Best ${pokemon.name} (${ivPercent.toFixed(0)}%)`,
        details: `Highest IV% of this species.`,
        tier: tier
      };
    }

    // This is a duplicate - not the best
    if (best) {
      const bestIv = calculateIvPercent(best) || 0;

      if (hasTradePartner) {
        return {
          verdict: VERDICTS.TRADE_CANDIDATE,
          reason: 'Duplicate - trade it',
          details: `Your best ${pokemon.name} has ${bestIv.toFixed(0)}% IVs.`,
          tier: tier
        };
      } else {
        return {
          verdict: VERDICTS.SAFE_TRANSFER,
          reason: 'Duplicate - transfer it',
          details: `Your best ${pokemon.name} has ${bestIv.toFixed(0)}% IVs.`,
          tier: tier
        };
      }
    }

    // Only one of this species - keep it
    return {
      verdict: VERDICTS.KEEP,
      reason: `Only ${pokemon.name} (${ivPercent.toFixed(0)}%)`,
      details: null,
      tier: tier
    };
  }

  /**
   * Check if a Pokemon species is meta-relevant for raids
   * Uses the meta database
   */
  function isRaidMetaRelevant(pokemon) {
    const metaEntry = findMetaEntry(pokemon);
    if (!metaEntry) return { isRelevant: false };

    if (metaEntry.raid && metaEntry.raid.dominated) {
      return {
        isRelevant: true,
        types: metaEntry.raid.types || [],
        tier: metaEntry.raid.tier || 'solid_pick',
        whyGood: metaEntry.raid.whyGood || null
      };
    }

    return { isRelevant: false };
  }

  /**
   * Check if a Pokemon species is meta-relevant for PvP
   * Uses the meta database
   */
  function isPvPMetaRelevant(pokemon) {
    const metaEntry = findMetaEntry(pokemon);
    if (!metaEntry) return { isRelevant: false };

    if (metaEntry.pvp && metaEntry.pvp.dominated && metaEntry.pvp.dominated.length > 0) {
      return {
        isRelevant: true,
        leagues: metaEntry.pvp.dominated,
        tier: metaEntry.pvp.dominatedTier || 'solid_pick',
        whyGood: metaEntry.pvp.whyGood || null
      };
    }

    return { isRelevant: false };
  }

  /**
   * OPTIMIZATION MODE: Full strategic analysis for raids and PvP
   * Uses new tier system for Top Raider detection
   * @param {Object} pokemon - The Pokemon to triage
   * @param {Array} collection - All Pokemon in the collection
   * @param {boolean} hasTradePartner - Whether user has a trade partner
   */
  function triagePokemonOptimization(pokemon, collection, hasTradePartner = false) {
    const isSpecial = pokemon.isShiny || pokemon.isLucky || pokemon.isFavorite;
    const isShadowOrPurified = pokemon.isShadow || pokemon.isPurified;
    const ivPercent = calculateIvPercent(pokemon) || 0;
    const level = pokemon.level || 0;
    const isFinal = isFinalEvolution(pokemon);
    const cp = pokemon.cp || 0;

    // Get tier from new meta database
    const tier = getTier(pokemon.name, pokemon.form, pokemon.isShadow);
    const metaEntry = getMetaEntry(pokemon);

    // ===== TOP RAIDER CHECKS (using new tier system) =====

    // Check if this Pokemon qualifies as a Top Raider
    const topRaiderCheck = isTopRaiderByTier(pokemon);

    if (topRaiderCheck.isRaider) {
      const attackTypes = metaEntry?.types || [];
      const typeDisplay = attackTypes.length > 0 ? attackTypes[0] : 'Mixed';

      // Shadow Pokemon
      if (pokemon.isShadow) {
        return {
          verdict: VERDICTS.TOP_RAIDER,
          reason: `Shadow ${typeDisplay} attacker`,
          details: `Shadow Pokemon deal 20% more damage. Tier ${tier} raid meta!`,
          tier: tier,
          attackType: typeDisplay,
          isShadow: true
        };
      }

      // High IV meta Pokemon
      if (ivPercent >= 80) {
        return {
          verdict: VERDICTS.TOP_RAIDER,
          reason: `${ivPercent.toFixed(0)}% IV ${typeDisplay} attacker`,
          details: `Tier ${tier} raid meta with great IVs!`,
          tier: tier,
          attackType: typeDisplay
        };
      }

      // Battle-ready meta Pokemon
      if (isFinal && cp >= 1500) {
        return {
          verdict: VERDICTS.TOP_RAIDER,
          reason: `Battle-ready ${typeDisplay} attacker`,
          details: `Tier ${tier} raid meta, ${cp} CP ready to go!`,
          tier: tier,
          attackType: typeDisplay
        };
      }
    }

    // ===== TOP PVP CHECKS =====

    // Pokemon with great PvP rank (top 5%) in any league
    const glRank = pokemon.greatLeague?.rank;
    const ulRank = pokemon.ultraLeague?.rank;
    const llRank = pokemon.littleLeague?.rank;

    // Great League rank check
    if (isFinal && glRank && glRank <= 205) { // Top 5% of 4096
      const percentile = ((4096 - glRank) / 4096 * 100).toFixed(1);
      return {
        verdict: VERDICTS.TOP_PVP,
        reason: `Great League Rank #${glRank}`,
        details: `Top ${percentile}% IVs for Great League!`,
        league: 'Great',
        pvpRank: glRank,
        leagueRank: glRank,
        tier: tier
      };
    }

    // Ultra League rank check
    if (isFinal && ulRank && ulRank <= 205) { // Top 5%
      const percentile = ((4096 - ulRank) / 4096 * 100).toFixed(1);
      return {
        verdict: VERDICTS.TOP_PVP,
        reason: `Ultra League Rank #${ulRank}`,
        details: `Top ${percentile}% IVs for Ultra League!`,
        league: 'Ultra',
        pvpRank: ulRank,
        leagueRank: ulRank,
        tier: tier
      };
    }

    // Little League rank check
    if (isFinal && llRank && llRank <= 205) { // Top 5%
      const percentile = ((4096 - llRank) / 4096 * 100).toFixed(1);
      return {
        verdict: VERDICTS.TOP_PVP,
        reason: `Little League Rank #${llRank}`,
        details: `Top ${percentile}% IVs for Little League!`,
        league: 'Little',
        pvpRank: llRank,
        leagueRank: llRank,
        tier: tier
      };
    }

    // High-IV (96%+) Pokemon are great for Master League
    if (isFinal && ivPercent >= 96 && tier) {
      return {
        verdict: VERDICTS.TOP_PVP,
        reason: `Master League candidate (${ivPercent.toFixed(0)}%)`,
        details: `Near-perfect IVs ideal for Master League. Tier ${tier}.`,
        league: 'Master',
        pvpRank: null,
        tier: tier
      };
    }

    // ===== TRADE VALUE CHECKS =====

    // High IV (96%+) meta-relevant species are worth saving for trades
    if (tier && ivPercent >= 96 && hasTradePartner) {
      return {
        verdict: VERDICTS.TRADE_CANDIDATE,
        reason: `High IV ${tier}-tier meta Pokemon`,
        details: `${ivPercent.toFixed(0)}% IVs on a meta Pokemon - good lucky trade candidate!`,
        tier: tier
      };
    }

    // Shinies are always trade candidates
    if (pokemon.isShiny && hasTradePartner) {
      return {
        verdict: VERDICTS.TRADE_CANDIDATE,
        reason: 'Shiny trade value',
        details: 'Shiny Pokemon are valuable for lucky trades!',
        tier: tier
      };
    }

    // ===== KEEP CHECKS =====

    // Special Pokemon always kept
    if (isSpecial) {
      let reasons = [];
      if (pokemon.isShiny) reasons.push('Shiny');
      if (pokemon.isLucky) reasons.push('Lucky');
      if (pokemon.isFavorite) reasons.push('Favorite');
      return {
        verdict: VERDICTS.KEEP,
        reason: reasons.join(', '),
        details: 'Special Pokemon - keeping!',
        tier: tier
      };
    }

    // Purified Pokemon kept
    if (pokemon.isPurified) {
      return {
        verdict: VERDICTS.KEEP,
        reason: 'Purified',
        details: 'Purified Pokemon get Return move.',
        tier: tier
      };
    }

    // ===== DUPLICATE / TRANSFER CHECKS =====

    // Check for dominated duplicates
    const dominated = isDominatedDuplicate(pokemon, collection);

    if (dominated.isDominated && !isSpecial && !isShadowOrPurified) {
      const betterCp = dominated.betterCopy.cp || '?';
      const betterIv = calculateIvPercent(dominated.betterCopy) || 0;

      if (hasTradePartner) {
        return {
          verdict: VERDICTS.TRADE_CANDIDATE,
          reason: 'Outclassed duplicate',
          details: `You have a better ${pokemon.name} (${betterIv.toFixed(0)}% IV, ${betterCp} CP).`,
          tier: tier
        };
      } else {
        return {
          verdict: VERDICTS.SAFE_TRANSFER,
          reason: 'Outclassed duplicate',
          details: `You have a better ${pokemon.name} (${betterIv.toFixed(0)}% IV, ${betterCp} CP).`,
          tier: tier
        };
      }
    }

    // Low value Pokemon (bad IVs, not meta-relevant)
    if (!isSpecial && !isShadowOrPurified && !tier) {
      const lowValue = isLowValuePokemon(pokemon);
      if (lowValue.isLow) {
        if (hasTradePartner) {
          return {
            verdict: VERDICTS.TRADE_CANDIDATE,
            reason: lowValue.reason,
            details: lowValue.details + ' Trade for IV reroll?',
            tier: null
          };
        }
        return {
          verdict: VERDICTS.SAFE_TRANSFER,
          reason: lowValue.reason,
          details: lowValue.details,
          tier: null
        };
      }
    }

    // Default - KEEP (no special flags)
    return {
      verdict: VERDICTS.KEEP,
      reason: 'No special flags',
      details: null,
      tier: tier
    };
  }

  /**
   * Get species key for grouping (name + form)
   */
  function getSpeciesKey(pokemon) {
    const form = pokemon.form || '';
    return `${pokemon.name}|${form}`;
  }

  /**
   * Find best specimen per species (by IV%)
   */
  function findBestPerSpecies(collection) {
    const best = {};

    collection.forEach(pokemon => {
      // Skip special Pokemon from "best" calculation - they're kept anyway
      if (pokemon.isShiny || pokemon.isLucky || pokemon.isFavorite || pokemon.isShadow) {
        return;
      }

      const key = getSpeciesKey(pokemon);
      const ivPercent = calculateIvPercent(pokemon) || 0;

      if (!best[key] || ivPercent > (calculateIvPercent(best[key]) || 0)) {
        best[key] = pokemon;
      }
    });

    return best;
  }

  /**
   * Main triage dispatch - routes to Casual or Optimization mode
   */
  function triagePokemon(pokemon, collection, hasTradePartner = false, mode = 'casual', speciesBest = null) {
    if (mode === 'casual') {
      return triagePokemonCasual(pokemon, collection, speciesBest, hasTradePartner);
    } else {
      return triagePokemonOptimization(pokemon, collection, hasTradePartner);
    }
  }

  /**
   * Triage entire collection
   * @param {Array} pokemonList - List of Pokemon to triage
   * @param {Object} options - Options object
   * @param {boolean} options.hasTradePartner - Whether user has a trade partner
   * @param {string} options.mode - 'casual' or 'optimization' (default: 'casual')
   */
  async function triageCollection(pokemonList, options = {}) {
    const hasTradePartner = options.hasTradePartner || false;
    const mode = options.mode || 'casual';

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

    // For casual mode, pre-calculate best specimen per species
    const speciesBest = mode === 'casual' ? findBestPerSpecies(pokemonList) : null;

    const results = pokemonList.map(pokemon => ({
      ...pokemon,
      triage: triagePokemon(pokemon, pokemonList, hasTradePartner, mode, speciesBest)
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
    getTier: getTier,
    renderTierBadge: renderTierBadge,
    VERDICTS: VERDICTS,
    THRESHOLDS: THRESHOLDS,
    TIER_COLORS: TIER_COLORS
  };

})();
