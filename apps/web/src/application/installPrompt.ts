// Module-level capture of Chrome's `beforeinstallprompt`. The event fires once
// per session, early — often before React mounts — so the listener attaches at
// import time (main.tsx imports this for its side effect) rather than inside a
// component. Components subscribe via useInstallPrompt.
//
// The deferred event is single-use: after prompt() Chrome will not reissue it
// that session, so promptInstall() clears it win-or-lose and the affordances
// that key off it disappear.

// Not in lib.dom.d.ts — Chrome-proprietary, never standardized.
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

let deferredPrompt: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();

const notify = (): void => {
  for (const listener of listeners) {
    listener();
  }
};

const isStandalone = (): boolean => window.matchMedia('(display-mode: standalone)').matches;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  // Belt and braces: Chrome shouldn't fire this when already installed, but an
  // installed app opened in a tab can still see it in some versions.
  if (isStandalone()) {
    return;
  }
  deferredPrompt = e as BeforeInstallPromptEvent;
  notify();
});

window.addEventListener('appinstalled', () => {
  deferredPrompt = null;
  notify();
});

export const subscribeToInstallPrompt = (onChange: () => void): (() => void) => {
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
  };
};

/** True while a deferred install prompt is held and the app isn't already installed. */
export const canPromptInstall = (): boolean => deferredPrompt != null && !isStandalone();

export const promptInstall = async (): Promise<void> => {
  const prompt = deferredPrompt;
  if (prompt == null) {
    return;
  }
  // Clear before awaiting: the event is spent the moment prompt() is called,
  // whatever the user chooses.
  deferredPrompt = null;
  notify();
  await prompt.prompt();
  await prompt.userChoice;
};
