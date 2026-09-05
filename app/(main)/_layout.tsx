import { Platform } from 'react-native';
import { Tabs, router } from 'expo-router';
import { useTheme } from '@/hooks';
import TabBarIcon from '@/components/layouts/TabBarIcon';
import TabBarLabel from '@/components/layouts/TabBarLabel';

// Figma specifies a raw `0px -7px 12px rgba(0,0,0,0.25)` shadow (node
// 6355:6595) that doesn't match any token in theme/shadows.ts (all of which
// are downward-offset). `shadow*` style props are deprecated on web (React
// Native Web warns) in favor of `boxShadow`, same reasoning as
// theme/shadows.ts's own `getShadowStyle` platform branch.
const tabBarShadow =
  Platform.OS === 'web'
    ? { boxShadow: '0px -7px 12px rgba(0, 0, 0, 0.25)' }
    : {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -7 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 12,
      };

// Main app shell (Figma "TabBar", node 6355:6595): Home / Order / Create Gig
// / Message / Profile. "Create Gig" has no active tab state in Figma (no
// "Create Gig Active" variant exists, unlike the other four) - it's an
// action button rather than a persisted tab, so its `tabPress` is
// intercepted below and redirected to the hidden "create" screen instead of
// letting it become a 6th selected tab.
export default function MainLayout() {
  const { colors } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          height: 84,
          paddingTop: 8,
          backgroundColor: colors.card,
          borderTopWidth: 0,
          ...tabBarShadow,
        },
      }}>
      <Tabs.Screen
        name="home"
        options={{
          tabBarIcon: ({ focused }) => <TabBarIcon name="home" focused={focused} />,
          tabBarLabel: ({ focused }) => <TabBarLabel label="Home" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="order"
        options={{
          tabBarIcon: ({ focused }) => <TabBarIcon name="order" focused={focused} />,
          tabBarLabel: ({ focused }) => <TabBarLabel label="Order" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="create-gig"
        options={{
          tabBarIcon: ({ focused }) => <TabBarIcon name="create-gig" focused={focused} />,
          tabBarLabel: ({ focused }) => <TabBarLabel label="Create Gig" focused={focused} />,
        }}
        listeners={{
          tabPress: e => {
            e.preventDefault();
            router.push('/create');
          },
        }}
      />
      <Tabs.Screen
        name="message"
        options={{
          tabBarIcon: ({ focused }) => <TabBarIcon name="message" focused={focused} />,
          tabBarLabel: ({ focused }) => <TabBarLabel label="Message" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => <TabBarIcon name="profile" focused={focused} />,
          tabBarLabel: ({ focused }) => <TabBarLabel label="Profile" focused={focused} />,
        }}
      />
      {/* Reached only via the "create-gig" tabPress listener above -
          `href: null` keeps it out of the tab bar (it's not a 6th
          destination) while still registering "/create" as a real route
          inside this group, so `router.push('/create')` resolves. */}
      <Tabs.Screen name="create" options={{ href: null }} />
    </Tabs>
  );
}
