import { faker } from "@faker-js/faker";
import "@testing-library/jest-dom/vitest";
import { render } from "@testing-library/react";
import { createElement } from "react";
import { beforeEach, describe, expect, it } from "vitest";

import {
  PronunciationButton,
  type PronunciationButtonProps,
} from "./PronunciationButton";

describe(PronunciationButton, () => {
  // 🎭 Mocks
  let props: PronunciationButtonProps;

  // 🏗 Setup
  beforeEach(() => {
    props = {
      className: faker.string.alpha(10),
      dialect: faker.helpers.arrayElement(["classical", "ecclesiastical"]),
      text: faker.lorem.word(),
    };
  });

  // 🧪 Tests
  it("should render successfully", () => {
    const element = createElement(PronunciationButton, props);
    const { container } = render(element);

    expect(container).toBeInTheDocument();
  });
});
