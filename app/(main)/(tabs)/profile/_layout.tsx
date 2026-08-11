import { Stack, useNavigation } from 'expo-router';
import { DrawerActions } from '@react-navigation/native';
import NavigationHeaderLeft from '@/components/layouts/NavigationHeaderLeft';
import NavigationHeaderTitle from '@/components/layouts/NavigationHeaderTitle';
import { useTheme } from '@/hooks';

export default function ProfileStackLayout() {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const toggleDrawer = () => navigation.dispatch(DrawerActions.toggleDrawer());
  return (
    <Stack
      screenOptions={{
        headerTintColor: colors.text.inverse,
        headerStyle: { backgroundColor: colors.primary },
        headerTitleStyle: { fontSize: 18 },
      }}>
      <Stack.Screen
        name="index"
        options={{
          title: 'Profile',
          headerTitle: () => <NavigationHeaderTitle />,
          headerLeft: () => <NavigationHeaderLeft onPress={toggleDrawer} />,
          headerTitleAlign: 'center',
        }}
      />
      <Stack.Screen name="details" options={{ title: 'Details' }} />
    </Stack>
  );
}
