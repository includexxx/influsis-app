# Screen Specs — Order Deliver

| | |
|---|---|
| **Figma nodes** | [`6040:8590`](https://www.figma.com/design/E7VpnelWNYgzs9WoLLNeh8/Influsis-Project-Brand_App-Version?node-id=6040-8590&m=dev) "Order Deliver" (empty link field), [`6574:6219`](https://www.figma.com/design/E7VpnelWNYgzs9WoLLNeh8/Influsis-Project-Brand_App-Version?node-id=6574-6219&m=dev) "Order Deliver" (filled link field, same screen, "Order Activity" tab active), [`6040:8664`](https://www.figma.com/design/E7VpnelWNYgzs9WoLLNeh8/Influsis-Project-Brand_App-Version?node-id=6040-8664&m=dev) "Order details" (same screen, "Order Details" tab active) and [`6574:6294`](https://www.figma.com/design/E7VpnelWNYgzs9WoLLNeh8/Influsis-Project-Brand_App-Version?node-id=6574-6294&m=dev) "Balance" (delivery confirmation) |
| **Routes** | `/order/[id]/deliver` (`app/(details)/order/[id]/deliver.tsx`), `/order/[id]/delivered` (`app/(details)/order/[id]/delivered.tsx`) |
| **Scenes** | `scenes/main/OrderDeliver.tsx`, `scenes/main/OrderDelivered.tsx` |
| **Data** | `data/orders.ts` (`orders`, looked up by `id`) |
| **Components used** | `ScreenHeader`, `Image`, `Button`, `StatusBadge` (existing, reused unmodified); `TextField` (existing, extended with a new optional `inputRowStyle` prop); `OrderActivityRow`, `StepTracker` (new, `components/elements/`) |

## Purpose

Two screens forming the tail end of the Order Details flow: **Order Deliver** — a 2-tab screen ("Order Activity": a timeline + a link-submission field + "Delivery" button; "Order Details": a condensed order summary + progress tracker), reached from Order Details' "Delivery" button — and **Order Delivered** — a confirmation screen shown after submitting.

## User flow

```
/order/[id]                             (Order Details)
  │  tap "Delivery" button
  ▼
/order/[id]/deliver                     tab: Order Activity (default)
  │  timeline: {business} place the order / The order started / The order started
  │  link field: "Deliver your file here" → user types a URL
  │
  ├─ tap "Order Details" tab ─────────▶  tab: Order Details (in-place switch, no navigation)
  │                                        summary: photo, title, status badge
  │                                        meta: Purchased by / Delivery due date / Price / Order number
  │                                        "Order Tracker" card: 4-step progress list
  │                                          │
  │                                          └─ tap "Order Activity" tab ─▶ back to tab: Order Activity
  │
  ├─ tap back chevron (ScreenHeader) ─▶  router.back() to /order/[id]
  │
  └─ (Order Activity tab) tap "Delivery" button ─▶  /order/[id]/delivered
                                            │  green checkmark, "Congratulation! You have
                                            │  delivered the project", description
                                            │
                                            └─ tap "Back to Order" → router.replace('/order')
```

## Sections (top to bottom)

### Order Deliver — "Order Activity" tab

| # | Section | Layout | Component |
|---|---|---|---|
| 1 | Header | Back chevron + centered "Order details" title | `ScreenHeader` |
| 2 | Tabs | "Order Activity" / "Order Details", each with its own underline | plain `Pressable`/`Text` |
| 3 | Activity timeline | Icon + "{business} {action}" + timestamp, one row per event | `OrderActivityRow` ×3 |
| 4 | Link field | Bordered text input with a paperclip trailing icon | `TextField` |
| 5 | Submit | Filled "Delivery" button | `Button` |

### Order Deliver — "Order Details" tab

| # | Section | Layout | Component |
|---|---|---|---|
| 1 | Summary | Photo + title + status badge | `Image` + plain `Text` + `StatusBadge` |
| 2 | Meta list | Label/value rows: Purchased by, Delivery due date, Price, Order number | plain `View`/`Text` |
| 3 | Order Tracker | Pink card, heading + 4-step vertical progress list | `StepTracker` |

### Order Delivered

| # | Section | Layout | Component |
|---|---|---|---|
| 1 | Confirmation | Green checkmark badge, 2-line title, description, "Back to Order" button | `Image` + plain `Text` + `Button` |

## New component: `OrderActivityRow`

No existing row component pairs a status icon with "{subject} {verb}" rich text and a trailing timestamp — `NotificationCard` and `ConversationCard` are both closer to a tappable list-item shape (avatar, unread state) than a timeline entry. `OrderActivityRow` (`components/elements/OrderActivityRow/`) is a new, narrowly-scoped component for this one pattern: a 26×26 icon, a "{business} {action}" text group, and a lighter timestamp, with an optional `muted` flag reproducing Figma's own 3rd timeline item (its action text is a lighter `rgba(0,0,0,0.7)` than the other two, identical copy otherwise).

## New component: `StepTracker`

The "Order Details" tab's "Order Tracker" card (Figma node `6040:8719`, "Progress steps / Progress icons centered") is a vertical stepper: a completed step gets a filled pink circle + checkmark and a pink connector line down to the next step; an incomplete step gets a black circle with a white dot and a gray connector. No existing component in this app renders a connected, ordered step list, so `StepTracker` (`components/elements/StepTracker/`) is new, and deliberately generic (`title`/`description`/`completed` per step) rather than order-specific, so any future step-based flow can reuse it. The completed step's checkmark is a small white glyph composited over a plain pink `View` circle in code (the same "colored `View` + icon" approach `SuccessSheet`'s own badge uses); the incomplete step's icon is Figma's own pre-flattened black-circle-plus-white-dot asset, used as one image since it isn't a solid color a `View` could reproduce.

## Extended component: `TextField`'s new `inputRowStyle` prop

The link field's bordered box uses an 8px radius, a `rgba(0,0,0,0.2)` border and a fixed 48px height - all different from `TextField`'s original 12px-radius/`gray[100]`-border/16px-padding shape (built for Sign In/Sign Up's email/password fields). Rather than duplicating the whole component for one screen's different box shape, `TextField` gained an optional `inputRowStyle` prop that overrides its bordered row's style, applied last in the row's style array so it wins over the component's own defaults. Every existing caller (auth screens, Apply Campaign's portfolio links) is unaffected since the prop is optional.

## Scope notes

- **No real backend, and no dedicated content per order.** As with every other flow, there's no orders/delivery API (`docs/PRD.md` §2.2/§4.1). Figma's "Order Deliver" node shows one example timeline (`<business> place the order` / `<business> The order started` ×2) and one example tracker (4 steps, the first completed) - both applied identically to every order via `data/orders.ts`'s shared `detailFields.activity`/`.tracker`, the same pattern already used for Order Details' own deliverables/requirements. `<business>` is substituted with the tapped order's own `businessName` at render time rather than left as a literal placeholder; the "Order Details" tab's summary/meta rows reuse that same order's `title`/`image`/`status`/`price`/`businessName`/`deliveryDate` fields rather than Figma's independently-authored sample values ($250.00, order number `#G24510278` stays as its own new field since nothing else on `Order` covers it).
- **"Purchased by" value substituted.** Figma's own value for this row is literally the string "Purchased by" again (not an actual name) - read as a text-entry placeholder error and substituted with the order's real `businessName`, the same normalization already applied to Order Details' own title/price mismatch (`docs/screen/order-details/README.md`).
- **Tracker step copy kept verbatim.** "Your details" / "Company details" / "Invite your team" / "Add your socials" read like a generic stepper component's default placeholder content rather than order-specific copy - but since it isn't garbled or duplicated text (unlike `data/campaigns.ts`'s corrupted "About the business" paragraph), it's mirrored as-is per this project's practice of implementing real Figma copy rather than inventing replacement text.
- **The link field doesn't gate the "Delivery" button.** Figma shows both an empty-field state (node `6040:8590`) and a filled one (`6574:6219`, `https://www.tiktok.com/`) but no validation/error state for either - the field is a plain controlled `TextField` and "Delivery" always navigates forward regardless of its content, since there's no backend to actually submit a delivery to.
- **The paperclip icon is decorative.** Figma's `fi-rr-clip` icon suggests file attachment, but the filled-state frame shows a *typed URL*, not an attached-file chip - so this is a link/URL field with a decorative clip icon, not a real file picker (unlike Apply Campaign's `FilePicker`, which does open the device's image library). Kept as a static trailing icon via `TextField`'s `rightAdornment`.
- **Tabs switch in-place via local state**, not navigation - `useState<'activity' | 'details'>('activity')` in `OrderDeliver.tsx`. Each tab renders its own `borderBottomWidth`/`borderBottomColor` (gray by default, pink when active) rather than one shared absolutely-positioned indicator spanning a computed width - simpler and robust now that either tab can be active, at the cost of the underline hairline not visibly continuing through the gap between the two tabs the way Figma's single full-width line + overlaid shorter accent does.
- **Order Delivered's page shape, not `SuccessSheet`.** This app's other post-submit confirmations (`SuccessSheet`, e.g. Apply Campaign's "Successful!" popup) are all bottom sheets. Figma's "Balance" node instead shows a static page with its confirmation block vertically centered on a blank screen, not anchored to the bottom edge - wrapping it in `BottomSheet` would visibly misplace it relative to Figma. `OrderDelivered.tsx` reuses `SuccessSheet`'s exact badge treatment (91px green circle, the same `assets/images/icons/success-check.png` icon and shadow — no new asset needed) as a plain centered `View` instead.
- **A "Back to Order" button was added.** Figma's "Balance" frame has no button or back chevron at all - leaving the user with zero way to exit the confirmation screen. Every other screen in this app provides at least one navigation affordance, so a primary button (`router.replace('/order')`, returning to the Order list rather than back into the now-stale deliver/details sub-flow) was added as the minimal necessary interaction, mirroring how Apply Campaign's own `SuccessSheet` provides a "Go to campaign" CTA for the equivalent moment in that flow.
- **Description text kept as Figma's literal placeholder copy** ("Lorem Ipsum is simply dummy text of the printing and typesetting industry.") rather than invented replacement copy - the same practice this project follows for other literal (if placeholder-looking) Figma text, e.g. Applications' "List" header title.
- **Nested dynamic routes**, matching the established `app/(details)/campaign/[id]/apply.tsx` precedent for "push a sibling screen under the same dynamic id": `app/(details)/order/[id]/deliver.tsx` and `app/(details)/order/[id]/delivered.tsx` sit alongside the existing `app/(details)/order/[id].tsx`.
- **Assets.** The two timeline icons (`assets/images/order-details/activity-place-order.png`, `activity-order-started.png`), the paperclip (`clip.png`), and the two tracker step icons (`tracker-check.png`, `tracker-incomplete.png`) were extracted via `scripts/rasterize-order-deliver-assets.py`. The back chevron and "Order details" header reuse `ScreenHeader`; the confirmation badge reuses the existing `assets/images/icons/success-check.png` (Figma exports the identical `vuesax/bold/tick-square` glyph `SuccessSheet` already uses). Figma's decorative confetti/mask background on the "Balance" frame was dropped as a one-off visual flourish, the same normalization this project applies to other non-essential decorative layers (e.g. `docs/screen/search/README.md`'s "One card layer dropped").

## Navigation

- **Entry:** Order Details' "Delivery" button (`scenes/main/OrderDetails.tsx`, `onPress={() => router.push(\`/order/${order.id}/deliver\`)}`).
- **Within Order Deliver:** tapping either tab label switches `activeTab` locally - no route change.
- **Exit:** back chevron → `router.back()` to `/order/[id]`; "Order Activity" tab's "Delivery" button → `/order/[id]/delivered` → "Back to Order" → `router.replace('/order')`.
