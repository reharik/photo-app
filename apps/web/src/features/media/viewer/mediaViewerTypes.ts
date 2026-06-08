export type NavigateDirection = 'previous' | 'next';

export type MobileViewerSheet = 'none' | 'info' | 'comment';

export type MobileViewerChrome = {
  visible: boolean;
  onToggleChrome: () => void;
  onOpenInfoSheet?: () => void;
  onOpenCommentSheet?: () => void;
  activeSheet?: MobileViewerSheet;
  sheetOpen?: boolean;
};
