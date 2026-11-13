# Theme background: follow-up opportunities

Research refreshed 2026-11-13. The first three items are delivered in 0.4.0 with the limits below; import/export remains a proposal. Keep the default panel small and use public host components and APIs wherever available.

| Priority | Opportunity | Reference and rationale | Acceptance before shipping |
| --- | --- | --- | --- |
| Delivered | Reading protection | Catppuccin documents a compatibility material mode and different light/dark treatment. Our full-shell transparency can still reveal content through settings. | Uses verified official surface tokens; opaque dialogs and protected content/code/menu surfaces. No per-message selectors. |
| Delivered | Optional still-video mode | Wallpaper Engine documents hidden/occluded and unfocused playback pause. Current support already pauses hidden pages and respects reduced motion. | Paused decoded first frame verified on macOS Web. Video remains loaded; CPU/GPU and power benefits are unmeasured. |
| Delivered | Separate light/dark appearance presets | Catppuccin lets users pair light and dark choices under system switching; this reduces repeated tuning. | Opt-in profiles preserve existing settings. Manual scheme switching verified in the real host; resolved system/custom scheme events covered by runtime tests. |
| 4 | Export/import appearance settings | Any Background groups a broad set of options and has configuration management. A small portable settings file could help users reproduce a look. | Validate a versioned schema, provide preview and rollback, and exclude local video/image bytes by default. No automatic cloud account or sync requirement. |

Avoid adding a wallpaper store, playlists, audio visualization, particles or a WebGL scene engine until users demonstrate a need. Those materially enlarge scope and maintenance, while established projects already cover them.

## Sources and limits

- [Wallpaper Engine](https://github.com/elysia395/dsh-wallpaper-engine): mature scene/video integration and playback/power controls; project documentation, not our independent performance measurements.
- [Catppuccin theme](https://github.com/NoNameLeGo/dsh-catppuccin-theme): paired light/dark choices, compatibility material mode, previews, and published performance caveats. Their hardware-specific figures are not transferred to this plugin.
- [Any Background](https://github.com/Tkingxiao/dsh-any-background): image/video backgrounds and configurable surfaces; useful as an organization reference, not a reason to duplicate every slider.

Prior market research identified these as commonly downloaded examples. Downloads include installs, updates and automation and do not equal active users. No new popularity ranking or representative user survey is claimed here.
