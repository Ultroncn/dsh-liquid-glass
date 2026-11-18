# Reading protection contrast measurements

Measured in the bundled DSH 0.2.2-rc.1 Web host on macOS with Chrome 158 and the plugin’s default neutral tint. Reading protection was enabled. For each preset we read the host’s resolved primary text color and the plugin’s content-surface token.

| Preset | Light theme minimum | Dark theme minimum |
| --- | ---: | ---: |
| Regular | 16.53:1 | 15.00:1 |
| Clear | 16.53:1 | 15.00:1 |
| Frost | 16.53:1 | 15.00:1 |

The tested light colors were `#0f1115` text and `rgba(255, 255, 255, 0.94)` content. The dark colors were `#f9fafb` text and `rgba(21, 21, 23, 0.94)` content. All three presets use the same minimum content opacity with reading protection on. Base and sidebar opacity still follow the preset.

The settings panel computes a conservative contrast estimate for this token pair. It composites the content color against black and white backdrops, converts sRGB to relative luminance, and displays the lowest contrast permitted by the resulting luminance range, rounded down. If the current theme exposes no readable opaque text color, the estimate is unavailable.

[WCAG 2.2 SC 1.4.3](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) uses 4.5:1 for ordinary text and 3:1 for large text. The table covers one primary-text/content token pair. Secondary text, code highlighting, controls, menus, custom themes and whole-page conformance require separate checks.

Reading protection dim and edge vignette are independent 0–100% controls. Legacy preferences fall back to 35% automatic dim and no vignette. Automatic dim applies to videos and bright images that can be sampled locally. A vignette applies its user-selected edge shading without sampling the image.
