# Pricing & Details

|                     |                                                                                                                                                                                                                                                                                                            |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Figma nodes**     | [`6301:8033`](https://www.figma.com/design/E7VpnelWNYgzs9WoLLNeh8/Influsis-Project-Brand_App-Version?node-id=6301-8033&m=dev) (empty), [`6525:6237`](https://www.figma.com/design/E7VpnelWNYgzs9WoLLNeh8/Influsis-Project-Brand_App-Version?node-id=6525-6237&m=dev) (filled)                        |
| **Route**           | `/create-gig-pricing` (`app/(details)/create-gig-pricing.tsx`)                                                                                                                                                                                                                                            |
| **Scene**           | `scenes/main/CreateGigPricing.tsx`                                                                                                                                                                                                                                                                       |
| **Components used** | `ScreenHeader`, `TextField`, `Button` (existing); `Checkbox`, `AddItemButton` (new)                                                                                                                                                                                                                      |

## Purpose

Step 2 of 3. Price, delivery time, a checkbox+text "What's Included" feature list, and a "Requirements for buyers" text list.

## UI elements

- `ScreenHeader` — same "Create new gig" header as the basics step.
- `TextField` "Enter your price" — numeric keyboard, no label (Pricing section heading covers both this and Delivery Time).
- `TextField` "Delivery Time" — plain text (e.g. "5 days"); no chevron/dropdown affordance in Figma, unlike Category on the basics step.
- "What's Included" — 3 `Checkbox` + `TextField` ("Add feature") rows by default, matching Figma's empty state; `AddItemButton` appends more rows.
- "Requirements for buyers" — 1 multiline `TextField` ("What do you need to get started?") by default; `AddItemButton` appends more.
- "Next" primary button — disabled until price, delivery time, and at least one non-empty feature are present.

## States

| State         | Trigger                                                                 |
| ------------- | ------------------------------------------------------------------------ |
| Feature unchecked | initial, or its `Checkbox` tapped again                              |
| Feature checked   | `Checkbox` tapped — swaps in the pink `checkbox-checked.png` asset   |
| Next disabled     | price / delivery time empty, or every feature row is empty           |

## Scope notes

Figma's filled "What's Included" example (node `6525:6237`) shows a small platform-logo icon per row instead of a checkbox once checked - not a specified, extractable icon set (one example only), so the checkbox stays a plain "include this in the published gig" toggle. See the flow [README](./README.md) "Cross-cutting scope notes" for the "Requirements for buyers" list-vs-textarea decision.

## Navigation

- **Entry:** "Next" on `/create` (basics step).
- **Exit:** "Next" → `router.push('/create-gig-preview')`.
