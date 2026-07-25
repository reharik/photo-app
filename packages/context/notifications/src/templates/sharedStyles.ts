// Re-exports the shared token styles under the names the invite templates use.
import {
  bodyTextStyle,
  buttonStyle,
  linkFallbackStyle,
  secondaryTextStyle,
} from './emailTokens.js';

export const paragraph = bodyTextStyle;
export const muted = secondaryTextStyle; // the "paste this link" label (#5C5145, 14px)
export const linkFallback = linkFallbackStyle;
export { buttonStyle };
