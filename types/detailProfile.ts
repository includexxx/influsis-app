import { ImageSourcePropType } from 'react-native';

// Shared optional fields repeated across Brand/Campaign/Influencer for
// their respective detail screens (BrandDetails/CampaignDetails/
// InfluencerProfile) - each has its own full-bleed banner photo, an
// overlapping avatar/logo, and a verified badge. `website` is
// deliberately NOT included here even though Brand and Campaign both have
// it - Influencer has no website concept, so adding it here would leak an
// unused field onto a type that doesn't have one.
export interface DetailProfileFields {
  bannerImage?: ImageSourcePropType;
  avatar?: ImageSourcePropType;
  verified?: boolean;
}
