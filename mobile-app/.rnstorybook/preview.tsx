import type { Preview } from '@storybook/react-native';
import React from 'react';

import { MutuityThemeProvider } from '../src/theme/MutuityThemeProvider';

const preview: Preview = {
  decorators: [
    (Story) => (
      <MutuityThemeProvider>
        <Story />
      </MutuityThemeProvider>
    ),
  ],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
  },
};

export default preview;
