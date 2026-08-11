import { Asset } from 'expo-asset';

export const images: { [key: string]: ReturnType<typeof require> } = {};

// preload images
const preloadImages = () =>
  Object.keys(images).map(key => {
    return Asset.fromModule(images[key] as number).downloadAsync();
  });

export const loadImages = async () => Promise.all(preloadImages());
