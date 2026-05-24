import { describe, expect, it } from "vitest";

import { nameVariables } from "./name-variables";

describe("nameVariables", () => {
  describe("kebab-case input", () => {
    it("returns all variants for a multi-word kebab-case name", () => {
      const result = nameVariables("my-service");
      expect(result).toEqual({
        name: "my-service",
        nameCamel: "myService",
        namePascal: "MyService",
        nameSnake: "my_service",
        nameConstant: "MY_SERVICE",
        nameKebab: "my-service",
      });
    });
  });

  describe("camelCase input", () => {
    it("returns all variants for a single lowercase word", () => {
      const result = nameVariables("calendar");
      expect(result).toEqual({
        name: "calendar",
        nameCamel: "calendar",
        namePascal: "Calendar",
        nameSnake: "calendar",
        nameConstant: "CALENDAR",
        nameKebab: "calendar",
      });
    });

    it("returns all variants for a multi-word camelCase name", () => {
      const result = nameVariables("annualSolarCycle");
      expect(result).toEqual({
        name: "annualSolarCycle",
        nameCamel: "annualSolarCycle",
        namePascal: "AnnualSolarCycle",
        nameSnake: "annual_solar_cycle",
        nameConstant: "ANNUAL_SOLAR_CYCLE",
        nameKebab: "annual-solar-cycle",
      });
    });
  });

  describe("PascalCase input", () => {
    it("returns all variants for a single PascalCase word", () => {
      const result = nameVariables("Button");
      expect(result).toEqual({
        name: "Button",
        nameCamel: "button",
        namePascal: "Button",
        nameSnake: "button",
        nameConstant: "BUTTON",
        nameKebab: "button",
      });
    });

    it("returns all variants for a multi-word PascalCase name", () => {
      const result = nameVariables("MyComponent");
      expect(result).toEqual({
        name: "MyComponent",
        nameCamel: "myComponent",
        namePascal: "MyComponent",
        nameSnake: "my_component",
        nameConstant: "MY_COMPONENT",
        nameKebab: "my-component",
      });
    });
  });

  describe("snake_case input", () => {
    it("returns all variants for a snake_case name", () => {
      const result = nameVariables("my_service");
      expect(result).toEqual({
        name: "my_service",
        nameCamel: "myService",
        namePascal: "MyService",
        nameSnake: "my_service",
        nameConstant: "MY_SERVICE",
        nameKebab: "my-service",
      });
    });
  });

  it("preserves name as-is", () => {
    expect(nameVariables("my-service").name).toBe("my-service");
    expect(nameVariables("myService").name).toBe("myService");
    expect(nameVariables("MyService").name).toBe("MyService");
  });
});
