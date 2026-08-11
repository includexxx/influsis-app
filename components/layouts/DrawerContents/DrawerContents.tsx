import { StyleSheet, View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks';

const styles = StyleSheet.create({
  root: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
  },
});

export default function DrawerContents() {
  const { colors, spacing } = useTheme();
  return (
    <SafeAreaView style={{ backgroundColor: colors.background }}>
      <View style={[styles.root, { padding: spacing.lg }]}>
        <Text style={{ color: colors.text.secondary }}>Menu</Text>
      </View>
    </SafeAreaView>
  );
}
