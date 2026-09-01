# Design System: Cavos developer console

## 1. Visual Theme & Atmosphere

Simple white operational console. Hairline gray, black type, indigo only on primary actions. Privy is the IA reference, not a visual clone.

- **Density:** 7
- **Variance:** 2
- **Motion:** 3

Personality: precise, sober, trustworthy.

## 2. Color Palette & Roles

- **Rail / Canvas / Panel** (`#FFFFFF`)
- **Surface** (`#F7F7FB`) — inputs, selected rows, table headers
- **Ink** (`#0A0A0F`)
- **Muted** (`#555561`)
- **Line** (`#ECECF0`)
- **Electric Indigo** (`#402AFF`) — primary buttons, focus, data bars

Selected: `bg-surface text-ink`. Never cream, never a painted indigo rail, never a dark navy field.

## 3. Typography Rules

- **UI / titles:** Geist. Page titles are semibold, not a display face.
- **Mono:** Geist Mono — identifiers and metrics
- **Ramagothic:** marketing only. Never on the console.
- Sidebar uses the mark alone

## 4. Layout and navigation

The console is the selected app. The mark sits at the top of the rail, then the app picker. App sections in the sidebar. Billing sits on the rail above app Settings, always. Footer profile opens the developer profile and workspace settings. Picker switches org and app.

## 5. Component Stylings

- **Panel:** white, hairline, 8px, no shadow
- **Buttons:** primary indigo. Secondary / ghost lift with black alpha
- **Status:** sentence-case text. Color carries meaning. No dots, no tracked caps, no pastel pills.
- **Empty state:** dashed line, no brand flood

## 6. Motion & Interaction

Feedback only. 150–250ms. `prefers-reduced-motion` respected.

## 7. Anti-Patterns (Banned)

- Gradients, grain, watermarks, dark navy fields
- Painted `#402AFF` sidebar
- Lavender / cream canvas or selected wash
- OAuth / session-keys copy
- Ramagothic (or any display face) on dashboard titles
- Pastel status tags (cream, mint, blush fills)
- Square bullets or tracked all-caps labels (PRODUCTION, HEALTHY)
