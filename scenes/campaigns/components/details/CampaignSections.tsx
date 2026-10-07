import { ReactNode, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/hooks';
import { AccentTone, toneColors } from '@/theme';
import { openLink } from '@/scenes/profile/utils/profileDisplay';
import { campaignDetailsStyle as s } from '../../campaignDetails.style';
import { CampaignDeliverable, CampaignRequirementSection } from '../../types/campaignFeed';
import { DELIVERABLE_TYPE_LABELS, PLATFORM_LABELS } from '../../utils/mapCampaignDetails';
import { platformIcon } from '../../utils/platformIcon';

type FeatherName = React.ComponentProps<typeof Feather>['name'];

// Descriptions longer than this start collapsed behind "Read more".
const COLLAPSED_DESCRIPTION_LENGTH = 240;

/** A rounded card with a tinted icon, a title (+ optional hint and count)
 * and its body. Every content block on the screen uses it. */
export function DetailSection({
  icon,
  tone,
  title,
  hint,
  count,
  danger,
  children,
  testID,
}: {
  icon: FeatherName;
  tone: AccentTone;
  title: string;
  hint?: string | null;
  count?: number;
  /** Tints the whole card red, for "don'ts"-style brief sections. */
  danger?: boolean;
  children: ReactNode;
  testID?: string;
}) {
  const { colors, palette, isDark } = useTheme();
  const iconTone = toneColors(tone, isDark);
  const dangerTone = toneColors('error', isDark);

  return (
    <View
      style={[
        s.sectionCard,
        danger
          ? {
              backgroundColor: isDark ? 'rgba(249, 112, 102, 0.08)' : palette.error[25],
              borderColor: isDark ? 'rgba(249, 112, 102, 0.24)' : palette.error[100],
            }
          : { backgroundColor: colors.card, borderColor: colors.border },
      ]}
      testID={testID}>
      <View style={s.sectionHeader}>
        <View
          style={[
            s.sectionIcon,
            { backgroundColor: danger ? dangerTone.background : iconTone.background },
          ]}>
          <Feather
            name={icon}
            size={18}
            color={danger ? dangerTone.foreground : iconTone.foreground}
          />
        </View>
        <View style={s.sectionTitleBlock}>
          <Text style={[s.sectionTitle, { color: colors.text.primary }]} accessibilityRole="header">
            {title}
          </Text>
          {hint ? <Text style={[s.sectionHint, { color: palette.gray[300] }]}>{hint}</Text> : null}
        </View>
        {count !== undefined ? (
          <View style={[s.countChip, { backgroundColor: iconTone.background }]}>
            <Text style={[s.countChipText, { color: iconTone.foreground }]}>{count}</Text>
          </View>
        ) : null}
      </View>
      {children}
    </View>
  );
}

/** Long text that starts collapsed with a "Read more" toggle. */
export function ExpandableText({ text }: { text: string }) {
  const { palette, isDark } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const isLong = text.length > COLLAPSED_DESCRIPTION_LENGTH;

  return (
    <View style={{ gap: 6 }}>
      <Text
        style={[s.bodyText, { color: palette.gray[isDark ? 100 : 400] }]}
        numberOfLines={isLong && !expanded ? 5 : undefined}>
        {text}
      </Text>
      {isLong ? (
        <Pressable
          accessibilityRole="button"
          hitSlop={8}
          onPress={() => setExpanded(value => !value)}
          testID="campaign-details-read-more">
          <Text style={[s.readMore, { color: toneColors('primary', isDark).foreground }]}>
            {expanded ? 'Show less' : 'Read more'}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

/** Items as rows with a round tinted check (or cross, for `danger`). */
export function CheckList({ items, danger }: { items: string[]; danger?: boolean }) {
  const { colors, isDark } = useTheme();
  const tone = toneColors(danger ? 'error' : 'success', isDark);

  return (
    <View style={s.checkList}>
      {items.map((item, index) => (
        <View key={`${item}-${index}`} style={s.checkRow}>
          <View style={[s.checkDot, { backgroundColor: tone.background }]}>
            <Feather name={danger ? 'x' : 'check'} size={12} color={tone.foreground} />
          </View>
          <Text style={[s.checkText, { color: colors.text.primary }]}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

/** Wrapped tinted pills. */
export function PillList({ items, tone = 'navy' }: { items: string[]; tone?: AccentTone }) {
  const { isDark } = useTheme();
  const colors = toneColors(tone, isDark);

  return (
    <View style={s.pillWrap}>
      {items.map((item, index) => (
        <View key={`${item}-${index}`} style={[s.pill, { backgroundColor: colors.background }]}>
          <Text style={[s.pillText, { color: colors.foreground }]}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

// A brief section's icon, picked from what it is: the backend's own `icon`
// field is free text with no agreed glyph set.
function briefIcon(section: CampaignRequirementSection): FeatherName {
  if (section.tone === 'danger') return 'alert-triangle';
  if (section.sectionKey === 'timing') return 'clock';
  if (section.sectionKey === 'promo-code' || section.layout === 'code') return 'tag';
  if (section.layout === 'links') return 'link';
  if (section.layout === 'tags') return 'hash';
  return 'file-text';
}

/** One section of the business's brief, rendered by its `layout`: a check
 * list, pills, tappable links, or a dashed promo-code box. A `danger` tone
 * (e.g. "Don'ts") turns the card red and the checks into crosses. */
export function BriefSection({ section }: { section: CampaignRequirementSection }) {
  const { colors, palette, isDark } = useTheme();
  const danger = section.tone === 'danger';
  const tone: AccentTone = section.tone === 'business' ? 'primary' : 'navy';
  const accent = toneColors(tone, isDark);

  let body: ReactNode;
  switch (section.layout) {
    case 'tags':
      body = <PillList items={section.items} tone={danger ? 'error' : tone} />;
      break;
    case 'links':
      body = (
        <View style={s.checkList}>
          {section.items.map((url, index) => (
            <Pressable
              key={`${url}-${index}`}
              accessibilityRole="link"
              onPress={() => openLink(url)}
              style={({ pressed }) => [
                s.linkRow,
                { backgroundColor: accent.background },
                pressed && s.pressed,
              ]}>
              <Feather name="external-link" size={15} color={accent.foreground} />
              <Text style={[s.linkText, { color: accent.foreground }]} numberOfLines={1}>
                {url}
              </Text>
            </Pressable>
          ))}
        </View>
      );
      break;
    case 'code':
      body = (
        <View style={s.checkList}>
          {section.items.map((code, index) => (
            <View
              key={`${code}-${index}`}
              style={[
                s.codeBox,
                {
                  borderColor: accent.foreground,
                  backgroundColor: isDark ? accent.background : palette.primary[25],
                },
              ]}>
              <Text style={[s.codeText, { color: colors.text.primary }]} selectable>
                {code}
              </Text>
            </View>
          ))}
        </View>
      );
      break;
    default:
      body = <CheckList items={section.items} danger={danger} />;
  }

  return (
    <DetailSection
      icon={briefIcon(section)}
      tone={tone}
      title={section.label}
      hint={section.hint}
      danger={danger}
      testID={`campaign-details-brief-${section.sectionKey}`}>
      {body}
    </DetailSection>
  );
}

/** "What you'll create": a tile per deliverable with its platform glyph. */
export function DeliverableList({ deliverables }: { deliverables: CampaignDeliverable[] }) {
  const { colors, palette, isDark } = useTheme();
  const tone = toneColors('primary', isDark);
  const tileBackground = isDark ? 'rgba(255, 255, 255, 0.04)' : palette.gray[25];

  return (
    <View style={s.deliverableGrid}>
      {deliverables.map(deliverable => {
        const type = DELIVERABLE_TYPE_LABELS[deliverable.type] ?? deliverable.type;
        const platform = PLATFORM_LABELS[deliverable.platform] ?? deliverable.platform;
        return (
          <View
            key={deliverable.id}
            style={[s.deliverableTile, { backgroundColor: tileBackground }]}
            accessible
            accessibilityLabel={`${deliverable.count} ${type} on ${platform}`}>
            <View style={[s.deliverableIcon, { backgroundColor: tone.background }]}>
              <Feather
                name={platformIcon(deliverable.platform)}
                size={20}
                color={tone.foreground}
              />
            </View>
            <View style={s.deliverableText}>
              <Text style={[s.deliverableTitle, { color: colors.text.primary }]}>
                {`${deliverable.count} × ${type}`}
              </Text>
              <Text style={[s.deliverableMeta, { color: palette.gray[300] }]}>{platform}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

/** Labelled pill groups for the campaign's audience targeting. */
export function AudienceGroups({ groups }: { groups: { label: string; items: string[] }[] }) {
  const { palette } = useTheme();

  return (
    <View style={{ gap: 14 }}>
      {groups.map(group => (
        <View key={group.label} style={s.audienceGroup}>
          <Text style={[s.audienceLabel, { color: palette.gray[300] }]}>{group.label}</Text>
          <PillList items={group.items} tone="navy" />
        </View>
      ))}
    </View>
  );
}
