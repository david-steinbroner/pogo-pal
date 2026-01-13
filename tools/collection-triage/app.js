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

  // Pokemon type lookup (name -> [types])
  var POKEMON_TYPES = {
    'Bulbasaur': ['Grass', 'Poison'], 'Ivysaur': ['Grass', 'Poison'], 'Venusaur': ['Grass', 'Poison'],
    'Charmander': ['Fire'], 'Charmeleon': ['Fire'], 'Charizard': ['Fire', 'Flying'],
    'Squirtle': ['Water'], 'Wartortle': ['Water'], 'Blastoise': ['Water'],
    'Caterpie': ['Bug'], 'Metapod': ['Bug'], 'Butterfree': ['Bug', 'Flying'],
    'Weedle': ['Bug', 'Poison'], 'Kakuna': ['Bug', 'Poison'], 'Beedrill': ['Bug', 'Poison'],
    'Pidgey': ['Normal', 'Flying'], 'Pidgeotto': ['Normal', 'Flying'], 'Pidgeot': ['Normal', 'Flying'],
    'Rattata': ['Normal'], 'Raticate': ['Normal'],
    'Spearow': ['Normal', 'Flying'], 'Fearow': ['Normal', 'Flying'],
    'Ekans': ['Poison'], 'Arbok': ['Poison'],
    'Pikachu': ['Electric'], 'Raichu': ['Electric'],
    'Sandshrew': ['Ground'], 'Sandslash': ['Ground'],
    'Nidoran♀': ['Poison'], 'Nidorina': ['Poison'], 'Nidoqueen': ['Poison', 'Ground'],
    'Nidoran♂': ['Poison'], 'Nidorino': ['Poison'], 'Nidoking': ['Poison', 'Ground'],
    'Clefairy': ['Fairy'], 'Clefable': ['Fairy'],
    'Vulpix': ['Fire'], 'Ninetales': ['Fire'],
    'Jigglypuff': ['Normal', 'Fairy'], 'Wigglytuff': ['Normal', 'Fairy'],
    'Zubat': ['Poison', 'Flying'], 'Golbat': ['Poison', 'Flying'], 'Crobat': ['Poison', 'Flying'],
    'Oddish': ['Grass', 'Poison'], 'Gloom': ['Grass', 'Poison'], 'Vileplume': ['Grass', 'Poison'],
    'Paras': ['Bug', 'Grass'], 'Parasect': ['Bug', 'Grass'],
    'Venonat': ['Bug', 'Poison'], 'Venomoth': ['Bug', 'Poison'],
    'Diglett': ['Ground'], 'Dugtrio': ['Ground'],
    'Meowth': ['Normal'], 'Persian': ['Normal'],
    'Psyduck': ['Water'], 'Golduck': ['Water'],
    'Mankey': ['Fighting'], 'Primeape': ['Fighting'],
    'Growlithe': ['Fire'], 'Arcanine': ['Fire'],
    'Poliwag': ['Water'], 'Poliwhirl': ['Water'], 'Poliwrath': ['Water', 'Fighting'], 'Politoed': ['Water'],
    'Abra': ['Psychic'], 'Kadabra': ['Psychic'], 'Alakazam': ['Psychic'],
    'Machop': ['Fighting'], 'Machoke': ['Fighting'], 'Machamp': ['Fighting'],
    'Bellsprout': ['Grass', 'Poison'], 'Weepinbell': ['Grass', 'Poison'], 'Victreebel': ['Grass', 'Poison'],
    'Tentacool': ['Water', 'Poison'], 'Tentacruel': ['Water', 'Poison'],
    'Geodude': ['Rock', 'Ground'], 'Graveler': ['Rock', 'Ground'], 'Golem': ['Rock', 'Ground'],
    'Ponyta': ['Fire'], 'Rapidash': ['Fire'],
    'Slowpoke': ['Water', 'Psychic'], 'Slowbro': ['Water', 'Psychic'], 'Slowking': ['Water', 'Psychic'],
    'Magnemite': ['Electric', 'Steel'], 'Magneton': ['Electric', 'Steel'], 'Magnezone': ['Electric', 'Steel'],
    "Farfetch'd": ['Normal', 'Flying'],
    'Doduo': ['Normal', 'Flying'], 'Dodrio': ['Normal', 'Flying'],
    'Seel': ['Water'], 'Dewgong': ['Water', 'Ice'],
    'Grimer': ['Poison'], 'Muk': ['Poison'],
    'Shellder': ['Water'], 'Cloyster': ['Water', 'Ice'],
    'Gastly': ['Ghost', 'Poison'], 'Haunter': ['Ghost', 'Poison'], 'Gengar': ['Ghost', 'Poison'],
    'Onix': ['Rock', 'Ground'], 'Steelix': ['Steel', 'Ground'],
    'Drowzee': ['Psychic'], 'Hypno': ['Psychic'],
    'Krabby': ['Water'], 'Kingler': ['Water'],
    'Voltorb': ['Electric'], 'Electrode': ['Electric'],
    'Exeggcute': ['Grass', 'Psychic'], 'Exeggutor': ['Grass', 'Psychic'],
    'Cubone': ['Ground'], 'Marowak': ['Ground'],
    'Hitmonlee': ['Fighting'], 'Hitmonchan': ['Fighting'], 'Hitmontop': ['Fighting'],
    'Lickitung': ['Normal'], 'Lickilicky': ['Normal'],
    'Koffing': ['Poison'], 'Weezing': ['Poison'],
    'Rhyhorn': ['Ground', 'Rock'], 'Rhydon': ['Ground', 'Rock'], 'Rhyperior': ['Ground', 'Rock'],
    'Chansey': ['Normal'], 'Blissey': ['Normal'],
    'Tangela': ['Grass'], 'Tangrowth': ['Grass'],
    'Kangaskhan': ['Normal'],
    'Horsea': ['Water'], 'Seadra': ['Water'], 'Kingdra': ['Water', 'Dragon'],
    'Goldeen': ['Water'], 'Seaking': ['Water'],
    'Staryu': ['Water'], 'Starmie': ['Water', 'Psychic'],
    'Mr. Mime': ['Psychic', 'Fairy'],
    'Scyther': ['Bug', 'Flying'], 'Scizor': ['Bug', 'Steel'],
    'Jynx': ['Ice', 'Psychic'],
    'Electabuzz': ['Electric'], 'Electivire': ['Electric'],
    'Magmar': ['Fire'], 'Magmortar': ['Fire'],
    'Pinsir': ['Bug'],
    'Tauros': ['Normal'],
    'Magikarp': ['Water'], 'Gyarados': ['Water', 'Flying'],
    'Lapras': ['Water', 'Ice'],
    'Ditto': ['Normal'],
    'Eevee': ['Normal'], 'Vaporeon': ['Water'], 'Jolteon': ['Electric'], 'Flareon': ['Fire'],
    'Espeon': ['Psychic'], 'Umbreon': ['Dark'], 'Leafeon': ['Grass'], 'Glaceon': ['Ice'], 'Sylveon': ['Fairy'],
    'Porygon': ['Normal'], 'Porygon2': ['Normal'], 'Porygon-Z': ['Normal'],
    'Omanyte': ['Rock', 'Water'], 'Omastar': ['Rock', 'Water'],
    'Kabuto': ['Rock', 'Water'], 'Kabutops': ['Rock', 'Water'],
    'Aerodactyl': ['Rock', 'Flying'],
    'Snorlax': ['Normal'], 'Munchlax': ['Normal'],
    'Articuno': ['Ice', 'Flying'], 'Zapdos': ['Electric', 'Flying'], 'Moltres': ['Fire', 'Flying'],
    'Dratini': ['Dragon'], 'Dragonair': ['Dragon'], 'Dragonite': ['Dragon', 'Flying'],
    'Mewtwo': ['Psychic'], 'Mew': ['Psychic'],
    // Gen 2
    'Chikorita': ['Grass'], 'Bayleef': ['Grass'], 'Meganium': ['Grass'],
    'Cyndaquil': ['Fire'], 'Quilava': ['Fire'], 'Typhlosion': ['Fire'],
    'Totodile': ['Water'], 'Croconaw': ['Water'], 'Feraligatr': ['Water'],
    'Sentret': ['Normal'], 'Furret': ['Normal'],
    'Hoothoot': ['Normal', 'Flying'], 'Noctowl': ['Normal', 'Flying'],
    'Ledyba': ['Bug', 'Flying'], 'Ledian': ['Bug', 'Flying'],
    'Spinarak': ['Bug', 'Poison'], 'Ariados': ['Bug', 'Poison'],
    'Chinchou': ['Water', 'Electric'], 'Lanturn': ['Water', 'Electric'],
    'Pichu': ['Electric'], 'Cleffa': ['Fairy'], 'Igglybuff': ['Normal', 'Fairy'],
    'Togepi': ['Fairy'], 'Togetic': ['Fairy', 'Flying'], 'Togekiss': ['Fairy', 'Flying'],
    'Natu': ['Psychic', 'Flying'], 'Xatu': ['Psychic', 'Flying'],
    'Mareep': ['Electric'], 'Flaaffy': ['Electric'], 'Ampharos': ['Electric'],
    'Bellossom': ['Grass'],
    'Marill': ['Water', 'Fairy'], 'Azumarill': ['Water', 'Fairy'], 'Azurill': ['Normal', 'Fairy'],
    'Sudowoodo': ['Rock'], 'Bonsly': ['Rock'],
    'Hoppip': ['Grass', 'Flying'], 'Skiploom': ['Grass', 'Flying'], 'Jumpluff': ['Grass', 'Flying'],
    'Aipom': ['Normal'], 'Ambipom': ['Normal'],
    'Sunkern': ['Grass'], 'Sunflora': ['Grass'],
    'Yanma': ['Bug', 'Flying'], 'Yanmega': ['Bug', 'Flying'],
    'Wooper': ['Water', 'Ground'], 'Quagsire': ['Water', 'Ground'],
    'Murkrow': ['Dark', 'Flying'], 'Honchkrow': ['Dark', 'Flying'],
    'Misdreavus': ['Ghost'], 'Mismagius': ['Ghost'],
    'Unown': ['Psychic'],
    'Wobbuffet': ['Psychic'], 'Wynaut': ['Psychic'],
    'Girafarig': ['Normal', 'Psychic'],
    'Pineco': ['Bug'], 'Forretress': ['Bug', 'Steel'],
    'Dunsparce': ['Normal'],
    'Gligar': ['Ground', 'Flying'], 'Gliscor': ['Ground', 'Flying'],
    'Snubbull': ['Fairy'], 'Granbull': ['Fairy'],
    'Qwilfish': ['Water', 'Poison'],
    'Shuckle': ['Bug', 'Rock'],
    'Heracross': ['Bug', 'Fighting'],
    'Sneasel': ['Dark', 'Ice'], 'Weavile': ['Dark', 'Ice'],
    'Teddiursa': ['Normal'], 'Ursaring': ['Normal'],
    'Slugma': ['Fire'], 'Magcargo': ['Fire', 'Rock'],
    'Swinub': ['Ice', 'Ground'], 'Piloswine': ['Ice', 'Ground'], 'Mamoswine': ['Ice', 'Ground'],
    'Corsola': ['Water', 'Rock'],
    'Remoraid': ['Water'], 'Octillery': ['Water'],
    'Delibird': ['Ice', 'Flying'],
    'Mantine': ['Water', 'Flying'], 'Mantyke': ['Water', 'Flying'],
    'Skarmory': ['Steel', 'Flying'],
    'Houndour': ['Dark', 'Fire'], 'Houndoom': ['Dark', 'Fire'],
    'Phanpy': ['Ground'], 'Donphan': ['Ground'],
    'Stantler': ['Normal'],
    'Smeargle': ['Normal'],
    'Tyrogue': ['Fighting'],
    'Smoochum': ['Ice', 'Psychic'],
    'Elekid': ['Electric'],
    'Magby': ['Fire'],
    'Miltank': ['Normal'],
    'Raikou': ['Electric'], 'Entei': ['Fire'], 'Suicune': ['Water'],
    'Larvitar': ['Rock', 'Ground'], 'Pupitar': ['Rock', 'Ground'], 'Tyranitar': ['Rock', 'Dark'],
    'Lugia': ['Psychic', 'Flying'], 'Ho-Oh': ['Fire', 'Flying'],
    'Celebi': ['Psychic', 'Grass'],
    // Gen 3
    'Treecko': ['Grass'], 'Grovyle': ['Grass'], 'Sceptile': ['Grass'],
    'Torchic': ['Fire'], 'Combusken': ['Fire', 'Fighting'], 'Blaziken': ['Fire', 'Fighting'],
    'Mudkip': ['Water'], 'Marshtomp': ['Water', 'Ground'], 'Swampert': ['Water', 'Ground'],
    'Poochyena': ['Dark'], 'Mightyena': ['Dark'],
    'Zigzagoon': ['Normal'], 'Linoone': ['Normal'],
    'Wurmple': ['Bug'], 'Silcoon': ['Bug'], 'Beautifly': ['Bug', 'Flying'], 'Cascoon': ['Bug'], 'Dustox': ['Bug', 'Poison'],
    'Lotad': ['Water', 'Grass'], 'Lombre': ['Water', 'Grass'], 'Ludicolo': ['Water', 'Grass'],
    'Seedot': ['Grass'], 'Nuzleaf': ['Grass', 'Dark'], 'Shiftry': ['Grass', 'Dark'],
    'Taillow': ['Normal', 'Flying'], 'Swellow': ['Normal', 'Flying'],
    'Wingull': ['Water', 'Flying'], 'Pelipper': ['Water', 'Flying'],
    'Ralts': ['Psychic', 'Fairy'], 'Kirlia': ['Psychic', 'Fairy'], 'Gardevoir': ['Psychic', 'Fairy'], 'Gallade': ['Psychic', 'Fighting'],
    'Surskit': ['Bug', 'Water'], 'Masquerain': ['Bug', 'Flying'],
    'Shroomish': ['Grass'], 'Breloom': ['Grass', 'Fighting'],
    'Slakoth': ['Normal'], 'Vigoroth': ['Normal'], 'Slaking': ['Normal'],
    'Nincada': ['Bug', 'Ground'], 'Ninjask': ['Bug', 'Flying'], 'Shedinja': ['Bug', 'Ghost'],
    'Whismur': ['Normal'], 'Loudred': ['Normal'], 'Exploud': ['Normal'],
    'Makuhita': ['Fighting'], 'Hariyama': ['Fighting'],
    'Nosepass': ['Rock'], 'Probopass': ['Rock', 'Steel'],
    'Skitty': ['Normal'], 'Delcatty': ['Normal'],
    'Sableye': ['Dark', 'Ghost'],
    'Mawile': ['Steel', 'Fairy'],
    'Aron': ['Steel', 'Rock'], 'Lairon': ['Steel', 'Rock'], 'Aggron': ['Steel', 'Rock'],
    'Meditite': ['Fighting', 'Psychic'], 'Medicham': ['Fighting', 'Psychic'],
    'Electrike': ['Electric'], 'Manectric': ['Electric'],
    'Plusle': ['Electric'], 'Minun': ['Electric'],
    'Volbeat': ['Bug'], 'Illumise': ['Bug'],
    'Roselia': ['Grass', 'Poison'], 'Roserade': ['Grass', 'Poison'], 'Budew': ['Grass', 'Poison'],
    'Gulpin': ['Poison'], 'Swalot': ['Poison'],
    'Carvanha': ['Water', 'Dark'], 'Sharpedo': ['Water', 'Dark'],
    'Wailmer': ['Water'], 'Wailord': ['Water'],
    'Numel': ['Fire', 'Ground'], 'Camerupt': ['Fire', 'Ground'],
    'Torkoal': ['Fire'],
    'Spoink': ['Psychic'], 'Grumpig': ['Psychic'],
    'Spinda': ['Normal'],
    'Trapinch': ['Ground'], 'Vibrava': ['Ground', 'Dragon'], 'Flygon': ['Ground', 'Dragon'],
    'Cacnea': ['Grass'], 'Cacturne': ['Grass', 'Dark'],
    'Swablu': ['Normal', 'Flying'], 'Altaria': ['Dragon', 'Flying'],
    'Zangoose': ['Normal'], 'Seviper': ['Poison'],
    'Lunatone': ['Rock', 'Psychic'], 'Solrock': ['Rock', 'Psychic'],
    'Barboach': ['Water', 'Ground'], 'Whiscash': ['Water', 'Ground'],
    'Corphish': ['Water'], 'Crawdaunt': ['Water', 'Dark'],
    'Baltoy': ['Ground', 'Psychic'], 'Claydol': ['Ground', 'Psychic'],
    'Lileep': ['Rock', 'Grass'], 'Cradily': ['Rock', 'Grass'],
    'Anorith': ['Rock', 'Bug'], 'Armaldo': ['Rock', 'Bug'],
    'Feebas': ['Water'], 'Milotic': ['Water'],
    'Castform': ['Normal'],
    'Kecleon': ['Normal'],
    'Shuppet': ['Ghost'], 'Banette': ['Ghost'],
    'Duskull': ['Ghost'], 'Dusclops': ['Ghost'], 'Dusknoir': ['Ghost'],
    'Tropius': ['Grass', 'Flying'],
    'Chimecho': ['Psychic'], 'Chingling': ['Psychic'],
    'Absol': ['Dark'],
    'Snorunt': ['Ice'], 'Glalie': ['Ice'], 'Froslass': ['Ice', 'Ghost'],
    'Spheal': ['Ice', 'Water'], 'Sealeo': ['Ice', 'Water'], 'Walrein': ['Ice', 'Water'],
    'Clamperl': ['Water'], 'Huntail': ['Water'], 'Gorebyss': ['Water'],
    'Relicanth': ['Water', 'Rock'],
    'Luvdisc': ['Water'],
    'Bagon': ['Dragon'], 'Shelgon': ['Dragon'], 'Salamence': ['Dragon', 'Flying'],
    'Beldum': ['Steel', 'Psychic'], 'Metang': ['Steel', 'Psychic'], 'Metagross': ['Steel', 'Psychic'],
    'Regirock': ['Rock'], 'Regice': ['Ice'], 'Registeel': ['Steel'],
    'Latias': ['Dragon', 'Psychic'], 'Latios': ['Dragon', 'Psychic'],
    'Kyogre': ['Water'], 'Groudon': ['Ground'], 'Rayquaza': ['Dragon', 'Flying'],
    'Jirachi': ['Steel', 'Psychic'], 'Deoxys': ['Psychic'],
    // Gen 4
    'Turtwig': ['Grass'], 'Grotle': ['Grass'], 'Torterra': ['Grass', 'Ground'],
    'Chimchar': ['Fire'], 'Monferno': ['Fire', 'Fighting'], 'Infernape': ['Fire', 'Fighting'],
    'Piplup': ['Water'], 'Prinplup': ['Water'], 'Empoleon': ['Water', 'Steel'],
    'Starly': ['Normal', 'Flying'], 'Staravia': ['Normal', 'Flying'], 'Staraptor': ['Normal', 'Flying'],
    'Bidoof': ['Normal'], 'Bibarel': ['Normal', 'Water'],
    'Kricketot': ['Bug'], 'Kricketune': ['Bug'],
    'Shinx': ['Electric'], 'Luxio': ['Electric'], 'Luxray': ['Electric'],
    'Cranidos': ['Rock'], 'Rampardos': ['Rock'],
    'Shieldon': ['Rock', 'Steel'], 'Bastiodon': ['Rock', 'Steel'],
    'Burmy': ['Bug'], 'Wormadam': ['Bug', 'Grass'], 'Mothim': ['Bug', 'Flying'],
    'Combee': ['Bug', 'Flying'], 'Vespiquen': ['Bug', 'Flying'],
    'Pachirisu': ['Electric'],
    'Buizel': ['Water'], 'Floatzel': ['Water'],
    'Cherubi': ['Grass'], 'Cherrim': ['Grass'],
    'Shellos': ['Water'], 'Gastrodon': ['Water', 'Ground'],
    'Drifloon': ['Ghost', 'Flying'], 'Drifblim': ['Ghost', 'Flying'],
    'Buneary': ['Normal'], 'Lopunny': ['Normal'],
    'Glameow': ['Normal'], 'Purugly': ['Normal'],
    'Stunky': ['Poison', 'Dark'], 'Skuntank': ['Poison', 'Dark'],
    'Bronzor': ['Steel', 'Psychic'], 'Bronzong': ['Steel', 'Psychic'],
    'Mime Jr.': ['Psychic', 'Fairy'],
    'Happiny': ['Normal'],
    'Chatot': ['Normal', 'Flying'],
    'Spiritomb': ['Ghost', 'Dark'],
    'Gible': ['Dragon', 'Ground'], 'Gabite': ['Dragon', 'Ground'], 'Garchomp': ['Dragon', 'Ground'],
    'Riolu': ['Fighting'], 'Lucario': ['Fighting', 'Steel'],
    'Hippopotas': ['Ground'], 'Hippowdon': ['Ground'],
    'Skorupi': ['Poison', 'Bug'], 'Drapion': ['Poison', 'Dark'],
    'Croagunk': ['Poison', 'Fighting'], 'Toxicroak': ['Poison', 'Fighting'],
    'Carnivine': ['Grass'],
    'Finneon': ['Water'], 'Lumineon': ['Water'],
    'Snover': ['Grass', 'Ice'], 'Abomasnow': ['Grass', 'Ice'],
    'Rotom': ['Electric', 'Ghost'],
    'Uxie': ['Psychic'], 'Mesprit': ['Psychic'], 'Azelf': ['Psychic'],
    'Dialga': ['Steel', 'Dragon'], 'Palkia': ['Water', 'Dragon'],
    'Heatran': ['Fire', 'Steel'],
    'Regigigas': ['Normal'],
    'Giratina': ['Ghost', 'Dragon'],
    'Cresselia': ['Psychic'],
    'Phione': ['Water'], 'Manaphy': ['Water'],
    'Darkrai': ['Dark'],
    'Shaymin': ['Grass'],
    'Arceus': ['Normal'],
    // Gen 5+
    'Victini': ['Psychic', 'Fire'],
    'Snivy': ['Grass'], 'Servine': ['Grass'], 'Serperior': ['Grass'],
    'Tepig': ['Fire'], 'Pignite': ['Fire', 'Fighting'], 'Emboar': ['Fire', 'Fighting'],
    'Oshawott': ['Water'], 'Dewott': ['Water'], 'Samurott': ['Water'],
    'Lillipup': ['Normal'], 'Herdier': ['Normal'], 'Stoutland': ['Normal'],
    'Purrloin': ['Dark'], 'Liepard': ['Dark'],
    'Pansage': ['Grass'], 'Simisage': ['Grass'],
    'Pansear': ['Fire'], 'Simisear': ['Fire'],
    'Panpour': ['Water'], 'Simipour': ['Water'],
    'Munna': ['Psychic'], 'Musharna': ['Psychic'],
    'Pidove': ['Normal', 'Flying'], 'Tranquill': ['Normal', 'Flying'], 'Unfezant': ['Normal', 'Flying'],
    'Blitzle': ['Electric'], 'Zebstrika': ['Electric'],
    'Roggenrola': ['Rock'], 'Boldore': ['Rock'], 'Gigalith': ['Rock'],
    'Woobat': ['Psychic', 'Flying'], 'Swoobat': ['Psychic', 'Flying'],
    'Drilbur': ['Ground'], 'Excadrill': ['Ground', 'Steel'],
    'Audino': ['Normal'],
    'Timburr': ['Fighting'], 'Gurdurr': ['Fighting'], 'Conkeldurr': ['Fighting'],
    'Tympole': ['Water'], 'Palpitoad': ['Water', 'Ground'], 'Seismitoad': ['Water', 'Ground'],
    'Throh': ['Fighting'], 'Sawk': ['Fighting'],
    'Sewaddle': ['Bug', 'Grass'], 'Swadloon': ['Bug', 'Grass'], 'Leavanny': ['Bug', 'Grass'],
    'Venipede': ['Bug', 'Poison'], 'Whirlipede': ['Bug', 'Poison'], 'Scolipede': ['Bug', 'Poison'],
    'Cottonee': ['Grass', 'Fairy'], 'Whimsicott': ['Grass', 'Fairy'],
    'Petilil': ['Grass'], 'Lilligant': ['Grass'],
    'Basculin': ['Water'],
    'Sandile': ['Ground', 'Dark'], 'Krokorok': ['Ground', 'Dark'], 'Krookodile': ['Ground', 'Dark'],
    'Darumaka': ['Fire'], 'Darmanitan': ['Fire'],
    'Maractus': ['Grass'],
    'Dwebble': ['Bug', 'Rock'], 'Crustle': ['Bug', 'Rock'],
    'Scraggy': ['Dark', 'Fighting'], 'Scrafty': ['Dark', 'Fighting'],
    'Sigilyph': ['Psychic', 'Flying'],
    'Yamask': ['Ghost'], 'Cofagrigus': ['Ghost'],
    'Tirtouga': ['Water', 'Rock'], 'Carracosta': ['Water', 'Rock'],
    'Archen': ['Rock', 'Flying'], 'Archeops': ['Rock', 'Flying'],
    'Trubbish': ['Poison'], 'Garbodor': ['Poison'],
    'Zorua': ['Dark'], 'Zoroark': ['Dark'],
    'Minccino': ['Normal'], 'Cinccino': ['Normal'],
    'Gothita': ['Psychic'], 'Gothorita': ['Psychic'], 'Gothitelle': ['Psychic'],
    'Solosis': ['Psychic'], 'Duosion': ['Psychic'], 'Reuniclus': ['Psychic'],
    'Ducklett': ['Water', 'Flying'], 'Swanna': ['Water', 'Flying'],
    'Vanillite': ['Ice'], 'Vanillish': ['Ice'], 'Vanilluxe': ['Ice'],
    'Deerling': ['Normal', 'Grass'], 'Sawsbuck': ['Normal', 'Grass'],
    'Emolga': ['Electric', 'Flying'],
    'Karrablast': ['Bug'], 'Escavalier': ['Bug', 'Steel'],
    'Foongus': ['Grass', 'Poison'], 'Amoonguss': ['Grass', 'Poison'],
    'Frillish': ['Water', 'Ghost'], 'Jellicent': ['Water', 'Ghost'],
    'Alomomola': ['Water'],
    'Joltik': ['Bug', 'Electric'], 'Galvantula': ['Bug', 'Electric'],
    'Ferroseed': ['Grass', 'Steel'], 'Ferrothorn': ['Grass', 'Steel'],
    'Klink': ['Steel'], 'Klang': ['Steel'], 'Klinklang': ['Steel'],
    'Tynamo': ['Electric'], 'Eelektrik': ['Electric'], 'Eelektross': ['Electric'],
    'Elgyem': ['Psychic'], 'Beheeyem': ['Psychic'],
    'Litwick': ['Ghost', 'Fire'], 'Lampent': ['Ghost', 'Fire'], 'Chandelure': ['Ghost', 'Fire'],
    'Axew': ['Dragon'], 'Fraxure': ['Dragon'], 'Haxorus': ['Dragon'],
    'Cubchoo': ['Ice'], 'Beartic': ['Ice'],
    'Cryogonal': ['Ice'],
    'Shelmet': ['Bug'], 'Accelgor': ['Bug'],
    'Stunfisk': ['Ground', 'Electric'],
    'Mienfoo': ['Fighting'], 'Mienshao': ['Fighting'],
    'Druddigon': ['Dragon'],
    'Golett': ['Ground', 'Ghost'], 'Golurk': ['Ground', 'Ghost'],
    'Pawniard': ['Dark', 'Steel'], 'Bisharp': ['Dark', 'Steel'],
    'Bouffalant': ['Normal'],
    'Rufflet': ['Normal', 'Flying'], 'Braviary': ['Normal', 'Flying'],
    'Vullaby': ['Dark', 'Flying'], 'Mandibuzz': ['Dark', 'Flying'],
    'Heatmor': ['Fire'],
    'Durant': ['Bug', 'Steel'],
    'Deino': ['Dark', 'Dragon'], 'Zweilous': ['Dark', 'Dragon'], 'Hydreigon': ['Dark', 'Dragon'],
    'Larvesta': ['Bug', 'Fire'], 'Volcarona': ['Bug', 'Fire'],
    'Cobalion': ['Steel', 'Fighting'], 'Terrakion': ['Rock', 'Fighting'], 'Virizion': ['Grass', 'Fighting'],
    'Tornadus': ['Flying'], 'Thundurus': ['Electric', 'Flying'], 'Landorus': ['Ground', 'Flying'],
    'Reshiram': ['Dragon', 'Fire'], 'Zekrom': ['Dragon', 'Electric'], 'Kyurem': ['Dragon', 'Ice'],
    'Keldeo': ['Water', 'Fighting'],
    'Meloetta': ['Normal', 'Psychic'],
    'Genesect': ['Bug', 'Steel'],
    // Regional forms
    'Rattata (Alola)': ['Dark', 'Normal'], 'Raticate (Alola)': ['Dark', 'Normal'],
    'Raichu (Alola)': ['Electric', 'Psychic'],
    'Sandshrew (Alola)': ['Ice', 'Steel'], 'Sandslash (Alola)': ['Ice', 'Steel'],
    'Vulpix (Alola)': ['Ice'], 'Ninetales (Alola)': ['Ice', 'Fairy'],
    'Diglett (Alola)': ['Ground', 'Steel'], 'Dugtrio (Alola)': ['Ground', 'Steel'],
    'Meowth (Alola)': ['Dark'], 'Persian (Alola)': ['Dark'],
    'Geodude (Alola)': ['Rock', 'Electric'], 'Graveler (Alola)': ['Rock', 'Electric'], 'Golem (Alola)': ['Rock', 'Electric'],
    'Grimer (Alola)': ['Poison', 'Dark'], 'Muk (Alola)': ['Poison', 'Dark'],
    'Exeggutor (Alola)': ['Grass', 'Dragon'],
    'Marowak (Alola)': ['Fire', 'Ghost'],
    'Ponyta (Galar)': ['Psychic'], 'Rapidash (Galar)': ['Psychic', 'Fairy'],
    'Slowpoke (Galar)': ['Psychic'], 'Slowbro (Galar)': ['Poison', 'Psychic'], 'Slowking (Galar)': ['Poison', 'Psychic'],
    "Farfetch'd (Galar)": ['Fighting'],
    'Weezing (Galar)': ['Poison', 'Fairy'],
    'Mr. Mime (Galar)': ['Ice', 'Psychic'],
    'Articuno (Galar)': ['Psychic', 'Flying'], 'Zapdos (Galar)': ['Fighting', 'Flying'], 'Moltres (Galar)': ['Dark', 'Flying'],
    'Corsola (Galar)': ['Ghost'],
    'Zigzagoon (Galar)': ['Dark', 'Normal'], 'Linoone (Galar)': ['Dark', 'Normal'], 'Obstagoon': ['Dark', 'Normal'],
    'Darumaka (Galar)': ['Ice'], 'Darmanitan (Galar)': ['Ice'],
    'Yamask (Galar)': ['Ground', 'Ghost'], 'Runerigus': ['Ground', 'Ghost'],
    'Stunfisk (Galar)': ['Ground', 'Steel'],
    'Growlithe (Hisui)': ['Fire', 'Rock'], 'Arcanine (Hisui)': ['Fire', 'Rock'],
    'Voltorb (Hisui)': ['Electric', 'Grass'], 'Electrode (Hisui)': ['Electric', 'Grass'],
    'Typhlosion (Hisui)': ['Fire', 'Ghost'],
    'Qwilfish (Hisui)': ['Dark', 'Poison'], 'Overqwil': ['Dark', 'Poison'],
    'Sneasel (Hisui)': ['Fighting', 'Poison'], 'Sneasler': ['Fighting', 'Poison'],
    'Samurott (Hisui)': ['Water', 'Dark'],
    'Lilligant (Hisui)': ['Grass', 'Fighting'],
    'Zorua (Hisui)': ['Normal', 'Ghost'], 'Zoroark (Hisui)': ['Normal', 'Ghost'],
    'Braviary (Hisui)': ['Psychic', 'Flying'],
    'Sliggoo (Hisui)': ['Steel', 'Dragon'], 'Goodra (Hisui)': ['Steel', 'Dragon'],
    'Avalugg (Hisui)': ['Ice', 'Rock'],
    'Decidueye (Hisui)': ['Grass', 'Fighting'],
  };

  // Helper function to get Pokemon types
  function getPokemonTypes(name, form) {
    // Try form-specific key first
    if (form && form !== 'Normal') {
      var formKey = name + ' (' + form + ')';
      if (POKEMON_TYPES[formKey]) {
        return POKEMON_TYPES[formKey];
      }
    }
    // Fall back to base name, or 'Unknown' if not found
    return POKEMON_TYPES[name] || ['Unknown'];
  }

  // Column configuration for table
  var DEFAULT_COLUMNS = [
    { id: 'pokemon', label: 'Pokemon', locked: true, visible: true },
    { id: 'type', label: 'Type', locked: false, visible: true },
    { id: 'tier', label: 'Tier', locked: false, visible: true },
    { id: 'league', label: 'League', locked: false, visible: true },
    { id: 'cp', label: 'CP', locked: false, visible: true },
    { id: 'ivs', label: 'IVs', locked: false, visible: true },
    { id: 'verdict', label: 'Verdict', locked: false, visible: true },
    { id: 'why', label: 'Why?', locked: false, visible: true }
  ];

  var columnConfig = loadColumnConfig();

  function loadColumnConfig() {
    var saved = localStorage.getItem('pokemonColumnConfig');
    if (saved) {
      try {
        var parsed = JSON.parse(saved);
        // Validate and merge with defaults to handle new columns
        return mergeColumnConfig(parsed);
      } catch (e) {
        return JSON.parse(JSON.stringify(DEFAULT_COLUMNS));
      }
    }
    return JSON.parse(JSON.stringify(DEFAULT_COLUMNS));
  }

  function mergeColumnConfig(saved) {
    // Ensure all default columns exist in saved config
    var result = [];
    var savedIds = saved.map(function(c) { return c.id; });

    // First, add saved columns that still exist in defaults
    saved.forEach(function(col) {
      var defaultCol = DEFAULT_COLUMNS.find(function(d) { return d.id === col.id; });
      if (defaultCol) {
        result.push({
          id: col.id,
          label: defaultCol.label,
          locked: defaultCol.locked,
          visible: col.visible
        });
      }
    });

    // Then add any new default columns that weren't in saved
    DEFAULT_COLUMNS.forEach(function(defaultCol) {
      if (savedIds.indexOf(defaultCol.id) === -1) {
        result.push(JSON.parse(JSON.stringify(defaultCol)));
      }
    });

    return result;
  }

  function saveColumnConfig() {
    localStorage.setItem('pokemonColumnConfig', JSON.stringify(columnConfig));
  }

  function getVisibleColumns() {
    return columnConfig.filter(function(c) { return c.visible; });
  }

  // Initialize on DOM ready
  document.addEventListener('DOMContentLoaded', function() {
    initUploadButton();
    initNewUploadButton();
    initFilters();
    initPvpFilters();
    initFiltersToggle();
    initCardFilters();
    initSegmentedControl();
    initSortableHeaders();
    initTeamFilters();
    initTradeToggle();
    initModeSelector();
    initColumnSettings();
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
  function showResultsView(pokemonCount) {
    var container = document.getElementById('appContainer');
    var headerStatus = document.getElementById('headerStatus');

    // Update status text
    if (headerStatus && pokemonCount) {
      headerStatus.textContent = pokemonCount + ' Pokémon loaded';
    }

    // Transition to post-upload state
    container.classList.remove('pre-upload');
    container.classList.add('post-upload');

    // Scroll to top to ensure user sees results from the beginning
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function resetToUpload() {
    var container = document.getElementById('appContainer');

    // Clear any existing data
    currentResults = null;
    currentParsedPokemon = null;
    currentFilename = '';

    // Reset file input
    var fileInput = document.getElementById('fileInput');
    if (fileInput) fileInput.value = '';

    // Reset search input
    var searchInput = document.getElementById('searchInput');
    if (searchInput) searchInput.value = '';

    // Reset trade toggle
    var tradeToggle = document.getElementById('tradeToggle');
    if (tradeToggle) tradeToggle.checked = false;
    hasTradePartner = false;

    // Reset mode to casual
    currentMode = 'casual';
    var modeSelector = document.getElementById('modeSelector');
    if (modeSelector) modeSelector.textContent = 'Casual';

    // Reset segment to transfer-trade
    var segmentBtns = document.querySelectorAll('.segment-btn');
    segmentBtns.forEach(function(btn) {
      btn.classList.toggle('active', btn.dataset.segment === 'transfer-trade');
    });

    // Clear card selections
    document.querySelectorAll('.summary-card.selected').forEach(function(card) {
      card.classList.remove('selected');
    });

    // Clear status
    setStatus('', '');

    // Transition back to pre-upload state
    container.classList.remove('post-upload');
    container.classList.add('pre-upload');
  }

  function initNewUploadButton() {
    var btn = document.getElementById('newUploadBtn');
    if (btn) {
      btn.addEventListener('click', resetToUpload);
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
    // Switch from landing to results view (pass pokemon count for header status)
    showResultsView(results.pokemon.length);

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

  function renderTable(pokemon, filter, opponentTypes, teamFilters) {
    filter = filter || 'all';
    opponentTypes = opponentTypes || [];
    teamFilters = teamFilters || {};
    const tbody = document.getElementById('resultsBody');

    // Render table headers based on column config
    renderTableHeaders();

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

    // Calculate effectiveness for each Pokemon if opponent types are selected
    if (opponentTypes.length > 0) {
      filtered = filtered.map(function(p) {
        // Check if effective against ANY of the selected opponent types
        var isEffective = opponentTypes.some(function(type) {
          return PogoTriage.getEffectivenessAgainst(p, type);
        });
        return {
          ...p,
          _effectiveness: isEffective
        };
      });
    }

    // Sort: use custom sort if active, otherwise use default verdict-based sort
    if (currentSort.column) {
      filtered = sortPokemon(filtered);
    } else {
      filtered = sortByVerdict(filtered, filter);
    }

    // If opponent types are selected, sort super effective to top (after verdict sort)
    if (opponentTypes.length > 0) {
      filtered = filtered.slice().sort(function(a, b) {
        var aEffective = a._effectiveness ? 1 : 0;
        var bEffective = b._effectiveness ? 1 : 0;
        return bEffective - aEffective; // Super effective first
      });
    }

    // Build table rows
    tbody.innerHTML = filtered.map(function(p) {
      return renderRow(p, opponentTypes);
    }).join('');

    // Show empty state if needed
    if (filtered.length === 0) {
      var visibleCount = getVisibleColumns().length;
      tbody.innerHTML = '<tr><td colspan="' + visibleCount + '" class="empty-state">' + getEmptyStateMessage(filter) + '</td></tr>';
    }
  }

  function renderTableHeaders() {
    var thead = document.querySelector('#resultsTable thead tr');
    if (!thead) return;

    var visibleColumns = getVisibleColumns();

    // Column sort data and CSS classes
    var columnMeta = {
      'pokemon': { sort: 'name', sortable: true },
      'type': { sort: null, sortable: false },
      'tier': { sort: 'tier', sortable: true },
      'league': { sort: 'cp', sortable: true },
      'cp': { sort: 'cp', sortable: true },
      'ivs': { sort: 'ivPercent', sortable: true },
      'verdict': { sort: 'verdict', sortable: true },
      'why': { sort: null, sortable: false }
    };

    thead.innerHTML = visibleColumns.map(function(col) {
      var meta = columnMeta[col.id] || { sortable: false };
      var classes = ['col-' + col.id];
      if (meta.sortable) classes.push('sortable');

      var sortIndicator = meta.sortable ? '<span class="sort-indicator"></span>' : '';
      var sortAttr = meta.sort ? ' data-sort="' + meta.sort + '"' : '';

      return '<th class="' + classes.join(' ') + '"' + sortAttr + '>' + col.label + sortIndicator + '</th>';
    }).join('');

    // Re-attach sort handlers
    initSortableHeaders();
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

  function renderRow(pokemon, opponentTypes) {
    opponentTypes = opponentTypes || [];
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

    // Check effectiveness (use cached value if available, or check against any opponent type)
    var effectiveness = pokemon._effectiveness;
    if (!effectiveness && opponentTypes.length > 0) {
      effectiveness = opponentTypes.some(function(type) {
        return PogoTriage.getEffectivenessAgainst(pokemon, type);
      });
    }
    var effectivenessBadge = '';
    if (effectiveness) {
      effectivenessBadge = ' <span class="effectiveness-badge">Super Effective</span>';
    }

    // Render league eligibility badges
    var leagueBadges = renderLeagueBadges(pokemon.cp || 0);

    // Get Pokemon types
    var types = getPokemonTypes(pokemon.name, pokemon.form);
    var typeDisplay = types ? types.join(' / ') : '';

    // Get visible columns and render cells dynamically
    var visibleColumns = getVisibleColumns();
    var cells = visibleColumns.map(function(col) {
      switch (col.id) {
        case 'pokemon':
          return '<td class="col-pokemon">' +
            '<strong>' + pokemonName + '</strong>' + formStr +
            badges +
          '</td>';
        case 'type':
          return '<td class="col-type">' + typeDisplay + '</td>';
        case 'tier':
          return '<td class="col-tier">' + tierBadge + '</td>';
        case 'league':
          return '<td class="col-league">' + leagueBadges + '</td>';
        case 'cp':
          return '<td class="col-cp">' + (pokemon.cp || '?') + '</td>';
        case 'ivs':
          return '<td class="col-ivs">' + ivStr + '</td>';
        case 'verdict':
          return '<td class="col-verdict">' +
            '<span class="verdict verdict-' + verdictClass + '">' +
              verdictDisplay.icon + ' ' + verdictDisplay.label +
            '</span>' +
          '</td>';
        case 'why':
          return '<td class="col-why">' +
            '<span class="reason">' + escapeHtml(pokemon.triage.reason) + '</span>' +
            effectivenessBadge +
            (escapedDetails ? '<button class="details-btn" onclick="showDetails(\'' + pokemonName + '\', \'' + escapedDetails.replace(/'/g, "\\'") + '\')">?</button>' : '') +
          '</td>';
        default:
          return '<td>-</td>';
      }
    }).join('');

    return '<tr data-verdict="' + verdict + '" data-name="' + pokemonName.toLowerCase() + '" data-tier="' + (tier || '') + '">' +
      cells +
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
    var pvpFiltersRow = document.getElementById('pvpFiltersRow');
    if (!teamFilters) return;

    var currentSegment = document.querySelector('.segment-btn.active');
    var segment = currentSegment ? currentSegment.dataset.segment : '';
    var selectedCard = document.querySelector('.summary-card.selected');

    // Show filters on My Teams tab when any card is selected
    if (segment === 'my-teams' && selectedCard) {
      teamFilters.hidden = false;

      // Show League/CP only for PvP, hide for Raiders
      var isPvP = selectedCard.dataset.filter === 'TOP_PVP';
      if (pvpFiltersRow) {
        pvpFiltersRow.hidden = !isPvP;
      }
    } else {
      teamFilters.hidden = true;
      if (pvpFiltersRow) {
        pvpFiltersRow.hidden = true;
      }
      resetTeamFilters();
    }
  }

  // Reset team filters to default state
  function resetTeamFilters() {
    var leagueSelect = document.getElementById('filterLeague');
    var maxCPSelect = document.getElementById('filterMaxCP');

    if (leagueSelect) leagueSelect.value = '';
    if (maxCPSelect) maxCPSelect.value = '';

    // Reset type filter checkboxes
    document.querySelectorAll('#typeFilterDropdown .popup-checkbox input').forEach(function(cb) {
      cb.checked = false;
    });
    updateTypeFilterButtonText();

    // Reset fighting against checkboxes
    document.querySelectorAll('#fightingAgainstDropdown .popup-checkbox input').forEach(function(cb) {
      cb.checked = false;
    });
    updateFightingAgainstButtonText();

    // Close any open popups
    var typeDropdown = document.getElementById('typeFilterDropdown');
    var fightingDropdown = document.getElementById('fightingAgainstDropdown');
    if (typeDropdown) typeDropdown.hidden = true;
    if (fightingDropdown) fightingDropdown.hidden = true;
  }

  // Update type filter button text based on selections
  function updateTypeFilterButtonText() {
    var typeCheckboxes = document.querySelectorAll('#typeFilterDropdown .popup-checkbox input:checked');
    var typeFilterBtn = document.getElementById('typeFilterBtn');
    if (!typeFilterBtn) return;

    if (typeCheckboxes.length === 0) {
      typeFilterBtn.textContent = 'All types eligible';
    } else if (typeCheckboxes.length <= 2) {
      var types = Array.from(typeCheckboxes).map(function(cb) { return cb.value; });
      typeFilterBtn.textContent = types.join(', ');
    } else {
      typeFilterBtn.textContent = typeCheckboxes.length + ' types selected';
    }
  }

  // Update fighting against button text based on selections
  function updateFightingAgainstButtonText() {
    var checkboxes = document.querySelectorAll('#fightingAgainstDropdown .popup-checkbox input:checked');
    var btn = document.getElementById('fightingAgainstBtn');
    if (!btn) return;

    if (checkboxes.length === 0) {
      btn.textContent = 'Fighting against...';
    } else if (checkboxes.length <= 2) {
      var types = Array.from(checkboxes).map(function(cb) { return cb.value; });
      btn.textContent = 'vs ' + types.join(', ');
    } else {
      btn.textContent = 'vs ' + checkboxes.length + ' types';
    }
  }

  // Get selected types from type filter checkboxes
  function getSelectedTypes() {
    var typeCheckboxes = document.querySelectorAll('#typeFilterDropdown .popup-checkbox input:checked');
    return Array.from(typeCheckboxes).map(function(cb) { return cb.value; });
  }

  // Get selected fighting against types
  function getSelectedFightingAgainst() {
    var checkboxes = document.querySelectorAll('#fightingAgainstDropdown .popup-checkbox input:checked');
    return Array.from(checkboxes).map(function(cb) { return cb.value; });
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
    var comingSoonContainer = document.getElementById('comingSoonContainer');
    var cardsGrid = document.getElementById('summaryCards');
    var tableContainer = document.querySelector('.results-table-container');
    var resultsHeader = document.querySelector('.results-header');
    var teamFilters = document.getElementById('teamFilters');
    var tradeToggle = document.getElementById('tradePartnerToggle');
    var filtersDiv = document.getElementById('filters');

    segmentBtns.forEach(function(btn) {
      btn.addEventListener('click', function() {
        var segment = btn.dataset.segment;

        // Update active state
        segmentBtns.forEach(function(b) { b.classList.remove('active'); });
        btn.classList.add('active');

        // Clear any card selections when switching segments
        clearCardSelections();

        // Handle Transfer/Trade coming soon state
        if (segment === 'transfer-trade') {
          // Show coming soon, hide cards and table
          if (comingSoonContainer) comingSoonContainer.hidden = false;
          if (cardsGrid) cardsGrid.style.display = 'none';
          if (tableContainer) tableContainer.style.display = 'none';
          if (resultsHeader) resultsHeader.style.display = 'none';
          if (teamFilters) teamFilters.hidden = true;
          if (tradeToggle) tradeToggle.classList.remove('visible');
          if (filtersDiv) filtersDiv.style.display = 'none';
          return; // Exit early, don't process filters
        }

        // Hide coming soon, show cards and table for other segments
        if (comingSoonContainer) comingSoonContainer.hidden = true;
        if (cardsGrid) cardsGrid.style.display = '';
        if (tableContainer) tableContainer.style.display = '';
        if (resultsHeader) resultsHeader.style.display = '';
        if (filtersDiv) filtersDiv.style.display = '';

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
        if (segment === 'my-teams') {
          filterVerdict.value = 'TOP_RAIDER';
        } else {
          filterVerdict.value = 'all';
        }

        // Hide trade toggle for non-transfer-trade segments
        if (tradeToggle) {
          tradeToggle.classList.remove('visible');
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

    // Type filter elements
    var typeFilterBtn = document.getElementById('typeFilterBtn');
    var typeFilterDropdown = document.getElementById('typeFilterDropdown');
    var typeClearBtn = document.getElementById('typeClearBtn');
    var typeDoneBtn = document.getElementById('typeDoneBtn');
    var typeCheckboxes = document.querySelectorAll('#typeFilterDropdown .popup-checkbox input');

    // Fighting against elements
    var fightingBtn = document.getElementById('fightingAgainstBtn');
    var fightingDropdown = document.getElementById('fightingAgainstDropdown');
    var fightingClearBtn = document.getElementById('fightingAgainstClear');
    var fightingDoneBtn = document.getElementById('fightingAgainstDone');
    var fightingCheckboxes = document.querySelectorAll('#fightingAgainstDropdown .popup-checkbox input');

    if (!leagueSelect) return;

    // League dropdown - also sets max CP automatically
    leagueSelect.addEventListener('change', function() {
      var value = leagueSelect.value;
      if (value === 'great') {
        maxCPSelect.value = '1500';
      } else if (value === 'ultra') {
        maxCPSelect.value = '2500';
      } else if (value === 'master') {
        maxCPSelect.value = '';
      }
      applyFilters();
    });

    // Max CP dropdown
    maxCPSelect.addEventListener('change', function() {
      applyFilters();
    });

    // ---- Type Filter Popup ----
    typeFilterBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      typeFilterDropdown.hidden = !typeFilterDropdown.hidden;
      // Close other popup
      fightingDropdown.hidden = true;
    });

    typeFilterDropdown.addEventListener('click', function(e) {
      e.stopPropagation();
    });

    typeCheckboxes.forEach(function(cb) {
      cb.addEventListener('change', function() {
        updateTypeFilterButtonText();
      });
    });

    typeClearBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      typeCheckboxes.forEach(function(cb) { cb.checked = false; });
      updateTypeFilterButtonText();
      applyFilters();
    });

    typeDoneBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      typeFilterDropdown.hidden = true;
      applyFilters();
    });

    // ---- Fighting Against Popup ----
    fightingBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      fightingDropdown.hidden = !fightingDropdown.hidden;
      // Close other popup
      typeFilterDropdown.hidden = true;
    });

    fightingDropdown.addEventListener('click', function(e) {
      e.stopPropagation();
    });

    fightingCheckboxes.forEach(function(cb) {
      cb.addEventListener('change', function() {
        updateFightingAgainstButtonText();
      });
    });

    fightingClearBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      fightingCheckboxes.forEach(function(cb) { cb.checked = false; });
      updateFightingAgainstButtonText();
      applyFilters();
    });

    fightingDoneBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      fightingDropdown.hidden = true;
      applyFilters();
    });

    // Close both popups when clicking outside
    document.addEventListener('click', function(e) {
      if (!typeFilterDropdown.contains(e.target) && e.target !== typeFilterBtn) {
        typeFilterDropdown.hidden = true;
      }
      if (!fightingDropdown.contains(e.target) && e.target !== fightingBtn) {
        fightingDropdown.hidden = true;
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
      selector.textContent = 'Optimization';
      document.querySelector('.mode-option[data-mode="casual"]').classList.remove('active');
      document.querySelector('.mode-option[data-mode="optimization"]').classList.add('active');
    }

    // Get the wrapper element
    const wrapper = document.getElementById('headerModeSelector');
    if (!wrapper) return;

    // Toggle dropdown on click
    wrapper.addEventListener('click', function(e) {
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
        selector.textContent = mode === 'casual' ? 'Casual' : 'Optimization';
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
    var opponentTypes = getSelectedFightingAgainst();
    var searchFilter = document.getElementById('searchInput').value.toLowerCase().trim();

    // Get team filters (Max CP and Type)
    var maxCPSelect = document.getElementById('filterMaxCP');
    var maxCP = maxCPSelect && maxCPSelect.value ? parseInt(maxCPSelect.value) : null;

    var selectedTypes = getSelectedTypes();

    // Build team filters object
    var teamFilters = {
      maxCP: maxCP,
      selectedTypes: selectedTypes
    };

    // Re-render table with new filters
    renderTable(currentResults.pokemon, verdictFilter, opponentTypes, teamFilters);

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
  // Column Settings
  // ============================================

  function initColumnSettings() {
    var btn = document.getElementById('columnSettingsBtn');
    var dropdown = document.getElementById('columnSettingsDropdown');
    var resetBtn = document.getElementById('columnResetBtn');

    if (!btn || !dropdown) return;

    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      dropdown.hidden = !dropdown.hidden;
      if (!dropdown.hidden) {
        renderColumnSettings();
      }
    });

    resetBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      columnConfig = JSON.parse(JSON.stringify(DEFAULT_COLUMNS));
      saveColumnConfig();
      renderColumnSettings();
      applyFilters(); // Re-render with default columns
    });

    document.addEventListener('click', function(e) {
      if (!dropdown.contains(e.target) && e.target !== btn) {
        dropdown.hidden = true;
      }
    });
  }

  function renderColumnSettings() {
    var list = document.getElementById('columnSettingsList');
    if (!list) return;

    list.innerHTML = columnConfig.map(function(col, index) {
      return '<div class="column-setting-item ' + (col.locked ? 'locked' : '') + '" ' +
             'draggable="' + (!col.locked) + '" ' +
             'data-index="' + index + '" ' +
             'data-id="' + col.id + '">' +
        '<span class="column-drag-handle">⋮⋮</span>' +
        '<input type="checkbox" ' +
               'id="col-' + col.id + '" ' +
               (col.visible ? 'checked ' : '') +
               (col.locked ? 'disabled ' : '') + '>' +
        '<label for="col-' + col.id + '">' + col.label + '</label>' +
      '</div>';
    }).join('');

    // Add checkbox listeners
    list.querySelectorAll('input[type="checkbox"]').forEach(function(checkbox) {
      checkbox.addEventListener('change', function(e) {
        var id = e.target.id.replace('col-', '');
        toggleColumnVisibility(id);
      });
    });

    initColumnDragAndDrop();
  }

  function toggleColumnVisibility(colId) {
    var col = columnConfig.find(function(c) { return c.id === colId; });
    if (col && !col.locked) {
      col.visible = !col.visible;
      saveColumnConfig();
      applyFilters(); // Re-render table with current filters
    }
  }

  function initColumnDragAndDrop() {
    var list = document.getElementById('columnSettingsList');
    if (!list) return;

    var draggedItem = null;
    var draggedIndex = null;

    // Touch drag state
    var touchedItem = null;
    var touchedIndex = null;

    list.querySelectorAll('.column-setting-item[draggable="true"]').forEach(function(item) {
      // Desktop drag events
      item.addEventListener('dragstart', function(e) {
        draggedItem = item;
        draggedIndex = parseInt(item.dataset.index);
        item.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
      });

      item.addEventListener('dragend', function() {
        item.classList.remove('dragging');
        list.querySelectorAll('.column-setting-item').forEach(function(i) {
          i.classList.remove('drag-over');
        });
        draggedItem = null;
        draggedIndex = null;
      });

      item.addEventListener('dragover', function(e) {
        e.preventDefault();
        if (!draggedItem || draggedItem === item) return;

        var targetIndex = parseInt(item.dataset.index);

        // Don't allow dropping before locked items
        if (targetIndex === 0 && columnConfig[0].locked) return;

        item.classList.add('drag-over');
      });

      item.addEventListener('dragleave', function() {
        item.classList.remove('drag-over');
      });

      item.addEventListener('drop', function(e) {
        e.preventDefault();
        if (!draggedItem || draggedItem === item) return;

        var targetIndex = parseInt(item.dataset.index);

        // Don't allow dropping at position 0 if it's locked
        if (targetIndex === 0 && columnConfig[0].locked) return;

        // Reorder
        var moved = columnConfig.splice(draggedIndex, 1)[0];
        columnConfig.splice(targetIndex, 0, moved);

        saveColumnConfig();
        renderColumnSettings();
        applyFilters();
      });

      // Touch events for mobile
      var handle = item.querySelector('.column-drag-handle');
      if (handle) {
        handle.addEventListener('touchstart', function(e) {
          e.preventDefault();
          touchedItem = item;
          touchedIndex = parseInt(item.dataset.index);
          item.classList.add('dragging');
        }, { passive: false });

        handle.addEventListener('touchmove', function(e) {
          if (!touchedItem) return;
          e.preventDefault();

          var touch = e.touches[0];
          var elemBelow = document.elementFromPoint(touch.clientX, touch.clientY);
          var targetItem = elemBelow ? elemBelow.closest('.column-setting-item') : null;

          // Clear all drag-over states
          list.querySelectorAll('.column-setting-item').forEach(function(i) {
            i.classList.remove('drag-over');
          });

          if (targetItem && targetItem !== touchedItem && !targetItem.classList.contains('locked')) {
            var targetIndex = parseInt(targetItem.dataset.index);
            if (!(targetIndex === 0 && columnConfig[0].locked)) {
              targetItem.classList.add('drag-over');
            }
          }
        }, { passive: false });

        handle.addEventListener('touchend', function(e) {
          if (!touchedItem) return;

          var touch = e.changedTouches[0];
          var elemBelow = document.elementFromPoint(touch.clientX, touch.clientY);
          var targetItem = elemBelow ? elemBelow.closest('.column-setting-item') : null;

          if (targetItem && targetItem !== touchedItem && !targetItem.classList.contains('locked')) {
            var targetIndex = parseInt(targetItem.dataset.index);
            if (!(targetIndex === 0 && columnConfig[0].locked)) {
              // Reorder
              var moved = columnConfig.splice(touchedIndex, 1)[0];
              columnConfig.splice(targetIndex, 0, moved);

              saveColumnConfig();
              renderColumnSettings();
              applyFilters();
            }
          }

          // Cleanup
          touchedItem.classList.remove('dragging');
          list.querySelectorAll('.column-setting-item').forEach(function(i) {
            i.classList.remove('drag-over');
          });
          touchedItem = null;
          touchedIndex = null;
        });
      }
    });
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
