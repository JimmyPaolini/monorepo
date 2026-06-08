import { Field, ID, ObjectType } from "@nestjs/graphql";
import {
  createConnectionType,
  createEdgeType,
} from "nestjs-graphql-connection";

/**
 * TODO: Document the {{namePascalCase}} GraphQL object type.
 */
@ObjectType()
export class {{namePascalCase}}Entity {
  @Field(() => ID)
  id!: string;
}

@ObjectType()
export class {{namePascalCase}}Edge extends createEdgeType(
  {{namePascalCase}}Entity,
) {}

/**
 * GraphQL Relay Connection for {{namePascalCase}}.
 */
@ObjectType()
export class {{namePascalCase}}Connection extends createConnectionType(
  {{namePascalCase}}Edge,
) {}
