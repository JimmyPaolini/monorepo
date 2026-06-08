import { Field, ID, ObjectType } from "@nestjs/graphql";
import { createConnectionType, createEdgeType } from "nestjs-graphql-connection";

/**
 * Sample GraphQL entity — replace with your domain entity.
 */
@ObjectType()
export class SampleEntity {
  @Field(() => ID)
  id!: string;
}

@ObjectType()
export class SampleEdge extends createEdgeType(SampleEntity) {}

/**
 * GraphQL Relay Connection for Sample.
 */
@ObjectType()
export class SampleConnection extends createConnectionType(SampleEdge) {}
