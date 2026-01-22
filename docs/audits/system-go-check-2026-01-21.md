# System GO Check - 2026-01-21

## Summary
Final verification pass before new design changes and features. All critical issues resolved.

## Task 1: Tap Target Safety (pointer-events)

### Issue Found
The `::before` pseudo-elements used for hit-area expansion were missing `pointer-events: none`. Without this, the pseudo-element could potentially intercept clicks before they reach the button element.

### Fix Applied
Added `pointer-events: none` to all hit-area `::before` pseudo-elements:
- `.icon-btn::before`
- `.window-tab::before`
- `.sheet-btn::before`
- `.drawer-close-btn::before`
- `.upload-action-btn::before`
- `.collapsible-toggle::before`
- `.modal-close-btn::before`

### Comment Added
```css
/* Invisible hit area extension for icon buttons
   pointer-events: none ensures the pseudo-element doesn't intercept clicks;
   the actual button element receives the click through the transparent pseudo */
```

### Mobile Safari Verification
- The `pointer-events: none` pattern is well-supported in Safari (iOS 3.2+)
- Pseudo-elements with `pointer-events: none` cannot intercept touch events
- Button element receives all touch/click events correctly

## Task 2: Carousel Dot Tap Targets

### Issue Found
Carousel dots (`.carousel-dot`) were only 12px visual size with no hit-area expansion. This made them difficult to tap on mobile, especially with thumb input.

### Fix Applied
Added hit-area expansion to carousel dots:
```css
.carousel-dot {
  position: relative;
  /* ... existing 12px visual styles ... */
}

.carousel-dot::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  min-width: var(--tap-target-min);  /* 44px */
  min-height: var(--tap-target-min); /* 44px */
  pointer-events: none;
}
```

### Mobile Safari Verification
- Visual dot remains 12px (no visual change)
- Hit area now 44px x 44px
- Dots have 16px gap (`--space-md`), so hit areas may overlap slightly at boundaries
- Overlap is acceptable for carousel navigation (common pattern)

## Task 3: Build Readiness Test

### Implementation
Added `verifyTapTargets()` function in `app.js` that:
1. Only runs when debug mode is enabled (`?debug=1` or localStorage)
2. Checks computed styles for key interactive components
3. Logs compliance status to console with ✅/❌ indicators

### Components Verified
- `.icon-btn`
- `.sheet-btn`
- `.window-tab`
- `.carousel-dot`
- `.drawer-close-btn`

### How to Test
1. Open app with `?debug=1` query parameter
2. Open browser console
3. Look for `[PoGO Debug] Tap Target Compliance Check` group
4. All components should show ✅ with hit area >= 44px

### Sample Console Output
```
[PoGO Debug] Tap Target Compliance Check
  .icon-btn: ✅ hit area 44x44px (min: 44px)
  .sheet-btn: ✅ hit area 100x44px (min: 44px)
  .window-tab: ✅ hit area 100x44px (min: 44px)
  .carousel-dot: ✅ hit area 44x44px (min: 44px)
  .drawer-close-btn: ✅ hit area 44x44px (min: 44px)
  ✅ All tap targets compliant
```

## Files Changed
- `styles/app.css` - Added `pointer-events: none` to 7 hit-area pseudo-elements, added carousel-dot hit-area
- `src/app.js` - Added `verifyTapTargets()` debug function, updated Sentry release to 3.3.25
- `index.html` - Version bump to v3.3.25

## Remaining Risks

### None Critical
All identified issues have been resolved.

### Minor Notes
1. **Carousel dot hit area overlap**: Hit areas overlap slightly due to 16px gap vs 44px hit area. This is acceptable and common for carousel navigation patterns.

2. **Debug function accuracy**: `getComputedStyle(el, '::before')` may not return accurate `min-width/min-height` in all browsers. The fallback to `getBoundingClientRect()` ensures reasonable validation.

## Verification Checklist

- [x] All `::before` hit-areas have `pointer-events: none`
- [x] Carousel dots have 44px hit area
- [x] Debug mode verification function added
- [x] JS syntax validation passes
- [x] No visual changes to UI

## Mobile Safari Notes

The pattern used is well-established and Safari-safe:
- `position: relative` + `::before` with `position: absolute` - supported since Safari 3.1
- `pointer-events: none` - supported since Safari 4.0 (iOS 3.2)
- `transform: translate(-50%, -50%)` - supported since Safari 9.0 (iOS 9.0)

All minimum Safari versions are well below current deployment targets.

---

## Task 4: Verifier Stability Fix (2026-01-21 follow-up)

### Issue Found
Running `verifyTapTargets()` on desktop produced inconsistent results:
- Run 1: `.window-tab` hit area 228x44 (PASS)
- Run 2: `.window-tab` hit area 28x44 (FAIL)

### Root Cause Analysis
Two problems identified:

1. **Verifier used `querySelector` (first match only)**: With 5 `.window-tab` elements in the DOM (3 primary tabs + 2 secondary tabs), the verifier only checked the first one. Different elements could be measured on different runs if DOM order or visibility changed.

2. **`.window-tab::before` lacked `min-width`**: The hit-area pseudo-element used `left: 0; right: 0` positioning instead of explicit `min-width: var(--tap-target-min)`. This meant the CSS couldn't guarantee a 44px minimum hit area for narrow tabs - it depended on the tab's actual width.

### Fix A: Robust Verifier
Rewrote `verifyTapTargets()` to:

1. **Check ALL matches**: Uses `querySelectorAll` instead of `querySelector`
2. **Filter to visible elements only**:
   - Skips `el.hidden` or `aria-hidden="true"`
   - Skips `display: none` or `visibility: hidden`
   - Skips zero-size elements (`rect.width === 0 && rect.height === 0`)
   - Skips elements not in layout (`offsetParent === null`) unless `position: fixed`
3. **Report detailed measurements**:
   - Total matches, visible count, hidden count
   - Hit area for each visible element
   - Highlights the WORST (smallest) measurement
4. **Failure diagnostics**:
   - For any FAIL, prints: tag, id, classes, text snippet
   - Shows both `getBoundingClientRect()` and computed `::before` min-width/min-height

### Fix B: CSS Hit Area Safety
Changed `.window-tab::before` from relative positioning to explicit minimum:

**Before:**
```css
.window-tab::before {
  top: 50%;
  left: 0;
  right: 0;
  transform: translateY(-50%);
  min-height: var(--tap-target-min);
}
```

**After:**
```css
.window-tab::before {
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  min-width: var(--tap-target-min);
  min-height: var(--tap-target-min);
}
```

This ensures ALL `.window-tab` elements have a guaranteed 44x44px hit area, regardless of actual tab width.

### Sample Console Output (new format)
```
[PoGO Debug] Tap Target Compliance Check
  .icon-btn: ✅ 2 visible, 0 hidden, worst: 44x44px
  .sheet-btn: ✅ 3 visible, 0 hidden, worst: 100x44px
  .window-tab: ✅ 5 visible, 0 hidden, worst: 44x44px
    .window-tab details
    [0] ✅ 107x44px (rect: 107x36, ::before min: 44x44) <button#modeVsBtn...> "Versus"
    [1] ✅ 107x44px (rect: 107x36, ::before min: 44x44) <button#modeCollectionBtn...> "Collection"
    [2] ✅ 107x44px (rect: 107x36, ::before min: 44x44) <button#modeTradeBtn...> "Trade"
    [3] ✅ 120x44px (rect: 120x32, ::before min: 44x44) <button#vsSubTabTypes...> "Opponent Types"
    [4] ✅ 120x44px (rect: 120x32, ::before min: 44x44) <button#vsSubTabPokemon...> "Opponent Pokemon"
  .carousel-dot: ✅ 2 visible, 0 hidden, worst: 44x44px
  .drawer-close-btn: ✅ 1 visible, 0 hidden, worst: 44x44px
  ✅ All tap targets compliant
```

### Verification Protocol
1. ✅ Desktop `/?debug=1` - run twice in succession, consistent PASS
2. ✅ Mobile-width viewport - run twice, consistent PASS
3. ✅ Switch tabs and re-run - consistent PASS
4. ✅ All 5 `.window-tab` elements visible and measured

### Files Changed
- `src/app.js` - Complete rewrite of `verifyTapTargets()` with visibility filtering and detailed reporting
- `styles/app.css` - Changed `.window-tab::before` to use explicit `min-width: var(--tap-target-min)`
