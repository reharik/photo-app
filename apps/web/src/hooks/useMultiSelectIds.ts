import { useCallback, useRef, useState, type MouseEvent } from 'react';

/**
 * Multi-select like desktop file managers / Google Photos:
 * - Checkbox (plain click) toggles one item
 * - Ctrl/Cmd+click on image/caption toggles one id
 * - Shift+click selects a contiguous range (anchor = last toggle, or the clicked index if none)
 */
export const useMultiSelectIds = (orderedIds: string[]) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [anchorIndex, setAnchorIndex] = useState<number | null>(null);
  const orderedIdsRef = useRef(orderedIds);
  orderedIdsRef.current = orderedIds;

  const handleModifierClick = useCallback(
    (e: MouseEvent, id: string, index: number): void => {
      if (!e.ctrlKey && !e.metaKey && !e.shiftKey) {
        return;
      }
      e.preventDefault();
      e.stopPropagation();

      if (e.ctrlKey || e.metaKey) {
        setSelectedIds((prev) => {
          const next = new Set(prev);
          if (next.has(id)) {
            next.delete(id);
          } else {
            next.add(id);
          }
          return next;
        });
        setAnchorIndex(index);
        return;
      }

      if (e.shiftKey) {
        setSelectedIds((prev) => {
          const ids = orderedIdsRef.current;
          const from = anchorIndex ?? index;
          const start = Math.min(from, index);
          const end = Math.max(from, index);
          const rangeIds = ids.slice(start, end + 1);
          const next = new Set(prev);
          rangeIds.forEach((rid) => {
            next.add(rid);
          });
          return next;
        });
        setAnchorIndex(index);
      }
    },
    [anchorIndex],
  );

  const isSelected = useCallback((id: string): boolean => selectedIds.has(id), [selectedIds]);

  /** Toggle one item (checkbox click); updates range anchor for Shift+click. */
  const toggleSelectAt = useCallback((id: string, index: number): void => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
    setAnchorIndex(index);
  }, []);

  /** Enter selection with a single item (mobile long-press entry). */
  const enterSelectionAt = useCallback((id: string, index: number): void => {
    setSelectedIds(new Set([id]));
    setAnchorIndex(index);
  }, []);

  const clearSelection = useCallback((): void => {
    setSelectedIds(new Set());
    setAnchorIndex(null);
  }, []);

  const selectionCount = selectedIds.size;

  return {
    selectedIds: Array.from(selectedIds),
    selectionCount,
    isSelected,
    handleModifierClick,
    toggleSelectAt,
    enterSelectionAt,
    clearSelection,
  };
};
