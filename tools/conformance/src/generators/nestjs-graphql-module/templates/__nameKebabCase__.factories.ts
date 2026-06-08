import { faker } from "@faker-js/faker";
import { Factory } from "fishery";

import { Find{{namePascalCase}}Args } from "./{{nameKebabCase}}.args";
import { {{namePascalCase}}Entity } from "./{{nameKebabCase}}.entities";
import {
  Create{{namePascalCase}}Input,
  Delete{{namePascalCase}}Input,
  Update{{namePascalCase}}Input,
} from "./{{nameKebabCase}}.inputs";

export const {{nameCamelCase}}EntityFactory = Factory.define<{{namePascalCase}}Entity>(
  () => ({
    id: faker.string.uuid(),
  }),
);

export const create{{namePascalCase}}InputFactory = Factory.define<Create{{namePascalCase}}Input>(
  () => ({
    _placeholder: undefined as never,
  }),
);

export const update{{namePascalCase}}InputFactory = Factory.define<Update{{namePascalCase}}Input>(
  () => ({
    _placeholder: undefined as never,
  }),
);

export const delete{{namePascalCase}}InputFactory = Factory.define<Delete{{namePascalCase}}Input>(
  () => ({
    _placeholder: undefined as never,
  }),
);

export const find{{namePascalCase}}ArgsFactory = Factory.define<Find{{namePascalCase}}Args>(
  () => ({
    first: faker.number.int({ max: 50, min: 1 }),
    after: undefined,
    last: undefined,
    before: undefined,
  }),
);
