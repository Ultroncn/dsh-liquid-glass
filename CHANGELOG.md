# Changelog

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
