import { faker } from "@faker-js/faker";
import { Factory } from "fishery";

import { FindSampleArgs } from "./sample.args";
import { SampleEntity } from "./sample.entities";
import { CreateSampleInput, DeleteSampleInput, UpdateSampleInput } from "./sample.inputs";

export const sampleEntityFactory = Factory.define<SampleEntity>(() => ({
  id: faker.string.uuid(),
}));

export const createSampleInputFactory = Factory.define<CreateSampleInput>(() => ({
  _placeholder: undefined as never,
}));

export const updateSampleInputFactory = Factory.define<UpdateSampleInput>(() => ({
  _placeholder: undefined as never,
}));

export const deleteSampleInputFactory = Factory.define<DeleteSampleInput>(() => ({
  _placeholder: undefined as never,
}));

export const findSampleArgsFactory = Factory.define<FindSampleArgs>(() => ({
  after: undefined,
  before: undefined,
  first: faker.number.int({ max: 50, min: 1 }),
  last: undefined,
}));
