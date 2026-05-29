import { LearningMaterialEntity } from "@monorepo/lexico-ingestion-entities";
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { LexicoIngestionCommand } from "./lexicoIngestion.command";
import { LexicoIngestionService } from "./lexicoIngestion.service";

/** Root module for lexico-ingestion CLI wiring TypeORM and ingestion services. */
@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: "postgres",
      host: process.env["POSTGRES_HOST"] ?? "localhost",
      port: Number(process.env["POSTGRES_PORT"] ?? 5432),
      username: process.env["POSTGRES_USER"] ?? "postgres",
      password: process.env["POSTGRES_PASSWORD"] ?? "postgres",
      database: process.env["POSTGRES_DATABASE"] ?? "lexico_ingestion",
      entities: [LearningMaterialEntity],
      synchronize: true,
      manualInitialization: true,
    }),
  ],
  providers: [LexicoIngestionCommand, LexicoIngestionService],
})
export class LexicoIngestionModule {}
