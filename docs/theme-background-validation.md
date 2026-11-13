# Theme background: local validation, 2026-11-13

Release candidate: 0.3.0. This record describes validation before the release tag is published. This document covers the redesigned settings and local video support; the older v0.2.0 evidence file is historical.

## Host contract

Reference packages: official npm `@deepseek-ai/dsh`, `@deepseek-ai/dsh-client-ui-primitives`, `@deepseek-ai/dsh-client-ui-settings-general`, and `@deepseek-ai/dsh-client-ui-settings`, all 0.2.2-rc.2. Shipped JavaScript and source maps were inspected.

- `ui-primitives` is a platform seed. Switch, Button, Input, Checkbox, Menu, Modal and both chevron icons resolve in the actual shell. No new runtime package dependency is needed.
- General settings `DeveloperToolsRow` uses 16px vertical padding, 24px gap, a 0.5px border-l2 separator, 14/20 title and 12/18 secondary description with 4px top margin. A small owned adapter follows this layout; no hashed CSS or private component import.
- Appearance uses slot order 10 and font size 11; the plugin uses 10.5.
- No public settings-row, slider or select primitive was found in this pinned version. The slider remains a labeled native range input; selects use official Menu.
- Reusing primitives follows the installed host's control styling. Slot ordering and the layout adapter still require verification after host updates; this is not a promise of automatic future compatibility.

## Behavior

“主题背景” / “Theme background” is initially collapsed below Appearance, with a separate Advanced disclosure. The master switch disables glass, image and video together without discarding preferences. Appearance reset preserves background and master switch. Existing image/GIF and opacity keys remain compatible.

Local MP4/WebM files up to 100 MiB are decoded before being committed. Video Blob data uses the `dsh-liquid-glass-media` IndexedDB database, `videos` store; localStorage only stores selection metadata and paused preference. Metadata commits after the Blob transaction completes. Failed replacements retain the prior selection; obsolete pending selections are discarded. Old Blob cleanup is best-effort after selection commits, so a storage failure during cleanup may leave an orphan until site storage is cleaned.

Playback is muted, looping and inline. Hidden pages and reduced-motion preferences pause playback. Saved pause survives refresh. Reading protection dims video by at least 35% when enabled. No audio, remote video URL, playlists or server upload. Data is origin/browser-local and can be lost when site data is cleared. Container support does not guarantee every codec works.

## Initial redesign checks (before the card iteration)

- `DSH_HOST_INSTALL=/private/tmp/liquid-glass-host-022 node test/smoke.test.mjs`: 242 assertions passed, including executable official seed/module contract checks. Fake IndexedDB exercises real asynchronous transactions; media element behavior is mocked in this suite.
- Behavioral cases: failed saves/deletes, unsupported/oversized/undecodable media, missing storage, autoplay rejection and retry, pause persistence, hidden/reduced-motion pause, reset, master off/on, image replacement, late selection cancellation, cleanup and Blob URL release.
- Isolated official DSH 0.2.2-rc.2 Web host, macOS in-app browser, disposable profile and no account/model keys: verified collapsed placement and native switch; expanded controls and advanced Menu selection; light/dark appearance; real 640×360 H.264 MP4 decode and muted loop; pause; refresh restoring the video and pause; resume; corrupt MP4 error preserving the old playing video; removal and refresh keeping video absent. The 3-second gradient fixture was generated locally with AVFoundation.
- No browser console errors were captured before the intentional corrupt-file test.
- `npm pack --dry-run --json`: expected 9 files; no fixture, tests, local profile, credentials or runtime dependencies bundled.
- `git diff --check` and `node --check lib/client.js` passed. Existing user-deleted screenshot assets are not restored.

## Limits

No Windows/Linux, mobile/narrow viewport, Safari/Firefox, native desktop WebView, real WebM codec or low-end GPU/battery benchmark was performed. System media preferences and storage failures were simulated rather than changing the user's OS settings. Existing full-shell transparency still lets underlying conversation content show through the settings panel; this change does not invent unsupported per-panel host hooks.

Browser API references: [HTMLMediaElement.play](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/play), [IndexedDB transactions](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB).

## Card and draft iteration

The separate text preview was replaced by three miniature material cards using official Buttons, accessible selection state and a plugin-owned decorative preview. The host does not export a material-card/upload primitive. A permanent 192×120 image/video upload card composes official buttons and icons with native media/file elements; replace/remove are in the hover/focus overlay, and video playback is controlled in the card. Touch layouts keep the actions visible. No redundant media-description row is rendered.

Both image and video selection, replacement and removal are drafts: they update the page immediately without changing the saved selection. Save commits, failed Save retains the draft, and discard/unmount restores saved media. Remote image probing has a 15-second timeout. The official Modal offers Keep editing, Discard changes and Save and leave.

The host exports no public leave-guard API. A deliberately small semantic adapter intercepts settings navigation, close/backdrop, Escape and the plugin's own collapse control; browser reload uses the native beforeunload prompt. It is verified against the 0.2.2-rc.2 settings markup, not a guarantee for future host structures or arbitrary programmatic navigation. Cleanup restores the saved background even when the host unmounts programmatically.

Validation for this iteration:

- Smoke suite: 260 assertions passed against the official host module contract. New behavioral coverage includes draft preview without storage writes, removal rollback, failed-save navigation blocking, exact-once navigation replay, video staging/commit, Escape, cleanup, and card selection semantics. The hook mock now retains refs and runs effect cleanup.
- Real official 0.2.2-rc.2 Web host in Chrome on macOS: image selection preview; settings-close and menu-change confirmation; continue editing; Save and leave; discard restoring the prior image; real H.264 video preview, Save, removal/discard and refresh restoring the playing muted 640×360 video; card selection, light/dark previews and video pause.
- Existing screenshot deletions and unrelated working-tree changes are preserved. No commit, push or npm publication is part of this iteration.

## 0.3.0 release-candidate gate

- Independent review found one teardown-order defect: an editor cleanup could restore media after its owning runtime stopped. The preview action now ignores stopped runtimes. Two regressions failed before the fix and pass after it, including stale-instance cleanup after a new runtime starts.
- Final official-host contract suite: 262 assertions passed. The reviewer independently reran it after the fix; no remaining Critical or Important findings.
- The generated 0.3.0 npm tarball was installed with the official host plugin manager into a fresh disposable Web profile, rather than linked to this working tree. The test environment's pnpm workspace-root warning required the per-command `npm_config_ignore_workspace_root_check=true`; no global npm/pnpm setting was changed.
- Real packaged-host checks on macOS: initial collapse and position; master off/on; image selection, preview and Save and leave; material card and keyboard slider changes; light/dark; video draft, Save, muted loop, pause and refresh restoring the saved paused 640×360 H.264 video. No console errors were captured.
- Four 1280×720 screenshots were captured without modifying the page DOM or compositing UI. They use an original programmatically drawn landscape and an original motion clip. The light settings shot uses 3% transparency; the dark scene uses Clear; the video controls shot uses Frost. No personal conversation, account or model credentials were loaded.
- `screenshots.json` declares the four repository-relative paths using the community marketplace format. Screenshots are source-hosted and not bundled into the npm runtime package.
- This verification does not establish all browser codecs, native desktop behavior, cross-platform rendering or a measured energy/GPU claim.
