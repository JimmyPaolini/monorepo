import React, { Fragment } from "npm:react";
import { Box, Text, Spacer, Newline, Static } from "npm:ink";
import { ProgressBar, Spinner, ThemeProvider } from "@inkjs/ui";
import { theme } from "./logs.theme.ts";
import { setupDates } from "./logs.utils.tsx";
import type { Log, LogsProps } from "./logs.types.tsx";
import { Choices } from "../choices/choices.component.tsx";
import { ChoicesProps } from "../choices/choices.types.ts";

export function Logs(props: LogsProps) {
  const { choices, date, count = 0, logs = [], start, end } = props;

  // 🪝 Hooks

  // 🏗️ Setup
  const {
    dateLabel,
    dateProgressLabel,
    dateProgressPercent,
    daysElapsed,
    daysRemaining,
    endLabel,
    startLabel,
  } = setupDates({ date, start, end });

  const items = [choices, ...logs];

  // 💪 Handlers

  // 🎨 Markup
  const renderItem = (item: ChoicesProps | Log | undefined, i: number) => {
    if (!item) return <Fragment key={i}></Fragment>;
    else if ("aspects" in item) {
      // This is a ChoicesProps object
      return <Choices key="choices" {...item} />;
    } else {
      const key = item.timestamp.toISOString() + item.value;
      return <Text key={key}>{item.value}</Text>;
    }
  };

  // 🔄 Lifecycle

  // 🔌 Short Circuits

  return (
    <ThemeProvider theme={theme}>
      <Static items={items}>{renderItem}</Static>
      <Box
        flexDirection="column"
        borderStyle="round"
        paddingY={1}
        paddingX={2}
        marginY={1}
      >
        <Box marginBottom={1}>
          <Text bold>🚀 Output</Text>
        </Box>
        <Box marginBottom={1}>
          <Text>
            📅 Count: {count} events
            <Newline />
            📆 Current: {dateLabel}
          </Text>
        </Box>
        <Box>
          <Text>
            Elapsed: {daysElapsed} day{daysElapsed !== 1 ? "s" : ""}
          </Text>
          <Spacer />
          <Text>
            Remaining: {daysRemaining} day{daysRemaining !== 1 ? "s" : ""}
          </Text>
        </Box>
        <Box>
          <Spinner label={dateProgressLabel + " "} />
          <ProgressBar value={dateProgressPercent} />
        </Box>
        <Box>
          <Text>Start: {startLabel}</Text>
          <Spacer />
          <Text>End: {endLabel}</Text>
        </Box>
      </Box>
    </ThemeProvider>
  );
}
