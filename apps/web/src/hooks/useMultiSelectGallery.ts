import { ViewerOperation } from '@packages/contracts';
import { useMemo } from 'react';
import { useMultiSelectIds } from './useMultiSelectIds';

export type GalleryConfigItems = {
  operation: ViewerOperation;
  label?: string;
  onAction: () => void;
};

type MultiSelectGalleryProps<T extends { id: string; viewerOperations?: ViewerOperation[] }> = {
  nodes: T[];
  actions: GalleryConfigItems[];
};
export const useMultiSelectGallery = <
  T extends { id: string; viewerOperations?: ViewerOperation[] },
>({
  nodes,
  actions,
}: MultiSelectGalleryProps<T>) => {
  const ids = useMemo(() => nodes.map((x) => x.id), [nodes]);
  const multiSelect = useMultiSelectIds(ids);
  const selectedItems = useMemo(() => {
    return nodes.filter((x) => multiSelect.isSelected(x.id));
  }, [nodes, multiSelect]);

  const availableActions = useMemo(() => {
    return actions
      .filter((x) => selectedItems.some((y) => y.viewerOperations?.includes(x.operation)))
      .map((x) => ({ ...x, label: x.label ?? x.operation.display }));
  }, [actions, selectedItems]);

  return {
    ...multiSelect,
    selectedItems,
    availableActions,
    multiSelectProps: multiSelect,
  };
};
