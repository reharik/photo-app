import { ReactorVM } from '../../../viewModels';

export type ReactorLine = {
  inlineNames: string[];
  overflowCount: number;
  allReactors: ReactorVM[];
};

export const displayNameForReactor = (reactor: ReactorVM): string =>
  reactor.isViewer ? 'You' : `${reactor.firstName} ${reactor.lastName}`;

/** Viewer first, then remaining reactors in source order. */
export const sortReactorsForDisplay = (reactors: ReactorVM[]): ReactorVM[] => {
  const viewer = reactors.filter((reactor) => reactor.isViewer);
  const others = reactors.filter((reactor) => !reactor.isViewer);
  return [...viewer, ...others];
};

export const buildReactorLine = (reactors: ReactorVM[]): ReactorLine | undefined => {
  if (reactors.length === 0) {
    return undefined;
  }

  const sorted = sortReactorsForDisplay(reactors);
  const inlineNames = sorted.map(displayNameForReactor).slice(0, Math.min(2, sorted.length));
  const overflowCount = Math.max(0, sorted.length - 2);

  return {
    inlineNames,
    overflowCount,
    allReactors: sorted,
  };
};
