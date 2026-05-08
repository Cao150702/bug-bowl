# UI/UX Design Iterations — Bug Bowl

## Date: 2026-05-08

---

## Iteration 1: Initial Layout

### Design
Left: Editor (title + body) | Right: Quality Meter (score + checklist)

### Problem
- Quality meter looks too plain — just a number
- No visual hierarchy between score and checklist items

### Fix
- Added score level label ("High Quality" / "Needs Improvement" / "Low Quality")
- Color-coded score (green/yellow/red)
- Added "Clear" button for reset

---

## Iteration 2: AI Result Placement

### Initial Design
AI result replaces rule score when available.

### Problem
User loses the rule-based score after AI runs. Both are useful.

### Fix
- AI result goes in a separate card below the rule score
- Both visible simultaneously
- AI card includes confidence + severity + suggestion

---

## Iteration 3: Examples Section

### Problem
Users don't know what "good" looks like. Score of 85 is meaningless without context.

### Fix
- Added "Quality Examples" section at the bottom
- Side-by-side comparison: Low Quality (15) vs High Quality (85)
- Concrete examples with actual titles and body snippets

---

## Iteration 4: Mobile Responsive

### Problem
Grid layout breaks on mobile — editor and score meter stack poorly.

### Fix
- `md:grid-cols-3` for desktop, `grid-cols-1` for mobile
- Score meter moves below editor on mobile
- Text sizes scale appropriately

---

## Key Decisions

| Decision | Rationale |
|----------|-----------|
| Real-time scoring (no debounce) | Rule-based scoring is instant, no need for debounce |
| AI only when score > 30 | Save API costs, low-score reports aren't worth AI analysis |
| Separate cards for rule/AI | Both provide different value, user needs to see both |
| Monospace font for bug body | Users write code/logs, monospace is more natural |

---

## What I Learned

1. **Progressive disclosure** — show rule score first (instant), AI analysis second (async)
2. **Context is king** — a score number alone is useless; examples make it meaningful
3. **Design for the worst case** — most bug reports are bad; the UI should guide users to improve
