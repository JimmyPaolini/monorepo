import { Injectable } from "@nestjs/common";

import type { LoggerService } from "../logger/logger.service";
import type { SynchronizationMode } from "./synchronization.types";

/** Shared options for resolving and validating synchronization command mode arguments. */
interface SynchronizationModeResolutionOptions {
  readonly defaultMode?: SynchronizationMode;
  readonly invalidModeLabel: string;
  readonly loggerService: LoggerService;
  readonly passedParameters: string[];
  readonly usageMessage: string;
}

/** Result of mode parsing before command-specific error handling is applied. */
type SynchronizationModeResolutionResult =
  | {
      modeValue: string;
      valid: false;
    }
  | {
      modeValue: SynchronizationMode;
      valid: true;
    };

/** Shared service for resolving and validating synchronization command modes. */
@Injectable()
export class SynchronizationModeService {
  /** Logs invalid mode details and exits with status code 1. */
  private exitInvalidMode(options: {
    invalidModeLabel: string;
    loggerService: LoggerService;
    modeValue: string;
    usageMessage: string;
  }): never {
    const { invalidModeLabel, loggerService, modeValue, usageMessage } =
      options;

    loggerService.error(`❌ ${invalidModeLabel}: ${modeValue}`);
    loggerService.error(usageMessage);
    process.exit(1);
  }

  /** Resolves mode value and indicates whether it is valid without side effects. */
  private resolveModeValue(
    options: SynchronizationModeResolutionOptions,
  ): SynchronizationModeResolutionResult {
    const { defaultMode = "check", passedParameters } = options;
    const modeValue = passedParameters[0] ?? defaultMode;

    if (this.isSynchronizationMode(modeValue)) {
      return { modeValue, valid: true };
    }

    return { modeValue, valid: false };
  }

  /** Returns true when the provided value is a supported synchronization mode. */
  isSynchronizationMode(modeValue: string): modeValue is SynchronizationMode {
    return modeValue === "check" || modeValue === "write";
  }

  /** Resolves synchronization mode or exits the process when the mode is invalid. */
  resolveSynchronizationModeOrExit(
    options: SynchronizationModeResolutionOptions,
  ): SynchronizationMode {
    const modeResolution = this.resolveModeValue(options);

    if (modeResolution.valid) {
      return modeResolution.modeValue;
    }

    return this.exitInvalidMode({
      invalidModeLabel: options.invalidModeLabel,
      loggerService: options.loggerService,
      modeValue: modeResolution.modeValue,
      usageMessage: options.usageMessage,
    });
  }

  /** Resolves synchronization mode or throws when the mode is invalid. */
  resolveSynchronizationModeOrThrow(
    options: SynchronizationModeResolutionOptions,
  ): SynchronizationMode {
    const modeResolution = this.resolveModeValue(options);

    if (modeResolution.valid) {
      return modeResolution.modeValue;
    }

    options.loggerService.error(
      `❌ ${options.invalidModeLabel}: ${modeResolution.modeValue}`,
    );
    options.loggerService.error(options.usageMessage);
    throw new TypeError(
      `Invalid synchronization mode: ${modeResolution.modeValue}`,
    );
  }
}
