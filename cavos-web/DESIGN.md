# Cavos developer console design system

## Theme

A precise operational console. White and cool-neutral surfaces carry dense technical information; ink establishes hierarchy and electric indigo is reserved for primary actions, focus, and current selection. Success, warning, and danger colors communicate state only.

## Color

- Brand: `#402AFF`; hover `#3420D6`; soft `#ECEAFF`.
- Ink: `#0A0A0F`; muted text: `#555561` or darker on white.
- Surface: `#F7F7FB`; line: `#E0E0E6`.
- Success: dark green text on pale green; warning: dark amber on pale amber; danger: dark red on pale red.
- Body copy targets 4.5:1 contrast. Never communicate status by color alone.

## Typography

Use Geist for interface text and Geist Mono for identifiers, addresses, timestamps, and tabular figures. Product headings use a compact fixed scale and sentence case. Body prose stays within 65–75 characters; data tables may be wider.

## Layout and navigation

- Retain the global left navigation and a constrained `max-w-6xl` content area.
- Use persistent contextual tabs for app-level sections.
- Prefer aligned sections and data tables over grids of equal cards.
- Collapse navigation structurally on mobile; tables scroll or become labeled rows.
- Environment context must remain visible in app headers and filters.

## Components and states

- Panels use restrained borders and at most one level of elevation.
- Every control implements default, hover, focus-visible, active, disabled, loading, and error states.
- Loading uses shape-matched skeletons. Empty states teach the next action. Errors explain a corrective action.
- Status badges include text and/or icon. Health is expressed as passed checks, never an unexplained score.
- Destructive production actions require explicit confirmation.

## Motion

Motion communicates feedback or state only. Use property-specific CSS transitions between 150–250ms with `cubic-bezier(0.23, 1, 0.32, 1)`. Pressable controls scale to `0.97–0.98`. Avoid page-load choreography. Under `prefers-reduced-motion`, remove positional motion while retaining useful color and opacity feedback.
