export type NavigateDirection = 'previous' | 'next';

export type MobileViewerSheet = 'none' | 'info' | 'comment';

export type MobileViewerChrome = {
  visible: boolean;
  onToggleChrome: () => void;
  onOpenInfoSheet?: () => void;
  onOpenCommentSheet?: () => void;
  activeSheet?: MobileViewerSheet;
  sheetOpen?: boolean;
  /** When true, React/Comment action-bar buttons render grayed and inert; Info stays interactive. */
  interactionsLocked?: boolean;
};
