import { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams, Redirect } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { nanoid } from '@reduxjs/toolkit';
import { useTheme } from '@/hooks';
import { layoutStyle, buttonStyle as sharedButton, applyCampaignStyle } from '@/styles';
import { allCampaigns } from '@/data/campaigns';
import Image from '@/components/elements/Image';
import TextField from '@/components/elements/TextField';
import FilePicker from '@/components/elements/FilePicker';
import FileUploadItem from '@/components/elements/FileUploadItem';
import Button from '@/components/elements/Button';
import SuccessSheet from '@/components/elements/SuccessSheet';

const backChevronIcon = require('@/assets/images/icons/back-chevron.png');

interface PortfolioFile {
  id: string;
  name: string;
  sizeLabel: string;
  included: boolean;
}

function formatFileSize(bytes?: number): string {
  if (!bytes) return '';
  const kb = bytes / 1024;
  return kb < 1024 ? `${Math.round(kb)} KB` : `${(kb / 1024).toFixed(1)} MB`;
}

// The Apply Campaign screen (Figma "Apply campaign", node 6011:8293 /
// 6393:7254 / 6393:7407) - pushed from Campaign Details' "Apply Now"
// button. Registered as a nested dynamic route
// (app/(details)/campaign/[id]/apply.tsx, path `/campaign/[id]/apply`)
// alongside the existing `/campaign/[id]` route, the same "no tab bar"
// `(details)` group reasoning. See docs/screen/apply-campaign/README.md.
export default function ApplyCampaign() {
  const { colors, palette } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const campaign = allCampaigns.find(item => item.id === id);

  const [files, setFiles] = useState<PortfolioFile[]>([]);
  const [linkOne, setLinkOne] = useState('');
  const [linkTwo, setLinkTwo] = useState('');
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);

  if (!campaign) {
    return <Redirect href="/home" />;
  }

  const canApply = files.length > 0 && !!(linkOne.trim() || linkTwo.trim());

  async function handlePickFiles() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (result.canceled) return;

    const picked = result.assets.map(asset => ({
      id: nanoid(),
      name: asset.fileName ?? 'Image',
      sizeLabel: formatFileSize(asset.fileSize) || '—',
      included: true,
    }));
    setFiles(prev => [...prev, ...picked]);
  }

  function toggleFileIncluded(fileId: string) {
    setFiles(prev =>
      prev.map(file => (file.id === fileId ? { ...file, included: !file.included } : file)),
    );
  }

  function handleApply() {
    setIsSuccessOpen(true);
  }

  return (
    <SafeAreaView style={[layoutStyle.screen, { backgroundColor: colors.background }]}>
      <View style={applyCampaignStyle.headerRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={8}
          style={applyCampaignStyle.backButton}
          onPress={() => router.back()}>
          <Image
            source={backChevronIcon}
            style={applyCampaignStyle.backButton}
            contentFit="contain"
          />
        </Pressable>
      </View>

      <ScrollView
        style={layoutStyle.screen}
        contentContainerStyle={applyCampaignStyle.content}
        showsVerticalScrollIndicator={false}>
        <View style={applyCampaignStyle.sectionBlock}>
          <Text style={[applyCampaignStyle.heading, { color: colors.text.primary }]}>
            Make your application
          </Text>

          <View style={[applyCampaignStyle.recapField, { backgroundColor: palette.gray[25] }]}>
            <Text style={[applyCampaignStyle.recapText, { color: palette.gray[400] }]}>
              {campaign.title}
            </Text>
          </View>

          {campaign.about && (
            <View style={[applyCampaignStyle.recapField, { backgroundColor: palette.gray[25] }]}>
              <Text style={[applyCampaignStyle.recapText, { color: palette.gray[400] }]}>
                {campaign.about}
              </Text>
            </View>
          )}

          {campaign.budget && (
            <View style={[applyCampaignStyle.recapField, { backgroundColor: palette.gray[25] }]}>
              <Text style={[applyCampaignStyle.recapText, { color: palette.gray[400] }]}>
                {campaign.budget}
              </Text>
            </View>
          )}
        </View>

        <View style={applyCampaignStyle.sectionBlock}>
          <Text style={[applyCampaignStyle.sectionTitle, { color: colors.text.primary }]}>
            Showcase your top work
          </Text>
          <FilePicker onPress={handlePickFiles} testID="portfolio-file-picker" />
          {!!files.length && (
            <View style={applyCampaignStyle.fileList}>
              {files.map(file => (
                <FileUploadItem
                  key={file.id}
                  name={file.name}
                  sizeLabel={file.sizeLabel}
                  included={file.included}
                  onToggleIncluded={() => toggleFileIncluded(file.id)}
                  testID={`portfolio-file-${file.id}`}
                />
              ))}
            </View>
          )}
        </View>

        <View style={applyCampaignStyle.sectionBlock}>
          <Text style={[applyCampaignStyle.sectionTitle, { color: colors.text.primary }]}>
            Portfolio Links
          </Text>
          <View style={applyCampaignStyle.linkList}>
            <TextField
              placeholder="Add social media or portfolio links"
              value={linkOne}
              onChangeText={setLinkOne}
              autoCapitalize="none"
              testID="portfolio-link-one"
            />
            <TextField
              placeholder="Add social media or portfolio links"
              value={linkTwo}
              onChangeText={setLinkTwo}
              autoCapitalize="none"
              testID="portfolio-link-two"
            />
          </View>
        </View>

        <Button
          title="Apply Now"
          titleStyle={sharedButton.primaryTitle}
          style={sharedButton.primary}
          onPress={handleApply}
          disabled={!canApply}
          testID="apply-now-button"
        />
      </ScrollView>

      {isSuccessOpen && (
        <SuccessSheet
          title="Successful!"
          description="Your application has been submitted. The business will be in touch if you're a good fit."
          buttonLabel="Go to campaign"
          buttonStyle={{ backgroundColor: '#DADADA' }}
          buttonTitleStyle={{ color: '#000000' }}
          onButtonPress={() => {
            setIsSuccessOpen(false);
            router.back();
          }}
          onClose={() => setIsSuccessOpen(false)}
        />
      )}
    </SafeAreaView>
  );
}
