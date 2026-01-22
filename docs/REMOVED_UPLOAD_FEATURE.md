# Removed Feature: CSV Upload (2026-01-22)

## Status
**Temporarily removed** - Pivoting to non-upload workflow for now. May revisit later.

## What It Did
- Users could upload a PokeGenie CSV export of their Pokemon collection
- The app would parse the CSV and show personalized counter recommendations from their roster
- "Your Pokemon" section would appear with their best counters for each opponent type

## UI Components Removed

### Appbar Upload Button (index.html)
```html
<input accept=".csv" class="hidden-file" id="fileInput" type="file"/>
<button id="uploadBtn" class="icon-btn" type="button" aria-label="Upload CSV" title="Upload CSV">
  <svg class="icon" viewBox="0 0 20 20" aria-hidden="true">
    <path d="M3 14v3h14v-3" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="square" stroke-linejoin="miter"/>
    <path d="M10 12V3M6 7l4-4 4 4" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="square" stroke-linejoin="miter"/>
  </svg>
</button>
```

### Upload Drawer (index.html)
Located at `#uploadDrawer` - full drawer with:
- PokeGenie CSV support info
- "Coming soon" note for Pokemon HOME
- Upload action button
- Status indicator

## Code Still Present (can be reactivated)

### CSV Parsing Modules
- `src/csv/parseCsv.js` - CSV parsing with PapaParse
- `src/csv/mapping.js` - Header detection, field extraction, IV calculation

### DOM References (src/ui/dom.js)
- `fileInput`, `uploadBtn`, `uploadDrawer`, `uploadDrawerBtn`, etc.

### Event Handlers (src/ui/events.js)
- File input change handler
- Upload button click
- Drawer open/close

### Render Functions (src/ui/render.js)
- `renderYourPokemonCounters()` - renders user's Pokemon as counter recommendations

### State (src/state.js)
- `state.collection` - stores parsed Pokemon data

## CSS Classes
- `.upload-panel`, `.upload-panel-row`, `.upload-label`, `.upload-value`
- `.upload-action`, `.upload-action-btn`
- `.upload-status`, `.upload-status-icon`, `.upload-status-text`
- `.upload-coming-soon`

## To Restore
1. Add back the appbar button and hidden file input
2. Add back the upload drawer HTML
3. Verify DOM references in dom.js still work
4. Test CSV upload flow end-to-end

## Why Removed
Pivoting to focus on general counter recommendations without requiring users to upload personal data. Simplifies onboarding and removes privacy friction.
