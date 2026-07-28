import type { Occurrence } from "@/features/calendar/occurrences";

export interface PositionedOccurrence extends Occurrence {
  column: number;
  totalColumns: number;
}

/**
 * Assigns each occurrence a column (and the total column count for its overlap
 * cluster) so concurrent events render side-by-side instead of stacking on top
 * of each other. Classic greedy interval-scheduling approach.
 */
export function layoutOccurrences(occurrences: Occurrence[]): PositionedOccurrence[] {
  const sorted = [...occurrences].sort(
    (a, b) =>
      a.occurrenceStart.getTime() - b.occurrenceStart.getTime() ||
      b.occurrenceEnd.getTime() - a.occurrenceEnd.getTime()
  );

  const positioned: PositionedOccurrence[] = [];
  let cluster: Occurrence[] = [];
  let clusterEnd = -Infinity;

  function flushCluster() {
    if (cluster.length === 0) return;
    const columnEnds: number[] = [];
    const assigned: { occ: Occurrence; column: number }[] = [];

    for (const occ of cluster) {
      let placedColumn = -1;
      for (let c = 0; c < columnEnds.length; c++) {
        if (occ.occurrenceStart.getTime() >= columnEnds[c]) {
          columnEnds[c] = occ.occurrenceEnd.getTime();
          placedColumn = c;
          break;
        }
      }
      if (placedColumn === -1) {
        columnEnds.push(occ.occurrenceEnd.getTime());
        placedColumn = columnEnds.length - 1;
      }
      assigned.push({ occ, column: placedColumn });
    }

    const totalColumns = columnEnds.length;
    for (const { occ, column } of assigned) {
      positioned.push({ ...occ, column, totalColumns });
    }
    cluster = [];
    clusterEnd = -Infinity;
  }

  for (const occ of sorted) {
    if (cluster.length === 0 || occ.occurrenceStart.getTime() < clusterEnd) {
      cluster.push(occ);
      clusterEnd = Math.max(clusterEnd, occ.occurrenceEnd.getTime());
    } else {
      flushCluster();
      cluster.push(occ);
      clusterEnd = occ.occurrenceEnd.getTime();
    }
  }
  flushCluster();

  return positioned;
}
