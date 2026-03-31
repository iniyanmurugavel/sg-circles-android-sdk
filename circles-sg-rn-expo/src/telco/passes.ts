import type { SelectedRoamPass, TravelPassId } from '../brownfield/contracts';
import { formatTravelPrice } from './pricing';

export type TravelPassOption = {
  badge: string;
  coverageSummary: string;
  dataAllowance: string;
  id: TravelPassId;
  perks: string[];
  priceAmount: number;
  priceCurrencyCode: string;
  subtitle: string;
  title: string;
};

export const travelPasses: TravelPassOption[] = [
  {
    badge: 'Best for quick hops',
    coverageSummary: 'Malaysia, Thailand, Indonesia',
    dataAllowance: '8 GB',
    id: 'city-hopper',
    perks: ['Auto-start on landing', '5G priority where available'],
    priceAmount: 12,
    priceCurrencyCode: 'SGD',
    subtitle: 'A lightweight roaming pass for short regional trips.',
    title: 'City Hopper',
  },
  {
    badge: 'Recommended',
    coverageSummary: '18 APAC and Europe destinations',
    dataAllowance: '18 GB',
    id: 'roam-like-local',
    perks: ['Daily spend guard', 'Unlimited chat apps'],
    priceAmount: 28,
    priceCurrencyCode: 'SGD',
    subtitle: 'Balanced data and premium controls for week-long travel.',
    title: 'Roam Like Local',
  },
  {
    badge: 'High-usage',
    coverageSummary: '32 destinations with hotspot support',
    dataAllowance: '35 GB',
    id: 'always-on-max',
    perks: ['Priority tethering', 'Multi-device travel hotspot'],
    priceAmount: 48,
    priceCurrencyCode: 'SGD',
    subtitle: 'For creators, operators, and heavy video or hotspot usage.',
    title: 'Always On Max',
  },
];

export function getTravelPass(passId: TravelPassId) {
  return travelPasses.find((pass) => pass.id === passId) ?? travelPasses[1];
}

export function toSelectedRoamPass(pass: TravelPassOption): SelectedRoamPass {
  return {
    coverageSummary: pass.coverageSummary,
    includedData: pass.dataAllowance,
    price: formatTravelPrice(pass.priceAmount, pass.priceCurrencyCode),
    selectedPassId: pass.id,
    selectedPassName: pass.title,
  };
}
