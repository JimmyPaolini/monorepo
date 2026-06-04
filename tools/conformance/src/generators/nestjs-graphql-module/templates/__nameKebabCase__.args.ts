import { ArgsType, Field, Int } from "@nestjs/graphql";

/**
 * TODO: Document the Find{{namePascalCase}}Args GraphQL args type.
 */
@ArgsType()
export class Find{{namePascalCase}}Args {
  @Field(() => Int, { defaultValue: 0 })
  skip: number = 0;

  @Field(() => Int, { defaultValue: 10 })
  take: number = 10;
}
