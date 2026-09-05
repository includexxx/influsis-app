const { jest } = require('@jest/globals');

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

// Reanimated's worklets aren't compiled under Jest (no babel worklet plugin
// in the test transform), so any component using it - e.g. BottomSheet via
// @gorhom/bottom-sheet - needs this standard mock to render in tests.
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));
