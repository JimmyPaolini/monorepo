/**
 * Values for local extremum detection in a discrete sequence.
 */
export interface NeighborValues {
  /** Value from the previous time step. */
  previous: number;

  /** Value from the current time step. */
  current: number;

  /** Value from the next time step. */
  next: number;
}
