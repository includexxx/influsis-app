import { ComponentProps, ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/hooks';
import { getShadowStyle, palette, radius, spacing } from '@/theme';
import { resolveMediaKeyOrUrl } from '@/utils/media';
import BottomSheet from '@/components/elements/BottomSheet';
import Button from '@/components/elements/Button';
import Image from '@/components/elements/Image';
import StatusBadge from '@/components/elements/StatusBadge';
import { CreatorAgreement } from '../utils/agreement';
import { formatCampaignPrice } from '../utils/mapCampaignFeedItem';
import { scopeItemLabel, scopePairKey } from '../utils/scope';

export interface AgreementSheetProps {
  /** null while loading, or when there is nothing to show. */
  agreement: CreatorAgreement | null;
  isLoading?: boolean;
  /** Confirm mode needs the campaign's licensing tier; never guess the pay. */
  loadError?: boolean;
  onRetry?: () => void;
  isAccepting?: boolean;
  /** The offer shown is no longer pending - Accept is disabled. */
  isStale?: boolean;
  /** A server message (e.g. a 409) or the generic error. */
  message?: string | null;
  onConfirm?: (offerId: string) => void;
  onClose: () => void;
}

type FeatherName = ComponentProps<typeof Feather>['name'];

// Same brand gradient as the Deliverables screen's summary card.
const AMOUNT_GRADIENT = [palette.primary[400], palette.primary[700]] as const;

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing['3xl'],
    gap: spacing.md,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIconConfirm: { backgroundColor: palette.primary[50] },
  headerIconDone: { backgroundColor: palette.success[50] },
  header: { flex: 1, fontSize: 18, lineHeight: 26, fontWeight: '700' },
  partyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: radius.xl,
    padding: 12,
  },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  avatarFallback: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.primary[50],
  },
  avatarInitial: { fontSize: 18, fontWeight: '700', color: palette.primary[600] },
  partyBody: { flex: 1, gap: 2 },
  partyTitle: { fontSize: 16, lineHeight: 22, fontWeight: '600' },
  partySubtitle: { fontSize: 13, lineHeight: 18 },
  amountCard: {
    borderRadius: radius.xl,
    padding: 18,
    gap: 6,
    overflow: 'hidden',
    ...getShadowStyle('md'),
  },
  amountGlow: {
    position: 'absolute',
    top: -50,
    right: -30,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  amountLabel: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    letterSpacing: 1,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  amount: { fontSize: 32, lineHeight: 40, fontWeight: '800', color: palette.white },
  licensingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    marginTop: 4,
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
  },
  licensingText: { flexShrink: 1, fontSize: 12, lineHeight: 16, color: palette.white },
  detailsCard: { borderWidth: 1, borderRadius: radius.xl, paddingHorizontal: 14 },
  detailRow: { flexDirection: 'row', gap: 12, paddingVertical: 12 },
  detailDivider: { borderTopWidth: 1 },
  detailIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.primary[25],
  },
  detailBody: { flex: 1, gap: 6, justifyContent: 'center' },
  label: { fontSize: 12, lineHeight: 16, fontWeight: '500' },
  value: { fontSize: 15, lineHeight: 22, fontWeight: '600' },
  scopeChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  scopeChip: {
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: palette.primary[25],
  },
  scopeChipText: { fontSize: 13, lineHeight: 18, fontWeight: '600', color: palette.primary[700] },
  lockNote: {
    flexDirection: 'row',
    gap: 10,
    borderRadius: radius.lg,
    padding: 12,
    backgroundColor: palette.warning[50],
  },
  lockText: { flex: 1, fontSize: 13, lineHeight: 19, color: palette.warning[700] },
  errorBanner: {
    flexDirection: 'row',
    gap: 10,
    borderRadius: radius.lg,
    padding: 12,
    backgroundColor: palette.error[50],
  },
  errorText: { flex: 1, color: palette.error[700], fontSize: 14, lineHeight: 20 },
  centered: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.lg },
  stateIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.error[50],
  },
  hint: { fontSize: 13, lineHeight: 19 },
  actions: { gap: 10, marginTop: 4 },
  fullWidth: { alignSelf: 'stretch' },
  primaryButton: {
    height: 52,
    borderRadius: radius.full,
    backgroundColor: palette.primary[500],
    ...getShadowStyle('sm'),
  },
  primaryTitle: { fontSize: 16, fontWeight: '700', color: palette.white },
  secondaryButton: {
    height: 52,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: palette.primary[200],
    backgroundColor: palette.white,
  },
  secondaryTitle: { fontSize: 16, fontWeight: '600', color: palette.primary[500] },
});

// "12,500 taka" for a screen reader; other currencies keep their code.
function spokenAmount(amountMinor: number, currency: string): string {
  const formatted = formatCampaignPrice(amountMinor, currency);
  return currency === 'BDT' ? `${formatted.replace(/^BDT /, '')} taka` : formatted;
}

// The agreement the creator reviews before Accept (CF4) - confirm mode - and
// reopens afterwards from "View agreement" - confirmed mode. Shows only the
// creator's own money: the whole deal (agreed price plus licensing, F-2/F-6),
// never the platform fee, VAT, processing or the business's total, and no
// payment copy (escrow is item 27). Closing or dragging it down never
// accepts. Campaign-specific, so it lives in the scene, not the element kit.
function AgreementSheet({
  agreement,
  isLoading,
  loadError,
  onRetry,
  isAccepting,
  isStale,
  message,
  onConfirm,
  onClose,
}: AgreementSheetProps) {
  const { colors } = useTheme();
  const primary = { color: colors.text.primary };
  const secondary = { color: colors.text.secondary };

  function body() {
    if (isLoading) {
      return (
        <View style={styles.centered} testID="agreement-loading">
          <ActivityIndicator color={palette.primary[400]} />
          <Text style={[styles.hint, secondary]}>Loading the agreement…</Text>
        </View>
      );
    }

    if (loadError) {
      return (
        <View style={styles.centered} testID="agreement-error">
          <View style={styles.stateIcon}>
            <Feather name="alert-triangle" size={22} color={palette.error[600]} />
          </View>
          <Text style={[styles.value, primary]}>Couldn&apos;t load the campaign terms.</Text>
          <View style={[styles.actions, styles.fullWidth]}>
            <Button
              title="Retry"
              style={styles.primaryButton}
              titleStyle={styles.primaryTitle}
              onPress={onRetry}
              testID="agreement-retry"
            />
            <Button
              title="Back to offer"
              style={styles.secondaryButton}
              titleStyle={styles.secondaryTitle}
              onPress={onClose}
              testID="agreement-back"
            />
          </View>
        </View>
      );
    }

    if (!agreement) {
      return (
        <>
          {message ? <MessageBanner message={message} /> : null}
          <Button
            title="Close"
            style={styles.secondaryButton}
            titleStyle={styles.secondaryTitle}
            onPress={onClose}
            testID="agreement-close"
          />
        </>
      );
    }

    const confirm = agreement.mode === 'confirm';
    const avatar = resolveMediaKeyOrUrl(agreement.businessAvatarUrl);
    const youReceive = formatCampaignPrice(agreement.youReceiveMinor, agreement.currency);
    const acceptDisabled = isStale || isAccepting;
    const initial = (agreement.businessName ?? agreement.campaignTitle).trim().charAt(0);

    return (
      <>
        <View style={styles.headerRow}>
          <View
            style={[styles.headerIcon, confirm ? styles.headerIconConfirm : styles.headerIconDone]}>
            <Feather
              name={confirm ? 'file-text' : 'check-circle'}
              size={20}
              color={confirm ? palette.primary[500] : palette.success[600]}
            />
          </View>
          <Text style={[styles.header, primary]} accessibilityRole="header">
            {confirm
              ? 'Review the agreement'
              : `Agreement confirmed${agreement.acceptedAt ? ` · ${agreement.acceptedAt}` : ''}`}
          </Text>
          {!confirm && agreement.isCompleted ? (
            <StatusBadge
              label="Completed"
              color={palette.success[50]}
              textColor={palette.success[700]}
              testID="agreement-completed"
            />
          ) : null}
        </View>

        <View style={[styles.partyCard, { borderColor: colors.border }]}>
          {avatar ? (
            <Image source={{ uri: avatar }} style={styles.avatar} contentFit="cover" />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarInitial}>{initial.toUpperCase()}</Text>
            </View>
          )}
          <View style={styles.partyBody}>
            <Text style={[styles.partyTitle, primary]} numberOfLines={2}>
              {agreement.campaignTitle}
            </Text>
            {agreement.businessName ? (
              <Text
                style={[styles.partySubtitle, secondary]}
                numberOfLines={1}
                testID="agreement-business">
                {agreement.businessName}
              </Text>
            ) : null}
          </View>
        </View>

        <LinearGradient
          colors={AMOUNT_GRADIENT}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.amountCard}>
          <View style={styles.amountGlow} />
          <View
            accessible
            accessibilityLabel={`You'll receive ${spokenAmount(agreement.youReceiveMinor, agreement.currency)}`}
            testID="agreement-you-receive">
            <Text style={styles.amountLabel}>YOU&apos;LL RECEIVE</Text>
            <Text style={styles.amount}>{youReceive}</Text>
          </View>
          {agreement.licensingPercent > 0 ? (
            <View style={styles.licensingChip}>
              <Feather name="award" size={13} color={palette.white} />
              <Text style={styles.licensingText} testID="agreement-licensing">
                Includes {formatCampaignPrice(agreement.licensingMinor, agreement.currency)} for
                paid-ad usage rights (+{agreement.licensingPercent}%)
              </Text>
            </View>
          ) : null}
        </LinearGradient>

        <View style={[styles.detailsCard, { borderColor: colors.border }]}>
          <DetailRow icon="package" label="Deliverables" testID="agreement-deliverables">
            {agreement.scope.length ? (
              <View style={styles.scopeChips}>
                {agreement.scope.map(item => (
                  <View key={scopePairKey(item)} style={styles.scopeChip}>
                    <Text style={styles.scopeChipText}>
                      {item.count} × {scopeItemLabel(item)}
                    </Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={[styles.value, primary]}>No deliverables set</Text>
            )}
          </DetailRow>
          <DetailRow icon="calendar" label="Content deadline" divider>
            <Text style={[styles.value, primary]}>{agreement.contentDeadline}</Text>
          </DetailRow>
        </View>

        {confirm ? (
          <View style={styles.lockNote}>
            <Feather name="lock" size={16} color={palette.warning[700]} />
            <Text style={styles.lockText}>
              Accepting locks this price and these deliverables. It can&apos;t be undone.
            </Text>
          </View>
        ) : null}

        {message ? <MessageBanner message={message} /> : null}

        <View style={styles.actions}>
          {confirm ? (
            <>
              <Button
                title="Accept & confirm"
                style={styles.primaryButton}
                titleStyle={styles.primaryTitle}
                onPress={() => agreement.offerId && onConfirm?.(agreement.offerId)}
                isLoading={isAccepting}
                disabled={acceptDisabled}
                accessibilityState={{ disabled: !!acceptDisabled }}
                accessibilityLabel="Accept and confirm"
                testID="agreement-accept"
              />
              <Button
                title="Back to offer"
                style={styles.secondaryButton}
                titleStyle={styles.secondaryTitle}
                onPress={onClose}
                disabled={isAccepting}
                testID="agreement-back"
              />
            </>
          ) : (
            <Button
              title="Close"
              style={styles.secondaryButton}
              titleStyle={styles.secondaryTitle}
              onPress={onClose}
              testID="agreement-close"
            />
          )}
        </View>
      </>
    );
  }

  return (
    <BottomSheet isOpen initialOpen onClose={onClose}>
      <View style={[styles.content, { backgroundColor: colors.card }]} testID="agreement-sheet">
        {body()}
      </View>
    </BottomSheet>
  );
}

function DetailRow({
  icon,
  label,
  divider,
  testID,
  children,
}: {
  icon: FeatherName;
  label: string;
  divider?: boolean;
  testID?: string;
  children: ReactNode;
}) {
  const { colors } = useTheme();
  return (
    <View
      style={[styles.detailRow, divider && [styles.detailDivider, { borderColor: colors.border }]]}
      testID={testID}>
      <View style={styles.detailIcon}>
        <Feather name={icon} size={16} color={palette.primary[500]} />
      </View>
      <View style={styles.detailBody}>
        <Text style={[styles.label, { color: colors.text.secondary }]}>{label}</Text>
        {children}
      </View>
    </View>
  );
}

function MessageBanner({ message }: { message: string }) {
  return (
    <View
      style={styles.errorBanner}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      testID="agreement-message">
      <Feather name="alert-circle" size={16} color={palette.error[700]} />
      <Text style={styles.errorText}>{message}</Text>
    </View>
  );
}

export default AgreementSheet;
