import { groupByToMap } from "@caelundas/src/modules/caelundas/caelundas.types";
import { Injectable } from "@nestjs/common";
import _ from "lodash";

import { TripleAspectsComposerService } from "./triple-aspects-composer.service.js";

import type { AspectBodies } from "@caelundas/src/modules/aspects/aspects.service";
import type {
  Aspect,
  Body,
} from "@caelundas/src/modules/caelundas/caelundas.types";
import type { Event } from "@caelundas/src/modules/calendar/calendar.types";
import type { Moment } from "moment-timezone";

/**
 *
 */
@Injectable()
export class TripleAspectsDetectorService {
  constructor(
    private readonly tripleAspectsComposerService: TripleAspectsComposerService,
  ) {}

  /**
   *
   */
  static groupAspectsByType<T extends AspectBodies>(
    edges: T[],
  ): Map<Aspect, T[]> {
    return groupByToMap(edges, (edge) => edge.aspect);
  }

  private checkGrandTrineTriplet(args: {
    body1: Body;
    body2: Body;
    body3: Body;
    currentAspectBodies: AspectBodies[];
    minute: Moment;
    previousAspectBodies: AspectBodies[];
    trines: AspectBodies[];
  }): Event | null {
    const {
      body1,
      body2,
      body3,
      currentAspectBodies,
      minute,
      previousAspectBodies,
      trines,
    } = args;

    if (!this.isGrandTrine({ body1, body2, body3, edges: trines })) {
      return null;
    }

    const result =
      TripleAspectsComposerService.determineCompoundPhaseFromSnapshots({
        checkPatternExists: (edges) =>
          this.isGrandTrine({ body1, body2, body3, edges }),
        currentAspectBodies,
        currentMinute: minute,
        patternBodies: [body1, body2, body3],
        previousAspectBodies,
      });

    if (!result) {
      return null;
    }

    return this.tripleAspectsComposerService.buildTripleAspectEvent({
      body1,
      body2,
      body3,
      phase: result.phase,
      timestamp: result.eventMinute,
      tripleAspect: "grand trine",
    });
  }

  private checkTSquareFocalBody(args: {
    body1: Body;
    body2: Body;
    currentAspectBodies: AspectBodies[];
    focalBody: Body;
    minute: Moment;
    previousAspectBodies: AspectBodies[];
    unionEdges: AspectBodies[];
  }): Event | null {
    const {
      body1,
      body2,
      currentAspectBodies,
      focalBody,
      minute,
      previousAspectBodies,
      unionEdges,
    } = args;

    if (!this.isTSquare({ body1, body2, edges: unionEdges, focalBody })) {
      return null;
    }

    const result =
      TripleAspectsComposerService.determineCompoundPhaseFromSnapshots({
        checkPatternExists: (edges) =>
          this.isTSquare({ body1, body2, edges, focalBody }),
        currentAspectBodies,
        currentMinute: minute,
        patternBodies: [body1, body2, focalBody],
        previousAspectBodies,
      });

    if (!result) {
      return null;
    }

    return this.tripleAspectsComposerService.buildTripleAspectEvent({
      body1,
      body2,
      body3: focalBody,
      focalOrApexBody: focalBody,
      phase: result.phase,
      timestamp: result.eventMinute,
      tripleAspect: "t-square",
    });
  }

  private checkYodApexBody(args: {
    apexBody: Body;
    body1: Body;
    body2: Body;
    currentAspectBodies: AspectBodies[];
    minute: Moment;
    previousAspectBodies: AspectBodies[];
    unionEdges: AspectBodies[];
  }): Event | null {
    const {
      apexBody,
      body1,
      body2,
      currentAspectBodies,
      minute,
      previousAspectBodies,
      unionEdges,
    } = args;

    if (!this.isYod({ apexBody, body1, body2, edges: unionEdges })) {
      return null;
    }

    const result =
      TripleAspectsComposerService.determineCompoundPhaseFromSnapshots({
        checkPatternExists: (edges) =>
          this.isYod({ apexBody, body1, body2, edges }),
        currentAspectBodies,
        currentMinute: minute,
        patternBodies: [body1, body2, apexBody],
        previousAspectBodies,
      });

    if (!result) {
      return null;
    }

    return this.tripleAspectsComposerService.buildTripleAspectEvent({
      body1,
      body2,
      body3: apexBody,
      focalOrApexBody: apexBody,
      phase: result.phase,
      timestamp: result.eventMinute,
      tripleAspect: "yod",
    });
  }

  private isGrandTrine(args: {
    body1: Body;
    body2: Body;
    body3: Body;
    edges: AspectBodies[];
  }): boolean {
    const { body1, body2, body3, edges } = args;
    return (
      TripleAspectsComposerService.haveAspect({
        aspectType: "trine",
        body1,
        body2,
        edges,
      }) &&
      TripleAspectsComposerService.haveAspect({
        aspectType: "trine",
        body1,
        body2: body3,
        edges,
      }) &&
      TripleAspectsComposerService.haveAspect({
        aspectType: "trine",
        body1: body2,
        body2: body3,
        edges,
      })
    );
  }

  private isTSquare(args: {
    body1: Body;
    body2: Body;
    edges: AspectBodies[];
    focalBody: Body;
  }): boolean {
    const { body1, body2, edges, focalBody } = args;
    return (
      TripleAspectsComposerService.haveAspect({
        aspectType: "opposite",
        body1,
        body2,
        edges,
      }) &&
      TripleAspectsComposerService.haveAspect({
        aspectType: "square",
        body1,
        body2: focalBody,
        edges,
      }) &&
      TripleAspectsComposerService.haveAspect({
        aspectType: "square",
        body1: body2,
        body2: focalBody,
        edges,
      })
    );
  }

  private isYod(args: {
    apexBody: Body;
    body1: Body;
    body2: Body;
    edges: AspectBodies[];
  }): boolean {
    const { apexBody, body1, body2, edges } = args;
    return (
      TripleAspectsComposerService.haveAspect({
        aspectType: "sextile",
        body1,
        body2,
        edges,
      }) &&
      TripleAspectsComposerService.haveAspect({
        aspectType: "quincunx",
        body1,
        body2: apexBody,
        edges,
      }) &&
      TripleAspectsComposerService.haveAspect({
        aspectType: "quincunx",
        body1: body2,
        body2: apexBody,
        edges,
      })
    );
  }

  /**
   *
   */
  composeGrandTrines(args: {
    currentAspectBodies: AspectBodies[];
    minute: Moment;
    previousAspectBodies: AspectBodies[];
  }): Event[] {
    const { currentAspectBodies, minute, previousAspectBodies } = args;
    const unionEdges = [...currentAspectBodies, ...previousAspectBodies];
    const trines =
      TripleAspectsDetectorService.groupAspectsByType(unionEdges).get(
        "trine",
      ) || [];

    const bodiesInTrines = new Set<Body>();
    for (const trine of trines) {
      bodiesInTrines.add(trine.bodies[0]);
      bodiesInTrines.add(trine.bodies[1]);
    }

    const bodiesArray = [...bodiesInTrines];
    const events: Event[] = [];

    for (let index = 0; index < bodiesArray.length; index++) {
      for (
        let secondIndex = index + 1;
        secondIndex < bodiesArray.length;
        secondIndex++
      ) {
        for (
          let thirdIndex = secondIndex + 1;
          thirdIndex < bodiesArray.length;
          thirdIndex++
        ) {
          const body1 = bodiesArray[index];
          const body2 = bodiesArray[secondIndex];
          const body3 = bodiesArray[thirdIndex];
          if (!body1 || !body2 || !body3) {
            continue;
          }

          const event = this.checkGrandTrineTriplet({
            body1,
            body2,
            body3,
            currentAspectBodies,
            minute,
            previousAspectBodies,
            trines,
          });
          if (event) {
            events.push(event);
          }
        }
      }
    }

    return events;
  }

  /**
   *
   */
  composeTSquares(args: {
    currentAspectBodies: AspectBodies[];
    minute: Moment;
    previousAspectBodies: AspectBodies[];
  }): Event[] {
    const { currentAspectBodies, minute, previousAspectBodies } = args;
    const unionEdges = [...currentAspectBodies, ...previousAspectBodies];
    const aspectsByType =
      TripleAspectsDetectorService.groupAspectsByType(unionEdges);
    const oppositions = aspectsByType.get("opposite") || [];
    const squares = aspectsByType.get("square") || [];
    const events: Event[] = [];

    for (const opposition of oppositions) {
      const body1 = opposition.bodies[0];
      const body2 = opposition.bodies[1];
      const body1SquareBodies =
        TripleAspectsComposerService.findBodiesWithAspectTo(
          body1,
          "square",
          squares,
        );
      const body2SquareBodies =
        TripleAspectsComposerService.findBodiesWithAspectTo(
          body2,
          "square",
          squares,
        );

      for (const focalBody of _.intersection(
        body1SquareBodies,
        body2SquareBodies,
      )) {
        const event = this.checkTSquareFocalBody({
          body1,
          body2,
          currentAspectBodies,
          focalBody,
          minute,
          previousAspectBodies,
          unionEdges,
        });
        if (event) {
          events.push(event);
        }
      }
    }

    return events;
  }

  /**
   *
   */
  composeYods(args: {
    currentAspectBodies: AspectBodies[];
    minute: Moment;
    previousAspectBodies: AspectBodies[];
  }): Event[] {
    const { currentAspectBodies, minute, previousAspectBodies } = args;
    const unionEdges = [...currentAspectBodies, ...previousAspectBodies];
    const aspectsByType =
      TripleAspectsDetectorService.groupAspectsByType(unionEdges);
    const sextiles = aspectsByType.get("sextile") || [];
    const quincunxes = aspectsByType.get("quincunx") || [];
    const events: Event[] = [];

    for (const sextile of sextiles) {
      const body1 = sextile.bodies[0];
      const body2 = sextile.bodies[1];
      const body1QuincunxBodies =
        TripleAspectsComposerService.findBodiesWithAspectTo(
          body1,
          "quincunx",
          quincunxes,
        );
      const body2QuincunxBodies =
        TripleAspectsComposerService.findBodiesWithAspectTo(
          body2,
          "quincunx",
          quincunxes,
        );

      for (const apexBody of _.intersection(
        body1QuincunxBodies,
        body2QuincunxBodies,
      )) {
        const event = this.checkYodApexBody({
          apexBody,
          body1,
          body2,
          currentAspectBodies,
          minute,
          previousAspectBodies,
          unionEdges,
        });
        if (event) {
          events.push(event);
        }
      }
    }

    return events;
  }
}
