import { ObjectType } from "@nestjs/graphql";
import { ChildEntity } from "typeorm";

import { Inflection } from "./Inflection.entity";

/**
 * Inflection marker for lexemes that do not vary by inflection.
 */
@ChildEntity("uninflected")
@ObjectType({ implements: Inflection })
export class UninflectedInflection extends Inflection {}
