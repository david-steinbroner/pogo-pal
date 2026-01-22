# PoGO Pal - Project Handoff Document

> **Stable Baseline: v3.3.26** (2026-01-21)
> This is the single source of truth for a new dev/chat to pick up work.

---

## A. Current App State

### Version
**v3.3.26** - Stable baseline with full tap-target compliance and production error handling.

### What It Does
PoGO Pal is a Pokemon GO companion app for battle preparation. Privacy-first: all processing happens client-side, no data leaves the browser.

### Screens

| Tab | Status | Description |
|-----|--------|-------------|
| **Versus** | Functional | Battle assistant - select opponent types, see recommended move types and Pokemon counters |
| **Collection** | Placeholder | "Coming soon" - will show your Pokemon collection from CSV import |
| **Trade** | Placeholder | "Coming soon" - will help find good trade candidates |

### Versus Tab Features
- **Type Grid**: 18-type picker to select opponent's types (multi-select)
- **Move Type Recommendations**: Shows which move types to use/avoid
- **Budget Counters**: Curated counter recommendations for each type (no CSV required)
- **Your Pokemon**: If you upload a Poke Genie CSV export, shows your best counters (section collapsed by default)
- **Carousel**: Swipeable 2-page layout for recommendations

### Known Limitations (MVP Cuts)
- Collection/Trade tabs are placeholders
- No raid boss quick-select (planned)
- No regional filter for budget counters (planned)
- No individual Pokemon analysis (planned)

### Debug Mode
Enable via URL parameter or localStorage:
```
http://localhost:8000/?debug=1
```
Or in console:
```javascript
localStorage.setItem('debug', '1');
location.reload();
```

Debug mode enables:
- `verifyTapTargets()` function in console
- Additional console logging
- Sentry breadcrumb trails

---

## B. Recent Work Summary (v3.3.20 → v3.3.26)

### The Cleanup Sprint
This baseline represents a focused cleanup and hardening pass that reduced the codebase by 10% and eliminated all known production issues.

**Dead Code Removal (594 lines, 10.3% reduction)**
The codebase had accumulated orphaned DOM references and unused functions from prior feature iterations. A systematic audit removed 19 orphaned DOM refs (for elements no longer in HTML), 7 unused functions, ~40 dead CSS selectors, and a duplicated 70-line dark mode media query block.

**Style Tokenization (24 hardcoded values eliminated)**
Magic numbers like `32px` for icon buttons and `28px` for chips were scattered throughout CSS. New component size tokens (`--icon-btn-size`, `--chip-size`, `--icon-size`, `--icon-size-sm`, `--tap-target-min`) now provide single points of control. Frame border colors were tokenized as `--border-frame` for consistent theming.

**Production Crash Fix**
A production error (`dom.tableHeaders` undefined) was occurring because `tableHeaders` had been removed from the DOM but its reference remained in `dom.js`. The root cause was failing to validate DOM ref removals against all usages.

Guardrails added:
- Try/catch wrappers around non-critical module loads
- Sentry release tags (`pogo-pal@X.Y.Z`) for version tracking
- Breadcrumb trails for boot sequence, CSV parsing, and user actions
- Extra error context (state snapshots, timestamps)

**Tap Target Enforcement**
All interactive elements now meet the 44px minimum hit area for accessibility (`--tap-target-min`). The pattern uses a `::before` pseudo-element positioned absolutely, centered with `transform: translate(-50%, -50%)`, with `min-width` and `min-height` set to the tap target minimum. The visual face can be smaller (e.g., carousel dots are 12px visually but have 44px hit areas).

Seven component classes use this pattern: `.icon-btn`, `.sheet-btn`, `.window-tab`, `.drawer-close-btn`, `.collapsible-toggle`, `.modal-close-btn`, `.upload-action-btn`, and `.carousel-dot`.

**Verification Function**
`verifyTapTargets()` runs automatically in debug mode and is exposed on `window` for manual testing. It checks ALL instances of each selector, filters to visible elements, and reports the worst measurement. A passing check shows all components with hit areas >= 44px.

---

## C. Guardrails / Rules (Do Not Regress)

### Interactive Element Classes
All clickable elements must use a base class with hit-area expansion:
- `.icon-btn` - Icon buttons (32px visual, 44px hit)
- `.sheet-btn` - Sheet/panel buttons (36px visual, 44px hit)
- `.window-tab` - Tab buttons (variable visual, 44px hit)
- `.drawer-close-btn` - Drawer close buttons (28px visual, 44px hit)
- `.carousel-dot` - Carousel pagination dots (12px visual, 44px hit)
- `.collapsible-toggle` - Collapsible section toggles
- `.modal-close-btn` - Modal close buttons
- `.upload-action-btn` - Upload action buttons

### Sizing Rules
- **Never** set `width`/`height` directly on interactive elements
- Size the inner face (icon, text) with tokens
- Let the hit-area `::before` pseudo-element handle tap compliance
- Use component tokens: `--icon-btn-size`, `--chip-size`, `--icon-size`, `--icon-size-sm`

### Token Philosophy
- "Two is a pattern, three is a policy"
- If you need a third variant of a size, mint a token
- Context-specific overrides go on the container, not one-off classes

### DOM Reference Safety
- When removing an element from HTML, search for all references in JS
- Validate against: `dom.js`, `render.js`, `events.js`, `app.js`
- Use `grep -r "elementId" src/` to find usages
- Never assume "it's probably not used"

### Error Handling
- Non-critical module loads wrapped in try/catch
- Sentry release version matches HTML version tag
- Breadcrumbs added for major operations (boot, CSV parse, user actions)
- Error context includes state snapshots

---

## D. Baseline Verification Checklist (2 minutes)

Run this before shipping any changes:

### 1. Normal Mode (no errors)
```
http://localhost:8000/
```
- [ ] App loads without error banner
- [ ] No console errors (F12 → Console)
- [ ] Versus tab shows type grid and recommendations

### 2. Debug Mode (tap targets)
```
http://localhost:8000/?debug=1
```
- [ ] Run `verifyTapTargets()` in console
- [ ] All components show `✅` (PASS)
- [ ] Final line: "All tap targets compliant"
- [ ] Run twice in succession - results are consistent

### 3. Navigation (no regressions)
- [ ] Switch to Collection tab - "Coming soon" shows
- [ ] Switch to Trade tab - "Coming soon" shows
- [ ] Switch back to Versus tab - type grid intact
- [ ] Open About drawer (? button) - drawer opens
- [ ] Close drawer - drawer closes cleanly

### 4. Mobile Width
- [ ] Resize browser to ~375px width
- [ ] Run `verifyTapTargets()` - still all PASS
- [ ] Carousel navigation works (swipe or dots)

---

## E. Next Safe Steps

### Design Changes (Token-Driven)
- [ ] Mint `--card-padding` token (currently hardcoded in some places)
- [ ] Standardize button text sizes with a `--text-btn` token
- [ ] Add dark mode polish for new components
- [ ] Consider `--transition-*` tokens if adding animations
- [ ] Audit remaining one-off color usages

### Feature Additions (Low-Risk)
- [ ] Current Raid Bosses quick-select for VS opponent
- [ ] Regional filter dropdown for budget counters (localStorage)
- [ ] Individual Pokemon lookup (search any Pokemon)
- [ ] Collection tab: basic list view of uploaded Pokemon
- [ ] Trade tab: simple trade value indicators
- [ ] CSV import improvement: better error messages for malformed files

### Shipping Protocol
1. Create feature branch from `main`
2. Make changes in small commits
3. Run baseline verification checklist
4. Push to branch - Cloudflare Pages creates preview at `branch-name.pogo-pal.pages.dev`
5. Test preview URL on mobile Safari
6. Check Sentry for any new errors (filter by release version)
7. Merge to `main` when verified

---

## Architecture

### File Structure
```
/
├── index.html              # Entry point (loads app.js as module)
├── CLAUDE.md               # This file - project handoff
├── README.md               # Public-facing readme
├── /src/
│   ├── app.js              # Main orchestrator, CSV processing, Sentry init
│   ├── state.js            # Single source of truth (types, results, sort state)
│   ├── /csv/
│   │   ├── parseCsv.js     # CSV parsing, locale-tolerant numbers
│   │   ├── mapping.js      # Header detection, field extraction, IV calc
│   │   └── pokedex.js      # Species → type mappings (~600 Pokemon)
│   ├── /data/
│   │   └── budgetCounters.js  # Curated budget counter recommendations
│   └── /ui/
│       ├── dom.js          # DOM element references
│       ├── render.js       # UI rendering (grid, carousel, VS mode)
│       └── events.js       # Event handlers, sheet/drawer management
├── /styles/
│   └── app.css             # All CSS (~3000 lines, design system tokens)
├── /docs/
│   ├── design-system.md    # Design System v4 spec
│   ├── COMPONENTS.md       # Component documentation
│   └── /audits/            # Audit reports from cleanup sprint
└── /legacy/
    └── pogo-v3-prototype-v3_35-legacy.html  # Original monolith reference
```

### Design Direction
Pokemon handheld UI vibes (Game Boy → GBA → Nintendo DS).
**Current theme: Design System v4 "Pokedex Companion"**
- Warm cream light theme (`--bg-base: #F5F0E1`)
- Visible 2px borders, not subtle shadows
- Press Start 2P headers, VT323 body text
- 4px border-radius for GBA-era feel

### Key Constraints
- Safari-safe JS (no bleeding-edge features)
- No official Pokemon/Nintendo assets
- No build step - plain ES modules only
- All processing client-side (privacy-first)

---

## Dev Setup

```bash
cd ~/Projects/Active\ Development/pogo-pal
python -m http.server 8000
# Open http://localhost:8000
# Debug mode: http://localhost:8000/?debug=1
```

### Links
- **Production**: https://pogo-pal.pages.dev
- **Repo**: https://github.com/david-steinbroner/pogo-pal
- **Branch**: main

---

## Audit Documentation

Detailed reports from the cleanup sprint:
- `docs/audits/code-audit-2026-01-21.md` - Dead code removal details
- `docs/audits/style-tokenization-audit-2026-01-21.md` - Tokenization changes
- `docs/audits/ui-system-tuning-2026-01-21.md` - Tap target compliance
- `docs/audits/system-go-check-2026-01-21.md` - Final verification + verifier stability fix

---

## Current Focus
Combat Intelligence Suite

## Next Up
### Combat Intelligence Suite
- [ ] Current Raid Bosses: quick-select UI for active raids
- [ ] Regional filter for budget counters: localStorage persistence
- [ ] Individual Pokemon Analysis: search/browse any Pokemon

### Core Tabs
- [ ] Trade tab: full implementation
- [ ] Collection tab: full implementation

## Blocked / Questions
(none)

---

## Session End Protocol
After each working session, update this file:
1. Move completed items from "Next Up" to changelog (with date)
2. Update "Current Focus" if it changed
3. Add any blockers to "Blocked / Questions"
4. Run baseline verification checklist
5. Commit: `docs: update project manifest`
