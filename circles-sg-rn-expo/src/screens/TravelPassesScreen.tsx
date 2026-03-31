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
  TravelPassId,
} from '../brownfield/contracts';
import { getTravelPriceParts } from '../telco/pricing';
import { getTravelPass, travelPasses } from '../telco/passes';
import { CirclesBackdrop } from '../ui/circles-backdrop';
import { CirclesToolbar } from '../ui/CirclesToolbar';
import { circlesTheme } from '../ui/circles-theme';

type Props = {
  launchContext: CirclesRoamLaunchContext;
  notifyScreenView: (screenName: string) => void;
  onContinue: (selectedPassId: TravelPassId) => void;
  onDismiss: () => void;
  onSelectPass: (selectedPassId: TravelPassId) => void;
  selectedPassId: TravelPassId;
};

export function TravelPassesScreen({
  launchContext,
  notifyScreenView,
  onContinue,
  onDismiss,
  onSelectPass,
  selectedPassId,
}: Props) {
  const recommendedPass = getTravelPass(launchContext.recommendedPassId);
  const selectedPass = getTravelPass(selectedPassId);
  const onScreenVisible = useEffectEvent(() => {
    notifyScreenView('travel-passes');
  });

  useEffect(() => {
    onScreenVisible();
  }, [launchContext.correlationId, onScreenVisible]);

  return (
    <SafeAreaView style={styles.screen}>
      <CirclesBackdrop />
      <ScrollView
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <CirclesToolbar
          leadingLabel="Close"
          onLeadingPress={onDismiss}
          subtitle="Shared Roaming Flow"
          title="Travel Passes"
        />

        <View style={styles.heroCard}>
          <View style={styles.heroKickerRow}>
            <Text style={styles.heroKicker}>Circles Roaming</Text>
            <Text style={styles.heroStatus}>Native context ready</Text>
          </View>

          <Text style={styles.heroTitle}>
            Roaming passes for {launchContext.destinationName}
          </Text>
          <Text style={styles.heroBody}>
            The host app has already passed the subscriber, line, and current plan into
            the shared SDK, so this selection flow can feel immediate and personalized.
          </Text>

          <View style={styles.heroMetaGrid}>
            <MetricTile label="Line" value={launchContext.lineNumber} />
            <MetricTile label="Current plan" value={launchContext.currentPlanName} />
            <MetricTile label="Live usage" value={launchContext.currentUsageGb} />
            <MetricTile label="Renews" value={launchContext.renewalDate} />
          </View>

          <View style={styles.recommendedCard}>
            <View style={styles.recommendedCopy}>
              <Text style={styles.recommendedLabel}>Recommended for this trip</Text>
              <Text style={styles.recommendedTitle}>{recommendedPass.title}</Text>
              <Text style={styles.recommendedBody}>
                {recommendedPass.subtitle}
              </Text>
            </View>
            <PriceLockup
              caption="per trip"
              currencyCode={recommendedPass.priceCurrencyCode}
              priceAmount={recommendedPass.priceAmount}
            />
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <View style={styles.sectionCopy}>
            <Text style={styles.sectionTitle}>Choose a pass</Text>
            <Text style={styles.sectionBody}>
              Each option is designed for a different roaming pattern and keeps pricing
              clear inside the native experience.
            </Text>
          </View>
          <View style={styles.sectionChip}>
            <Text style={styles.sectionChipText}>{travelPasses.length} options</Text>
          </View>
        </View>

        {travelPasses.map((travelPass) => {
          const isSelected = travelPass.id === selectedPassId;

          return (
            <Pressable
              key={travelPass.id}
              onPress={() => onSelectPass(travelPass.id)}
              style={({ pressed }) => [
                styles.passCard,
                isSelected ? styles.passCardSelected : null,
                pressed ? styles.passCardPressed : null,
              ]}
            >
              <View style={styles.passCardHeader}>
                <View style={styles.passCardCopy}>
                  <View style={styles.passCardTagRow}>
                    <View style={styles.passBadge}>
                      <Text style={styles.passBadgeText}>{travelPass.badge}</Text>
                    </View>
                    {isSelected ? (
                      <View style={styles.selectedBadge}>
                        <Text style={styles.selectedBadgeText}>Selected</Text>
                      </View>
                    ) : null}
                  </View>
                  <Text style={styles.passTitle}>{travelPass.title}</Text>
                  <Text style={styles.passSubtitle}>{travelPass.subtitle}</Text>
                </View>
                <PriceLockup
                  caption="per trip"
                  currencyCode={travelPass.priceCurrencyCode}
                  priceAmount={travelPass.priceAmount}
                />
              </View>

              <View style={styles.passStatsRow}>
                <InfoPill label="Data" value={travelPass.dataAllowance} />
                <InfoPill label="Coverage" value={travelPass.coverageSummary} />
              </View>

              <View style={styles.perkList}>
                {travelPass.perks.map((perk) => (
                  <PerkRow key={perk} text={perk} />
                ))}
              </View>
            </Pressable>
          );
        })}

        <View style={styles.contextCard}>
          <Text style={styles.contextTitle}>Launch contract</Text>
          <Text style={styles.contextBody}>
            This is the native payload that opened the shared roaming SDK.
          </Text>
          <MetricRow label="Subscriber" value={launchContext.subscriberId} />
          <MetricRow label="Source platform" value={launchContext.sourcePlatform} />
          <MetricRow label="Source screen" value={launchContext.sourceScreen} />
          <MetricRow label="Correlation ID" value={launchContext.correlationId} />
        </View>

        <View style={styles.ctaCard}>
          <View style={styles.ctaCardHeader}>
            <View style={styles.ctaCopy}>
              <Text style={styles.ctaLabel}>Selected pass</Text>
              <Text style={styles.ctaTitle}>{selectedPass.title}</Text>
              <Text style={styles.ctaBody}>
                {selectedPass.dataAllowance} with coverage across{' '}
                {selectedPass.coverageSummary}.
              </Text>
            </View>
            <PriceLockup
              caption="per trip"
              compact
              currencyCode={selectedPass.priceCurrencyCode}
              priceAmount={selectedPass.priceAmount}
            />
          </View>

          <Pressable
            onPress={() => onContinue(selectedPassId)}
            style={({ pressed }) => [
              styles.primaryButton,
              pressed ? styles.primaryButtonPressed : null,
            ]}
          >
            <Text style={styles.primaryButtonText}>Continue to Activation Summary</Text>
          </Pressable>

          <Pressable
            onPress={onDismiss}
            style={({ pressed }) => [
              styles.secondaryButton,
              pressed ? styles.secondaryButtonPressed : null,
            ]}
          >
            <Text style={styles.secondaryButtonText}>Close and Return to Native App</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoPill}>
      <Text style={styles.infoPillLabel}>{label}</Text>
      <Text numberOfLines={2} style={styles.infoPillValue}>
        {value}
      </Text>
    </View>
  );
}

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metricRow}>
      <Text style={styles.metricRowLabel}>{label}</Text>
      <Text style={styles.metricRowValue}>{value}</Text>
    </View>
  );
}

function MetricTile({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metricTile}>
      <Text style={styles.metricTileLabel}>{label}</Text>
      <Text style={styles.metricTileValue}>{value}</Text>
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

function PriceLockup({
  caption,
  compact = false,
  currencyCode,
  priceAmount,
}: {
  caption: string;
  compact?: boolean;
  currencyCode: string;
  priceAmount: number;
}) {
  const { amount, currencyCode: formattedCurrencyCode } = getTravelPriceParts(
    priceAmount,
    currencyCode
  );

  return (
    <View style={[styles.priceLockup, compact ? styles.priceLockupCompact : null]}>
      <View style={styles.priceRow}>
        <Text style={styles.priceCurrency}>{formattedCurrencyCode}</Text>
        <Text style={styles.priceAmount}>{amount}</Text>
      </View>
      <Text style={styles.priceCaption}>{caption}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    gap: 18,
    paddingBottom: 40,
    paddingHorizontal: 20,
    paddingTop: 14,
  },
  contextBody: {
    color: circlesTheme.colors.inkMuted,
    fontFamily: circlesTheme.type.bodyFamily,
    fontSize: 14,
    lineHeight: 20,
  },
  contextCard: {
    ...circlesTheme.shadows.soft,
    backgroundColor: circlesTheme.colors.cardMuted,
    borderColor: circlesTheme.colors.edge,
    borderRadius: circlesTheme.radius.medium,
    borderWidth: 1,
    gap: 12,
    padding: 20,
  },
  contextTitle: {
    color: circlesTheme.colors.ink,
    fontFamily: circlesTheme.type.displayFamily,
    fontSize: 20,
    fontWeight: '700',
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
    padding: 20,
  },
  ctaCardHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 16,
  },
  ctaCopy: {
    flex: 1,
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
  heroBody: {
    color: circlesTheme.colors.inkMuted,
    fontFamily: circlesTheme.type.bodyFamily,
    fontSize: 16,
    lineHeight: 24,
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
  heroKicker: {
    color: circlesTheme.colors.accent,
    fontFamily: circlesTheme.type.bodyFamily,
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  heroKickerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  heroMetaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  heroStatus: {
    color: circlesTheme.colors.success,
    fontFamily: circlesTheme.type.bodyFamily,
    fontSize: 12,
  },
  heroTitle: {
    color: circlesTheme.colors.ink,
    fontFamily: circlesTheme.type.displayFamily,
    fontSize: 30,
    fontWeight: '700',
    lineHeight: 36,
  },
  infoPill: {
    backgroundColor: circlesTheme.colors.pill,
    borderColor: circlesTheme.colors.edge,
    borderRadius: 18,
    borderWidth: 1,
    flex: 1,
    gap: 4,
    minWidth: 132,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  infoPillLabel: {
    color: circlesTheme.colors.inkMuted,
    fontFamily: circlesTheme.type.bodyFamily,
    fontSize: 12,
  },
  infoPillValue: {
    color: circlesTheme.colors.ink,
    fontFamily: circlesTheme.type.bodyFamily,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 18,
  },
  metricRow: {
    alignItems: 'center',
    borderTopColor: circlesTheme.colors.edge,
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
  },
  metricRowLabel: {
    color: circlesTheme.colors.inkMuted,
    fontFamily: circlesTheme.type.bodyFamily,
    fontSize: 13,
  },
  metricRowValue: {
    color: circlesTheme.colors.ink,
    flexShrink: 1,
    fontFamily: circlesTheme.type.monoFamily,
    fontSize: 12,
    textAlign: 'right',
  },
  metricTile: {
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
  metricTileLabel: {
    color: circlesTheme.colors.inkMuted,
    fontFamily: circlesTheme.type.bodyFamily,
    fontSize: 12,
  },
  metricTileValue: {
    color: circlesTheme.colors.ink,
    fontFamily: circlesTheme.type.bodyFamily,
    fontSize: 15,
    fontWeight: '600',
  },
  passBadge: {
    alignSelf: 'flex-start',
    backgroundColor: circlesTheme.colors.pillStrong,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  passBadgeText: {
    color: circlesTheme.colors.ink,
    fontFamily: circlesTheme.type.bodyFamily,
    fontSize: 12,
    fontWeight: '600',
  },
  passCard: {
    ...circlesTheme.shadows.soft,
    backgroundColor: circlesTheme.colors.cardMuted,
    borderColor: circlesTheme.colors.edge,
    borderRadius: circlesTheme.radius.medium,
    borderWidth: 1,
    gap: 16,
    padding: 20,
  },
  passCardCopy: {
    flex: 1,
    gap: 8,
  },
  passCardHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 16,
  },
  passCardPressed: {
    opacity: 0.95,
  },
  passCardSelected: {
    borderColor: circlesTheme.colors.accent,
    transform: [{ scale: 1.005 }],
  },
  passCardTagRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  passStatsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  passSubtitle: {
    color: circlesTheme.colors.inkMuted,
    fontFamily: circlesTheme.type.bodyFamily,
    fontSize: 15,
    lineHeight: 22,
  },
  passTitle: {
    color: circlesTheme.colors.ink,
    fontFamily: circlesTheme.type.displayFamily,
    fontSize: 24,
    fontWeight: '700',
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
    lineHeight: 34,
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
  priceLockupCompact: {
    minWidth: 84,
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
  recommendedBody: {
    color: circlesTheme.colors.inkMuted,
    fontFamily: circlesTheme.type.bodyFamily,
    fontSize: 14,
    lineHeight: 20,
  },
  recommendedCard: {
    alignItems: 'flex-start',
    backgroundColor: circlesTheme.colors.canvasAlt,
    borderColor: circlesTheme.colors.edgeStrong,
    borderRadius: 24,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 16,
    padding: 18,
  },
  recommendedCopy: {
    flex: 1,
    gap: 6,
  },
  recommendedLabel: {
    color: circlesTheme.colors.warning,
    fontFamily: circlesTheme.type.bodyFamily,
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  recommendedTitle: {
    color: circlesTheme.colors.ink,
    fontFamily: circlesTheme.type.displayFamily,
    fontSize: 22,
    fontWeight: '700',
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
  sectionBody: {
    color: circlesTheme.colors.inkMuted,
    fontFamily: circlesTheme.type.bodyFamily,
    fontSize: 15,
    lineHeight: 22,
  },
  sectionChip: {
    alignSelf: 'flex-start',
    backgroundColor: circlesTheme.colors.pill,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  sectionChipText: {
    color: circlesTheme.colors.ink,
    fontFamily: circlesTheme.type.bodyFamily,
    fontSize: 12,
    fontWeight: '600',
  },
  sectionCopy: {
    flex: 1,
    gap: 6,
  },
  sectionHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 16,
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  sectionTitle: {
    color: circlesTheme.colors.ink,
    fontFamily: circlesTheme.type.displayFamily,
    fontSize: 24,
    fontWeight: '700',
  },
  selectedBadge: {
    backgroundColor: circlesTheme.colors.accentSoft,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  selectedBadgeText: {
    color: circlesTheme.colors.accent,
    fontFamily: circlesTheme.type.bodyFamily,
    fontSize: 12,
    fontWeight: '700',
  },
});
