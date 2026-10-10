# Vendored Video.js skin source

The Video.js v10 **default video skin**, as editable source, used by the media
viewer's `VideoRenderer`. It is vendored (rather than imported from the package)
because the packaged skin has no setting for changing its keyboard shortcuts or
for marking its control bar.

- **Source:** the Video.js Shadcn registry, plain-CSS React catalog —
  `https://shadcn.videojs.org/r/react/css/{name}.json`, item `@videojs/video`.
- **Pulled against:** `@videojs/react` 10.0.1 (2026-10-10). The registry serves
  its _current_ source, so keep `@videojs/react` and `@videojs/core` in
  `apps/web/package.json` in step with a re-pull.
- **Extra dependencies it needs:** `cn` (class-name joining, `lib/utils.ts`) and
  `@videojs/core` (menu text).

## Layout

- `components/videojs/**`, `lib/**` — registry output, unmodified except for the
  edits listed below.
- `components.json` — the Shadcn config used for the pull (kept for re-pulling;
  nothing in the app reads it).

The files import each other through the `@videojs-skin/*` alias, which maps to
this folder in `apps/web/tsconfig.json` (`paths`) and `apps/web/vite.config.js`
(`resolve.alias`). The folder is excluded from ESLint.

## Our edits

Every local change carries a `homeroll:` comment — `grep -rn "homeroll:" .`

1. `components/videojs/video/behaviors/playback-hotkeys.tsx` — plain
   ArrowLeft/ArrowRight seek removed (arrows navigate the viewer); Shift+arrow
   seeks 5s; `<` / `>` speed hotkeys removed. `behaviors/hotkeys.tsx` — `i`
   (picture-in-picture) hotkey removed.
2. `components/videojs/video/layout/controls.tsx`
   - `data-video-controls` on the control bar, read by
     `src/hooks/useMobileViewerGestures.ts`;
   - cast, picture-in-picture and settings controls removed (fullscreen kept);
   - the mute button is hidden while muted, when the viewer shows its own
     "Tap to unmute" pill.
3. `components/videojs/styles/themes/theme.css` — square corners: player frame
   (`--media-video-border-radius` default) and control-bar containers
   (`--media-controls-radius`).
4. `components/videojs/video/skin.css` — removed the container rule that hid
   the time values when the time group was under 16rem, so they always show
   (portrait videos make the player narrow at any screen width).
5. `components/videojs/styles/video/theme.css` — the controls scrim
   (`--media-controls-gradient`) is two soft bands behind the top and bottom
   control rows instead of a dim over the whole frame.
6. `components/videojs/styles/sliders.css` — the time slider's fill reads
   `--homeroll-video-progress`, which `VideoRenderer` sets from
   `theme.color.videoProgress`.

## Re-pulling

The Shadcn CLI needs a project root, so pull into a throwaway directory and copy
the result over this folder:

```sh
mkdir -p /tmp/vjs-pull/src && cd /tmp/vjs-pull
echo '{ "name": "pull", "private": true, "type": "module", "dependencies": { "react": "^19.0.0" } }' > package.json
echo '{ "compilerOptions": { "jsx": "react-jsx", "baseUrl": ".", "paths": { "@videojs-skin/*": ["./src/*"] } }, "include": ["src"] }' > tsconfig.json
cp <repo>/apps/web/src/vendor/videojs/components.json .
npx shadcn@latest add @videojs/video --overwrite --yes
cp -r src/components src/lib <repo>/apps/web/src/vendor/videojs/
```

Then review `git diff`: anything that removes a `homeroll:` line is one of the
edits above being overwritten — re-apply it. Delete files the new catalog no
longer ships.
