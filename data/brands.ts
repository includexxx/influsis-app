import { ImageSourcePropType } from 'react-native';

// Mock content for the Brands screen (scenes/main/Brands.tsx), standing in
// for a real brands API - see docs/screen/brands/README.md "Scope notes"
// and docs/PRD.md §2.2/§4.1 (no backend exists yet).

export interface BrandLogo {
  id: string;
  source: ImageSourcePropType;
  label: string;
}

// Figma repeats a small set of real logos across its 24 grid cells (node
// 6010:16780) - row 1 (KFC/Bkash Ltd/Bkash/Uber) reuses the exact same four
// images already extracted for Home's "Brand" row (assets/images/home/
// brand-logo-*.jpg), then rows 2/5 and row 4 each repeat verbatim, and row 6
// swaps in three new logos. Mirrored here (including row 1's mismatched
// "Bkash Ltd" label on what's visibly the Bata logo) rather than inventing
// distinct brand names/logos Figma doesn't specify, same as data/home.ts,
// data/search.ts, data/liveCampaigns.ts and data/campaigns.ts.
export const brands: BrandLogo[] = [
  // Row 1
  { id: 'brand-1', source: require('@/assets/images/home/brand-logo-2.jpg'), label: 'KFC Ltd' },
  { id: 'brand-2', source: require('@/assets/images/home/brand-logo-1.jpg'), label: 'Bkash Ltd' },
  { id: 'brand-3', source: require('@/assets/images/home/brand-logo-5.jpg'), label: 'Bkash' },
  { id: 'brand-4', source: require('@/assets/images/home/brand-logo-4.jpg'), label: 'Uber' },
  // Row 2
  { id: 'brand-5', source: require('@/assets/images/brands/kay.jpg'), label: 'Kay' },
  { id: 'brand-6', source: require('@/assets/images/brands/eastasy.jpg'), label: 'Eastasy' },
  { id: 'brand-7', source: require('@/assets/images/brands/aarong.jpg'), label: 'Aarong' },
  { id: 'brand-8', source: require('@/assets/images/brands/xiomi.jpg'), label: 'Xiomi' },
  // Row 3
  { id: 'brand-9', source: require('@/assets/images/brands/techno.jpg'), label: 'Techno' },
  { id: 'brand-10', source: require('@/assets/images/brands/robi.jpg'), label: 'Robi' },
  { id: 'brand-11', source: require('@/assets/images/brands/gp.jpg'), label: 'GP' },
  { id: 'brand-12', source: require('@/assets/images/home/brand-logo-3.jpg'), label: 'Pathao' },
  // Row 4
  { id: 'brand-13', source: require('@/assets/images/home/brand-logo-1.jpg'), label: 'Bkash Ltd' },
  { id: 'brand-14', source: require('@/assets/images/home/brand-logo-1.jpg'), label: 'Bkash Ltd' },
  { id: 'brand-15', source: require('@/assets/images/home/brand-logo-5.jpg'), label: 'Bkash' },
  { id: 'brand-16', source: require('@/assets/images/home/brand-logo-4.jpg'), label: 'Uber' },
  // Row 5
  { id: 'brand-17', source: require('@/assets/images/brands/kay.jpg'), label: 'Kay' },
  { id: 'brand-18', source: require('@/assets/images/brands/eastasy.jpg'), label: 'Eastasy' },
  { id: 'brand-19', source: require('@/assets/images/brands/aarong.jpg'), label: 'Aarong' },
  { id: 'brand-20', source: require('@/assets/images/brands/xiomi.jpg'), label: 'Xiomi' },
  // Row 6
  { id: 'brand-21', source: require('@/assets/images/brands/techno.jpg'), label: 'Techno' },
  { id: 'brand-22', source: require('@/assets/images/brands/realme.jpg'), label: 'Realme' },
  { id: 'brand-23', source: require('@/assets/images/brands/vivo.jpg'), label: 'Vivo' },
  { id: 'brand-24', source: require('@/assets/images/brands/oneplus.jpg'), label: 'One Plus' },
];
