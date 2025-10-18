import React from "npm:react";
import _ from "npm:lodash";
import moment from "npm:moment-timezone";
import { Box, Text } from "npm:ink";
import type { ChoicesProps } from "./choices.types.ts";
import { Body, symbolByBody } from "../symbols.constants.ts";
import { UnorderedList } from "@inkjs/ui";
import { useState } from "npm:react";

export function Choices(props: ChoicesProps) {
  const {
    aspects,
    decanIngressBodies,
    end,
    eventTypes,
    ingresses,
    latitude,
    longitude,
    majorAspectBodies,
    minorAspectBodies,
    peakIngressBodies,
    planetaryPhaseBodies,
    retrogradeBodies,
    signIngressBodies,
    specialtyAspectBodies,
    start,
  } = props;

  // 🪝 Hooks
  const [isExpanded, _setExpanded] = useState(false);
  // useInput((input, _key) => {
  //   if (input.toLowerCase() === "e") {
  //     setExpanded(!isExpanded);
  //   }
  // });

  // 🏗️ Setup

  // 💪 Handlers

  // 🎨 Markup

  const renderBodies = (title: string, bodies: Body[]) => {
    if (isExpanded) {
      return (
        <UnorderedList.Item>
          <Text>{title}: </Text>
          <UnorderedList>
            {bodies.map((body) => (
              <UnorderedList.Item key={body}>
                <Text>
                  {symbolByBody[body]} {_.startCase(body)}
                </Text>
              </UnorderedList.Item>
            ))}
          </UnorderedList>
        </UnorderedList.Item>
      );
    } else {
      return (
        <UnorderedList.Item>
          <Text>
            {title}: {bodies.map((body) => symbolByBody[body]).join(" ")}
          </Text>
        </UnorderedList.Item>
      );
    }
  };

  // 🔄 Lifecycle

  // 🔌 Short Circuits

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      paddingY={1}
      paddingX={2}
      marginY={1}
    >
      <Box marginBottom={1}>
        <Text bold>🔮 Input</Text>
      </Box>
      <UnorderedList>
        {!!ingresses.length && (
          <UnorderedList.Item>
            <Text>💫 Ingresses</Text>
            <UnorderedList>
              {!!signIngressBodies.length &&
                renderBodies("🪧  Sign Ingresses", signIngressBodies)}
              {!!decanIngressBodies.length &&
                renderBodies("🔟 Decan Ingresses", decanIngressBodies)}
              {!!peakIngressBodies.length &&
                renderBodies("⛰️  Peak Ingresses", peakIngressBodies)}
            </UnorderedList>
          </UnorderedList.Item>
        )}
        {!!aspects.length && (
          <UnorderedList.Item>
            <Text>🧭 Aspects</Text>
            <UnorderedList>
              {!!majorAspectBodies.length &&
                renderBodies("📐 Major Aspects", majorAspectBodies)}
              {!!minorAspectBodies.length &&
                renderBodies("🖇️  Minor Aspects", minorAspectBodies)}
              {!!specialtyAspectBodies.length &&
                renderBodies("🧮 Specialty Aspects", specialtyAspectBodies)}
            </UnorderedList>
          </UnorderedList.Item>
        )}
        {!!retrogradeBodies.length &&
          renderBodies("🔄 Retrogrades", retrogradeBodies)}
        {!!planetaryPhaseBodies.length &&
          renderBodies("🌗 Planetary Phases", planetaryPhaseBodies)}
        {eventTypes.includes("annualSolarCycle") && (
          <UnorderedList.Item>
            <Text>📏 Annual Solar Cycle</Text>
          </UnorderedList.Item>
        )}
        {eventTypes.includes("monthlyLunarCycle") && (
          <UnorderedList.Item>
            <Text>🌒 Monthly Lunar Cycle</Text>
          </UnorderedList.Item>
        )}
        {eventTypes.includes("dailySolarCycle") && (
          <UnorderedList.Item>
            <Text>☀️ Daily Solar Cycle</Text>
          </UnorderedList.Item>
        )}
        {eventTypes.includes("dailyLunarCycle") && (
          <UnorderedList.Item>
            <Text>🌙 Daily Lunar Cycle</Text>
          </UnorderedList.Item>
        )}
        {eventTypes.includes("twilights") && (
          <UnorderedList.Item>
            <Text>🌄 Twilights</Text>
          </UnorderedList.Item>
        )}
        {longitude && (
          <UnorderedList.Item>
            <Text>📍 Longitude: {longitude}°</Text>
          </UnorderedList.Item>
        )}
        {latitude && (
          <UnorderedList.Item>
            <Text>📍 Latitude: {latitude}°</Text>
          </UnorderedList.Item>
        )}
        {start && (
          <UnorderedList.Item>
            <Text>📅 Start: {moment(start).format("YYYY-MM-DD")}</Text>
          </UnorderedList.Item>
        )}
        {end && (
          <UnorderedList.Item>
            <Text>📅 End: {moment(end).format("YYYY-MM-DD")}</Text>
          </UnorderedList.Item>
        )}
      </UnorderedList>
      {/* <Box marginTop={1}>
        <Text>Options:</Text>
        <Spacer />
        <Text>e: {isExpanded ? "Expand" : "Collapse"} Inputs</Text>
      </Box> */}
    </Box>
  );
}
