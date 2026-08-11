import { SimpleLineIcons } from '@expo/vector-icons';
import { useTheme } from '@/hooks';

export default function NavigationHeaderLeft({ onPress }: { onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <SimpleLineIcons.Button
      name="menu"
      size={24}
      color={colors.text.inverse}
      backgroundColor="transparent"
      onPress={onPress}
    />
  );
}
