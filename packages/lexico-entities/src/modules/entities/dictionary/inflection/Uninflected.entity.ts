import { ObjectType } from "@nestjs/graphql";
import { ChildEntity } from "typeorm";

import { Inflection } from "./Inflection.entity.js";

/**
 *
 */
@ChildEntity("uninflected")
@ObjectType({ implements: Inflection })
export class UninflectedInflection extends Inflection {}
