import { Field, ID, ObjectType } from "@nestjs/graphql";

/**
 * TODO: Document the {{namePascalCase}} GraphQL object type.
 */
@ObjectType()
export class {{namePascalCase}}Entity {
  @Field(() => ID)
  id!: string;
}
