import { Tabs } from 'expo-router';
import { AntDesign } from '@expo/vector-icons';
import { useTheme } from '@/hooks';

export default function TabLayout() {
  const { colors } = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarInactiveTintColor: colors.text.secondary,
        tabBarInactiveBackgroundColor: colors.background,
        tabBarActiveTintColor: colors.primary,
        tabBarActiveBackgroundColor: colors.background,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <AntDesign name="home" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <AntDesign name="profile" size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
