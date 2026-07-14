import AsyncStorage from '@react-native-async-storage/async-storage';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useFonts } from 'expo-font';
import React from 'react';
import { LiteUI } from '@storybook/react-native-ui-lite';

import { view } from './storybook.requires';
import { appFontAssets } from '../src/theme/fonts';

/**
 * This file is user-editable.
 *
 * Use it as your React Native Storybook entrypoint and wrap `StorybookUIRoot`
 * with application decorators/providers (theme, i18n, state, navigation, etc).
 */
const StorybookUIRoot = view.getStorybookUI({
  shouldPersistSelection: true,
  storage: {
    getItem: AsyncStorage.getItem,
    setItem: AsyncStorage.setItem,
  },
  CustomUIComponent: LiteUI,
});

export default function StorybookRoot(): React.JSX.Element | null {
  const [fontsLoaded] = useFonts({
    ...appFontAssets,
    ...MaterialCommunityIcons.font,
  });

  if (!fontsLoaded) {
    return null;
  }

  return React.createElement(StorybookUIRoot);
}
