import { ObjectType } from "@nestjs/graphql";
import { ChildEntity } from "typeorm";

import { Inflection } from "./Inflection.entity.js";

/**
 *
 */
@ObjectType({ implements: Inflection })
@ChildEntity("uninflected")
export class Uninflected extends Inflection {}
