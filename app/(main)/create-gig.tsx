import { Redirect } from 'expo-router';

// Never actually reached in normal use - the tab's `tabPress` is
// intercepted in `_layout.tsx` and redirects to the hidden `/create` screen
// instead. This file exists only so expo-router has a screen to render a
// tab bar button for. Falls back to Home if somehow navigated to directly
// (e.g. a stale deep link).
export default function CreateGigTabFallback() {
  return <Redirect href="/home" />;
}
