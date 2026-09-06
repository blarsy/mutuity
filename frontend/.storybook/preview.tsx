import type { Preview } from "@storybook/react";

import { StoryProviders, type StoryHarnessParameters } from "../src/stories/harness/StoryProviders";
import type { AppColorMode } from "../src/theme";

const preview: Preview = {
  parameters: {
    layout: "fullscreen",
    nextjs: { router: { pathname: "/", asPath: "/" } },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/
      }
    }
  },
  globalTypes: {
    colorMode: {
      description: "Mutuity theme color mode",
      toolbar: {
        icon: "paintbrush",
        items: [
          { value: "light", title: "Light" },
          { value: "dark", title: "Dark" }
        ],
        dynamicTitle: true
      }
    },
    locale: {
      description: "Interface language",
      toolbar: {
        icon: "globe",
        items: [
          { value: "fr", title: "Français" },
          { value: "en", title: "English" }
        ],
        dynamicTitle: true
      }
    }
  },
  initialGlobals: {
    colorMode: "light",
    locale: "fr"
  },
  decorators: [
    (Story, context) => {
      const harness = context.parameters as StoryHarnessParameters;

      return (
        <StoryProviders
          apollo={harness.apollo}
          appShell={harness.appShell ?? true}
          auth={harness.auth}
          colorMode={context.globals.colorMode as AppColorMode}
          locale={context.globals.locale as string}
        >
          <Story />
        </StoryProviders>
      );
    }
  ]
};

export default preview;
