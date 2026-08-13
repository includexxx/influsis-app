import { useMemo, useState } from 'react';
import { View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '@/hooks';
import { layoutStyle, searchStyle } from '@/styles';
import AppHeader from '@/components/elements/AppHeader';
import SearchBar from '@/components/elements/SearchBar';
import CategoryChip from '@/components/elements/CategoryChip';
import CampaignCard from '@/components/elements/CampaignCard';
import EmptyState from '@/components/elements/EmptyState';
import SearchIllustration from '@/components/elements/SearchIllustration';
import { searchCategories, searchResults } from '@/data/search';

// The Search screen (Figma "Home - Influencer Ongoing", nodes 6119:6016
// (typing, keyboard open), 6119:6338 (results) and 6123:7171 (no results)),
// pushed from the Home tab's search bar (scenes/main/Home.tsx). Registered
// as a hidden route inside app/(main) (see app/(main)/_layout.tsx) so the
// tab bar stays visible, matching Figma (every state but the keyboard-open
// one shows it). Populated from data/search.ts mock content - no backend
// exists yet (docs/PRD.md §2.2/§4.1) - see docs/screen/search/README.md.
export default function Search() {
  const { colors } = useTheme();
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>('');

  const filteredResults = useMemo(
    () =>
      searchResults.filter(
        item => item.title.toLowerCase().includes(query.trim().toLowerCase()) || '',
      ),
    [query],
  );

  return (
    <SafeAreaView style={[layoutStyle.screen, { backgroundColor: colors.background }]}>
      <ScrollView
        style={layoutStyle.screen}
        contentContainerStyle={layoutStyle.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        <AppHeader
          onNotificationPress={() => router.push('/notifications')}
          style={searchStyle.headerGap}
        />

        <SearchBar
          value={query}
          onChangeText={setQuery}
          autoFocus
          style={searchStyle.searchBarGap}
        />

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={[searchStyle.row, searchStyle.chipRowGap]}>
            {searchCategories.map(category => (
              <CategoryChip
                key={category}
                label={category}
                selected={selectedCategory === category}
                onPress={() => setSelectedCategory(prev => (prev === category ? null : category))}
              />
            ))}
          </View>
        </ScrollView>

        <View style={searchStyle.resultsGap}>
          {filteredResults.length > 0 ? (
            <View style={searchStyle.resultsListGap}>
              {filteredResults.map(item => (
                <CampaignCard key={item.id} variant="list" {...item} />
              ))}
            </View>
          ) : (
            <EmptyState
              style={searchStyle.emptyState}
              illustration={<SearchIllustration />}
              title="No campaign Found"
              description="When we add collections. They'll be appear here"
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
