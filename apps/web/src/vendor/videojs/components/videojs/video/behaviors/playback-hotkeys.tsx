import { Hotkey } from '@videojs/react';

export interface PlaybackHotkeysProps {
  disabled?: boolean | undefined;
}

export function PlaybackHotkeys({ disabled = false }: PlaybackHotkeysProps = {}) {
  return (
    <>
      <Hotkey disabled={disabled} keys="Space" action="togglePaused" />
      <Hotkey disabled={disabled} keys="k" action="togglePaused" />
      <Hotkey disabled={disabled} keys="m" action="toggleMuted" />
      {/* homeroll: plain ArrowRight/ArrowLeft seek removed (arrows navigate the media viewer); Shift+arrow seeks 5s instead. */}
      <Hotkey disabled={disabled} keys="Shift+ArrowRight" action="seekStep" value={5} />
      <Hotkey disabled={disabled} keys="Shift+ArrowLeft" action="seekStep" value={-5} />
      <Hotkey disabled={disabled} keys="l" action="seekStep" />
      <Hotkey disabled={disabled} keys="j" action="seekStep" />
      <Hotkey disabled={disabled} keys="ArrowUp" action="volumeStep" />
      <Hotkey disabled={disabled} keys="ArrowDown" action="volumeStep" />
      <Hotkey disabled={disabled} keys="0-9" action="seekToPercent" />
      <Hotkey disabled={disabled} keys="Home" action="seekToPercent" value={0} />
      <Hotkey disabled={disabled} keys="End" action="seekToPercent" value={100} />
      {/* homeroll: ">" / "<" (speed up / down) hotkeys removed along with the settings menu. */}
    </>
  );
}
