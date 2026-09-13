// A single row in the "What's Included" / "Requirements for buyers" lists
// on the Create Gig pricing step (Figma "Frame 1707480184" and siblings,
// node 6301:8077) - `included` backs that row's checkbox; `Requirements`
// rows reuse the same shape with `included` simply unused (no checkbox is
// rendered there).
export interface GigListItem {
  id: string;
  text: string;
  included: boolean;
}

// Mirrors `Gig["id"]`'s draft-vs-submitted lifecycle this flow introduces -
// see `slices/createGig.slice.ts`. Not merged into `types/gig.ts`'s `Gig`
// status field naming (see there) to keep the wizard's in-progress shape
// separate from the published `Gig` record shape.
export type CreateGigStatus = 'draft' | 'pending';
