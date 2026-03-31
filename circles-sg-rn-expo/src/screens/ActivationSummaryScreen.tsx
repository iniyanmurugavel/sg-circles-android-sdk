import { useEffect, useEffectEvent } from 'react';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import type {
  CirclesRoamLaunchContext,
  RoamActivationHandoff,
} from '../brownfield/contracts';
import { parseFormattedTravelPrice } from '../telco/pricing';
import { getTravelPass } from '../telco/passes';
import { CirclesBackdrop } from '../ui/circles-backdrop';
import { CirclesToolbar } from '../ui/CirclesToolbar';
import { circlesTheme } from '../ui/circles-theme';

type Props = {
  handoff: RoamActivationHandoff;
  launchContext: CirclesRoamLaunchContext;
  notifyScreenView: (screenName: string) => void;
  onActivate: () => void;
  onBack: () => void;
};

export function ActivationSummaryScreen({
  handoff,
  launchContext,
  notifyScreenView,
  onActivate,
  onBack,
}: Props) {
  const selectedPass = getTravelPass(handoff.selectedPassId);
  const onScreenVisible = useEffectEvent(() => {
    notifyScreenView('activation-summary');
  });

  useEffect(() => {
    onScreenVisible();
  }, [handoff.correlationId, onScreenVisible]);

  return (
    <SafeAreaView style={styles.screen}>
      <CirclesBackdrop />
      <ScrollView
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <CirclesToolbar
          leadingLabel="Back"
          onLeadingPress={onBack}
          subtitle="Shared Roaming Flow"
          title="Activation Summary"
        />

        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <View style={styles.heroCopy}>
              <Text style={styles.kicker}>Activation Summary</Text>
              <Text style={styles.title}>{handoff.selectedPassName} is ready.</Text>
              <Text style={styles.body}>
                The shared SDK has assembled the final activation payload and can hand
                it back to the native app with the same contract identifiers.
              </Text>
            </View>
            <PriceLockup caption="per trip" price={handoff.price} />
          </View>

          <View style={styles.summaryGrid}>
            <SummaryTile label="Destination" value={handoff.destinationName} />
            <SummaryTile label="Included data" value={handoff.includedData} />
            <SummaryTile label="Captured at" value={formatCapturedAt(handoff.capturedAt)} />
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Subscriber activation view</Text>
          <Text style={styles.cardBody}>
            This is the final confirmation state before the native app commits the
            purchase and updates the subscriber record.
          </Text>

          <MetricRow label="Selected pass" value={handoff.selectedPassName} />
          <MetricRow label="Coverage" value={handoff.coverageSummary} />
          <MetricRow label="Line" value={launchContext.lineNumber} />
          <MetricRow label="Current plan" value={launchContext.currentPlanName} />

          <View style={styles.perkList}>
            {selectedPass.perks.map((perk) => (
              <PerkRow key={perk} text={perk} />
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Native callback payload</Text>
          <Text style={styles.cardBody}>
            The host app receives this data through the
            `circles.roaming.completed` message.
          </Text>

          <MetricRow label="Pass ID" value={handoff.selectedPassId} />
          <MetricRow label="Session ID" value={launchContext.sessionId} />
          <MetricRow label="Correlation ID" value={handoff.correlationId} />
          <MetricRow label="Source screen" value={launchContext.sourceScreen} />
        </View>

        <View style={styles.ctaCard}>
          <View style={styles.ctaCopy}>
            <Text style={styles.ctaLabel}>Final handoff</Text>
            <Text style={styles.ctaTitle}>Return activation to the native shell</Text>
            <Text style={styles.ctaBody}>
              Native keeps ownership of checkout, analytics, and subscriber state. The
              shared module returns only the confirmed payload.
            </Text>
          </View>

          <Pressable
            onPress={onActivate}
            style={({ pressed }) => [
              styles.primaryButton,
              pressed ? styles.primaryButtonPressed : null,
            ]}
          >
            <Text style={styles.primaryButtonText}>Activate in Native App</Text>
          </Pressable>

          <Pressable
            onPress={onBack}
            style={({ pressed }) => [
              styles.secondaryButton,
              pressed ? styles.secondaryButtonPressed : null,
            ]}
          >
            <Text style={styles.secondaryButtonText}>Back to Travel Passes</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function formatCapturedAt(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('en-SG', {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
  }).format(date);
}

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metricRow}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

function PerkRow({ text }: { text: string }) {
  return (
    <View style={styles.perkRow}>
      <View style={styles.perkDot} />
      <Text style={styles.perkText}>{text}</Text>
    </View>
  );
}

function PriceLockup({ caption, price }: { caption: string; price: string }) {
  const { amount, currencyCode } = parseFormattedTravelPrice(price);

  return (
    <View style={styles.priceLockup}>
      <View style={styles.priceRow}>
        <Text style={styles.priceCurrency}>{currencyCode}</Text>
        <Text style={styles.priceAmount}>{amount}</Text>
      </View>
      <Text style={styles.priceCaption}>{caption}</Text>
    </View>
  );
}

function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryTile}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
    color: circlesTheme.colors.inkMuted,
    fontFamily: circlesTheme.type.bodyFamily,
    fontSize: 16,
    lineHeight: 24,
  },
  card: {
    ...circlesTheme.shadows.soft,
    backgroundColor: circlesTheme.colors.cardMuted,
    borderColor: circlesTheme.colors.edge,
    borderRadius: circlesTheme.radius.medium,
    borderWidth: 1,
    gap: 14,
    padding: 20,
  },
  cardBody: {
    color: circlesTheme.colors.inkMuted,
    fontFamily: circlesTheme.type.bodyFamily,
    fontSize: 14,
    lineHeight: 21,
  },
  cardTitle: {
    color: circlesTheme.colors.ink,
    fontFamily: circlesTheme.type.displayFamily,
    fontSize: 22,
    fontWeight: '700',
  },
  contentContainer: {
    gap: 18,
    paddingBottom: 40,
    paddingHorizontal: 20,
    paddingTop: 14,
  },
  ctaBody: {
    color: circlesTheme.colors.inkMuted,
    fontFamily: circlesTheme.type.bodyFamily,
    fontSize: 14,
    lineHeight: 21,
  },
  ctaCard: {
    ...circlesTheme.shadows.card,
    backgroundColor: circlesTheme.colors.cardElevated,
    borderColor: circlesTheme.colors.edgeStrong,
    borderRadius: circlesTheme.radius.large,
    borderWidth: 1,
    gap: 14,
    marginBottom: 8,
    padding: 20,
  },
  ctaCopy: {
    gap: 6,
  },
  ctaLabel: {
    color: circlesTheme.colors.accent,
    fontFamily: circlesTheme.type.bodyFamily,
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  ctaTitle: {
    color: circlesTheme.colors.ink,
    fontFamily: circlesTheme.type.displayFamily,
    fontSize: 24,
    fontWeight: '700',
  },
  heroCard: {
    ...circlesTheme.shadows.card,
    backgroundColor: circlesTheme.colors.card,
    borderColor: circlesTheme.colors.edge,
    borderRadius: circlesTheme.radius.large,
    borderWidth: 1,
    gap: 18,
    padding: 22,
  },
  heroCopy: {
    flex: 1,
    gap: 8,
  },
  heroTopRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 16,
  },
  kicker: {
    color: circlesTheme.colors.accent,
    fontFamily: circlesTheme.type.bodyFamily,
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  metricLabel: {
    color: circlesTheme.colors.inkMuted,
    fontFamily: circlesTheme.type.bodyFamily,
    fontSize: 13,
  },
  metricRow: {
    alignItems: 'center',
    borderTopColor: circlesTheme.colors.edge,
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
  },
  metricValue: {
    color: circlesTheme.colors.ink,
    flexShrink: 1,
    fontFamily: circlesTheme.type.monoFamily,
    fontSize: 12,
    textAlign: 'right',
  },
  perkDot: {
    backgroundColor: circlesTheme.colors.accent,
    borderRadius: 999,
    height: 7,
    marginTop: 7,
    width: 7,
  },
  perkList: {
    gap: 8,
    paddingTop: 6,
  },
  perkRow: {
    flexDirection: 'row',
    gap: 10,
  },
  perkText: {
    color: circlesTheme.colors.ink,
    flex: 1,
    fontFamily: circlesTheme.type.bodyFamily,
    fontSize: 14,
    lineHeight: 21,
  },
  priceAmount: {
    color: circlesTheme.colors.ink,
    fontFamily: circlesTheme.type.displayFamily,
    fontSize: 32,
    fontWeight: '700',
  },
  priceCaption: {
    color: circlesTheme.colors.inkMuted,
    fontFamily: circlesTheme.type.bodyFamily,
    fontSize: 12,
    textAlign: 'right',
  },
  priceCurrency: {
    color: circlesTheme.colors.inkMuted,
    fontFamily: circlesTheme.type.bodyFamily,
    fontSize: 12,
    letterSpacing: 1.1,
    marginTop: 4,
    textTransform: 'uppercase',
  },
  priceLockup: {
    alignItems: 'flex-end',
    gap: 4,
    minWidth: 92,
  },
  priceRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 6,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: circlesTheme.colors.accent,
    borderRadius: 999,
    justifyContent: 'center',
    minHeight: 56,
    paddingHorizontal: 20,
  },
  primaryButtonPressed: {
    opacity: 0.93,
  },
  primaryButtonText: {
    color: circlesTheme.colors.accentContrast,
    fontFamily: circlesTheme.type.displayFamily,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  screen: {
    backgroundColor: circlesTheme.colors.canvas,
    flex: 1,
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: circlesTheme.colors.pillStrong,
    borderColor: circlesTheme.colors.edge,
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 52,
    paddingHorizontal: 18,
  },
  secondaryButtonPressed: {
    opacity: 0.94,
  },
  secondaryButtonText: {
    color: circlesTheme.colors.ink,
    fontFamily: circlesTheme.type.bodyFamily,
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  summaryLabel: {
    color: circlesTheme.colors.inkMuted,
    fontFamily: circlesTheme.type.bodyFamily,
    fontSize: 12,
  },
  summaryTile: {
    backgroundColor: circlesTheme.colors.canvasAlt,
    borderColor: circlesTheme.colors.edge,
    borderRadius: 18,
    borderWidth: 1,
    flexGrow: 1,
    gap: 6,
    minWidth: '47%',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  summaryValue: {
    color: circlesTheme.colors.ink,
    fontFamily: circlesTheme.type.bodyFamily,
    fontSize: 15,
    fontWeight: '600',
  },
  title: {
    color: circlesTheme.colors.ink,
    fontFamily: circlesTheme.type.displayFamily,
    fontSize: 30,
    fontWeight: '700',
    lineHeight: 36,
  },
});
