# PoGO Pal - Project Manifest

## Current Focus
Trade tab implementation

## Next Up
- [ ] Trade tab: placeholder or basic implementation

## Blocked / Questions
(none)

## Recent Progress
- 2026-01-15: VS UI fixes - centered modal, hide collapsed picker bar, unified pill sizes, stronger divider
- 2026-01-15: Bug fixes - info icon style, tooltip anchor, default to VS tab, consistent type pills
- 2026-01-15: VS tab UX batch - upload to top bar, info icon in header, wider labels, fixed type selection
- 2026-01-15: VS tab tooltip - fixed positioning (appears below icon), updated copy
- 2026-01-15: VS tab copy - clearer labels (Use/Don't use move types, Don't bring pokemon, Watch out for)
- 2026-01-15: VS tab UX - unified upload buttons with icons, reordered layout (Bring/Avoid first when no CSV)
- 2026-01-15: VS tab polish - removed VS icon, added upload buttons to empty states
- 2026-01-15: Design System Migration complete - migrated to light "Pokédex Companion" theme (10 chunks)
- 2026-01-15: VS type selector Done/Edit toggle - explicit collapse control, validation feedback
- 2025-01-15: Fixed CSV name detection - skip numeric values (Pokedex #), find actual Pokemon names
- 2025-01-15: Filtering + sorting verified working: type filters, "X of Y" counts, sorting on filtered subset
- 2025-01-15: Versus mode working with uploaded collection, shows best picks
- 2025-01-15: Migrated repo pogo-tools → pogo-pal, updated all GitHub URLs, Cloudflare Pages configured
- 2025-01-15: ES modules refactor complete - monolith split into state.js, csv/, ui/ modules
- 2025-01-15: Added design system + typography reference docs to /app/docs/
- 2025-01-15: Cleaned up duplicate project folders, consolidated to single location

## Architecture
Single-page app using ES modules (no build step):

```
/app/
  index.html              # Entry point (loads app.js as module)
  /src/
    app.js                # Main orchestrator, CSV processing
    state.js              # Single source of truth (types, results, sort state)
    /csv/
      parseCsv.js         # CSV parsing, locale-tolerant numbers
      mapping.js          # Header detection, field extraction, IV calc
      pokedex.js          # Species → type mappings (~600 Pokemon)
    /ui/
      dom.js              # DOM element references
      render.js           # UI rendering (grid, table, VS mode)
      events.js           # Event handlers, sheet/drawer management
  /styles/
    app.css               # All CSS (~1300 lines, GBA/DS theming)
  /docs/
    HANDOFF.md            # Legacy continuity doc
    design-system.md      # Design System v4 spec (single source of truth)
    design-migration-plan.md  # Migration plan (complete)

/legacy/
  pogo-v3-prototype-v3_35-legacy.html   # Original monolith for reference
```

## Design Direction
Pokemon handheld UI vibes (Game Boy → GBA → Nintendo DS). Current theme: **Design System v4 "Pokédex Companion"** - warm cream light theme with visible 2px borders, Press Start 2P headers, VT323 body text, 4px border-radius for GBA-era feel.

## Dev Setup
```bash
cd ~/Projects/Active\ Development/pogo-pal/app
python -m http.server 8000
# Open http://localhost:8000
```

## Links
- Production: https://pogo-pal.pages.dev
- Repo: https://github.com/david-steinbroner/pogo-pal
- Branch: main

## Constraints
- Safari-safe JS (no bleeding-edge features)
- No official Pokemon/Nintendo assets
- No build step - plain ES modules only
- All processing happens client-side (privacy-first)

## Session End Protocol
After each working session, update this file:
1. Move completed items from "Next Up" to "Recent Progress" (one line, with date)
2. Update "Current Focus" if it changed
3. Add any blockers to "Blocked / Questions"
4. Commit: `docs: update project manifest`
