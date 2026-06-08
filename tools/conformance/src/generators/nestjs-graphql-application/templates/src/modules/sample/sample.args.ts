import { ArgsType } from "@nestjs/graphql";
import { ConnectionArgs } from "nestjs-graphql-connection";

/**
 * Sample args type — replace with your domain filter arguments.
 */
@ArgsType()
export class FindSampleArgs extends ConnectionArgs {
  // TODO: Add custom filter arguments here
}
