# Changelog

## 0.4.0 — 2026-11-13

- Extend Reading protection to official surface tokens: opaque dialogs/overlays and at least 94% opacity for content, code and menus, while retaining base/sidebar transparency. Protection is available without a background and can be disabled.
- Add optional separate light/dark appearance settings using the host resolved color scheme, with atomic persistence and safe migration from existing preferences. Media remains shared; Reset affects only the active scheme when separation is enabled.
- Add Motion / Still frame for video backgrounds. Still mode retains the frame, loads the first frame on restart, and respects existing user/system pause conditions.
- Refresh bilingual documentation and four actual-host marketplace screenshots.
- Validation: 289 smoke assertions against the official 0.2.2-rc.2 host contract, independent review, and packed-package Web verification on macOS, including persisted light/dark choices, draft preservation and a decoded paused first frame after reload. CPU/GPU, power savings and cross-platform codec coverage are not claimed.

## 0.3.0 — 2026-11-13

- Replace the standalone text preview with three selectable material cards built from official buttons.
- Unify image/video selection in a compact uploader with thumbnail-overlay replace/remove controls.
- Preview background drafts immediately; commit only on Save, and confirm before leaving settings with unsaved changes. Discard restores the previous background.

- Rename the settings entry to Theme background (主题背景), directly below Appearance, with inline collapse and a separately collapsed Advanced section.
- Reuse official switches, buttons, inputs, checkboxes, menus, modals and chevrons; align title/description layout with host settings.
- Add local MP4/WebM backgrounds (100 MiB max), IndexedDB storage, muted looping, pause/resume, hidden-page and reduced-motion pauses, and explicit save/playback errors.
- Master switch now disables all background effects while preserving preferences. Appearance reset retains the chosen background.
- Preserve existing image/GIF settings; remove custom switch and full-screen image lightbox.

- Prevent late editor cleanup from recreating backgrounds after plugin shutdown or discarding a newer runtime’s draft.
- Add four real-host screenshots and a repository-owned `screenshots.json` for storefront discovery.
- Validation: 262 assertions against the official 0.2.2-rc.2 host contract, independent code review, and installation of the packed release candidate in an isolated Web profile on macOS. Cross-platform codecs and low-end performance are not claimed.

## 0.2.0 — 2026-11-13

Includes the 0.1.1 fixes below (0.1.1 was not released separately); verified in the
real DeepSeek Harness 0.2.2-rc.2 host (web shell) on 2026-11-13 — 7/7 checks passed:
activation, settings rendering, preset switching, restart persistence, GIF handling,
no page errors, official shortcut registration.

### Added

- Three material presets (measured in the real host):
  - Regular: alpha 0.62, blur 12px, saturation 180%
  - Clear: alpha 0.35, blur 6px, saturation 140%
  - Frost: alpha 0.78, blur 20px, saturation 200%
- Four tints: neutral, cool white, warm gray, ink (each with light/dark values).
- Wallpaper controls: automatic dimming of bright wallpapers, manual dim, fit
  (cover / contain / fill), nine positions, brightness.
- Accessibility protection: reduced transparency or increased contrast switches to
  an effective Frost preset with alpha of at least 0.5.
- "Toggle Liquid Glass" command registered through the host's official shortcut
  registry (Mod+Shift+G on desktop macOS/Windows/Linux and Web macOS/Windows;
  Linux Web starts unbound per host policy). No plugin-owned global key listener.

### Fixed (0.1.1 fixes, included in this release)

- Transparency setting no longer lost on host restart (verified across a restart:
  80% slider / alpha 0.2 survived).
- GIF wallpapers stay animated: the uploaded file is stored byte-for-byte
  (data URL identical to the source file), with no canvas re-encoding.
- Uploads that exceed remaining browser storage now show a warning instead of
  failing silently, and do not overwrite the existing wallpaper.
- Stored numeric values no longer carry floating-point noise.
- Removed dead Toggle code.
- Compatibility declaration checked.

### Fixed (activation)

- The client now uses the host's official seed module
  `@deepseek-ai/dsh-client-store` for its store, replacing the non-existent
  `@deepseek-ai/dsh-client-runtime/client`. The old import prevented the plugin
  from activating at all in the real host (host reported
  "1 entry did not activate"); the manifest no longer lists the missing package.
