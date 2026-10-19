import { View, Pressable, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '@/hooks';
import EmptyState from '../EmptyState';
import SearchIllustration from '../SearchIllustration';
import Button from '../Button';

export interface ItemUnavailableProps {
  style?: StyleProp<ViewStyle>;
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    gap: 20,
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  backButton: {
    paddingHorizontal: 28,
    height: 44,
    borderRadius: 22,
  },
  backTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  link: {
    fontSize: 14,
    fontWeight: '600',
  },
});

// What a screen shows when the thing it was opened for is gone or no longer
// the creator's (a 404) - most often reached from a notification, an email
// link or a push (backend CLIENT_INTEGRATION §1). Same EmptyState +
// SearchIllustration shape as CampaignsEmptyState.
function ItemUnavailable({ style }: ItemUnavailableProps) {
  const { palette } = useTheme();

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/home');
  };

  return (
    <View style={[styles.root, style]} testID="item-unavailable">
      <EmptyState
        illustration={<SearchIllustration />}
        title="This item is no longer available"
        description="It may have been removed, or you no longer have access to it."
      />
      <Button
        title="Go back"
        accessibilityRole="button"
        onPress={goBack}
        style={[styles.backButton, { backgroundColor: palette.primary[400] }]}
        titleStyle={[styles.backTitle, { color: palette.white }]}
      />
      <Pressable accessibilityRole="link" hitSlop={8} onPress={() => router.push('/notifications')}>
        <Text style={[styles.link, { color: palette.primary[500] }]}>View notifications</Text>
      </Pressable>
    </View>
  );
}

export default ItemUnavailable;
