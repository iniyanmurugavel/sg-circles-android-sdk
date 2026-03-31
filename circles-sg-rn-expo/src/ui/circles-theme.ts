import { Platform } from 'react-native';

const displayFamily =
  Platform.select({
    ios: 'AvenirNext-Bold',
    android: 'sans-serif-medium',
    default: 'system',
  }) ?? 'system';

const bodyFamily =
  Platform.select({
    ios: 'AvenirNext-Regular',
    android: 'sans-serif',
    default: 'system',
  }) ?? 'system';

const monoFamily =
  Platform.select({
    ios: 'Menlo',
    android: 'monospace',
    default: 'monospace',
  }) ?? 'monospace';

export const circlesTheme = {
  colors: {
    accent: '#39e3ba',
    accentContrast: '#041912',
    accentSoft: 'rgba(57, 227, 186, 0.14)',
    accentStrong: '#11c295',
    canvas: '#06121d',
    canvasAlt: '#0a1a29',
    card: '#0d2234',
    cardElevated: '#122d44',
    cardMuted: '#10283c',
    edge: 'rgba(163, 221, 255, 0.14)',
    edgeStrong: 'rgba(57, 227, 186, 0.3)',
    heroGlow: '#21496f',
    heroGlowSoft: 'rgba(103, 143, 255, 0.24)',
    ink: '#f5fbff',
    inkMuted: '#9bb6c8',
    pill: '#14344b',
    pillStrong: '#1a4060',
    success: '#a5f8d3',
    warning: '#ffc978',
  },
  radius: {
    large: 32,
    medium: 24,
    small: 18,
  },
  shadows: {
    card:
      Platform.select({
        ios: {
          shadowColor: '#010912',
          shadowOffset: { width: 0, height: 18 },
          shadowOpacity: 0.35,
          shadowRadius: 32,
        },
        android: {
          elevation: 12,
        },
        default: {},
      }) ?? {},
    soft:
      Platform.select({
        ios: {
          shadowColor: '#010912',
          shadowOffset: { width: 0, height: 12 },
          shadowOpacity: 0.2,
          shadowRadius: 24,
        },
        android: {
          elevation: 6,
        },
        default: {},
      }) ?? {},
  },
  type: {
    bodyFamily,
    displayFamily,
    monoFamily,
  },
};
