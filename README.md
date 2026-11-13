# dsh-liquid-glass

English | [中文](README.zh.md)

[![npm](https://img.shields.io/npm/v/dsh-liquid-glass?logo=npm)](https://www.npmjs.com/package/dsh-liquid-glass)
[![license](https://img.shields.io/github/license/Ultroncn/dsh-liquid-glass)](LICENSE)
[![DeepSeek Harness](https://img.shields.io/badge/DeepSeek%20Harness-plugin-4b68ff)](https://github.com/deepseek-ai/deepseek-harness)

**Liquid glass for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)** — one toggle, and the whole interface turns to glass.

Translucent theme surfaces and scoped frosted menus over your own background image, with material presets, tint, wallpaper controls, and system accessibility response. The working-tree features below shipped in 0.2.0 (npm latest 0.2.0); see the CHANGELOG.

## Install

```sh
dsh plugin --profile web add dsh-liquid-glass
```

Open **Settings → General** — a **Liquid Glass** row appears. It is ON by default; restart once after install.

## Preview

| Settings | Glass shell | Wallpaper |
| --- | --- | --- |
| ![Liquid Glass settings](assets/screenshots/1-settings.png) | ![Translucent DeepSeek Harness shell](assets/screenshots/2-glass-shell.png) | ![Custom wallpaper controls](assets/screenshots/3-settings-wallpaper.png) |

## What you get

- **Theme surface transparency** through the official ThemeRuntime tokens, with a 3%–95% transparency slider.
- **Regular, Clear, and Frost presets**, plus cool white, warm gray, and ink tints. Manual transparency fine-tunes the selected preset.
- **Scoped menu frost** with an independent switch, a settings-card rim color, and a material preview with an inset highlight. Host filter placement stays unchanged.
- **Wallpaper controls**: cover/contain/fill, nine positions, brightness 20%–200%, and manual dim 0%–60%. Bright local or same-origin images automatically receive at least 35% dim; cross-origin links use manual dim only. Large static uploads are compressed; GIF data is preserved.
- **System accessibility response**: reduced transparency or increased contrast selects effective Frost material and limits transparency to 50%, without overwriting saved preferences.
- **Keyboard toggle**: Ctrl/Cmd+Shift+G through the host shortcut service. Change or remove “Toggle Liquid Glass” in the host Keyboard shortcuts settings. Linux Web starts unbound; conflicting defaults fall back to an unbound command.

Independent user/assistant opacity floors and general host-panel blur/highlights are not implemented: verified official extension hooks are missing. See [local API evidence and validation limits](docs/v0.2.0-local-evidence.md). Live DSH regression testing passed 7/7 on host 0.2.2-rc.2 (2026-11-13); full regression coverage is still to be expanded. Existing screenshots show the older interface.

## Privacy and compatibility

- Settings and uploaded backgrounds stay in this browser's `localStorage`; the plugin has no server component and sends no telemetry.
- The UI integrates through DeepSeek Harness's public client runtime, locale, slot, theme, and shortcut APIs. Shortcut bindings use host-managed device-local storage (localStorage on Web; keybindings.json on Desktop).
- Light and dark color schemes are supported. A DSH restart is required once after installation so the client bundle can be loaded.

## Verify from source

The smoke test runs the published client bundle inside a mocked DSH browser runtime and exercises registration, lifecycle, settings, persistence, wallpaper controls and slider bounds:

```sh
node test/smoke.test.mjs
```

## Uninstall

```sh
dsh plugin --profile web remove dsh-liquid-glass
```

Preferences live in this browser's localStorage and are left behind harmlessly.

## License

MIT
