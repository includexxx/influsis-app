import { View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '@/hooks';
import { layoutStyle, buttonStyle as sharedButton, createGigStyle } from '@/styles';
import { useCreateGigSlice } from '@/slices';
import { gigCategories } from '@/data/gigCategories';
import ScreenHeader from '@/components/elements/ScreenHeader';
import ImageUploader from '@/components/elements/ImageUploader';
import TextField from '@/components/elements/TextField';
import SelectField from '@/components/elements/SelectField';
import Button from '@/components/elements/Button';
import CustomSelectField from '@/components/elements/CustomSelectField';

// Step 1 of the Create Gig wizard - "basic info" (Figma "Create Gig", node
// 6525:6020 empty state / 6521:5770 filled state): cover photo, service
// title, category, description. Registered at the existing `/create` route
// (app/(main)/create.tsx), reached via the "Create Gig" tab's `tabPress`
// listener in app/(main)/_layout.tsx - replaces that route's previous bare
// placeholder scene. See docs/screen/create-gig/basics.md.
export default function CreateGigBasics() {
  const { colors } = useTheme();
  const {
    coverImageUri,
    title,
    category,
    description,
    dispatch,
    setCoverImageUri,
    setTitle,
    setCategory,
    setDescription,
  } = useCreateGigSlice();

  const canContinue = !!coverImageUri && !!title.trim() && !!category && !!description.trim();

  function handleNext() {
    router.push('/create-gig-pricing');
  }

  return (
    <SafeAreaView style={[layoutStyle.screen, { backgroundColor: colors.background }]}>
      <View style={createGigStyle.headerRow}>
        <ScreenHeader title="Create new gig" onBack={() => router.back()} />
      </View>
      <View style={[createGigStyle.divider, { backgroundColor: colors.divider }]} />

      <ScrollView
        style={layoutStyle.screen}
        contentContainerStyle={[layoutStyle.scrollContent, createGigStyle.fieldGroup]}
        showsVerticalScrollIndicator={false}>
        <ImageUploader
          imageUri={coverImageUri}
          onChange={uri => dispatch(setCoverImageUri(uri))}
          testID="cover-image-uploader"
        />

        <TextField
          label="Service Title"
          labelStyle={[createGigStyle.fieldLabel, { color: colors.text.primary }]}
          value={title}
          onChangeText={text => dispatch(setTitle(text))}
          testID="service-title-input"
        />

        <CustomSelectField
          label="Category"
          placeholder="Select category"
          value={category}
          options={gigCategories}
          onSelect={value => dispatch(setCategory(value))}
          testID="category-select"
        />

        <TextField
          label="Description"
          labelStyle={[createGigStyle.fieldLabel, { color: colors.text.primary }]}
          placeholder="Describe your service in detail.."
          multiline
          inputStyle={createGigStyle.textarea}
          value={description}
          onChangeText={text => dispatch(setDescription(text))}
          testID="description-input"
        />
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
