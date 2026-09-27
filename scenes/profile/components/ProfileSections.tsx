import { View, Text, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/hooks';
import IconSectionHeader from '@/components/elements/IconSectionHeader';
import Image from '@/components/elements/Image';
import { PORTFOLIO_PLATFORM_OPTIONS } from '@/data/portfolioPlatforms';
import { resolveMediaUrl } from '@/utils/media';
import { myProfileStyle, TAG_COLORS, TagColorKey } from '../myProfile.style';
import { labelFor, openLink, socialPlatformLabel, socialProfileUrl } from '../utils/profileDisplay';

// The read-only profile building blocks shared by the creator's own My
// Profile screen (scenes/profile/MyProfile.tsx) and the public Creator
// Profile other users see (scenes/creator/CreatorProfile.tsx), so the two
// render a profile identically.

type FeatherIcon = React.ComponentProps<typeof Feather>['name'];

export interface CredColumnData {
  icon: FeatherIcon;
  value: string;
  label: string;
}

export function CredColumn({ icon, value, label }: CredColumnData) {
  const { colors, palette: themePalette } = useTheme();
  return (
    <View style={myProfileStyle.credColumn}>
      <Feather name={icon} size={16} color={colors.primary} />
      <Text style={[myProfileStyle.credValue, { color: colors.text.primary }]}>{value}</Text>
      <Text style={[myProfileStyle.credLabel, { color: themePalette.gray[300] }]}>{label}</Text>
    </View>
  );
}

/** The bordered credibility strip under the bio, columns split by dividers. */
export function CredStrip({ columns }: { columns: CredColumnData[] }) {
  const { colors } = useTheme();
  return (
    <View style={[myProfileStyle.credCard, { borderColor: colors.border }]}>
      {columns.map((column, index) => (
        <View key={column.label} style={myProfileStyle.credColumnWrap}>
          {index > 0 ? (
            <View style={[myProfileStyle.credDivider, { backgroundColor: colors.divider }]} />
          ) : null}
          <CredColumn {...column} />
        </View>
      ))}
    </View>
  );
}

export function Section({
  icon,
  label,
  children,
}: {
  icon: FeatherIcon;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <View style={myProfileStyle.section}>
      <IconSectionHeader icon={icon} label={label} />
      <View style={myProfileStyle.sectionBody}>{children}</View>
    </View>
  );
}

export function TagRow({
  values,
  options,
  colorKey,
}: {
  values: string[];
  options: { value: string; label: string }[];
  colorKey: TagColorKey;
}) {
  const { isDark } = useTheme();
  if (!values.length) return null;
  const tone = isDark ? TAG_COLORS[colorKey].dark : TAG_COLORS[colorKey].light;

  return (
    <View style={myProfileStyle.tagRowWrap}>
      {values.map(value => (
        <View key={value} style={[myProfileStyle.tagPill, { backgroundColor: tone.bg }]}>
          <Text style={[myProfileStyle.tagLabel, { color: tone.text }]}>
            {labelFor(value, options)}
          </Text>
        </View>
      ))}
    </View>
  );
}

/** Label/value rows in a bordered card under a "Location" header. */
export function LocationCard({ rows }: { rows: { label: string; value: string }[] }) {
  const { colors, palette: themePalette } = useTheme();
  if (!rows.length) return null;

  return (
    <View style={myProfileStyle.section}>
      <IconSectionHeader icon="map-pin" label="Location" />
      <View
        style={[
          myProfileStyle.locationCard,
          myProfileStyle.sectionBody,
          { borderColor: colors.border },
        ]}>
        {rows.map((row, index) => (
          <View key={row.label}>
            <View style={myProfileStyle.metaRow}>
              <Text style={[myProfileStyle.metaLabel, { color: themePalette.gray[300] }]}>
                {row.label}
              </Text>
              <Text style={[myProfileStyle.metaValue, { color: colors.text.primary }]}>
                {row.value}
              </Text>
            </View>
            {index < rows.length - 1 ? (
              <View style={[myProfileStyle.metaRowDivider, { backgroundColor: colors.divider }]} />
            ) : null}
          </View>
        ))}
      </View>
    </View>
  );
}

/** An outlined chip; with a `url` it opens that link and shows an
 * external-link glyph, without one it's plain text. */
export function LinkChip({
  label,
  url,
  testID,
}: {
  label: string;
  url?: string | null;
  testID?: string;
}) {
  const { colors, palette: themePalette } = useTheme();
  return (
    <Pressable
      accessibilityRole={url ? 'link' : undefined}
      disabled={!url}
      onPress={url ? () => openLink(url) : undefined}
      style={[myProfileStyle.socialChip, { borderColor: colors.border }]}
      testID={testID}>
      <Text style={[myProfileStyle.tagLabel, { color: colors.text.primary }]} numberOfLines={1}>
        {label}
      </Text>
      {url ? <Feather name="external-link" size={12} color={themePalette.gray[300]} /> : null}
    </Pressable>
  );
}

/** Social platform chips; one with a handle opens that profile. */
export function SocialPlatformRow({
  platforms,
}: {
  platforms: { platform: string; handle: string | null }[];
}) {
  if (!platforms.length) return null;

  return (
    <View style={myProfileStyle.tagRowWrap}>
      {platforms.map(({ platform, handle }) => {
        const cleanHandle = handle?.trim().replace(/^@/, '');
        return (
          <LinkChip
            key={platform}
            label={
              cleanHandle
                ? `${socialPlatformLabel(platform)} · @${cleanHandle}`
                : socialPlatformLabel(platform)
            }
            url={socialProfileUrl(platform, handle)}
            testID={`profile-social-${platform}`}
          />
        );
      })}
    </View>
  );
}

/** Portfolio tiles (thumbnail or a platform placeholder) that open the link.
 * Pass `onAddPress` to append the dashed "Add work" tile (owner only). */
export function PortfolioGrid({
  items,
  onAddPress,
  testIDPrefix,
}: {
  items: { url: string; platform: string; thumbnailUrl: string | null }[];
  onAddPress?: () => void;
  testIDPrefix: string;
}) {
  const { colors, palette: themePalette, isDark } = useTheme();

  return (
    <View style={[myProfileStyle.portfolioGrid, myProfileStyle.sectionBody]}>
      {items.map((item, index) => {
        const thumbnail = resolveMediaUrl(item.thumbnailUrl);
        return (
          <Pressable
            key={`${item.url}-${index}`}
            style={[myProfileStyle.portfolioTile, { borderColor: colors.border }]}
            onPress={() => openLink(item.url)}
            testID={`${testIDPrefix}-portfolio-${index}`}>
            {thumbnail ? (
              <Image source={{ uri: thumbnail }} style={{ flex: 1 }} contentFit="cover" />
            ) : (
              <View
                style={[
                  myProfileStyle.portfolioPlaceholder,
                  { backgroundColor: themePalette.primary[isDark ? 900 : 50] },
                ]}>
                <Text
                  style={[
                    myProfileStyle.portfolioPlaceholderLabel,
                    { color: themePalette.gray[isDark ? 100 : 500] },
                  ]}>
                  {labelFor(item.platform, PORTFOLIO_PLATFORM_OPTIONS)}
                </Text>
              </View>
            )}
          </Pressable>
        );
      })}
      {onAddPress ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Add work"
          onPress={onAddPress}
          style={[myProfileStyle.addWorkTile, { borderColor: colors.border }]}
          testID={`${testIDPrefix}-add-work`}>
          <Feather name="plus" size={20} color={themePalette.gray[300]} />
          <Text style={[myProfileStyle.addWorkLabel, { color: themePalette.gray[300] }]}>
            Add work
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
