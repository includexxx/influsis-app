import { Text, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks';

export interface TabBarLabelProps {
  label: string;
  focused: boolean;
}

const styles = StyleSheet.create({
  label: {
    fontSize: 11,
    letterSpacing: 0.44,
    textAlign: 'center',
  },
});

// Tab bar label text (Figma "TabBar", node 6355:6595) - active tabs render
// bolder and darker than inactive ones.
function TabBarLabel({ label, focused }: TabBarLabelProps) {
  const { palette } = useTheme();

  return (
    <Text
      style={[
        styles.label,
        {
          color: focused ? palette.gray[900] : palette.gray[400],
          fontWeight: focused ? '700' : '500',
        },
      ]}>
      {label}
    </Text>
  );
}

export default TabBarLabel;
