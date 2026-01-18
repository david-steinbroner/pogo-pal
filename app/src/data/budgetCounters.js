/**
 * Budget Counter Recommendations
 * Curated Pokemon counters for each opponent type
 * All entries are globally available (no regionals in v1)
 */

import { TYPE_CHART } from '../state.js';

/**
 * Common Pokemon by their primary type (for AVOID recommendations)
 * These are frequently-used Pokemon that players might mistakenly bring
 */
const COMMON_POKEMON_BY_TYPE = {
  Normal: [
    { name: 'Snorlax', types: ['Normal'], tier: 'common' },
    { name: 'Blissey', types: ['Normal'], tier: 'uncommon' },
    { name: 'Slaking', types: ['Normal'], tier: 'common' },
    { name: 'Ursaring', types: ['Normal'], tier: 'common' }
  ],
  Fire: [
    { name: 'Charizard', types: ['Fire', 'Flying'], tier: 'common' },
    { name: 'Flareon', types: ['Fire'], tier: 'common' },
    { name: 'Arcanine', types: ['Fire'], tier: 'common' },
    { name: 'Blaziken', types: ['Fire', 'Fighting'], tier: 'common' }
  ],
  Water: [
    { name: 'Gyarados', types: ['Water', 'Flying'], tier: 'common' },
    { name: 'Vaporeon', types: ['Water'], tier: 'common' },
    { name: 'Swampert', types: ['Water', 'Ground'], tier: 'common' },
    { name: 'Kyogre', types: ['Water'], tier: 'legendary' }
  ],
  Electric: [
    { name: 'Jolteon', types: ['Electric'], tier: 'common' },
    { name: 'Electivire', types: ['Electric'], tier: 'uncommon' },
    { name: 'Luxray', types: ['Electric'], tier: 'common' },
    { name: 'Magnezone', types: ['Electric', 'Steel'], tier: 'common' }
  ],
  Grass: [
    { name: 'Venusaur', types: ['Grass', 'Poison'], tier: 'common' },
    { name: 'Roserade', types: ['Grass', 'Poison'], tier: 'common' },
    { name: 'Sceptile', types: ['Grass'], tier: 'common' },
    { name: 'Torterra', types: ['Grass', 'Ground'], tier: 'common' }
  ],
  Ice: [
    { name: 'Mamoswine', types: ['Ice', 'Ground'], tier: 'common' },
    { name: 'Glaceon', types: ['Ice'], tier: 'common' },
    { name: 'Weavile', types: ['Dark', 'Ice'], tier: 'uncommon' },
    { name: 'Lapras', types: ['Water', 'Ice'], tier: 'uncommon' }
  ],
  Fighting: [
    { name: 'Machamp', types: ['Fighting'], tier: 'common' },
    { name: 'Hariyama', types: ['Fighting'], tier: 'common' },
    { name: 'Lucario', types: ['Fighting', 'Steel'], tier: 'rare' },
    { name: 'Conkeldurr', types: ['Fighting'], tier: 'uncommon' }
  ],
  Poison: [
    { name: 'Gengar', types: ['Ghost', 'Poison'], tier: 'common' },
    { name: 'Roserade', types: ['Grass', 'Poison'], tier: 'common' },
    { name: 'Toxicroak', types: ['Poison', 'Fighting'], tier: 'common' },
    { name: 'Nidoking', types: ['Poison', 'Ground'], tier: 'common' }
  ],
  Ground: [
    { name: 'Garchomp', types: ['Dragon', 'Ground'], tier: 'rare' },
    { name: 'Rhyperior', types: ['Ground', 'Rock'], tier: 'uncommon' },
    { name: 'Excadrill', types: ['Ground', 'Steel'], tier: 'uncommon' },
    { name: 'Golem', types: ['Rock', 'Ground'], tier: 'common' }
  ],
  Flying: [
    { name: 'Honchkrow', types: ['Dark', 'Flying'], tier: 'common' },
    { name: 'Staraptor', types: ['Normal', 'Flying'], tier: 'common' },
    { name: 'Togekiss', types: ['Fairy', 'Flying'], tier: 'rare' },
    { name: 'Dragonite', types: ['Dragon', 'Flying'], tier: 'uncommon' }
  ],
  Psychic: [
    { name: 'Alakazam', types: ['Psychic'], tier: 'common' },
    { name: 'Espeon', types: ['Psychic'], tier: 'common' },
    { name: 'Gardevoir', types: ['Psychic', 'Fairy'], tier: 'uncommon' },
    { name: 'Metagross', types: ['Steel', 'Psychic'], tier: 'rare' }
  ],
  Bug: [
    { name: 'Pinsir', types: ['Bug'], tier: 'common' },
    { name: 'Scizor', types: ['Bug', 'Steel'], tier: 'uncommon' },
    { name: 'Heracross', types: ['Bug', 'Fighting'], tier: 'rare' },
    { name: 'Yanmega', types: ['Bug', 'Flying'], tier: 'common' }
  ],
  Rock: [
    { name: 'Tyranitar', types: ['Rock', 'Dark'], tier: 'uncommon' },
    { name: 'Rhyperior', types: ['Ground', 'Rock'], tier: 'uncommon' },
    { name: 'Golem', types: ['Rock', 'Ground'], tier: 'common' },
    { name: 'Rampardos', types: ['Rock'], tier: 'rare' }
  ],
  Ghost: [
    { name: 'Gengar', types: ['Ghost', 'Poison'], tier: 'common' },
    { name: 'Chandelure', types: ['Ghost', 'Fire'], tier: 'uncommon' },
    { name: 'Giratina', types: ['Ghost', 'Dragon'], tier: 'legendary' },
    { name: 'Dusknoir', types: ['Ghost'], tier: 'uncommon' }
  ],
  Dragon: [
    { name: 'Dragonite', types: ['Dragon', 'Flying'], tier: 'uncommon' },
    { name: 'Garchomp', types: ['Dragon', 'Ground'], tier: 'rare' },
    { name: 'Salamence', types: ['Dragon', 'Flying'], tier: 'uncommon' },
    { name: 'Haxorus', types: ['Dragon'], tier: 'rare' }
  ],
  Dark: [
    { name: 'Tyranitar', types: ['Rock', 'Dark'], tier: 'uncommon' },
    { name: 'Honchkrow', types: ['Dark', 'Flying'], tier: 'common' },
    { name: 'Weavile', types: ['Dark', 'Ice'], tier: 'uncommon' },
    { name: 'Absol', types: ['Dark'], tier: 'rare' }
  ],
  Steel: [
    { name: 'Metagross', types: ['Steel', 'Psychic'], tier: 'rare' },
    { name: 'Magnezone', types: ['Electric', 'Steel'], tier: 'common' },
    { name: 'Excadrill', types: ['Ground', 'Steel'], tier: 'uncommon' },
    { name: 'Scizor', types: ['Bug', 'Steel'], tier: 'uncommon' }
  ],
  Fairy: [
    { name: 'Gardevoir', types: ['Psychic', 'Fairy'], tier: 'uncommon' },
    { name: 'Togekiss', types: ['Fairy', 'Flying'], tier: 'rare' },
    { name: 'Granbull', types: ['Fairy'], tier: 'common' },
    { name: 'Clefable', types: ['Fairy'], tier: 'common' }
  ]
};

/**
 * Budget counter entry structure:
 * {
 *   name: string,        // Pokemon name
 *   types: string[],     // Pokemon types for display
 *   fast: string,        // Recommended fast move
 *   charged: string,     // Recommended charged move
 *   tier: string,        // Accessibility: common, uncommon, rare, legendary
 *   cost: string,        // Investment: low, medium, high
 *   note: string         // Brief availability note
 * }
 */

export const BUDGET_COUNTERS = {
  // NORMAL - weak to Fighting
  Normal: [
    { name: 'Machamp', types: ['Fighting'], fast: 'Counter', charged: 'Dynamic Punch', tier: 'common', cost: 'medium', note: 'Trade evolve = free' },
    { name: 'Hariyama', types: ['Fighting'], fast: 'Counter', charged: 'Dynamic Punch', tier: 'common', cost: 'low', note: 'Wild Makuhita common' },
    { name: 'Primeape', types: ['Fighting'], fast: 'Counter', charged: 'Close Combat', tier: 'common', cost: 'low', note: 'Wild Mankey common' },
    { name: 'Breloom', types: ['Grass', 'Fighting'], fast: 'Counter', charged: 'Dynamic Punch', tier: 'uncommon', cost: 'medium', note: 'Shroomish in parks/grass' },
    { name: 'Lucario', types: ['Fighting', 'Steel'], fast: 'Counter', charged: 'Aura Sphere', tier: 'rare', cost: 'high', note: 'Hatch Riolu from eggs' }
  ],

  // FIRE - weak to Water, Ground, Rock
  Fire: [
    { name: 'Gyarados', types: ['Water', 'Flying'], fast: 'Waterfall', charged: 'Hydro Pump', tier: 'common', cost: 'medium', note: 'Magikarp everywhere' },
    { name: 'Vaporeon', types: ['Water'], fast: 'Water Gun', charged: 'Hydro Pump', tier: 'common', cost: 'low', note: 'Eevee very common' },
    { name: 'Swampert', types: ['Water', 'Ground'], fast: 'Water Gun', charged: 'Hydro Cannon', tier: 'common', cost: 'medium', note: 'CD move ideal' },
    { name: 'Golem', types: ['Rock', 'Ground'], fast: 'Rock Throw', charged: 'Stone Edge', tier: 'common', cost: 'low', note: 'Trade evolve = free' },
    { name: 'Rhyperior', types: ['Ground', 'Rock'], fast: 'Mud-Slap', charged: 'Earthquake', tier: 'uncommon', cost: 'medium', note: 'Rhyhorn nests exist' }
  ],

  // WATER - weak to Grass, Electric
  Water: [
    { name: 'Roserade', types: ['Grass', 'Poison'], fast: 'Razor Leaf', charged: 'Grass Knot', tier: 'common', cost: 'medium', note: 'Roselia spawns often' },
    { name: 'Venusaur', types: ['Grass', 'Poison'], fast: 'Vine Whip', charged: 'Frenzy Plant', tier: 'common', cost: 'medium', note: 'CD move ideal' },
    { name: 'Jolteon', types: ['Electric'], fast: 'Thunder Shock', charged: 'Thunderbolt', tier: 'common', cost: 'low', note: 'Eevee very common' },
    { name: 'Electivire', types: ['Electric'], fast: 'Thunder Shock', charged: 'Wild Charge', tier: 'uncommon', cost: 'medium', note: 'Elekid from eggs' },
    { name: 'Luxray', types: ['Electric'], fast: 'Spark', charged: 'Wild Charge', tier: 'common', cost: 'low', note: 'Shinx spawns common' }
  ],

  // ELECTRIC - weak to Ground
  Electric: [
    { name: 'Garchomp', types: ['Dragon', 'Ground'], fast: 'Mud Shot', charged: 'Earth Power', tier: 'rare', cost: 'high', note: 'Gible rare but worth it' },
    { name: 'Rhyperior', types: ['Ground', 'Rock'], fast: 'Mud-Slap', charged: 'Earthquake', tier: 'uncommon', cost: 'medium', note: 'Rhyhorn nests exist' },
    { name: 'Golem', types: ['Rock', 'Ground'], fast: 'Mud-Slap', charged: 'Earthquake', tier: 'common', cost: 'low', note: 'Trade evolve = free' },
    { name: 'Mamoswine', types: ['Ice', 'Ground'], fast: 'Mud-Slap', charged: 'Bulldoze', tier: 'common', cost: 'medium', note: 'Swinub very common' },
    { name: 'Excadrill', types: ['Ground', 'Steel'], fast: 'Mud-Slap', charged: 'Drill Run', tier: 'uncommon', cost: 'medium', note: 'Drilbur spawns in events' }
  ],

  // GRASS - weak to Fire, Ice, Poison, Flying, Bug
  Grass: [
    { name: 'Charizard', types: ['Fire', 'Flying'], fast: 'Fire Spin', charged: 'Blast Burn', tier: 'common', cost: 'medium', note: 'CD move ideal' },
    { name: 'Flareon', types: ['Fire'], fast: 'Fire Spin', charged: 'Flamethrower', tier: 'common', cost: 'low', note: 'Eevee very common' },
    { name: 'Mamoswine', types: ['Ice', 'Ground'], fast: 'Powder Snow', charged: 'Avalanche', tier: 'common', cost: 'medium', note: 'Swinub very common' },
    { name: 'Honchkrow', types: ['Dark', 'Flying'], fast: 'Peck', charged: 'Sky Attack', tier: 'common', cost: 'low', note: 'Murkrow spawns often' },
    { name: 'Roserade', types: ['Grass', 'Poison'], fast: 'Poison Jab', charged: 'Sludge Bomb', tier: 'common', cost: 'medium', note: 'Poison moveset here' }
  ],

  // ICE - weak to Fire, Fighting, Rock, Steel
  Ice: [
    { name: 'Machamp', types: ['Fighting'], fast: 'Counter', charged: 'Dynamic Punch', tier: 'common', cost: 'medium', note: 'Trade evolve = free' },
    { name: 'Charizard', types: ['Fire', 'Flying'], fast: 'Fire Spin', charged: 'Blast Burn', tier: 'common', cost: 'medium', note: 'CD move ideal' },
    { name: 'Flareon', types: ['Fire'], fast: 'Fire Spin', charged: 'Flamethrower', tier: 'common', cost: 'low', note: 'Eevee very common' },
    { name: 'Tyranitar', types: ['Rock', 'Dark'], fast: 'Smack Down', charged: 'Stone Edge', tier: 'uncommon', cost: 'high', note: 'CD move for Smack Down' },
    { name: 'Metagross', types: ['Steel', 'Psychic'], fast: 'Bullet Punch', charged: 'Meteor Mash', tier: 'rare', cost: 'high', note: 'CD move, very strong' }
  ],

  // FIGHTING - weak to Flying, Psychic, Fairy
  Fighting: [
    { name: 'Alakazam', types: ['Psychic'], fast: 'Confusion', charged: 'Psychic', tier: 'common', cost: 'medium', note: 'Abra spawns often' },
    { name: 'Espeon', types: ['Psychic'], fast: 'Confusion', charged: 'Psychic', tier: 'common', cost: 'low', note: 'Walk Eevee + day evolve' },
    { name: 'Honchkrow', types: ['Dark', 'Flying'], fast: 'Peck', charged: 'Sky Attack', tier: 'common', cost: 'low', note: 'Murkrow spawns often' },
    { name: 'Gardevoir', types: ['Psychic', 'Fairy'], fast: 'Charm', charged: 'Dazzling Gleam', tier: 'uncommon', cost: 'medium', note: 'Ralts spawns in events' },
    { name: 'Togekiss', types: ['Fairy', 'Flying'], fast: 'Charm', charged: 'Dazzling Gleam', tier: 'rare', cost: 'high', note: 'Togepi from eggs' }
  ],

  // POISON - weak to Ground, Psychic
  Poison: [
    { name: 'Alakazam', types: ['Psychic'], fast: 'Confusion', charged: 'Psychic', tier: 'common', cost: 'medium', note: 'Abra spawns often' },
    { name: 'Espeon', types: ['Psychic'], fast: 'Confusion', charged: 'Psychic', tier: 'common', cost: 'low', note: 'Walk Eevee + day evolve' },
    { name: 'Garchomp', types: ['Dragon', 'Ground'], fast: 'Mud Shot', charged: 'Earth Power', tier: 'rare', cost: 'high', note: 'Gible rare but worth it' },
    { name: 'Rhyperior', types: ['Ground', 'Rock'], fast: 'Mud-Slap', charged: 'Earthquake', tier: 'uncommon', cost: 'medium', note: 'Rhyhorn nests exist' },
    { name: 'Excadrill', types: ['Ground', 'Steel'], fast: 'Mud-Slap', charged: 'Drill Run', tier: 'uncommon', cost: 'medium', note: 'Drilbur spawns in events' }
  ],

  // GROUND - weak to Water, Grass, Ice
  Ground: [
    { name: 'Gyarados', types: ['Water', 'Flying'], fast: 'Waterfall', charged: 'Hydro Pump', tier: 'common', cost: 'medium', note: 'Magikarp everywhere' },
    { name: 'Vaporeon', types: ['Water'], fast: 'Water Gun', charged: 'Hydro Pump', tier: 'common', cost: 'low', note: 'Eevee very common' },
    { name: 'Roserade', types: ['Grass', 'Poison'], fast: 'Razor Leaf', charged: 'Grass Knot', tier: 'common', cost: 'medium', note: 'Roselia spawns often' },
    { name: 'Mamoswine', types: ['Ice', 'Ground'], fast: 'Powder Snow', charged: 'Avalanche', tier: 'common', cost: 'medium', note: 'Swinub very common' },
    { name: 'Glaceon', types: ['Ice'], fast: 'Frost Breath', charged: 'Avalanche', tier: 'common', cost: 'low', note: 'Eevee + Glacial Lure' }
  ],

  // FLYING - weak to Electric, Ice, Rock
  Flying: [
    { name: 'Jolteon', types: ['Electric'], fast: 'Thunder Shock', charged: 'Thunderbolt', tier: 'common', cost: 'low', note: 'Eevee very common' },
    { name: 'Electivire', types: ['Electric'], fast: 'Thunder Shock', charged: 'Wild Charge', tier: 'uncommon', cost: 'medium', note: 'Elekid from eggs' },
    { name: 'Mamoswine', types: ['Ice', 'Ground'], fast: 'Powder Snow', charged: 'Avalanche', tier: 'common', cost: 'medium', note: 'Swinub very common' },
    { name: 'Tyranitar', types: ['Rock', 'Dark'], fast: 'Smack Down', charged: 'Stone Edge', tier: 'uncommon', cost: 'high', note: 'CD move for Smack Down' },
    { name: 'Rhyperior', types: ['Ground', 'Rock'], fast: 'Smack Down', charged: 'Rock Wrecker', tier: 'uncommon', cost: 'high', note: 'CD move ideal' }
  ],

  // PSYCHIC - weak to Bug, Ghost, Dark
  Psychic: [
    { name: 'Tyranitar', types: ['Rock', 'Dark'], fast: 'Bite', charged: 'Crunch', tier: 'uncommon', cost: 'medium', note: 'Larvitar in events' },
    { name: 'Honchkrow', types: ['Dark', 'Flying'], fast: 'Snarl', charged: 'Dark Pulse', tier: 'common', cost: 'low', note: 'Murkrow spawns often' },
    { name: 'Weavile', types: ['Dark', 'Ice'], fast: 'Snarl', charged: 'Foul Play', tier: 'uncommon', cost: 'medium', note: 'Sneasel spawns in cold' },
    { name: 'Gengar', types: ['Ghost', 'Poison'], fast: 'Shadow Claw', charged: 'Shadow Ball', tier: 'common', cost: 'medium', note: 'Gastly very common' },
    { name: 'Pinsir', types: ['Bug'], fast: 'Bug Bite', charged: 'X-Scissor', tier: 'common', cost: 'low', note: 'Wild spawns, no evolve' }
  ],

  // BUG - weak to Fire, Flying, Rock
  Bug: [
    { name: 'Charizard', types: ['Fire', 'Flying'], fast: 'Fire Spin', charged: 'Blast Burn', tier: 'common', cost: 'medium', note: 'CD move ideal' },
    { name: 'Flareon', types: ['Fire'], fast: 'Fire Spin', charged: 'Flamethrower', tier: 'common', cost: 'low', note: 'Eevee very common' },
    { name: 'Honchkrow', types: ['Dark', 'Flying'], fast: 'Peck', charged: 'Sky Attack', tier: 'common', cost: 'low', note: 'Murkrow spawns often' },
    { name: 'Tyranitar', types: ['Rock', 'Dark'], fast: 'Smack Down', charged: 'Stone Edge', tier: 'uncommon', cost: 'high', note: 'CD move for Smack Down' },
    { name: 'Rhyperior', types: ['Ground', 'Rock'], fast: 'Smack Down', charged: 'Rock Wrecker', tier: 'uncommon', cost: 'high', note: 'CD move ideal' }
  ],

  // ROCK - weak to Water, Grass, Fighting, Ground, Steel
  Rock: [
    { name: 'Machamp', types: ['Fighting'], fast: 'Counter', charged: 'Dynamic Punch', tier: 'common', cost: 'medium', note: 'Trade evolve = free' },
    { name: 'Gyarados', types: ['Water', 'Flying'], fast: 'Waterfall', charged: 'Hydro Pump', tier: 'common', cost: 'medium', note: 'Magikarp everywhere' },
    { name: 'Vaporeon', types: ['Water'], fast: 'Water Gun', charged: 'Hydro Pump', tier: 'common', cost: 'low', note: 'Eevee very common' },
    { name: 'Roserade', types: ['Grass', 'Poison'], fast: 'Razor Leaf', charged: 'Grass Knot', tier: 'common', cost: 'medium', note: 'Roselia spawns often' },
    { name: 'Metagross', types: ['Steel', 'Psychic'], fast: 'Bullet Punch', charged: 'Meteor Mash', tier: 'rare', cost: 'high', note: 'CD move, very strong' }
  ],

  // GHOST - weak to Ghost, Dark
  Ghost: [
    { name: 'Tyranitar', types: ['Rock', 'Dark'], fast: 'Bite', charged: 'Crunch', tier: 'uncommon', cost: 'medium', note: 'Larvitar in events' },
    { name: 'Honchkrow', types: ['Dark', 'Flying'], fast: 'Snarl', charged: 'Dark Pulse', tier: 'common', cost: 'low', note: 'Murkrow spawns often' },
    { name: 'Weavile', types: ['Dark', 'Ice'], fast: 'Snarl', charged: 'Foul Play', tier: 'uncommon', cost: 'medium', note: 'Sneasel spawns in cold' },
    { name: 'Gengar', types: ['Ghost', 'Poison'], fast: 'Shadow Claw', charged: 'Shadow Ball', tier: 'common', cost: 'medium', note: 'Gastly very common' },
    { name: 'Absol', types: ['Dark'], fast: 'Snarl', charged: 'Dark Pulse', tier: 'rare', cost: 'low', note: 'Raid boss, no evolve' }
  ],

  // DRAGON - weak to Ice, Dragon, Fairy
  Dragon: [
    { name: 'Mamoswine', types: ['Ice', 'Ground'], fast: 'Powder Snow', charged: 'Avalanche', tier: 'common', cost: 'medium', note: 'Swinub very common' },
    { name: 'Glaceon', types: ['Ice'], fast: 'Frost Breath', charged: 'Avalanche', tier: 'common', cost: 'low', note: 'Eevee + Glacial Lure' },
    { name: 'Weavile', types: ['Dark', 'Ice'], fast: 'Ice Shard', charged: 'Avalanche', tier: 'uncommon', cost: 'medium', note: 'Sneasel spawns in cold' },
    { name: 'Gardevoir', types: ['Psychic', 'Fairy'], fast: 'Charm', charged: 'Dazzling Gleam', tier: 'uncommon', cost: 'medium', note: 'Ralts spawns in events' },
    { name: 'Togekiss', types: ['Fairy', 'Flying'], fast: 'Charm', charged: 'Dazzling Gleam', tier: 'rare', cost: 'high', note: 'Togepi from eggs' }
  ],

  // DARK - weak to Fighting, Bug, Fairy
  Dark: [
    { name: 'Machamp', types: ['Fighting'], fast: 'Counter', charged: 'Dynamic Punch', tier: 'common', cost: 'medium', note: 'Trade evolve = free' },
    { name: 'Hariyama', types: ['Fighting'], fast: 'Counter', charged: 'Dynamic Punch', tier: 'common', cost: 'low', note: 'Wild Makuhita common' },
    { name: 'Gardevoir', types: ['Psychic', 'Fairy'], fast: 'Charm', charged: 'Dazzling Gleam', tier: 'uncommon', cost: 'medium', note: 'Ralts spawns in events' },
    { name: 'Togekiss', types: ['Fairy', 'Flying'], fast: 'Charm', charged: 'Dazzling Gleam', tier: 'rare', cost: 'high', note: 'Togepi from eggs' },
    { name: 'Pinsir', types: ['Bug'], fast: 'Bug Bite', charged: 'X-Scissor', tier: 'common', cost: 'low', note: 'Wild spawns, no evolve' }
  ],

  // STEEL - weak to Fire, Fighting, Ground
  Steel: [
    { name: 'Machamp', types: ['Fighting'], fast: 'Counter', charged: 'Dynamic Punch', tier: 'common', cost: 'medium', note: 'Trade evolve = free' },
    { name: 'Charizard', types: ['Fire', 'Flying'], fast: 'Fire Spin', charged: 'Blast Burn', tier: 'common', cost: 'medium', note: 'CD move ideal' },
    { name: 'Flareon', types: ['Fire'], fast: 'Fire Spin', charged: 'Flamethrower', tier: 'common', cost: 'low', note: 'Eevee very common' },
    { name: 'Garchomp', types: ['Dragon', 'Ground'], fast: 'Mud Shot', charged: 'Earth Power', tier: 'rare', cost: 'high', note: 'Gible rare but worth it' },
    { name: 'Rhyperior', types: ['Ground', 'Rock'], fast: 'Mud-Slap', charged: 'Earthquake', tier: 'uncommon', cost: 'medium', note: 'Rhyhorn nests exist' }
  ],

  // FAIRY - weak to Poison, Steel
  Fairy: [
    { name: 'Roserade', types: ['Grass', 'Poison'], fast: 'Poison Jab', charged: 'Sludge Bomb', tier: 'common', cost: 'medium', note: 'Roselia spawns often' },
    { name: 'Gengar', types: ['Ghost', 'Poison'], fast: 'Hex', charged: 'Sludge Bomb', tier: 'common', cost: 'medium', note: 'Gastly very common' },
    { name: 'Metagross', types: ['Steel', 'Psychic'], fast: 'Bullet Punch', charged: 'Meteor Mash', tier: 'rare', cost: 'high', note: 'CD move, very strong' },
    { name: 'Excadrill', types: ['Ground', 'Steel'], fast: 'Metal Claw', charged: 'Iron Head', tier: 'uncommon', cost: 'medium', note: 'Drilbur spawns in events' },
    { name: 'Toxicroak', types: ['Poison', 'Fighting'], fast: 'Poison Jab', charged: 'Sludge Bomb', tier: 'common', cost: 'low', note: 'Croagunk spawns often' }
  ]
};

/**
 * Get budget counters for selected opponent types
 * @param {string[]} oppTypes - Array of opponent types
 * @param {number} limit - Max counters to return
 * @returns {Array} Deduplicated and prioritized counter list
 */
export function getBudgetCounters(oppTypes, limit = 5) {
  if (!oppTypes || oppTypes.length === 0) return [];

  // Collect counters for all opponent types
  const allCounters = [];
  oppTypes.forEach(type => {
    const counters = BUDGET_COUNTERS[type];
    if (counters) {
      counters.forEach(c => allCounters.push({ ...c, targetType: type }));
    }
  });

  // Deduplicate by name, keeping first occurrence
  const seen = new Set();
  const unique = allCounters.filter(c => {
    if (seen.has(c.name)) return false;
    seen.add(c.name);
    return true;
  });

  // Sort by accessibility (common first) then investment (low first)
  const tierOrder = { common: 0, uncommon: 1, rare: 2, legendary: 3 };
  const costOrder = { low: 0, medium: 1, high: 2 };

  unique.sort((a, b) => {
    const tierDiff = tierOrder[a.tier] - tierOrder[b.tier];
    if (tierDiff !== 0) return tierDiff;
    return costOrder[a.cost] - costOrder[b.cost];
  });

  return unique.slice(0, limit);
}

/**
 * Get counters grouped by opponent type, with exact count per type
 * @param {string[]} oppTypes - Array of opponent types
 * @param {number} perType - Number of counters per type (default 3)
 * @returns {Object} Map of oppType -> array of counters
 */
export function getCountersPerType(oppTypes, perType = 3) {
  if (!oppTypes || oppTypes.length === 0) return {};

  const tierOrder = { common: 0, uncommon: 1, rare: 2, legendary: 3 };
  const costOrder = { low: 0, medium: 1, high: 2 };

  const result = {};
  oppTypes.forEach(type => {
    const counters = BUDGET_COUNTERS[type] || [];
    // Sort by tier then cost
    const sorted = [...counters].sort((a, b) => {
      const tierDiff = tierOrder[a.tier] - tierOrder[b.tier];
      if (tierDiff !== 0) return tierDiff;
      return costOrder[a.cost] - costOrder[b.cost];
    });
    result[type] = sorted.slice(0, perType).map(c => ({ ...c, targetType: type }));
  });

  return result;
}

/**
 * Get common Pokemon that are WEAK against selected opponent types.
 * These are Pokemon to avoid bringing to battle.
 * @param {string[]} oppTypes - Array of opponent types
 * @param {number} limit - Max Pokemon to return
 * @returns {Array} Common Pokemon that fare poorly against opponent
 */
export function getWeakCounters(oppTypes, limit = 6) {
  if (!oppTypes || oppTypes.length === 0) return [];

  // Find all types that opponent deals super effective damage to
  const weakTypes = new Set();
  for (const oppType of oppTypes) {
    const chart = TYPE_CHART[oppType];
    if (chart && chart.super) {
      chart.super.forEach(t => weakTypes.add(t));
    }
  }

  // Collect common Pokemon of those weak types
  const allWeak = [];
  for (const weakType of weakTypes) {
    const pokemon = COMMON_POKEMON_BY_TYPE[weakType];
    if (pokemon) {
      pokemon.forEach(p => allWeak.push({ ...p, weakType }));
    }
  }

  // Deduplicate by name
  const seen = new Set();
  const unique = allWeak.filter(p => {
    if (seen.has(p.name)) return false;
    seen.add(p.name);
    return true;
  });

  // Sort by tier (common first) so most recognizable Pokemon show up
  const tierOrder = { common: 0, uncommon: 1, rare: 2, legendary: 3 };
  unique.sort((a, b) => tierOrder[a.tier] - tierOrder[b.tier]);

  return unique.slice(0, limit);
}

/**
 * Get common Pokemon that are WEAK against selected opponent types, grouped by opponent type.
 * These are Pokemon to avoid bringing to battle.
 * @param {string[]} oppTypes - Array of opponent types
 * @param {number} perType - Max Pokemon per opponent type
 * @returns {Object} Map of oppType -> array of weak Pokemon
 */
export function getWeakCountersPerType(oppTypes, perType = 3) {
  if (!oppTypes || oppTypes.length === 0) return {};

  const result = {};
  oppTypes.forEach(oppType => {
    // Get types that this opponent deals super effective damage to
    const chart = TYPE_CHART[oppType];
    if (!chart || !chart.super) {
      result[oppType] = [];
      return;
    }

    // Collect common Pokemon of those weak types
    const weakPokemon = [];
    chart.super.forEach(weakType => {
      const pokemon = COMMON_POKEMON_BY_TYPE[weakType];
      if (pokemon) {
        pokemon.forEach(p => weakPokemon.push({ ...p, weakType }));
      }
    });

    // Deduplicate by name
    const seen = new Set();
    const unique = weakPokemon.filter(p => {
      if (seen.has(p.name)) return false;
      seen.add(p.name);
      return true;
    });

    // Sort by tier (common first)
    const tierOrder = { common: 0, uncommon: 1, rare: 2, legendary: 3 };
    unique.sort((a, b) => tierOrder[a.tier] - tierOrder[b.tier]);

    result[oppType] = unique.slice(0, perType);
  });

  return result;
}
