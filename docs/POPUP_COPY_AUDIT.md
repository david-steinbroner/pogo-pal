# Popup Copy Audit: Truth vs Display

**Date:** 2026-01-22
**Version:** v3.3.46

---

## A. Truth Table: What Code Computes vs What Copy Says

### 1. Best Counters (Pokemon Cards)

| Aspect | Current Copy | What Code Actually Computes |
|--------|--------------|----------------------------|
| **Popup text** | `"[Pokemon] [type] will perform well against [opponent] Pokémon."` | Curated lookup from `BUDGET_COUNTERS[oppType]` |
| **Selection logic** | Implies type effectiveness calc | **Manual curation only** - sorted by tier (common→rare), then cost (low→high) |
| **Data used** | Implies dynamic analysis | Static data: name, types, fast/charged moves, tier, cost, note |
| **Mismatch** | **YES** - Copy implies computed effectiveness, but it's editorial picks |

**Actual reason items appear:** Expert-curated counters known to perform well, prioritized by accessibility (common Pokemon first, low stardust cost first).

---

### 2. Worst Counters (Pokemon Cards)

| Aspect | Current Copy | What Code Actually Computes |
|--------|--------------|----------------------------|
| **Popup text** | `"[Pokemon] [type] is weak against [opponent] Pokémon."` | `TYPE_CHART[oppType].super` lookups |
| **Selection logic** | Implies Pokemon is weak | Types opponent deals super effective damage to → common Pokemon of those types |
| **Data used** | n/a | `COMMON_POKEMON_BY_TYPE[weakType]` |
| **Mismatch** | **PARTIAL** - Copy says "weak against" which is accurate, but doesn't explain dual-type nuance |

**Actual reason items appear:** Pokemon's primary type is in the opponent's `super` list (opponent deals 1.6x damage).

---

### 3. Best Counter Types (Type Icons)

| Aspect | Current Copy | What Code Actually Computes |
|--------|--------------|----------------------------|
| **Popup text** | `"[type] Pokémon will perform well against [opponent] Pokémon."` | `eff(oppType, defenderType) < 1.0` |
| **Selection logic** | "Perform well" = vague | **Pure defense** - types that RESIST opponent's attacks |
| **Data used** | n/a | `TYPE_CHART[oppType].resist` and `.immune` lookups |
| **Mismatch** | **YES** - "Perform well" implies offense, but this is purely about taking less damage |

**Actual reason items appear:** This type takes reduced damage (0.625x or 0.39x) when hit by opponent type moves.

---

### 4. Worst Counter Types (Type Icons)

| Aspect | Current Copy | What Code Actually Computes |
|--------|--------------|----------------------------|
| **Popup text** | `"[type] Pokémon will perform well against [opponent] Pokémon."` | `TYPE_CHART[oppType].super` direct lookup |
| **Selection logic** | Says "perform well" | **Pure vulnerability** - types opponent deals super effective to |
| **Mismatch** | **CRITICAL** - Says "perform well" but shows types that are WEAK (take 1.6x damage) |

**Actual reason items appear:** This type takes super effective damage (1.6x) from opponent type moves.

---

### 5. Super Effective Move Types (Type Icons)

| Aspect | Current Copy | What Code Actually Computes |
|--------|--------------|----------------------------|
| **Popup text** | `"[type] Pokémon will perform well against [opponent] Pokémon."` | `TYPE_CHART[moveType].super.includes(oppType)` |
| **Selection logic** | "Pokémon" mentioned | **Move types** that deal super effective damage, not Pokemon types |
| **Data used** | n/a | TYPE_CHART lookups |
| **Mismatch** | **PARTIAL** - Says "Pokémon" but means move types; "perform well" is vague but directionally correct |

**Actual reason items appear:** Moves of this type deal 1.6x damage to opponent type.

---

### 6. Not Very Effective Move Types (Type Icons)

| Aspect | Current Copy | What Code Actually Computes |
|--------|--------------|----------------------------|
| **Popup text** | `"[type] Pokémon will perform well against [opponent] Pokémon."` | **BROKEN** - references `chart?.weak` which doesn't exist |
| **Selection logic** | n/a | Should find resisted move types, but returns empty arrays |
| **Mismatch** | **CRITICAL BUG** - Function is broken, returns no results |

**Bug location:** `render.js:527-529` - `chart?.weak` should be `chart?.resist`

```javascript
// CURRENT (broken):
return chart?.weak?.includes(oppType) || chart?.immune?.includes(oppType);

// SHOULD BE:
return chart?.resist?.includes(oppType) || chart?.immune?.includes(oppType);
```

---

## B. Variance Patterns with Multi-Type Opponents

### Test Case: Fire + Flying selected (e.g., Charizard-like opponent)

#### Best Counter Types Results:
| Type | Why It Appears | Reason Category |
|------|----------------|-----------------|
| Rock | Resists Flying (0.625x), neutral to Fire | **Single resistance** |
| Ground | Immune to Electric (0.39x), but Fire is SE to it | *Should not appear* - net negative |
| Electric | Resists Flying (0.625x)... wait, no - Electric resists Electric, not Flying | Logic issue |

**Analysis:** The `getBringTypesPerOpp` function finds types that resist EACH opponent type separately, then groups by opponent. A Rock-type icon under Flying means "Rock resists Flying attacks" - but the user might bring Rock thinking it's globally good, when Fire deals normal damage to it.

#### Super Effective Move Types Results:
| Type | Why It Appears | Multiplier |
|------|----------------|------------|
| Rock | SE vs Fire (1.6x) × SE vs Flying (1.6x) = **2.56x** | **Double SE** |
| Water | SE vs Fire (1.6x), neutral vs Flying | **Single SE** |
| Electric | SE vs Flying (1.6x), neutral vs Fire | **Single SE** |

**Variance pattern:** Rock appears because it's double super effective, Water/Electric appear because they're single super effective. The "why" is fundamentally different.

---

### Test Case: Dragon + Ground selected (e.g., Garchomp)

#### Best Counter Types (per opponent):
- Under Dragon column: Fairy (immune to Dragon), Steel (resists Dragon)
- Under Ground column: Flying (immune to Ground), Bug (resists Ground), Grass (resists Ground)

#### Worst Counter Types (per opponent):
- Under Dragon column: Dragon (SE from Dragon)
- Under Ground column: Fire, Electric, Poison, Rock, Steel (SE from Ground)

**Key insight:** A Pokemon like Rhyperior (Ground/Rock) would be:
- **Good** against: Nothing in particular from this matchup
- **Bad** against: Ground (takes SE from Ground), Dragon (neutral but not resistant)

But our current popup would say the same generic text for all.

---

## C. Proposed Popup Copy Templates (Constrained to Current Logic)

### For Best Counters (Pokemon Cards):
**Current:** `"[Pokemon] [type] will perform well against [opponent] Pokémon."`

**Proposed:** `"[Pokemon] is a recommended counter for [opponent] types."`

*Rationale:* Doesn't imply computed effectiveness - acknowledges it's a recommendation.

---

### For Worst Counters (Pokemon Cards):
**Current:** `"[Pokemon] [type] is weak against [opponent] Pokémon."`

**Proposed (keep as-is):** `"[Pokemon] [type] is weak against [opponent] Pokémon."`

*Rationale:* Already accurate - the Pokemon's type takes super effective damage.

---

### For Best Counter Types:
**Current:** `"[type] Pokémon will perform well against [opponent] Pokémon."`

**Proposed:** `"[type] Pokémon resist [opponent] attacks."`

*Rationale:* Specifically describes what we computed (resistance), not vague "perform well".

---

### For Worst Counter Types:
**Current:** `"[type] Pokémon will perform well against [opponent] Pokémon."` (WRONG)

**Proposed:** `"[type] Pokémon take extra damage from [opponent] attacks."`

*Rationale:* Inverts the meaning to match actual display (these are types to AVOID).

---

### For Super Effective Move Types:
**Current:** `"[type] Pokémon will perform well against [opponent] Pokémon."`

**Proposed:** `"[type] moves deal extra damage to [opponent] Pokémon."`

*Rationale:* Clarifies we mean move types, not Pokemon types. Specifies "extra damage" = super effective.

---

### For Not Very Effective Move Types:
**Current:** `"[type] Pokémon will perform well against [opponent] Pokémon."` (WRONG + BROKEN)

**Proposed (after bug fix):** `"[type] moves deal reduced damage to [opponent] Pokémon."`

*Rationale:* Inverts meaning for "avoid" context + clarifies it's about moves.

---

## D. Optional Future Enhancements (Scoped)

### Enhancement 1: Add Multiplier Badges

Show the actual effectiveness multiplier on icons:

```
[2.56x] Rock    ← Double super effective
[1.6x]  Water   ← Single super effective
[0.39x] Steel   ← Double resistance
```

**Implementation scope:**
- Modify `renderTypeIconColumnLayout` to accept multiplier data
- Add small badge element to icons
- Compute multiplier using existing `combinedAttackMult()` function

**Benefit:** Users understand WHY Rock is better than Water without needing different copy.

---

### Enhancement 2: Reason Categories in Popup

Add a small reason tag to popups:

```
"Rock moves deal extra damage to Fire + Flying Pokémon."
[DOUBLE SUPER EFFECTIVE]
```

Categories:
- `DOUBLE SUPER EFFECTIVE` - 2.56x multiplier
- `SUPER EFFECTIVE` - 1.6x multiplier
- `DOUBLE RESISTANCE` - 0.39x taken
- `RESISTANCE` - 0.625x taken
- `IMMUNITY` - 0.39x taken (specific types)
- `RECOMMENDED` - curated picks (for Pokemon cards)

**Implementation scope:**
- Add `reasonCategory` to scored results
- Pass to popup function
- Display as small label below main text

---

## E. Bug Fix Required

### Critical Bug: `getAvoidMovesPerOpp` returns empty arrays

**File:** `src/ui/render.js:523-534`

**Issue:** References non-existent `chart?.weak` property

**Fix:**
```javascript
function getAvoidMovesPerOpp(oppTypes) {
  const result = {};
  oppTypes.forEach(oppType => {
    // Find move types that deal not very effective or no damage to this opponent
    const weakMoves = TYPES.filter(t => {
      const chart = TYPE_CHART[t.name];
      // FIX: Use 'resist' instead of 'weak'
      return chart?.resist?.includes(oppType) || chart?.immune?.includes(oppType);
    }).map(t => t.name);
    result[oppType] = weakMoves.slice(0, 3);
  });
  return result;
}
```

---

## Summary

| Section | Copy Accurate? | Logic Working? | Action Needed |
|---------|---------------|----------------|---------------|
| Best Counters | Misleading | Yes | Update copy |
| Worst Counters | Yes | Yes | None |
| Best Counter Types | Misleading | Yes | Update copy |
| Worst Counter Types | **Wrong** | Yes | Update copy (inverted meaning) |
| Super Effective Moves | Partial | Yes | Clarify "moves" |
| Not Very Effective Moves | **Wrong** | **Broken** | Fix bug + update copy |

**Priority order:**
1. Fix `getAvoidMovesPerOpp` bug (functional)
2. Fix Worst Counter Types copy (says opposite of truth)
3. Update remaining copy for clarity
