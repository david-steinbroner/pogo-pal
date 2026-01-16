# Design System Migration Plan

## Overview

Migrate PoGO Pal from the current dark theme to Design System v4 "Pokédex Companion" light theme.

---

## Gap Audit

### What Currently Matches
- Pokemon type colors (similar palette)
- Basic spacing approach
- Component concepts (cards, buttons, pills)
- Press Start 2P font available (used as `--font-pixel`)

### What Conflicts (Must Change)

| Area | Current | Design System v4 |
|------|---------|------------------|
| **Theme** | Dark (#0b0c14, #1f2342) | Light cream (#F5F0E6, #EDE8DC) |
| **Text** | Light on dark | Dark on light (#2D3436) |
| **Fonts** | Outfit/Inter (system) | Press Start 2P + VT323 |
| **Borders** | Subtle/transparent | Visible 2px solid (#9A9282) |
| **Border radius** | 10-12px rounded | 4-8px (GBA-era feel) |
| **Cards** | Glass/blur effects | Solid borders, panel shadows |
| **Buttons** | Ghost/transparent | Bordered with depth shadows |
| **Pills** | 999px (fully round) | 4px radius |

---

## Migration Chunks

### Chunk 1: CSS Tokens & Base Styles
**Scope:** Global CSS variables and body styles
**Files:** `app/styles/app.css`
**Changes:**
- Replace `:root` color tokens with design system palette
- Update body background, text color
- Add Google Fonts import (Press Start 2P, VT323)
- Add scanline overlay effect

**Acceptance:**
- Page has warm cream background
- Text is dark charcoal
- Fonts load correctly

**Test:**
- App loads with light background
- No console errors
- Text is readable

---

### Chunk 2: App Header & Navigation
**Scope:** `.appbar`, `.modebar`, mode tabs
**Files:** `app/styles/app.css`, `app/index.html`
**Changes:**
- Restyle appbar: cream background, 3px bottom border
- Update brand styling (POGO PAL in red)
- Convert mode tabs to segmented control pattern
- Add visible borders to segmented control

**Acceptance:**
- Header has cream background with strong border
- Mode tabs look like physical buttons
- Active tab uses primary red

**Test:**
- Tab switching works
- All tabs visible and clickable

---

### Chunk 3: Cards & Panels
**Scope:** `.vs-panel`, `.vs-hero-card`, all card containers
**Files:** `app/styles/app.css`
**Changes:**
- Update card backgrounds to `--bg-surface`
- Add 2px solid borders (`--border-strong`)
- Update card headers with alt background
- Add panel shadow effect
- Reduce border-radius to 8px

**Acceptance:**
- All cards have visible borders
- Headers are visually distinct
- Inset cards have recessed appearance

**Test:**
- VS panel displays correctly
- Hero cards visible
- No overlapping/clipping issues

---

### Chunk 4: Buttons & Actions
**Scope:** `.sheet-btn`, `.icon-btn`, upload button, clear/done buttons
**Files:** `app/styles/app.css`
**Changes:**
- Primary button: red background, white text, border, depth shadow
- Secondary button: cream background, dark border
- Ghost button: transparent with hover state
- Reduce border-radius to 4px
- Add press-down effect

**Acceptance:**
- Buttons have visible borders
- Primary actions stand out in red
- Press feedback works

**Test:**
- Upload button works
- Done/Edit/Clear buttons work
- Visual feedback on click

---

### Chunk 5: Type Pills & Grid
**Scope:** Type selection grid, type indicators
**Files:** `app/styles/app.css`, `app/src/ui/render.js`
**Changes:**
- Update type pill styling: 4px radius, 1px border
- Small pills: 20px height
- Large pills: 28px height (grid selection)
- Update selected state with ring shadow
- Ensure type colors match design system

**Acceptance:**
- Type pills have squared-off GBA feel
- Selection state is clear
- Colors are correct

**Test:**
- VS type grid works
- Selection/deselection works
- Filter grid in Collection works

---

### Chunk 6: Tables & Data Display
**Scope:** Collection table, data rows
**Files:** `app/styles/app.css`
**Changes:**
- Update table headers: alt background, display font
- Add 2px border below headers
- Update row borders to subtle
- Ensure numeric cells are right-aligned
- Update hover state

**Acceptance:**
- Table headers are clearly labeled
- Borders are visible
- Data is readable in VT323

**Test:**
- Upload CSV, verify table renders
- Sorting works
- Hover states work

---

### Chunk 7: Info Rows & VS Results
**Scope:** Bring/Avoid moves display, info rows
**Files:** `app/styles/app.css`
**Changes:**
- Update info row styling
- Labels in display font (8px uppercase)
- Values in body font
- Subtle divider borders
- Text pills with type colors + labels

**Acceptance:**
- Labels are clearly distinct
- Type pills show text
- Dividers are visible

**Test:**
- Select opponent types
- Verify Bring/Avoid displays correctly

---

### Chunk 8: Forms & Inputs
**Scope:** File upload, any text inputs
**Files:** `app/styles/app.css`
**Changes:**
- Update input styling: inset background, 2px border
- Focus state with primary color border
- File upload button styling

**Acceptance:**
- Inputs have recessed look
- Focus is clear
- Upload button matches design

**Test:**
- File upload works
- Any inputs are usable

---

### Chunk 9: Help Button & Tooltips
**Scope:** Info drawer trigger, tooltips
**Files:** `app/styles/app.css`
**Changes:**
- Update help button to circular with border
- Hover state with teal color
- Update tooltip styling if present

**Acceptance:**
- Help button is clearly visible
- Hover state works

**Test:**
- Info drawer opens/closes
- Tooltip displays if present

---

### Chunk 10: Final Polish & Cleanup
**Scope:** All remaining elements, cleanup
**Files:** `app/styles/app.css`
**Changes:**
- Remove unused dark theme styles
- Clean up skin override code (consolidate to single theme)
- Verify all borders are visible
- Final consistency pass

**Acceptance:**
- No dark theme remnants
- Consistent styling throughout
- All borders visible

**Test:**
- Full app walkthrough
- All views work
- No console errors

---

## Files to Modify

| File | Changes |
|------|---------|
| `app/styles/app.css` | Major theme overhaul |
| `app/index.html` | Font imports, possible class updates |
| `app/src/ui/render.js` | Update generated class names if needed |

---

## Progress Tracking

- [x] Chunk 1: CSS Tokens & Base Styles
- [x] Chunk 2: App Header & Navigation
- [x] Chunk 3: Cards & Panels
- [x] Chunk 4: Buttons & Actions
- [x] Chunk 5: Type Pills & Grid
- [x] Chunk 6: Tables & Data Display
- [x] Chunk 7: Info Rows & VS Results
- [x] Chunk 8: Forms & Inputs
- [x] Chunk 9: Help Button & Tooltips
- [x] Chunk 10: Final Polish & Cleanup
