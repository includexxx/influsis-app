# Screen Specs — Live Campaigns

| | |
|---|---|
| **Figma node** | [`6111:6871`](https://www.figma.com/design/E7VpnelWNYgzs9WoLLNeh8/Influsis-Project-Brand_App-Version?node-id=6111-6871&m=dev) — "Live campaigns" |
| **Route** | `/live-campaign` (`app/(details)/live-campaign.tsx`) |
| **Scene** | `scenes/main/LiveCampaign.tsx` |
| **Data** | `data/liveCampaigns.ts` |
| **Components used** | `ScreenHeader`, `CampaignCard` (extended with the existing `status` prop) — both existing, reused unmodified |

## Purpose

A flat list of a creator's live/ongoing campaigns. Reached from the Home tab's Active Campaigns section.

## User flow

```
/home
  │
  └─ tap "See all" on Active Campaigns (SectionHeader) → /live-campaign
                                                             │
                                                             ├─ tap back chevron (ScreenHeader) → back to /home
                                                             └─ tap a campaign card             → /campaign/[id] (docs/screen/campaign-details/README.md)
```

`/live-campaign` lives in the `app/(details)/` route group (outside the `(main)` Tabs group), the same reasoning as `/notifications` (docs/screen/notifications/README.md "Navigation") — Figma's frame has no tab bar instance, unlike `/search`'s frames, so it's pushed full-screen and popped via the back chevron rather than kept inside the tab shell. `(details)` is purely organizational (Expo Router route groups don't affect the URL) and groups every no-tab-bar screen reached via a Home "See all" link.

## Sections (top to bottom)

| # | Section | Layout | Component |
|---|---|---|---|
| 1 | Header | Back chevron + centered "Live Campaigns" title | `ScreenHeader` |
| 2 | Campaign list | Vertical stack, full-width cards | `CampaignCard` (`variant="list"`, `status="Ongoing"`) |

## No new components needed

Every piece of this screen already existed before this task: `ScreenHeader` (built for `/notifications`, its back-chevron asset is pixel-identical to this screen's own back icon — same Figma asset hash) and `CampaignCard`'s `status` prop (added for `/search`'s "Ongoing" badge). This screen is purely a new composition of existing reusable pieces plus its own data and a small `styles/liveCampaign.ts` module for its list-gap spacing — see "Reuse First" in `CLAUDE.md`.

## Scope notes

- **No real backend.** As with every other flow so far, there's no campaigns API (`docs/PRD.md` §2.2/§4.1) — content comes from the canonical `data/campaigns.ts` (re-exported as `liveCampaigns` from `data/liveCampaigns.ts` — see `docs/screen/campaign-details/README.md` "Data consolidation"), reusing the existing `Campaign` type and the campaign photos already extracted for Home (`assets/images/home/*.jpg`) rather than exporting duplicates.
- **Now tappable.** Each card's `onPress={() => router.push(\`/campaign/${item.id}\`)}` (`scenes/main/LiveCampaign.tsx`) leads to Campaign Details — see `docs/screen/campaign-details/README.md`.
- **Duplicate mock content.** Figma repeats "Bkash Branding Campaign" / "Bkash Ltd." across seven of the eight cards, with only the second card using the longer "Summer Unisex T-Shirt Fashion Collection Campaigns" title — mirrored here rather than inventing distinct campaign names Figma doesn't specify, same as `data/home.ts` and `data/search.ts`.
- **List gap confirmed at 16px**, distinct from Search's 14px and Home's 12px — each value taken directly from that screen's own Figma pixel positions rather than reusing another screen's near-but-not-quite-matching gap.
- **Entry point chosen among several candidates.** Figma's Home frames also contain a hidden "Live Campaigns" pill + avatar-stack banner (not rendered in the shipped Home screen) that could plausibly have linked here instead. Wired the existing Active Campaigns "See all" link instead — it was already a documented inert placeholder (`docs/screen/home/README.md`) with an obvious semantic match ("Active" ≈ "Live"), rather than building a new, currently-hidden Figma element to serve as the trigger.

## Navigation

- **Entry:** Home's Active Campaigns section header (`scenes/main/Home.tsx`).
- **Exit:** back chevron (`ScreenHeader`'s `onBack`) → `router.back()` to `/home`.
