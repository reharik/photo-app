import { ViewerOperation } from '@packages/contracts';

/**
 * `ViewerOperation` values returned in `viewerOperations` (GraphQL schema; see API schema).
 * UI labels: “remove from album” / “delete from library” map to the corresponding operations here.
 */

type WithViewerOps = { viewerOperations: readonly ViewerOperation[] };

export const canEveryItemDo = (items: WithViewerOps[], op: ViewerOperation): boolean =>
  items.length > 0 && items.every((x) => x.viewerOperations.includes(op));
