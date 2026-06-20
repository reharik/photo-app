import { DateTime } from 'luxon';

export type MultiSelectProps = {
  isSelected: (id: string) => boolean;
  handleModifierClick: (e: React.MouseEvent, id: string, index: number) => void;
  toggleSelectAt: (id: string, index: number) => void;
  enterSelectionAt: (id: string, index: number) => void;
};

export type GridMediaItem = {
  id: string;
  createdAt?: DateTime;
  takenAt?: DateTime;
  firstName?: string;
  lastName?: string;
};
