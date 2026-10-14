import { Redirect, Tabs } from 'expo-router';
import { useAuthSlice } from '@/slices';
import { authGate } from '@/utils/authGate';
import AnimatedTabBar from '@/components/layouts/AnimatedTabBar';

// Main app shell (Figma "TabBar", node 6355:6595): Home / Applications /
// Transactions / Message / Profile. Order and Create Gig are no longer tab
// buttons but keep their routes here (hidden), since `/order` and `/create`
// are still navigated to and keep the tab bar mounted. The Create Gig
// wizard's later steps (`/create-gig-pricing`, `/create-gig-preview`) stay
// in `(details)` and push onto the root Stack - see
// docs/screen/create-gig/README.md.
// The bar itself is the custom AnimatedTabBar (components/layouts); which
// routes get a button, with what icon and label, is its MAIN_TABS list.
export default function MainLayout() {
  const { status } = useAuthSlice();
  const gate = authGate(status, '(main)');

  if (gate.type === 'wait') return null;
  if (gate.type === 'redirect') return <Redirect href={gate.href} />;

  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={props => <AnimatedTabBar {...props} />}>
      <Tabs.Screen name="home" options={{ title: 'Home' }} />
      <Tabs.Screen name="applications" options={{ title: 'Applications' }} />
      <Tabs.Screen name="transactions" options={{ title: 'Transactions' }} />
      <Tabs.Screen name="message" options={{ title: 'Message' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
      {/* Former tabs, now without a tab button: Order (reached back from
          OrderDelivered) and Create Gig (CreateGigPreview's edit step). */}
      <Tabs.Screen name="order" options={{ href: null }} />
      <Tabs.Screen name="create" options={{ href: null }} />
      {/* Reached via the Home tab's search bar (scenes/home/Home.tsx). Not
          a tab bar destination (Figma's Search screen has no matching tab
          icon), but the tab bar itself stays visible on this screen per
          Figma (docs/screen/search) - registering it inside this group
          rather than at the root (unlike /notifications, which Figma shows
          without a tab bar) keeps that shell intact. */}
      <Tabs.Screen name="search" options={{ href: null }} />
      {/* The Balance screen, reached from the Profile tab's "Ballance" row
          (scenes/profile/Profile.tsx). Registered here for the same reason as
          /search: Figma's frame (node 6402:5295) keeps a Tab Bar instance
          mounted at y=848, so the shell has to stay intact - see
          docs/screen/balance/README.md. */}
      <Tabs.Screen name="ballance" options={{ href: null }} />
    </Tabs>
  );
}
