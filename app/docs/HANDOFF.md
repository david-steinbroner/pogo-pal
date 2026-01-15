# PoGO Pal (Prototype v3) - Continuity + Product Journey Log

This is the **one file** a new chat should read to pick up work seamlessly **and** to preserve a clean story of how the product evolved.

**Design direction headline:** Pokemon handheld UI vibes (**Game Boy -> GBA -> Nintendo DS**), with the ability to shift era deliberately as the project evolves. **Current baseline:** **GBP-inspired** (pixelated uppercase headers, tactile borders, and the "?"/info icon style).

---

## Design System Compliance (Required)

**All UI changes must conform to the design system.** See: [/app/docs/design-system.md](./design-system.md)

### Quick Checklist

Before merging any UI change, verify:

- [ ] **Spacing** - Uses design tokens (`--space-xs` through `--space-2xl`)
- [ ] **Typography** - Headers use Press Start 2P, body uses VT323
- [ ] **Borders** - Visible 2px borders on cards, panels, inputs (not shadows only)
- [ ] **Border Radius** - 4px for pills/buttons, 8px for cards (not 999px rounded)
- [ ] **Colors** - Uses design system palette (warm cream backgrounds, dark text)
- [ ] **Components** - Follows documented patterns for buttons, pills, tables, etc.
- [ ] **States** - Hover, active, focus states match design system specs

### Visible Borders Requirement

Delineation must use **visible borders**, not subtle shadows alone:
- Cards/Panels: `border: 2px solid var(--border-strong)`
- Table headers: `border-bottom: 2px solid var(--border-strong)`
- Inputs: `border: 2px solid var(--border-default)`

---

## Project Structure (v3 Refactor)

The monolith has been refactored into a clean multi-file ES module architecture:

```
/app/
  index.html              # Main entry point
  /src/
    app.js                # Main orchestrator
    state.js              # Application state (single source of truth)
    /csv/
      parseCsv.js         # CSV parsing utilities
      mapping.js          # Header detection and field extraction
      pokedex.js          # Species->type mappings
    /ui/
      dom.js              # DOM element references
      render.js           # UI rendering functions
      events.js           # Event handlers
  /styles/
    app.css               # All CSS styles
  /docs/
    HANDOFF.md            # This file
/legacy/
  pogo-v3-prototype-v3_35-legacy.html  # Original monolith for reference
```

---

## Next Up (read this first when you return)

### Immediate next chunk (do this next)
- **Filtering + sorting correctness (Collection):**
  - Filtering operates on uploaded rows (type filtering matches Pokemon types)
  - "Showing X of Y" is correct (Y = uploaded total, X = filtered count)
  - Sorting applies to the filtered subset (and doesn't desync when filters change)
- Keep the "Collection" experience stable: no sticky overlap/tap-blocking regressions; Versus still works.

**Definition of done (Immediate next chunk)**
- Type filter affects the rows shown (and the count line updates)
- "Showing X of Y" is accurate
- Sorting affects the filtered rows (not the full list)
- No regressions: Collection still uploads + renders; Versus still works; sticky stack still doesn't block taps

### Big rocks (this phase)
1) Harden CSV parsing + gate debug panel (PokéGenie variants/locales; clear UI errors; debug only on failures or debug mode) - **done in v30**
2) **Filtering + sorting correctness** (operate on uploaded rows; "Showing X of Y"; sorting on filtered subset)
3) **Versus hierarchy tightening** (scan-first; Top Picks hero; compact opponent input)
4) **v3 Refactor** (modular ES6 structure) - **done in v3-refactor**

---

## Operating procedure (always follow)

**Definition of Done for any chunk**
1) Make changes in **small chunks** (avoid browser freezes).
2) Update this doc:
   - Append **2-3 bullets** to **Changelog**
   - Add **one short entry** to **Product Journey Log** (problem -> decision -> outcome)
   - Update **Next Up** if priorities changed
3) Keep constraints: Safari-safe JS, no official Pokemon/Nintendo assets.

**Delivery protocol**
- End every chunk with a **Receipt**:
  1) **What changed:** 3-8 bullets
  2) **What to test:** 3-8 bullets
  3) **Known risks:** 0-3 bullets (optional)
  4) **Next:** 1 bullet that maps to **Next Up**

---

## Changelog (append-only; update every version)

- **v3-refactor** - Refactored single-file monolith into multi-file ES module architecture. Fixed syntax errors from duplicate code fragments. Created clean separation: state.js, csv/parseCsv.js, csv/mapping.js, csv/pokedex.js, ui/dom.js, ui/render.js, ui/events.js, app.js orchestrator.
- v35 - Added a mandatory delivery protocol to the embedded handoff doc (file-first output + receipt + savepoints) to prevent truncated responses from corrupting large HTML changes.
- v30 - Hardened CSV parsing across PokéGenie variants/locales (header mapping + locale number handling) and gated CSV debug panel (debug mode or failures only).
- v29e - Added fast-find tokens and moved embedded handoff doc near the top of the HTML for instant access.
- v29d - Made the embedded handoff doc the single source of truth (no separate .md); clarified "single-file only" workflow.
- v29c - Embedded the full continuity/handoff doc inside the HTML (`#handoffDoc`) so a new chat can pick up from one file.
- v29b - Added explicit changelog bullets for the code-map mini-step (scaffolding only).
- v29a - Added Code Map + SECTION markers + stable IDs to make surgical edits safe and fast.
- v29 - Reframed nav to **Versus | Collection | Trade**; added persistent Utility Row; moved Upload into Utility Row; restyled app bar Info button.

---

## Product Journey Log (append-only)

### v3-refactor
- **Problem:** Single-file monolith had grown to ~3700 lines with accumulated syntax errors from copy/paste conflicts, making maintenance difficult.
- **Decision:** Refactor into ES module structure with clear separation of concerns (state, csv parsing, ui rendering, events).
- **Outcome:** Clean, maintainable codebase with no console errors. Modules can be independently tested and updated.
- **Next (Immediate):** Verify upload flow works end-to-end, then continue with filtering/sorting correctness.

### v35
- **Problem:** Large single-file updates were getting cut off mid-response (Continue / truncated output), risking corrupted copies.
- **Decision:** Adopt a file-first delivery protocol: always write a new versioned HTML to disk and return a short receipt.
- **Outcome:** Each chunk reliably produces a usable artifact even if the chat UI truncates output.

### v30
- **Problem:** PokéGenie CSV exports vary (headers/locales), and the debug panel was always visible/noisy.
- **Decision:** Add header mapping + locale-tolerant number parsing; show CSV debug only in debug mode or on failures.
- **Outcome:** More CSV variants parse cleanly, and the default Collection UI stays uncluttered.

### v29
- **Problem:** Upload was living in the app bar and the mode nav didn't have room to grow (Trade coming soon).
- **Decision:** Reframe nav to **Versus | Collection | Trade** and add a persistent **Utility Row** for core actions like Upload.
- **Outcome:** More predictable layout and a stable place for global utilities, with fewer future refactors.

---

## Known Issues

1. **Original monolith had syntax errors** - Duplicate code fragments from lines 2863-2898, 2998-3068, 3233-3304, and 3344-3376 caused "return statements only valid inside functions" errors. These have been cleaned up in the refactor.

2. **Safari compatibility** - Safari is strict about syntax. If you encounter errors, check for:
   - Missing semicolons
   - Trailing commas in arrays/objects
   - ES6+ features that may need polyfills

---

## How to Enable Preview Deploys (Cloudflare Pages)

1. **Ensure Cloudflare Pages is connected to GitHub**
   - Go to Cloudflare Dashboard -> Pages
   - Your `pogo-pal` project should be listed

2. **Ensure preview deployments are enabled**
   - Click on your project -> Settings -> Builds & deployments
   - Under "Preview deployments", ensure it's enabled for all branches or specific branches

3. **Verify the build configuration**
   - Build command: (leave blank for static sites)
   - Build output directory: `/app` (update this to point to the app directory)
   - Root directory: `/` or `/app` depending on your preference

4. **Push the refactor-v3 branch**
   ```bash
   git push origin refactor-v3
   ```

5. **Find your preview URL**
   - Go to Cloudflare Dashboard -> Pages -> Your project -> Deployments
   - Preview deployments appear with a unique URL like: `refactor-v3.pogo-pal.pages.dev`

---

## Receipt Format Reminder (for future assistants)

When completing a chunk, always provide:

```
## Receipt

**What changed:**
- Bullet 1
- Bullet 2
- ...

**What to test:**
- Test step 1
- Test step 2
- ...

**Known risks:** (optional)
- Risk 1
- ...

**Next:**
- What to work on next
```

---

## Local Development

To serve locally:
```bash
cd app
python -m http.server 8000
```

Then open http://localhost:8000 in your browser.

---

## Git Tags & Branches

- `legacy-monolith` tag: Points to the last commit on main before the refactor
- `refactor-v3` branch: Contains the multi-file refactored version
- `main` branch: Production (do not merge until refactor is validated)
