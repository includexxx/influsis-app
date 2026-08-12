# Username

| | |
|---|---|
| **Figma nodes** | [`6606:5904`](https://www.figma.com/design/E7VpnelWNYgzs9WoLLNeh8/Influsis-Project-Brand_App-Version?node-id=6606-5904&m=dev) (empty), [`6606:5937`](https://www.figma.com/design/E7VpnelWNYgzs9WoLLNeh8/Influsis-Project-Brand_App-Version?node-id=6606-5937&m=dev) ("Name is Not available" error) |
| **Route** | `/profile-verification/username` (`app/(auth)/profile-verification/username.tsx`) |
| **Scene** | `scenes/profile-verification/Username.tsx` |
| **Components used** | `ProfileStepHeader`, `TextField`, `Button` |

## Purpose

Second half of step 5 of 5. Sets the handle used in the creator's public profile URL.

## UI elements

- `ProfileStepHeader` — progress bar fully filled, "5 of 5", "Set your username" heading, "Your user name will be used in your profile URL" description.
- `TextField` with a `leftAdornment` of "Influsis.com/" (a small addition to the shared `TextField` component, mirroring its existing `rightAdornment` prop) ahead of the typed handle.
- "Next" primary button.

## States

| State | Trigger | Error text |
|---|---|---|
| Empty | initial | — |
| Required | "Next" pressed with no text | "Username is required" |
| Taken | "Next" pressed with a reserved name (`admin`, `influsis`, `salman` — client-side stand-in, no backend to check real availability against, see `docs/PRD.md` §2.2/§4.1) | "Name is Not available" (matches Figma `6606:5937` exactly) |

## Navigation

- **Entry:** "Next" on `/profile-verification/bio`.
- **Exit:** "Next" → `router.push('/profile-verification/completed')`.
