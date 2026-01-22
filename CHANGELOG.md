# Changelog

All notable changes to PoGO Pal are documented here.

---

## [3.3.29] - 2026-01-21

### Changed
- **Best Counters grid spacing**: Increased row gap from `--space-md` (16px) to `--space-lg` (24px) - reduces spreadsheet density

---

## [3.3.28] - 2026-01-21

### Summary
Reduce mobile "squish" via section rhythm + inner gutter. Tokenized hardcoded padding values.

### Changed
- **Section header rhythm**: `.carousel-header` padding reduced from `6px 2px` to `var(--space-xs)` (4px) - headers feel like labels, not dividers
- **Content spacing**: `.carousel-content` padding changed from `16px 8px` to `var(--space-md)` (16px all sides) - more breathing room after headers
- **Inner gutter**: `.window-content` padding increased from `12px` to `var(--space-md)` (16px) - content no longer pressed against frame

### Technical
- Replaced 3 hardcoded padding values with token references
- No visual redesign - same borders, bevels, typography

### Review
Open Versus tab with 2+ types selected to see the spacing improvements.

---

## [3.3.27] - 2026-01-21

### Changed
- **Button shadows**: Enhanced from `0 2px 0` to `2px 3px 0` (adds right-side shadow)
- **Type result icons**: Now use `var(--btn-shadow)` token for consistent raised-button look

---

## [3.3.26] - 2026-01-21 (Stable Baseline)

### Summary
Stable baseline release after cleanup sprint. Production-ready with full tap-target compliance, robust error handling, and comprehensive documentation.

### Added
- **Tap target verification**: `verifyTapTargets()` debug function checks all interactive elements
- **Carousel dot hit areas**: 12px visual dots now have 44px hit areas for mobile accessibility
- **Sentry breadcrumbs**: Boot sequence, CSV parsing, and user action trails for debugging
- **Component size tokens**: `--icon-btn-size`, `--chip-size`, `--icon-size`, `--icon-size-sm`, `--tap-target-min`
- **Frame border token**: `--border-frame` for consistent appbar/footer styling

### Fixed
- **Production crash**: `dom.tableHeaders` undefined error (orphaned DOM reference)
- **Tap target compliance**: All interactive elements now meet 44px minimum
- **Verifier stability**: Now checks ALL visible elements, not just first match
- **Window tab hit area**: Added explicit `min-width: 44px` to prevent narrow tab failures

### Changed
- **Hit area pattern**: All `::before` pseudo-elements now include `pointer-events: none`
- **Verifier output**: Shows total/visible/hidden counts, worst measurement, detailed breakdown

### Removed
- **Dead code**: 594 lines (10.3% of codebase)
  - 19 orphaned DOM references
  - 7 unused functions
  - ~40 dead CSS selectors
  - Duplicate dark mode media query block
- **Hardcoded values**: 24 magic numbers replaced with tokens

### Documentation
- Complete rewrite of `CLAUDE.md` as comprehensive handoff document
- Created `CHANGELOG.md` (this file)
- Four audit reports in `docs/audits/`

---

## [3.3.25] - 2026-01-21

### Added
- `pointer-events: none` to all hit-area pseudo-elements
- Carousel dot hit-area expansion (44px)
- `verifyTapTargets()` debug function (initial version)

### Fixed
- Hit-area pseudo-elements potentially intercepting clicks

---

## [3.3.24] - 2026-01-21

### Added
- Tap target enforcement via `::before` pseudo-element pattern
- `--tap-target-min: 44px` token

### Changed
- `.type-pill .icon-chip` uses `--icon-size-sm` token
- Removed redundant context overrides for icon sizes

### Removed
- 21 unused CSS tokens from `:root` and theme blocks

---

## [3.3.23] - 2026-01-21

### Added
- Component size tokens (`--icon-btn-size`, etc.)
- `--border-frame` token for appbar/footer borders

### Changed
- Tokenized all hardcoded component sizes
- JS inline styles converted to class toggles

### Removed
- Dead `updateStickyMetrics()` function
- Unused JS inline style assignments

---

## [3.3.22] - 2026-01-21

### Fixed
- `dom.tableHeaders` undefined crash in production
- Added try/catch wrappers for non-critical module loads

### Added
- Sentry release tags (`pogo-pal@X.Y.Z`)
- Error context with state snapshots
- Boot sequence breadcrumbs

---

## [3.3.21] - 2026-01-21

### Removed
- 594 lines of dead code
- 19 orphaned DOM references from `dom.js`
- 7 unused functions from `render.js` and `state.js`
- ~40 dead CSS selectors (modebar, utility-row, etc.)
- Duplicate dark mode media query (~70 lines)

---

## [3.3.20] - 2026-01-21

### Changed
- Carousel consolidated to 2 pages with interactive popups
- Smaller carousel dots with tighter spacing

---

## Prior Versions

See `docs/HANDOFF.md` for historical changelog from v29-v35 and v3-refactor.

---

## Versioning

This project uses semantic versioning: `MAJOR.MINOR.PATCH`

- **MAJOR**: Breaking changes or major feature releases
- **MINOR**: New features, backward compatible
- **PATCH**: Bug fixes, cleanup, documentation

Current release series: **3.3.x** (v3 refactored architecture, feature iteration)
