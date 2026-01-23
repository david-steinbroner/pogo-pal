# Changelog

All notable changes to PoGO Pal are documented here.

---

## [3.3.61] - 2026-01-22

### Fixed
- **Layout: fixed width shrink when toggling Pokemon selector**
  - Added explicit width: 100% to selector containers
  - Moved undo toast to app level (outside layout flow)

---

## [3.3.60] - 2026-01-22

### Added
- **Opponent Pokemon: search + typeahead selection (all 819 Pokemon)**
  - Text input with live search results (replaces limited dropdown)
  - Matching priority: exact > prefix > substring > fuzzy (Levenshtein)
  - Enter key: selects exact match or shows "Add [Suggestion]?" for typos
  - Tap header pill to remove Pokemon with 4-second undo toast
  - Arrow key navigation through results

### Changed
- Helper text simplified to "Add up to 3."

---

## [3.3.59] - 2026-01-22

### Changed
- **Copy: Counter Types popups use "against" for clarity**
  - Best Counter Types: "tend to do well against" (was "into")
  - Worst Counter Types: "tend to struggle against" (was "into")

---

## [3.3.58] - 2026-01-22

### Changed
- **Copy: Opponent Pokemon popups now name the selected Pokemon + its types**
  - Best/Worst Counters: "[Counter] is a recommended counter against [Opponent] (Type1/Type2)."
  - Best/Worst Counter Types: "[Type] Pokémon tend to do well against [Opponent] (types)."
  - Super/Not Very Effective Move Types: "[MoveType] moves hit [Opponent] (types) for extra damage."
  - Opponent Types tab popups unchanged (still reference per-type)

---

## [3.3.57] - 2026-01-22

### Added
- **Opponent Pokemon tab**: New sub-tab in VS mode to select specific Pokemon as opponents
  - Select up to 3 opponent Pokemon from dropdown (MVP selector)
  - Results computed from each Pokemon's actual typing
  - Same 6 result sections as Opponent Types tab (Best/Worst Counters, Counter Types, Move Types)
  - Column headers show Pokemon name + type icons
  - Debug logging for Pokemon selection and computed results
- **State management**: Added `vsSelectedPokemon` state array with add/remove/clear functions
- **CSS styling**: Pokemon header pills and column headers with type icon badges

---

## [3.3.56] - 2026-01-22

### Changed
- **Window content**: Reduced bottom padding to reveal carousel buttons fully

---

## [3.3.55] - 2026-01-22

### Changed
- **Popup height**: Reduced vertical padding (14px/18px → 10px/12px)

---

## [3.3.54] - 2026-01-22

### Changed
- **Opponent header**: Reduced vertical padding further (22px → 18px)

---

## [3.3.53] - 2026-01-22

### Changed
- **Opponent header**: Reduced vertical padding by 6px (28px → 22px)

---

## [3.3.52] - 2026-01-22

### Fixed
- **Popup Pokemon name size**: Ensure bold names inherit correct font-size

---

## [3.3.51] - 2026-01-22

### Changed
- **Popup styling**: Pokemon names now bold, reduced top padding by 4px

---

## [3.3.50] - 2026-01-22

### Changed
- **Copy: consistent, ultra-safe second-line explanations across popups**: All 6 popup types now use "tend to" phrasing with opponent type icon in second sentence

---

## [3.3.49] - 2026-01-22

### Changed
- **Copy: clearer Best/Worst Counter popup explanations**: Second sentence now explains damage relationships in plain English

---

## [3.3.48] - 2026-01-22

### Fixed
- **Popups now accurately describe each section**: Each popup type now uses section-specific copy that matches what it represents:
  - Best/Worst Counters: Describes Pokémon counter recommendations with matchup context
  - Best/Worst Counter Types: Describes defensive Pokémon type matchups (resist vs weak to opponent)
  - Super/Not Very Effective Move Types: Describes offensive move effectiveness
- **Worst Counter Types no longer says the opposite**: Previously all type popups used generic "will perform well" copy; now worst sections correctly warn about disadvantages

---

## [3.3.47] - 2026-01-22

### Fixed
- **"Not Very Effective Move Types" was empty/incorrect**: Fixed logic bug in `getAvoidMovesPerOpp` that referenced non-existent `chart.weak` property instead of `chart.resist`. The function now correctly identifies move types that deal reduced damage to the opponent.

---

## [3.3.46] - 2026-01-22

### Changed
- **Type icon refresh**: Replaced custom glyphs with partywhale/pokemon-type-icons (MIT)
  - Centralized icon mapping in `src/data/typeIcons.js`
  - SVGs use `currentColor` for CSS-controlled glyph color
- **Neutral glyph styling**: Icon glyphs now use high-contrast neutral colors
  - Light mode: near-charcoal (`#2D3436`)
  - Dark mode: near-white (`#f0f0f4`)
- **Muted type colors**: All 18 type colors reduced ~15-20% saturation for pastel look
- **Dark mode edge treatment**: Icon tiles have subtle dark stroke for glyph contrast

---

## [3.3.45] - 2026-01-22

### Changed
- **Opponent header placeholder lines**: Empty type slots show terminal-style lines instead of empty pills
  - Lines align to bottom of grid cell, left-aligned with 4px margin
  - Uses `--btn-lo` color to match button shadow

### Removed
- **CSV upload feature**: Temporarily removed to simplify UX
  - Upload button removed from appbar
  - Upload drawer removed
  - About drawer text updated
  - Documentation preserved in `docs/REMOVED_UPLOAD_FEATURE.md`

---

## [3.3.44] - 2026-01-22

### Changed
- **Popup type pills**: Icons+text replaced with pressed-state type pills
  - Uses standard `.type-pill.is-selected` structure
  - Popup text wraps with line-height: 2

---

## [3.3.43] - 2026-01-22

### Changed
- **Larger type icon tiles + spacing adjustments**
  - Icon tiles increased from 22px to 28px with proper tap target compliance
  - Gap between icons increased from 10px to 12px
  - Carousel content padding reduced to compensate
- **Secondary popup removed entirely**
  - Deleted mini type label popup (hold-to-show behavior)
  - Removed all related DOM, CSS, and JS code
- **Primary popup copy/behavior updated**
  - New format: "[icon] Type type Pokémon will perform well against [icon] Type type Pokémon."
  - Type names now shown as text after icons
  - Press-and-hold behavior (shows while pressed, closes on release)

---

## [3.3.42] - 2026-01-22

### Changed
- **Dark mode: icon tiles add top-edge glint for better tap affordance**
  - New `--icon-tile-glint` token (`inset 0 1px 0 rgba(255,255,255,0.28)`)
  - Type result icons (Best Counter Types, Super Effective Move Types) now have subtle top highlight
  - Pressed state removes glint + flattens shadow for physical press feel

---

## [3.3.41] - 2026-01-21

### Changed
- **Dark mode: appbar icon buttons - added outer outline for button silhouette**
  - New `--appbar-btn-outline` token (`rgba(255,255,255,0.22)`)
  - Box-shadow now includes `0 0 0 1px` outline stroke + drop shadow
  - Outline persists in pressed state for consistent boundary definition

---

## [3.3.40] - 2026-01-21

### Changed
- **Dark mode: appbar icon buttons - increased bevel contrast**
  - Button bg: `#454565` → `#505075` (more visible against appbar)
  - Highlight: `#6a6a90` → `#8585b0` (brighter top/left edge)
  - Shadow: `#1a1a28` → `#252535` (darker bottom/right edge)

---

## [3.3.39] - 2026-01-21

### Changed
- **Dark mode: appbar icon buttons now have pixel bevel + stronger pressed state for clearer affordance**
  - Added appbar-specific tokens: `--appbar-btn-bg`, `--appbar-btn-hi`, `--appbar-btn-lo`, `--appbar-btn-shadow`
  - Button face slightly lighter than appbar background for contrast
  - Classic pixel bevel: bright top/left highlight, dark bottom/right shadow
  - Pressed state: inverted bevel, no shadow, translateY(2px)

---

## [3.3.38] - 2026-01-21

### Changed
- **Dark mode: appbar icon buttons now have keyline/halo for better affordance**
  - Added `--btn-keyline` token (subtle light rim)
  - Appbar icon buttons get 1px outline for edge separation against dark header

---

## [3.3.37] - 2026-01-21

### Changed
- **Dark mode: improved button elevation/affordance** - Enhanced visual cues for tappable elements
  - Button tokens: brighter top/left highlights, crisper darker shadows, more offset
  - Counter cards (flip-card): pixel bevel borders, darker shadows
  - Type chips: stronger contrast via updated `--btn-*` tokens
  - Carousel dots: button-like elevation with shadow
  - Pressed states: deeper inset effect with darker shadows

---

## [3.3.36] - 2026-01-21

### Fixed
- **Feedback form padding**: Added left/right padding to match other drawer content
- **Drawer scroll**: Added bottom margin to version number for proper scroll visibility
- **About drawer default state**: All sections now closed by default (removed `open` from VERSUS)

---

## [3.3.35] - 2026-01-21

### Changed
- **Feedback form spacing**: Tightened margins and gaps for more compact layout
  - Reduced form-group margin, label margin, checkbox/radio row height
  - Removed gap between checkbox/radio items, reduced textarea min-height

---

## [3.3.34] - 2026-01-21

### Added
- **Beta feedback form**: In-app feedback collection in About drawer
  - Rating (1-5), multi-select issues, location, freeform text, screenshot attachment
  - Stored locally in IndexedDB (no server required)
- **Owner-only export gate**: Hidden unlock gesture (7 taps on version) + passcode
  - Export all feedback as JSON
  - Clear saved feedback
  - View submission count

### Technical
- IndexedDB storage with attachment support
- Owner mode persisted via localStorage
- `?debug=1` prompts for passcode (doesn't auto-unlock)

---

## [3.3.33] - 2026-01-21

### Fixed
- **Carousel dots clipping**: Changed `#vsRecommendations` from `overflow: hidden` to `overflow-x: hidden; overflow-y: visible` so dots remain visible
- **Footer gap**: Removed `margin-top` that created unintended whitespace above footer
- **Tab strip seams**: Removed `padding` from `.window-tabs` that caused vertical line artifacts

---

## [3.3.32] - 2026-01-21

### Changed
- **Footer reformatted**: Two-line layout for better readability
- **Footer softened**: Smaller text (10px), muted color, `margin-top` breathing room above footer
- **Token-driven spacing**: Footer padding now uses `--space-xs` / `--space-md` tokens

---

## [3.3.31] - 2026-01-21

### Changed
- **Header de-squish**: Moved version tag from appbar to About drawer (tap to copy); increased appbar padding from `--space-xs` to `--space-sm`
- **Tabs de-squish**: Added `--space-xs` vertical padding to tab strip

### Added
- **Version tap-to-copy**: Version in About drawer shows "Copied!" feedback for bug reports

---

## [3.3.30] - 2026-01-21

### Changed
- **Internal section dividers**: Softened from `--border-default` to `--border-subtle` - lower contrast, less visual dominance

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
