import { TextProps } from "npm:ink";
import { defaultTheme, extendTheme } from "@inkjs/ui";

export const theme = extendTheme(defaultTheme, {
  components: {
    ProgressBar: {
      styles: {
        completed: (): TextProps => ({
          color: "white",
        }),
        remaining: (): TextProps => ({
          dimColor: true,
        }),
      },
    },
    Spinner: {
      styles: {
        label: (): TextProps => ({
          color: "white",
          dimColor: true,
        }),
      },
    },
  },
});
