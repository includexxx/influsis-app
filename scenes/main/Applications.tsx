import { useState } from 'react';
import { View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '@/hooks';
import { layoutStyle, applicationsStyle } from '@/styles';
import { palette } from '@/theme';
import ScreenHeader from '@/components/elements/ScreenHeader';
import CategoryChip from '@/components/elements/CategoryChip';
import CampaignCard from '@/components/elements/CampaignCard';
import CampaignRequestCard from '@/components/elements/CampaignRequestCard';
import { appliedCampaigns, campaignRequests } from '@/data/applications';

type ApplicationsTab = 'applied' | 'request';

// The Applications screen (Figma "List", node 6015:7090 "Applied" tab +
// 6475:6394 "Request" tab) - a creator's sent applications and the
// invitations they've received, opened from Profile's "My Applications"
// link (scenes/main/Profile.tsx). Registered in the app/(details)/ route
// group (no tab bar), the same reasoning as every other (details) screen -
// see docs/screen/apply-campaign/campaign-list.md.
export default function Applications() {
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState<ApplicationsTab>('applied');
  const [requests, setRequests] = useState(campaignRequests);

  function removeRequest(id: string) {
    setRequests(prev => prev.filter(item => item.id !== id));
  }

  return (
    <SafeAreaView style={[layoutStyle.screen, { backgroundColor: colors.background }]}>
      <ScrollView
        style={layoutStyle.screen}
        contentContainerStyle={layoutStyle.scrollContent}
        showsVerticalScrollIndicator={false}>
        <ScreenHeader
          title="List"
          onBack={() => router.back()}
          style={applicationsStyle.headerGap}
        />

        <View style={applicationsStyle.tabRow}>
          <CategoryChip
            label="Applied"
            selected={activeTab === 'applied'}
            onPress={() => setActiveTab('applied')}
            testID="applications-tab-applied"
          />
          <CategoryChip
            label="Request"
            selected={activeTab === 'request'}
            onPress={() => setActiveTab('request')}
            testID="applications-tab-request"
          />
        </View>

        {activeTab === 'applied' ? (
          <View style={applicationsStyle.appliedListGap}>
            {appliedCampaigns.map(item => (
              <CampaignCard
                key={item.id}
                variant="applied"
                image={item.image}
                title={item.title}
                price={item.price}
                dueDate={item.appliedDate}
                status="Applied"
                statusColor={palette.primary[400]}
                statusTextColor={palette.white}
              />
            ))}
          </View>
        ) : (
          <View style={applicationsStyle.requestListGap}>
            {requests.map(item => (
              <CampaignRequestCard
                key={item.id}
                avatar={item.brandLogo}
                brandName={item.brandName}
                time={item.time}
                onAccept={() => removeRequest(item.id)}
                onDecline={() => removeRequest(item.id)}
                testID={`campaign-request-${item.id}`}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
