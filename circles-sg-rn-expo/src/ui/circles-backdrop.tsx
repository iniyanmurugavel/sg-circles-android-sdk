import { StyleSheet, View } from 'react-native';

import { circlesTheme } from './circles-theme';

export function CirclesBackdrop() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View style={styles.topGlow} />
      <View style={styles.topGlowSecondary} />
      <View style={styles.midGlow} />
      <View style={styles.bottomGlow} />
      <View style={styles.bottomGlowSecondary} />
      <View style={styles.topLine} />
      <View style={styles.grid} />
    </View>
  );
}

const styles = StyleSheet.create({
  bottomGlow: {
    backgroundColor: circlesTheme.colors.heroGlowSoft,
    borderRadius: 220,
    bottom: -120,
    height: 260,
    position: 'absolute',
    right: -30,
    width: 260,
  },
  bottomGlowSecondary: {
    backgroundColor: 'rgba(255, 201, 120, 0.08)',
    borderRadius: 240,
    bottom: 120,
    height: 180,
    left: -70,
    position: 'absolute',
    width: 180,
  },
  grid: {
    borderColor: 'rgba(175, 229, 255, 0.04)',
    borderTopWidth: 1,
    left: 24,
    position: 'absolute',
    right: 24,
    top: 200,
  },
  midGlow: {
    backgroundColor: circlesTheme.colors.heroGlow,
    borderRadius: 200,
    height: 260,
    position: 'absolute',
    right: -60,
    top: 240,
    width: 260,
  },
  topGlow: {
    backgroundColor: 'rgba(57, 227, 186, 0.2)',
    borderRadius: 220,
    height: 260,
    left: -90,
    position: 'absolute',
    top: -60,
    width: 260,
  },
  topGlowSecondary: {
    backgroundColor: 'rgba(103, 143, 255, 0.14)',
    borderRadius: 200,
    height: 220,
    position: 'absolute',
    right: -60,
    top: -30,
    width: 220,
  },
  topLine: {
    backgroundColor: 'rgba(163, 221, 255, 0.06)',
    height: 1,
    left: 24,
    position: 'absolute',
    right: 24,
    top: 120,
  },
});
