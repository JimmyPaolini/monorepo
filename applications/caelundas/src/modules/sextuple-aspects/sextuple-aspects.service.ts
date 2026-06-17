import { MathService } from "@caelundas/src/modules/math/math.service";
import { Injectable } from "@nestjs/common";
import _ from "lodash";

import { SextupleAspectsComposerService } from "./sextuple-aspects-composer.service.js";

import type { ComposeHexagramsArguments } from "./sextuple-aspects.types";
import type { AspectBodies } from "@caelundas/src/modules/aspects/aspects.service";
import type {
  AspectPhase,
  Body,
} from "@caelundas/src/modules/caelundas/caelundas.types";
import type { Event } from "@caelundas/src/modules/calendar/calendar.types";
import type { Moment } from "moment-timezone";

/**
 *
 */
@Injectable()
export class SextupleAspectsService {
  // 🏗 Dependency Injection

  constructor(
    private readonly sextupleAspectsComposerService: SextupleAspectsComposerService,
    private readonly mathService: MathService,
  ) {}

  // 🔏 Private Methods

  private composeHexagrams(args: ComposeHexagramsArguments): Event[] {
    const { currentAspectBodies, minute, previousAspectBodies } = args;
    const unionEdges = [...currentAspectBodies, ...previousAspectBodies];
    const aspectsByType =
      this.sextupleAspectsComposerService.groupAspectsByType(unionEdges);
    const trines = aspectsByType.get("trine") || [];
    const sextiles = aspectsByType.get("sextile") || [];
    if (trines.length < 6 || sextiles.length < 6) return [];
    const bodies =
      this.sextupleAspectsComposerService.collectTrineBodies(trines);
    if (bodies.length < 6) return [];
    return this.processHexagramCombinations({
      combinations: this.mathService.getCombinations(bodies, 6),
      currentAspectBodies,
      minute,
      previousAspectBodies,
      unionEdges,
    });
  }

  private determineCompoundPhaseFromSnapshots(args: {
    checkPatternExists: (edges: AspectBodies[]) => boolean;
    currentAspectBodies: AspectBodies[];
    currentMinute: Moment;
    patternBodies: Body[];
    previousAspectBodies: AspectBodies[];
  }): null | { eventMinute: Moment; phase: AspectPhase } {
    const {
      checkPatternExists,
      currentAspectBodies,
      currentMinute,
      patternBodies,
      previousAspectBodies,
    } = args;
    const bodySet = new Set(patternBodies);
    const filterByBodies = (edges: AspectBodies[]): AspectBodies[] =>
      edges.filter(
        (edge) => bodySet.has(edge.bodies[0]) && bodySet.has(edge.bodies[1]),
      );

    const currentFiltered = filterByBodies(currentAspectBodies);
    const previousFiltered = filterByBodies(previousAspectBodies);

    const currentExists = checkPatternExists(currentFiltered);
    const previousExists = checkPatternExists(previousFiltered);

    if (currentExists && !previousExists) {
      return { eventMinute: currentMinute, phase: "forming" };
    }

    if (!currentExists && previousExists) {
      return {
        eventMinute: currentMinute.clone().subtract(1, "minute"),
        phase: "dissolving",
      };
    }

    return null;
  }

  private processHexagramCombinations(args: {
    combinations: Body[][];
    currentAspectBodies: AspectBodies[];
    minute: Moment;
    previousAspectBodies: AspectBodies[];
    unionEdges: AspectBodies[];
  }): Event[] {
    const {
      combinations,
      currentAspectBodies,
      minute,
      previousAspectBodies,
      unionEdges,
    } = args;
    const events: Event[] = [];
    for (const bodyCombination of combinations) {
      const hexagramBodies =
        this.sextupleAspectsComposerService.findHexagramPattern(
          bodyCombination,
          unionEdges,
        );
      if (!hexagramBodies) continue;
      const phaseTransition = this.determineCompoundPhaseFromSnapshots({
        checkPatternExists: (edges) =>
          this.sextupleAspectsComposerService.findHexagramPattern(
            hexagramBodies,
            edges,
          ) !== null,
        currentAspectBodies,
        currentMinute: minute,
        patternBodies: hexagramBodies,
        previousAspectBodies,
      });
      if (!phaseTransition) continue;
      const event = this.sextupleAspectsComposerService.buildHexagramEvent(
        hexagramBodies,
        phaseTransition.phase,
        phaseTransition.eventMinute,
      );
      if (event) events.push(event);
    }
    return events;
  }

  // 🌎 Public Methods

  /**
   * Detects all sextuple aspect patterns from stored 2-body aspect events.
   *
   * Currently detects the Hexagram (Star of David) pattern, which is one
   * of the rarest and most spiritually significant configurations.
   *
   * @param aspectEvents - Previously detected simple aspect events
   * @param minute - The minute to check for sextuple aspect patterns
   * @returns Array of all detected sextuple aspect events at this minute
   */
  detect(args: {
    currentAspectBodies: AspectBodies[];
    minute: Moment;
    previousAspectBodies: AspectBodies[];
  }): Event[] {
    const { currentAspectBodies, minute, previousAspectBodies } = args;
    return this.composeHexagrams({
      currentAspectBodies,
      minute,
      previousAspectBodies,
    });
  }

  /**
   * Converts instantaneous sextuple aspect events into progressive events.
   *
   * Pairs forming and dissolving events for the same body sextet and
   * pattern type to create events spanning the entire active period.
   *
   * @param events - All events to process (non-sextuple-aspect events are filtered out)
   * @returns Array of progressive events spanning from forming to dissolving
   */
  detectProgressive(events: Event[]): Event[] {
    const progressiveEvents: Event[] = [];
    const groupedEvents =
      this.sextupleAspectsComposerService.groupSextupleEventsByKey(events);

    for (const group of Object.values(groupedEvents)) {
      const sortedEvents = _.sortBy(group, "start");

      for (let index = 0; index < sortedEvents.length; index++) {
        const currentEvent = sortedEvents[index];

        if (!currentEvent?.categories.includes("Forming")) {
          continue;
        }

        for (
          let secondIndex = index + 1;
          secondIndex < sortedEvents.length;
          secondIndex++
        ) {
          const potentialDissolvingEvent = sortedEvents[secondIndex];

          if (!potentialDissolvingEvent) {
            continue;
          }

          if (potentialDissolvingEvent.categories.includes("Dissolving")) {
            progressiveEvents.push(
              this.sextupleAspectsComposerService.buildProgressiveSextupleEvent(
                currentEvent,
                potentialDissolvingEvent,
              ),
            );
            break;
          }
        }
      }
    }

    return progressiveEvents;
  }
}
