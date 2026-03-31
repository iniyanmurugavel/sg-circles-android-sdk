import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import type { BrownfieldRuntimeMode } from '../brownfield/runtime';
import { CirclesBackdrop } from '../ui/circles-backdrop';
import { circlesTheme } from '../ui/circles-theme';

type Props = {
  errorMessage: string | null;
  onDismiss: () => void;
  runtimeMode: BrownfieldRuntimeMode | 'booting';
  status: 'error' | 'ready' | 'waiting';
};

export function LaunchStateScreen({
  errorMessage,
  onDismiss,
  runtimeMode,
  status,
}: Props) {
  return (
    <View style={styles.container}>
      <CirclesBackdrop />
      <View style={styles.card}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {runtimeMode === 'native' ? 'Native handoff' : 'Initializing shared flow'}
          </Text>
        </View>
        {status === 'waiting' ? (
          <>
            <ActivityIndicator color={circlesTheme.colors.accent} size="large" />
            <Text style={styles.title}>Preparing Circles Roaming</Text>
            <Text style={styles.body}>
              The native app is opening the shared Expo brownfield experience and
              passing the launch payload into the roaming module.
            </Text>
          </>
        ) : (
          <>
            <Text style={styles.title}>Launch payload missing</Text>
            <Text style={styles.body}>
              {errorMessage ??
                'The shared module did not receive the launch payload from native.'}
            </Text>
            <Pressable
              onPress={onDismiss}
              style={({ pressed }) => [
                styles.button,
                pressed ? styles.buttonPressed : null,
              ]}
            >
              <Text style={styles.buttonText}>Back to native</Text>
            </Pressable>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: circlesTheme.colors.pill,
    borderColor: circlesTheme.colors.edge,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  badgeText: {
    color: circlesTheme.colors.ink,
    fontFamily: circlesTheme.type.bodyFamily,
    fontSize: 12,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  body: {
    color: circlesTheme.colors.inkMuted,
    fontFamily: circlesTheme.type.bodyFamily,
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'left',
  },
  button: {
    alignItems: 'center',
    backgroundColor: circlesTheme.colors.accent,
    borderRadius: 999,
    marginTop: 6,
    minHeight: 54,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  buttonPressed: {
    opacity: 0.92,
  },
  buttonText: {
    color: circlesTheme.colors.accentContrast,
    fontFamily: circlesTheme.type.displayFamily,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  card: {
    ...circlesTheme.shadows.card,
    backgroundColor: circlesTheme.colors.card,
    borderColor: circlesTheme.colors.edge,
    borderRadius: circlesTheme.radius.large,
    borderWidth: 1,
    gap: 18,
    maxWidth: 440,
    padding: 24,
    width: '100%',
  },
  container: {
    alignItems: 'center',
    backgroundColor: circlesTheme.colors.canvas,
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    color: circlesTheme.colors.ink,
    fontFamily: circlesTheme.type.displayFamily,
    fontSize: 26,
    fontWeight: '700',
  },
});
