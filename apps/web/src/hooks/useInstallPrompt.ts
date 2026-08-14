import { useSyncExternalStore } from 'react';
import {
  canPromptInstall,
  promptInstall,
  subscribeToInstallPrompt,
} from '../application/installPrompt';

/**
 * Whether a deferred `beforeinstallprompt` is available to show, plus the
 * trigger. `canInstall` is false when the browser never fired the event
 * (iOS Safari, unsupported), when the app is already installed, or after the
 * one-shot prompt has been spent.
 */
export const useInstallPrompt = (): {
  canInstall: boolean;
  promptInstall: () => Promise<void>;
} => {
  const canInstall = useSyncExternalStore(subscribeToInstallPrompt, canPromptInstall, () => false);
  return { canInstall, promptInstall };
};
