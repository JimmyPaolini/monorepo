import { ChildEntity } from "typeorm";

import { Inflection } from "./Inflection.entity.js";

@ChildEntity("uninflected")
export class Uninflected extends Inflection {}
