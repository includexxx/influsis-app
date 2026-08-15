import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '@/hooks';
import { layoutStyle, buttonStyle as sharedButton, createGigStyle } from '@/styles';
import { useCreateGigSlice } from '@/slices';
import ScreenHeader from '@/components/elements/ScreenHeader';
import TextField from '@/components/elements/TextField';
import Checkbox from '@/components/elements/Checkbox';
import AddItemButton from '@/components/elements/AddItemButton';
import Button from '@/components/elements/Button';

// Step 2 of the Create Gig wizard - "pricing & details" (Figma "Create
// Gig", node 6301:8033 empty state / 6525:6237 filled state): price,
// delivery time, a checkbox+text "What's Included" feature list, and a
// "Requirements for buyers" text list. Registered at `/create-gig-pricing`
// (app/(main)/create-gig-pricing.tsx). See docs/screen/create-gig/pricing.md.
export default function CreateGigPricing() {
  const { colors } = useTheme();
  const {
    price,
    deliveryTime,
    features,
    requirements,
    dispatch,
    setPrice,
    setDeliveryTime,
    addFeature,
    updateFeatureText,
    toggleFeatureIncluded,
    addRequirement,
    updateRequirementText,
  } = useCreateGigSlice();

  const canContinue =
    !!price.trim() && !!deliveryTime.trim() && features.some(feature => !!feature.text.trim());

  function handleNext() {
    router.push('/create-gig-preview');
  }

  return (
    <SafeAreaView style={[layoutStyle.screen, { backgroundColor: colors.background }]}>
      <View style={createGigStyle.headerRow}>
        <ScreenHeader title="Create new gig" onBack={() => router.back()} />
      </View>
      <View style={[createGigStyle.divider, { backgroundColor: colors.divider }]} />

      <ScrollView
        style={layoutStyle.screen}
        contentContainerStyle={[layoutStyle.scrollContent, createGigStyle.sectionGroup]}
        showsVerticalScrollIndicator={false}>
        <View style={createGigStyle.sectionBlock}>
          <Text style={[createGigStyle.sectionTitle, { color: colors.text.primary }]}>Pricing</Text>
          <TextField
            placeholder="Enter your price"
            keyboardType="numeric"
            value={price}
            onChangeText={text => dispatch(setPrice(text))}
            testID="price-input"
          />
          <TextField
            placeholder="Delivery Time"
            value={deliveryTime}
            onChangeText={text => dispatch(setDeliveryTime(text))}
            testID="delivery-time-input"
          />
        </View>

        <View style={createGigStyle.sectionBlock}>
          <Text style={[createGigStyle.sectionTitle, { color: colors.text.primary }]}>
            What&apos;s Included
          </Text>
          <View style={createGigStyle.featureList}>
            {features.map(feature => (
              <View key={feature.id} style={createGigStyle.featureRow}>
                <Checkbox
                  checked={feature.included}
                  onPress={() => dispatch(toggleFeatureIncluded(feature.id))}
                  testID={`feature-checkbox-${feature.id}`}
                />
                <TextField
                  placeholder="Add feature"
                  value={feature.text}
                  onChangeText={text => dispatch(updateFeatureText({ id: feature.id, text }))}
                  style={createGigStyle.featureInput}
                  testID={`feature-input-${feature.id}`}
                />
              </View>
            ))}
          </View>
          <AddItemButton
            label="Add feature"
            style={createGigStyle.addItemButton}
            onPress={() => dispatch(addFeature())}
            testID="add-feature-button"
          />
        </View>

        <View style={createGigStyle.sectionBlock}>
          <Text style={[createGigStyle.sectionTitle, { color: colors.text.primary }]}>
            Requirements for buyers
          </Text>
          <View style={createGigStyle.featureList}>
            {requirements.map(requirement => (
              <TextField
                key={requirement.id}
                placeholder="What do you need to get started?"
                multiline
                inputStyle={createGigStyle.textarea}
                value={requirement.text}
                onChangeText={text => dispatch(updateRequirementText({ id: requirement.id, text }))}
                testID={`requirement-input-${requirement.id}`}
              />
            ))}
          </View>
          <AddItemButton
            label="Add feature"
            style={createGigStyle.addItemButton}
            onPress={() => dispatch(addRequirement())}
            testID="add-requirement-button"
          />
        </View>
      </ScrollView>

      <View style={layoutStyle.scrollContent}>
        <Button
          title="Next"
          titleStyle={sharedButton.primaryTitle}
          style={sharedButton.primary}
          onPress={handleNext}
          disabled={!canContinue}
        />
      </View>
    </SafeAreaView>
  );
}
