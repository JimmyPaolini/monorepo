import { ObjectType } from "@nestjs/graphql";

import { DeletableEntity } from "./Deletable.entity.js";

/** Base class providing a UUID primary key and audit trail columns for all content-bearing entities. */
@ObjectType({ isAbstract: true })
export abstract class AuditableEntity extends DeletableEntity {}
