import { Pressable, StyleSheet, Text, View } from 'react-native';

import { circlesTheme } from './circles-theme';

type Props = {
  onLeadingPress?: () => void;
  onTrailingPress?: () => void;
  subtitle?: string;
  title: string;
  leadingLabel?: string;
  trailingLabel?: string;
};

export function CirclesToolbar({
  onLeadingPress,
  onTrailingPress,
  subtitle,
  title,
  leadingLabel = 'Back',
  trailingLabel,
}: Props) {
  return (
    <View style={styles.root}>
      <View style={styles.row}>
        <ToolbarButton
          label={leadingLabel}
          onPress={onLeadingPress}
          variant="muted"
        />
        <ToolbarButton
          label={trailingLabel}
          onPress={onTrailingPress}
          variant="accent"
        />
      </View>

      <View style={styles.copy}>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        <Text style={styles.title}>{title}</Text>
      </View>
    </View>
  );
}

function ToolbarButton({
  label,
  onPress,
  variant,
}: {
  label?: string;
  onPress?: () => void;
  variant: 'accent' | 'muted';
}) {
  if (!label || !onPress) {
    return <View style={styles.buttonSpacer} />;
  }

  return (
    <Pressable
      hitSlop={10}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        variant === 'accent' ? styles.buttonAccent : styles.buttonMuted,
        pressed ? styles.buttonPressed : null,
      ]}
    >
      <Text
        style={[
          styles.buttonText,
          variant === 'accent' ? styles.buttonTextAccent : styles.buttonTextMuted,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 999,
    minHeight: 38,
    minWidth: 78,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  buttonAccent: {
    backgroundColor: circlesTheme.colors.accentSoft,
    borderColor: circlesTheme.colors.edgeStrong,
    borderWidth: 1,
  },
  buttonMuted: {
    backgroundColor: circlesTheme.colors.pill,
    borderColor: circlesTheme.colors.edge,
    borderWidth: 1,
  },
  buttonPressed: {
    opacity: 0.9,
  },
  buttonSpacer: {
    minWidth: 78,
  },
  buttonText: {
    fontFamily: circlesTheme.type.bodyFamily,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  buttonTextAccent: {
    color: circlesTheme.colors.accent,
  },
  buttonTextMuted: {
    color: circlesTheme.colors.ink,
  },
  copy: {
    gap: 4,
  },
  root: {
    gap: 14,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  subtitle: {
    color: circlesTheme.colors.accent,
    fontFamily: circlesTheme.type.bodyFamily,
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  title: {
    color: circlesTheme.colors.ink,
    fontFamily: circlesTheme.type.displayFamily,
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 34,
  },
});
