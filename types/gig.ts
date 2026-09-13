import { ImageSourcePropType } from 'react-native';

export interface GigService {
  title: string;
  description: string;
}

export interface Gig {
  id: string;
  image: ImageSourcePropType;
  platforms: string;
  price: string;
  description: string;
  services?: GigService[];
  descriptionBullets?: string[];
  // Set only on a gig produced by the Create Gig flow while it's shown on
  // that flow's own preview screen (`scenes/main/CreateGigPreview.tsx`) -
  // undefined for every other (pre-existing, already-live) mock gig in
  // `data/gigs.ts`, which predates this status concept. See
  // `docs/screen/create-gig/README.md` "Cross-cutting scope notes".
  status?: 'pending';
}
