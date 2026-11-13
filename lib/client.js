// dsh-liquid-glass — browser half (client plugin bundle).
//
// Loaded by dsh-client-modules at /plugins/dsh-liquid-glass/client.js and
// executed through the vendored cordis Loader's lazy-CJS module table
// (window.__ModuleLoader__.load). The factory body is plain CJS with require()
// resolved against the shell's module table — the same shape the shipped ui-*
// packages emit.
//
// Surface transparency, scoped menu frost, and a custom wallpaper.
// Host materials and shortcuts extend official APIs; see docs/v0.2.0-local-evidence.md.
// No theme catalog, no accent colors, no packs. Preferences persist in
// localStorage, the correct boundary for third-party visual preferences (the
// Host settings wire only exposes an allowlisted namespace set to browser
// clients).
window.__ModuleLoader__.load({
	id: "dsh-liquid-glass",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let jsx = require("react/jsx-runtime");
		let _react = require("react");
		// Platform seed in the official web shell; no /client suffix or inject edge.
		let _client_store = require("@deepseek-ai/dsh-client-store");


		//#region constants & storage
		const SETTINGS_NS = "settings.liquid-glass";
		const KEY_GLASS = "dsh-liquid-glass:glass";
		const KEY_ALPHA = "dsh-liquid-glass:glass-alpha";
		const KEY_WALLPAPER = "dsh-liquid-glass:wallpaper";
		const DEFAULT_ALPHA = 0.62;
		const GLASS_SOURCE = "dsh-liquid-glass:glass";
		const GLASS_CSS_ID = "dsh-liquid-glass-glass-css";
		const MATERIAL_SOURCE = "dsh-liquid-glass:material";
		const KEY_OPTIONS = "dsh-liquid-glass:options";
		const PRESETS = {
			regular: { alpha: 0.62, blur: 12, saturate: 180 },
			clear: { alpha: 0.35, blur: 6, saturate: 140 },
			frost: { alpha: 0.78, blur: 20, saturate: 200 }
		};
		const TINTS = {
			neutral: { light: "#ffffff", dark: "#151517" },
			cool: { light: "#edf5ff", dark: "#151b26" },
			warm: { light: "#f5f0e8", dark: "#24201c" },
			ink: { light: "#dce2eb", dark: "#10141c" }
		};
		const POSITIONS = ["left top", "center top", "right top", "left center", "center center", "right center", "left bottom", "center bottom", "right bottom"];
		const DEFAULT_OPTIONS = { preset: "regular", tint: "neutral", filter: true, dim: 0, autoDim: true, fit: "cover", position: "center center", brightness: 100 };
		const enumValue = (value, choices, fallback) => choices.includes(value) ? value : fallback;
		const numberValue = (value, min, max, fallback) => typeof value === "number" && Number.isFinite(value) ? Math.round(Math.min(max, Math.max(min, value))) : fallback;
		function readOptions() {
			let saved;
			try { saved = JSON.parse(readStorage(KEY_OPTIONS)); } catch { /* Invalid preferences use defaults. */ }
			const o = saved && typeof saved === "object" ? saved : {};
			return {
				preset: enumValue(o.preset, Object.keys(PRESETS), "regular"),
				tint: enumValue(o.tint, Object.keys(TINTS), "neutral"),
				filter: typeof o.filter === "boolean" ? o.filter : true,
				dim: numberValue(o.dim, 0, 60, 0),
				autoDim: typeof o.autoDim === "boolean" ? o.autoDim : true,
				fit: enumValue(o.fit, ["cover", "contain", "fill"], "cover"),
				position: enumValue(o.position, POSITIONS, "center center"),
				brightness: numberValue(o.brightness, 20, 200, 100)
			};
		}
		let accessibilityActive = false;
		function appearance() {
			const options = readOptions();
			const preset = accessibilityActive ? "frost" : options.preset;
			const material = PRESETS[preset];
			const alpha = accessibilityActive ? Math.max(0.5, readAlpha()) : readAlpha();
			// A preset's exact recipe holds at its default opacity. Making it
			// more transparent reduces blur; increased opacity never adds cost.
			const blur = accessibilityActive ? material.blur : Math.round(material.blur * Math.min(1, alpha / material.alpha) * 10) / 10;
			return { ...options, preset, alpha, blur, saturate: material.saturate, accessibility: accessibilityActive };
		}
		/** Glass defaults to ON: transparency is the whole point of the plugin. */
		const DEFAULT_GLASS_ON = true;

		function readStorage(key) {
			try { return window.localStorage.getItem(key); } catch { return null; }
		}
		function writeStorage(key, value) {
			try {
				if (value === null || value === void 0) window.localStorage.removeItem(key);
				else window.localStorage.setItem(key, value);
				return true;
			} catch { return false; }
		}
		function wallpaperFitsStorage(value) {
			try {
				const storage = window.localStorage;
				let used = 0;
				for (let i = 0; i < storage.length; i++) {
					const key = storage.key(i);
					// Replacing the wallpaper frees its previous value.
					if (key !== KEY_WALLPAPER) used += (storage.getItem(key) || "").length;
				}
				// Assume a typical ~5 MiB budget, estimating UTF-16 values at
				// 2 bytes per code unit. Browser quotas/accounting vary; the
				// actual write can still fail and must report that failure.
				return (used + value.length) * 2 <= 5 * 1024 * 1024;
			} catch { return true; } // If estimation is unavailable, let the write decide.
		}
		const readGlassOn = () => {
			const raw = readStorage(KEY_GLASS);
			if (raw === null) return DEFAULT_GLASS_ON;
			return raw === "on";
		};
		const readAlpha = () => {
			const raw = readStorage(KEY_ALPHA);
			if (raw === null) return DEFAULT_ALPHA;
			const n = Number(raw);
			return Number.isFinite(n) && n > 0 ? Math.min(0.97, Math.max(0.05, n)) : DEFAULT_ALPHA;
		};
		const readWallpaper = () => readStorage(KEY_WALLPAPER);
		//#endregion

		//#region color utils
		function hexToRgb(hex) {
			const m = /^#?([0-9a-f]{6})$/i.exec(String(hex).trim());
			if (!m) return null;
			const n = parseInt(m[1], 16);
			return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
		}
		function toRgba(hex, alpha) {
			const rgb = hexToRgb(hex);
			if (!rgb) return hex;
			return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
		}
		//#endregion

		//#region locale
		const zh = {
			"glass.presets": "质感预设",
			"glass.regular": "标准",
			"glass.clear": "清透",
			"glass.frost": "磨砂",
			"glass.tint": "色调",
			"glass.neutral": "原色",
			"glass.cool": "冷白",
			"glass.warm": "暖灰",
			"glass.ink": "墨色",
			"glass.filter": "菜单磨砂",
			"glass.materialHint": "磨砂用于宿主菜单材质；上方可预览效果。",
			"glass.accessibility": "系统减透明或增强对比度已启用：使用磨砂质感，透明度最高 50%。",
			"glass.saveFailed": "设置保存失败，请检查浏览器存储空间或权限。",
			"glass.shortcut": "切换液态玻璃",
			"glass.shortcutHint": "可在设置 → 通用 → 键盘快捷键中更改或移除“切换液态玻璃”。Linux 网页端默认不绑定。",
			"glass.shortcutUnavailable": "快捷键服务不可用，仍可使用上方开关。",
			"glass.shortcutConflict": "默认快捷键不可用；请在键盘快捷键设置中选择可用组合。",
			"wallpaper.dim": "壁纸暗化",
			"wallpaper.autoDim": "自动暗化明亮壁纸（至少 35%）",
			"wallpaper.autoDimHint": "跨域链接只使用手动暗化；自动检测为一次图片采样。",
			"wallpaper.fit": "缩放方式",
			"wallpaper.cover": "铺满",
			"wallpaper.contain": "完整显示",
			"wallpaper.fill": "拉伸",
			"wallpaper.position": "壁纸位置",
			"wallpaper.brightness": "壁纸亮度",
			"position.left top": "左上",
			"position.center top": "上中",
			"position.right top": "右上",
			"position.left center": "左中",
			"position.center center": "居中",
			"position.right center": "右中",
			"position.left bottom": "左下",
			"position.center bottom": "下中",
			"position.right bottom": "右下",
			"row.title": "液态玻璃",
			"row.subtitle": "由 Liquid Glass 提供 · 全界面透明化 + 自定义背景图",
			"glass.toggle": "启用玻璃质感",
			"glass.alpha": "透明度",
			"glass.hint": "透明度越大越透，背景越清晰。",
			"wallpaper.title": "背景图",
			"wallpaper.choose": "选择图片…",
			"wallpaper.upload": "点击上传背景图",
			"wallpaper.formats": "支持 JPG / PNG / WebP / GIF",
			"wallpaper.badType": "仅支持 JPG / PNG / WebP / GIF 格式的图片",
			"wallpaper.urlPlaceholder": "或粘贴图片 URL",
			"wallpaper.remove": "移除背景",
			"wallpaper.replace": "更换背景",
			"wallpaper.previewHint": "点击图片全屏预览",
			"wallpaper.save": "保存",
			"wallpaper.unsaved": "有未保存的更改",
			"wallpaper.badUrl": "图片链接加载失败，请检查后重试",
			"wallpaper.badFile": "图片文件读取或解码失败，请选择有效的图片",
			"wallpaper.tooLarge": "GIF 超出本浏览器的预计剩余存储空间，请缩小文件后重试",
			"wallpaper.saveFailed": "背景图保存失败，请释放浏览器存储空间或检查存储权限后重试",
			"wallpaper.checking": "校验中…",
			"wallpaper.hint": "背景铺满整个页面，保存在本浏览器；过大的静态图片会自动压缩，GIF 保留原图。"
		};
		const en = {
			"glass.presets": "Material preset",
			"glass.regular": "Regular",
			"glass.clear": "Clear",
			"glass.frost": "Frost",
			"glass.tint": "Tint",
			"glass.neutral": "Neutral",
			"glass.cool": "Cool white",
			"glass.warm": "Warm gray",
			"glass.ink": "Ink",
			"glass.filter": "Frosted menus",
			"glass.materialHint": "Frost follows the host menu material. The panel above previews the material.",
			"glass.accessibility": "System transparency or contrast protection is active: Frost material, at most 50% transparency.",
			"glass.saveFailed": "Settings could not be saved. Check browser storage space or permissions.",
			"glass.shortcut": "Toggle Liquid Glass",
			"glass.shortcutHint": "Change or remove “Toggle Liquid Glass” in Settings → General → Keyboard shortcuts. Linux Web starts unbound.",
			"glass.shortcutUnavailable": "Keyboard shortcuts are unavailable; use the switch above.",
			"glass.shortcutConflict": "The default shortcut is unavailable; choose an available binding in Keyboard shortcuts.",
			"wallpaper.dim": "Wallpaper dim",
			"wallpaper.autoDim": "Automatically dim bright wallpaper (at least 35%)",
			"wallpaper.autoDimHint": "Cross-origin links use manual dimming only; automatic detection samples the image once.",
			"wallpaper.fit": "Wallpaper fit",
			"wallpaper.cover": "Cover",
			"wallpaper.contain": "Contain",
			"wallpaper.fill": "Fill",
			"wallpaper.position": "Wallpaper position",
			"wallpaper.brightness": "Brightness",
			"position.left top": "Top left",
			"position.center top": "Top center",
			"position.right top": "Top right",
			"position.left center": "Center left",
			"position.center center": "Center",
			"position.right center": "Center right",
			"position.left bottom": "Bottom left",
			"position.center bottom": "Bottom center",
			"position.right bottom": "Bottom right",
			"row.title": "Liquid Glass",
			"row.subtitle": "Powered by Liquid Glass · full-shell transparency + custom background",
			"glass.toggle": "Enable glassmorphism",
			"glass.alpha": "Transparency",
			"glass.hint": "Higher transparency reveals more of the background.",
			"wallpaper.title": "Background",
			"wallpaper.choose": "Choose image…",
			"wallpaper.upload": "Click to upload a background",
			"wallpaper.formats": "JPG / PNG / WebP / GIF",
			"wallpaper.badType": "Only JPG / PNG / WebP / GIF images are supported",
			"wallpaper.urlPlaceholder": "…or paste an image URL",
			"wallpaper.remove": "Remove background",
			"wallpaper.replace": "Replace",
			"wallpaper.previewHint": "Click image to preview fullscreen",
			"wallpaper.save": "Save",
			"wallpaper.unsaved": "Unsaved changes",
			"wallpaper.badUrl": "Image failed to load from this URL. Please check and retry.",
			"wallpaper.badFile": "Image file could not be read or decoded. Please choose a valid image.",
			"wallpaper.tooLarge": "This GIF exceeds the estimated remaining browser storage. Please use a smaller file.",
			"wallpaper.saveFailed": "Background could not be saved. Free browser storage or check storage permissions and retry.",
			"wallpaper.checking": "Checking…",
			"wallpaper.hint": "The background spans the whole page and stays in this browser; large static images are compressed, while GIFs keep their original data."
		};
		//#endregion

		//#region wallpaper layer (full-page background)
		let wallpaperEl = null;
		let wallpaperDimEl = null;
		let wallpaperSample = null;
		let sampleUrl;
		let sampledLuminance = null;
		let wallpaperRevision = 0;
		function canSampleWallpaper(url) {
			if (/^data:image\//i.test(url)) return true;
			try {
				const resolved = new URL(url, window.location.href);
				return /^https?:$/.test(resolved.protocol) && resolved.origin === window.location.origin;
			} catch { return false; }
		}
		function effectiveDim(options = readOptions()) {
			const bright = sampledLuminance !== null && sampledLuminance * options.brightness / 100 > 0.7;
			return Math.max(options.dim, options.autoDim && bright ? 35 : 0);
		}
		function updateDim() {
			if (wallpaperDimEl) wallpaperDimEl.style.backgroundColor = `rgba(0, 0, 0, ${effectiveDim() / 100})`;
		}
		function sampleWallpaper(url) {
			if (url === sampleUrl) return;
			sampleUrl = url;
			sampledLuminance = null;
			const revision = ++wallpaperRevision;
			if (wallpaperSample) wallpaperSample.onload = wallpaperSample.onerror = null;
			wallpaperSample = null;
			updateDim();
			// No CORS retries, proxy, or pixel read for cross-origin URLs.
			if (!canSampleWallpaper(url)) return;
			const image = document.createElement("img");
			wallpaperSample = image;
			image.onload = () => {
				if (revision !== wallpaperRevision) return;
				try {
					const canvas = document.createElement("canvas");
					canvas.width = canvas.height = 16;
					const context = canvas.getContext("2d");
					context.drawImage(image, 0, 0, 16, 16);
					const pixels = context.getImageData(0, 0, 16, 16).data;
					let total = 0, weight = 0;
					for (let i = 0; i < pixels.length; i += 4) {
						const a = pixels[i + 3] / 255;
						total += (0.2126 * pixels[i] + 0.7152 * pixels[i + 1] + 0.0722 * pixels[i + 2]) / 255 * a;
						weight += a;
					}
					sampledLuminance = weight ? total / weight : 0;
				} catch { sampledLuminance = null; } // Includes tainted canvases after redirects.
				image.onload = image.onerror = null;
				wallpaperSample = null;
				updateDim();
			};
			image.onerror = () => {
				if (revision !== wallpaperRevision) return;
				image.onload = image.onerror = null;
				wallpaperSample = null;
			};
			image.src = url;
		}

		function applyWallpaper() {
			const url = readWallpaper();
			if (url === null) {
				teardownWallpaper();
				return;
			}
			if (wallpaperDimEl === null) {
				wallpaperDimEl = document.createElement("div");
				wallpaperDimEl.id = "dsh-liquid-glass-wallpaper-dim";
				wallpaperDimEl.style.cssText = "position:fixed;inset:0;z-index:-1;pointer-events:none;";
				// A higher stacking level paints dim above the image regardless of
				// DOM order, with brightness confined to the image.
				document.body.prepend(wallpaperDimEl);
			}
			if (wallpaperEl === null || !document.body.contains(wallpaperEl)) {
				wallpaperEl = document.createElement("div");
				wallpaperEl.style.cssText = "position:fixed;inset:0;z-index:-2;pointer-events:none;background-size:cover;background-position:center;background-repeat:no-repeat;";
				document.body.prepend(wallpaperEl);
			}
			const options = readOptions();
			wallpaperEl.style.backgroundImage = `url("${url.replace(/["\\\n\r]/g, (c) => `\\${c.charCodeAt(0).toString(16)} `)}")`;
			wallpaperEl.style.backgroundSize = options.fit === "fill" ? "100% 100%" : options.fit;
			wallpaperEl.style.backgroundPosition = options.position;
			wallpaperEl.style.filter = `brightness(${options.brightness}%)`;

			sampleWallpaper(url);
			updateDim();
		}

		function teardownWallpaper() {
			wallpaperEl?.remove();
			wallpaperDimEl?.remove();
			wallpaperEl = wallpaperDimEl = null;
			if (wallpaperSample) wallpaperSample.onload = wallpaperSample.onerror = null;
			wallpaperSample = null;
			sampleUrl = undefined;
			sampledLuminance = null;
			wallpaperRevision++;
		}

		/** Downscale an image to a JPEG data URL (localStorage quota friendly). */
		function compressImage(image, maxSide, quality) {
			const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
			const canvas = document.createElement("canvas");
			canvas.width = Math.max(1, Math.round(image.width * scale));
			canvas.height = Math.max(1, Math.round(image.height * scale));
			const context = canvas.getContext("2d");
			context.drawImage(image, 0, 0, canvas.width, canvas.height);
			return canvas.toDataURL("image/jpeg", quality);
		}
		//#endregion

		//#region liquid glass layer
		/**
		 * Every surface token the shell paints, page base included, goes
		 * translucent so the wallpaper shows through everywhere. Neutral white
		 * on light scheme, near-black on dark — the classic frosted-glass recipe.
		 */
		const GLASS_TOKENS = [
			"--dsw-alias-bg-base",
			"--dsw-alias-bg-layer-1",
			"--dsw-alias-bg-layer-2",
			"--dsw-alias-bg-layer-3",
			"--dsw-alias-bg-overlay",
			"--dsw-specific-sidebar-fill",
			"--dsw-alias-markdown-code-block",
			"--dsw-alias-markdown-inline-code"
		];
		let glassDispose = null;
		let materialDispose = null;

		function glassFilterCss(material) {
			const filter = material.filter ? `blur(${material.blur}px) saturate(${material.saturate}%)` : "none";
			// Only a plugin-owned, childless decoration gets a new filter.
			// Host surfaces retain their existing filter placement via the token API.
			return `[data-liquid-glass-preview]::before{backdrop-filter:${filter};-webkit-backdrop-filter:${filter};}`;
		}
		function glassCss(material) {
			const tint = TINTS[material.tint];
			return [
				"/* dsh-liquid-glass: no host DOM selectors or ancestor filters */",
				"[data-liquid-glass-preview]{position:relative;isolation:isolate;border-radius:12px;padding:18px;}",
				`[data-liquid-glass-preview]::before{content:"";position:absolute;inset:0;z-index:-1;pointer-events:none;border-radius:inherit;background:${toRgba(tint.light, material.alpha)};border:1px solid rgba(255,255,255,0.65);box-shadow:inset 0 1px 0 rgba(255,255,255,0.8);}`,
				`body[data-ds-dark-theme] [data-liquid-glass-preview]::before{background:${toRgba(tint.dark, material.alpha)};border-color:rgba(255,255,255,0.18);box-shadow:inset 0 1px 0 rgba(255,255,255,0.28);}`,
				glassFilterCss(material)
			].join("\n");
		}

		let applyingGlass = false;

		function applyGlass(ctx) {
			if (applyingGlass) return;
			applyingGlass = true;
			try { applyGlassInner(ctx); } finally { applyingGlass = false; }
		}

		function applyGlassInner(ctx) {
			teardownGlass();
			if (!readGlassOn()) return;
			const material = appearance();
			const { alpha } = material;
			const tint = TINTS[material.tint];
			const filter = material.filter ? `blur(${material.blur}px) saturate(${material.saturate}%)` : "none";
			// These are existing host material tokens, not inferred DOM classes.
			materialDispose = ctx.theme.overrideTokens(MATERIAL_SOURCE, {
				"--dsw-menu-backdrop-filter": { light: filter, dark: filter },
				"--dsw-menu-surface-fill": { light: toRgba(tint.light, Math.max(0.55, alpha)), dark: toRgba(tint.dark, Math.max(0.55, alpha)) },
				"--dsw-specific-menu": { light: toRgba(tint.light, Math.max(0.55, alpha)), dark: toRgba(tint.dark, Math.max(0.55, alpha)) },
				"--dsw-alias-settings-card-stroke": { light: "rgba(255, 255, 255, 0.65)", dark: "rgba(255, 255, 255, 0.18)" }
			});
			const overrides = {};
			for (const key of GLASS_TOKENS) {
				overrides[key] = {
					light: toRgba(tint.light, alpha),
					dark: toRgba(tint.dark, alpha)
				};
			}
			glassDispose = ctx.theme.overrideTokens(GLASS_SOURCE, overrides);
			const style = document.createElement("style");
			style.id = GLASS_CSS_ID;
			style.setAttribute("data-plugin-css", "dsh-liquid-glass");
			style.textContent = glassCss(material);
			document.head.appendChild(style);
		}

		function teardownGlass() {
			glassDispose?.();
			glassDispose = null;
			materialDispose?.();
			materialDispose = null;
			document.getElementById(GLASS_CSS_ID)?.remove();
		}
		//#endregion

		//#region store
		function createGlassStore() {
			return (0, _client_store.defineStore)({
				init: () => ({
					on: DEFAULT_GLASS_ON,
					alpha: DEFAULT_ALPHA,
					wallpaper: null,
					options: DEFAULT_OPTIONS,
					accessibility: false,
					settingsError: false,
					shortcutStatus: "unavailable",
					revision: -1
				}),
				actions: {
					sync: (d, on, alpha, wallpaper, revision, options, accessibility, settingsError, shortcutStatus) => {
						if (revision <= d.revision) return;
						d.on = on;
						d.alpha = alpha;
						d.wallpaper = wallpaper;
						d.revision = revision;
						d.options = options;
						d.accessibility = accessibility;
						d.settingsError = settingsError;
						d.shortcutStatus = shortcutStatus;
					}
				}
			});
		}
		//#endregion

		//#region styles
		const styles = {
			group: {
				borderBottom: "1px solid var(--dsw-alias-border-l2)",
				display: "flex",
				flexDirection: "column",
				gap: "10px",
				padding: "16px 0"
			},
			title: { color: "var(--dsw-alias-label-primary)", fontSize: "14px", fontWeight: 400, lineHeight: "22px" },
			subtitle: { color: "var(--dsw-alias-label-tertiary)", fontSize: "12px", lineHeight: "18px" },
			hint: { color: "var(--dsw-alias-label-tertiary)", fontSize: "12px", lineHeight: "18px" },
			sectionLabel: { color: "var(--dsw-alias-label-secondary)", fontSize: "12px", lineHeight: "18px", marginTop: "4px" },
			row: { display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" },
			sliderRow: { display: "flex", alignItems: "center", gap: "10px" },
			sliderLabel: { color: "var(--dsw-alias-label-secondary)", fontSize: "12px", width: "72px", flexShrink: 0 },
			slider: { flex: 1, minWidth: "120px" },
			sliderValue: { color: "var(--dsw-alias-label-tertiary)", fontSize: "12px", width: "40px", textAlign: "right" },
			button: {
				padding: "5px 12px",
				borderRadius: "8px",
				border: "1px solid var(--dsw-alias-border-l2)",
				background: "var(--dsw-alias-bg-layer-1)",
				color: "var(--dsw-alias-label-primary)",
				fontSize: "12px",
				cursor: "pointer",
				font: "inherit"
			},
			textInput: {
				flex: 1,
				minWidth: "180px",
				padding: "5px 10px",
				borderRadius: "8px",
				border: "1px solid var(--dsw-alias-border-l2)",
				background: "var(--dsw-alias-bg-layer-1)",
				color: "var(--dsw-alias-label-primary)",
				fontSize: "12px",
				font: "inherit",
				boxSizing: "border-box"
			},
			checkLabel: { display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", color: "var(--dsw-alias-label-primary)", fontSize: "12px" },
			headerRow: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" },
			previewWrap: {
				position: "relative",
				borderRadius: "10px",
				overflow: "hidden",
				border: "1px solid var(--dsw-alias-border-l1)",
				width: "140px",
				aspectRatio: "16 / 9",
				background: "var(--dsw-alias-bg-layer-1)",
				flexShrink: 0,
				cursor: "zoom-in"
			},
			previewImage: {
				position: "absolute",
				inset: 0,
				backgroundSize: "cover",
				backgroundPosition: "center",
				backgroundRepeat: "no-repeat"
			},
			actionRow: { display: "flex", gap: "8px", marginTop: "6px" },
			actionButton: {
				padding: "4px 10px",
				borderRadius: "8px",
				border: "1px solid var(--dsw-alias-border-l2)",
				background: "transparent",
				color: "var(--dsw-alias-label-secondary)",
				fontSize: "12px",
				lineHeight: "18px",
				cursor: "pointer",
				font: "inherit"
			},
			actionButtonDanger: {
				padding: "4px 10px",
				borderRadius: "8px",
				border: "1px solid rgba(229, 72, 77, 0.45)",
				background: "transparent",
				color: "#e5484d",
				fontSize: "12px",
				lineHeight: "18px",
				cursor: "pointer",
				font: "inherit"
			},
			buttonColumn: { display: "flex", flexDirection: "column", gap: "6px", justifyContent: "flex-start" },
			uploadBox: {
				width: "200px",
				aspectRatio: "16 / 9",
				borderRadius: "10px",
				border: "1.5px dashed var(--dsw-alias-border-l2)",
				background: "var(--dsw-alias-bg-layer-1)",
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				justifyContent: "center",
				gap: "4px",
				cursor: "pointer",
				font: "inherit",
				padding: 0
			},
			uploadPlus: { fontSize: "22px", lineHeight: "1", color: "var(--dsw-alias-label-tertiary)" },
			uploadText: { fontSize: "12px", color: "var(--dsw-alias-label-tertiary)" },
			saveButton: {
				padding: "4px 10px",
				borderRadius: "8px",
				border: "none",
				background: "#4d6bfe",
				color: "#ffffff",
				fontSize: "12px",
				lineHeight: "18px",
				cursor: "pointer",
				font: "inherit"
			},
			saveButtonDisabled: {
				padding: "4px 10px",
				borderRadius: "8px",
				border: "none",
				background: "var(--dsw-alias-bg-layer-2)",
				color: "var(--dsw-alias-label-tertiary)",
				fontSize: "12px",
				lineHeight: "18px",
				cursor: "default",
				font: "inherit"
			},
			dirtyHint: { color: "#e5484d", fontSize: "12px", lineHeight: "18px" },
			lightboxOverlay: {
				position: "fixed",
				inset: 0,
				background: "rgba(0, 0, 0, 0.85)",
				zIndex: 99999,
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				cursor: "zoom-out"
			},
			lightboxImage: {
				maxWidth: "92vw",
				maxHeight: "92vh",
				objectFit: "contain",
				borderRadius: "8px",
				boxShadow: "0 8px 64px rgba(0, 0, 0, 0.5)"
			}
		};

		function Slider({ label, value, min, max, step, format, onChange }) {
			return (0, jsx.jsxs)("div", {
				style: styles.sliderRow,
				children: [
					(0, jsx.jsx)("span", { style: styles.sliderLabel, children: label }),
					(0, jsx.jsx)("input", { type: "range", min, max, step, value, style: styles.slider, onChange: (e) => onChange(Number(e.target.value)) }),
					(0, jsx.jsx)("span", { style: styles.sliderValue, children: format(value) })
				]
			});
		}
		//#endregion

		//#region component
		/** Toggle switch, plain inline styles. */
		function Toggle({ checked, onChange }) {
			return (0, jsx.jsx)("button", {
				type: "button",
				role: "switch",
				"aria-checked": checked,
				onClick: () => onChange(!checked),
				style: {
					width: "40px",
					height: "22px",
					borderRadius: "11px",
					background: checked ? "var(--dsw-alias-brand-primary)" : "var(--dsw-alias-bg-layer-3)",
					border: checked ? "1px solid transparent" : "1px solid var(--dsw-alias-border-l2)",
					position: "relative",
					cursor: "pointer",
					padding: 0,
					flexShrink: 0,
					transition: "background 0.2s",
					font: "inherit",
					boxSizing: "border-box"
				},
				children: (0, jsx.jsx)("span", {
					style: {
						position: "absolute",
						top: "2px",
						left: checked ? "20px" : "2px",
						width: "18px",
						height: "18px",
						borderRadius: "50%",
						background: "#ffffff",
						boxShadow: "0 1px 3px rgba(0, 0, 0, 0.3)",
						transition: "left 0.2s"
					}
				})
			});
		}

		/** Decode a picked image, preserving GIF data and compressing static images. */
		const ACCEPTED_IMAGE_TYPES = /^image\/(jpeg|png|webp|gif)$/;

		function pickImageFile(file, onReady, onError) {
			if (!file) return;
			if (!ACCEPTED_IMAGE_TYPES.test(file.type)) {
				onError?.("wallpaper.badType");
				return;
			}
			const reader = new FileReader();
			reader.onload = () => {
				const dataUrl = String(reader.result);
				const img = new Image();
				img.onload = () => {
					if (file.type === "image/gif") {
						if (!wallpaperFitsStorage(dataUrl)) return onError?.("wallpaper.tooLarge");
						onReady(dataUrl);
					} else {
						onReady(compressImage(img, 1920, 0.85));
					}
				};
				img.onerror = () => onError?.("wallpaper.badFile");
				img.src = dataUrl;
			};
			reader.onerror = () => onError?.("wallpaper.badFile");
			reader.readAsDataURL(file);
		}

		/**
		 * Wallpaper preview card: shows the full image, and on hover reveals a
		 * dimmed overlay with Replace / Remove actions — the standard image
		 * picker pattern. Replacing via URL stays available in the row below.
		 */
		function WallpaperSection({ url, onApply, t }) {
			const draftState = _react.useState(url);
			const draft = draftState[0];
			const setDraft = draftState[1];
			const urlTextState = _react.useState(typeof url === "string" && /^https?:/i.test(url) ? url : "");
			const urlText = urlTextState[0];
			const setUrlText = urlTextState[1];
			const lightboxState = _react.useState(false);
			const lightbox = lightboxState[0];
			const setLightbox = lightboxState[1];
			const checkingState = _react.useState(false);
			const checking = checkingState[0];
			const setChecking = checkingState[1];
			const errorState = _react.useState("");
			const error = errorState[0];
			const setError = errorState[1];
			const fileRef = _react.useRef(null);
			// Re-sync the draft whenever the applied wallpaper changes externally.
			_react.useEffect(() => {
				setDraft(url);
				setUrlText(typeof url === "string" && /^https?:/i.test(url) ? url : "");
				setError("");
			}, [url]);
			_react.useEffect(() => {
				if (!lightbox) return void 0;
				const onKey = (e) => { if (e.key === "Escape") setLightbox(false); };
				window.addEventListener("keydown", onKey);
				return () => window.removeEventListener("keydown", onKey);
			}, [lightbox]);
			const dirty = draft !== url;
			const handleSave = () => {
				if (!dirty || checking) return;
				setError("");
				// Check again in case other settings used storage since selection.
				if (draft && /^data:image\/gif[;,]/i.test(draft) && !wallpaperFitsStorage(draft)) {
					setError(t("wallpaper.tooLarge"));
					return;
				}
				const applyDraft = () => {
					if (onApply(draft) === false) setError(t("wallpaper.saveFailed"));
				};
				// Picked files were decoded before drafting; remote URLs get a
				// load pre-check so a bad link is rejected with an inline hint.
				if (draft && /^https?:/i.test(draft)) {
					setChecking(true);
					const probe = new Image();
					probe.onload = () => { setChecking(false); applyDraft(); };
					probe.onerror = () => { setChecking(false); setError(t("wallpaper.badUrl")); };
					probe.src = draft;
				} else {
					applyDraft();
				}
			};
			const saveButton = (0, jsx.jsx)("button", {
				type: "button",
				style: dirty && !checking ? styles.saveButton : styles.saveButtonDisabled,
				disabled: !dirty || checking,
				onClick: handleSave,
				children: checking ? t("wallpaper.checking") : t("wallpaper.save")
			});
			return (0, jsx.jsxs)("div", {
				children: [
					(0, jsx.jsxs)("div", {
						style: { display: "flex", alignItems: "flex-start", gap: "10px" },
						children: [
							draft !== null && (0, jsx.jsx)("div", {
								style: styles.previewWrap,
								title: t("wallpaper.previewHint"),
								onClick: () => setLightbox(true),
								children: (0, jsx.jsx)("div", { style: { ...styles.previewImage, backgroundImage: `url("${draft}")` } })
							}),
							draft === null && (0, jsx.jsxs)("button", {
								type: "button",
								style: styles.uploadBox,
								onClick: () => fileRef.current?.click(),
								children: [
									(0, jsx.jsx)("span", { style: styles.uploadPlus, children: "+" }),
									(0, jsx.jsx)("span", { style: styles.uploadText, children: t("wallpaper.upload") }),
									(0, jsx.jsx)("span", { style: styles.uploadText, children: t("wallpaper.formats") })
								]
							}),
							draft !== null && (0, jsx.jsxs)("div", {
								style: styles.buttonColumn,
								children: [
									(0, jsx.jsx)("button", {
										type: "button",
										style: styles.actionButton,
										onClick: () => fileRef.current?.click(),
										children: t("wallpaper.replace")
									}),
									(0, jsx.jsx)("button", {
										type: "button",
										style: styles.actionButtonDanger,
										onClick: () => { setDraft(null); setUrlText(""); setError(""); },
										children: t("wallpaper.remove")
									})
								]
							})
						]
					}),
					(0, jsx.jsx)("input", {
						ref: fileRef,
						type: "file",
						accept: "image/jpeg,image/png,image/webp,image/gif",
						style: { display: "none" },
						onChange: (e) => {
							pickImageFile(
								e.target.files?.[0],
								(dataUrl) => { setDraft(dataUrl); setUrlText(""); setError(""); },
								(key) => setError(t(key))
							);
							e.target.value = "";
						}
					}),
					(0, jsx.jsxs)("div", {
						style: { display: "flex", gap: "8px", marginTop: "6px", alignItems: "center" },
						children: [
							(0, jsx.jsx)("input", {
								style: styles.textInput,
								placeholder: t("wallpaper.urlPlaceholder"),
								value: urlText,
								onChange: (e) => {
									const value = e.target.value;
									setUrlText(value);
									setError("");
									setDraft(value.trim() === "" ? null : value.trim());
								}
							}),
							saveButton
						]
					}),
					error !== "" && (0, jsx.jsx)("div", { style: styles.dirtyHint, children: error }),
					error === "" && dirty && (0, jsx.jsx)("div", { style: styles.dirtyHint, children: t("wallpaper.unsaved") }),
					lightbox && (0, jsx.jsx)("div", {
						style: styles.lightboxOverlay,
						onClick: () => setLightbox(false),
						children: (0, jsx.jsx)("img", { src: draft, style: styles.lightboxImage, alt: "" })
					})
				]
			});
		}

		/** The single settings row: glass toggle, sliders, background picker. */
		function Choices({ label, value, values, onChange, t, prefix }) {
			return (0, jsx.jsxs)("label", { style: styles.row, children: [
				(0, jsx.jsx)("span", { style: styles.sectionLabel, children: label }),
				(0, jsx.jsx)("select", { value, style: styles.button, onChange: (e) => onChange(e.target.value), children:
					values.map((v) => (0, jsx.jsx)("option", { value: v, children: t(`${prefix}.${v}`) }, v)) })
			] });
		}
		function Check({ label, checked, onChange }) {
			return (0, jsx.jsxs)("label", { style: styles.checkLabel, children: [
				(0, jsx.jsx)("input", { type: "checkbox", checked, onChange: (e) => onChange(e.target.checked) }), label
			] });
		}
		function GlassRow({ t, useStore, setGlass, setAlpha, setWallpaper, setOption, setPreset }) {
			const on = useStore((s) => s.on);
			const alpha = useStore((s) => s.alpha);
			const wallpaper = useStore((s) => s.wallpaper);
			const options = useStore((s) => s.options);
			const accessibility = useStore((s) => s.accessibility);
			const settingsError = useStore((s) => s.settingsError);
			const shortcutStatus = useStore((s) => s.shortcutStatus);
			return (0, jsx.jsxs)("div", {
				style: styles.group,
				children: [
					(0, jsx.jsxs)("div", {
						style: styles.headerRow,
						children: [
							(0, jsx.jsx)("div", { style: styles.title, children: t("row.title") }),
							(0, jsx.jsx)(Toggle, { checked: on, onChange: (v) => setGlass(v) })
						]
					}),
					on && (0, jsx.jsx)("div", { style: styles.subtitle, children: t("row.subtitle") }),
					on && (0, jsx.jsx)(Slider, { label: t("glass.alpha"), value: Math.round((1 - alpha) * 100), min: 3, max: accessibility ? 50 : 95, step: 1, format: (v) => `${v}%`, onChange: setAlpha }),
					on && (0, jsx.jsx)("div", { style: styles.hint, children: t("glass.hint") }),
					on && accessibility && (0, jsx.jsx)("div", { role: "status", style: styles.hint, children: t("glass.accessibility") }),
					on && (0, jsx.jsxs)("div", { role: "group", "aria-label": t("glass.presets"), style: styles.row, children:
						Object.keys(PRESETS).map((name) => (0, jsx.jsx)("button", { type: "button", style: styles.button, disabled: accessibility, "aria-pressed": options.preset === name, onClick: () => setPreset(name), children: t(`glass.${name}`) }, name)) }),
					on && (0, jsx.jsx)(Choices, { label: t("glass.tint"), value: options.tint, values: Object.keys(TINTS), onChange: (v) => setOption("tint", v), t, prefix: "glass" }),
					on && (0, jsx.jsx)(Check, { label: t("glass.filter"), checked: options.filter, onChange: (v) => setOption("filter", v) }),
					on && (0, jsx.jsx)("div", { "data-liquid-glass-preview": "", style: { color: "var(--dsw-alias-label-primary)" }, children: t(`glass.${options.preset}`) }),
					on && (0, jsx.jsx)("div", { style: styles.hint, children: t("glass.materialHint") }),
					settingsError && (0, jsx.jsx)("div", { role: "alert", style: styles.dirtyHint, children: t("glass.saveFailed") }),
					(0, jsx.jsx)("div", { style: styles.hint, children: t(shortcutStatus === "unavailable" ? "glass.shortcutUnavailable" : shortcutStatus === "unbound" ? "glass.shortcutConflict" : "glass.shortcutHint") }),
					on && (0, jsx.jsx)("div", { style: styles.sectionLabel, children: t("wallpaper.title") }),
					on && (0, jsx.jsx)(WallpaperSection, {
						url: wallpaper,
						onApply: (value) => setWallpaper(value),
						t
					}),
					on && (0, jsx.jsx)("div", { style: styles.hint, children: t("wallpaper.hint") }),
					on && (0, jsx.jsx)(Slider, { label: t("wallpaper.dim"), value: options.dim, min: 0, max: 60, step: 1, format: (v) => `${v}%`, onChange: (v) => setOption("dim", v) }),
					on && (0, jsx.jsx)(Check, { label: t("wallpaper.autoDim"), checked: options.autoDim, onChange: (v) => setOption("autoDim", v) }),
					on && (0, jsx.jsx)("div", { style: styles.hint, children: t("wallpaper.autoDimHint") }),
					on && (0, jsx.jsx)(Choices, { label: t("wallpaper.fit"), value: options.fit, values: ["cover", "contain", "fill"], onChange: (v) => setOption("fit", v), t, prefix: "wallpaper" }),
					on && (0, jsx.jsx)(Choices, { label: t("wallpaper.position"), value: options.position, values: POSITIONS, onChange: (v) => setOption("position", v), t, prefix: "position" }),
					on && (0, jsx.jsx)(Slider, { label: t("wallpaper.brightness"), value: options.brightness, min: 20, max: 200, step: 1, format: (v) => `${v}%`, onChange: (v) => setOption("brightness", v) })
				]
			});
		}
		//#endregion

		//#region plugin body
		const inject = ["slots", "locale", "theme"];

		let stopRuntime = null;
		function apply(ctx) {
			stopRuntime?.();
			let active = true;
			let settingsError = false;
			let shortcutStatus = "unavailable";
			const mediaDisposers = [];
			const shortcutDisposers = [];
			const store = createGlassStore();
			let bound;
			let revision = 0;
			const sync = () => {
				revision += 1;
				const material = appearance();
				bound?.sync(readGlassOn(), material.alpha, readWallpaper(), revision, material, accessibilityActive, settingsError, shortcutStatus);
			};

			const queries = ["(prefers-reduced-transparency: reduce)", "(prefers-contrast: more)"].map((query) => {
				try { return window.matchMedia?.(query); } catch { return null; }
			});
			const updateAccessibility = () => {
				if (!active) return;
				accessibilityActive = queries.some((query) => query?.matches);
				applyGlass(ctx);
				sync();
			};
			accessibilityActive = queries.some((query) => query?.matches);
			for (const query of queries) {
				if (query?.addEventListener) {
					query.addEventListener("change", updateAccessibility);
					mediaDisposers.push(() => query.removeEventListener("change", updateAccessibility));
				} else if (query?.addListener) {
					query.addListener(updateAccessibility);
					mediaDisposers.push(() => query.removeListener(updateAccessibility));
				}
			}
			const stop = () => {
				if (!active) return;
				active = false;
				for (const dispose of [...mediaDisposers, ...shortcutDisposers]) dispose();
				// overrideTokens disposers emit theme/change too; the handler below
				// must be inert before disposing, or it resurrects the glass layer.
				teardownGlass();
				teardownWallpaper();
			};
			stopRuntime = stop;
			applyWallpaper();
			applyGlass(ctx);
			sync();

			// A ThemeRuntime rebuild can drop our override layer; re-apply on
			// every theme change event, retaining explicit light/dark tint pairs.
			ctx.on("theme/change", () => {
				if (active && readGlassOn()) applyGlass(ctx);
			});

			ctx.effect(() => stop, "liquid-glass: cleanup");
			ctx.effect(() => ctx.locale.register(SETTINGS_NS, { zh, en }), "liquid-glass: dictionaries");

			// Same optional Cordis injection used by the host theme's shortcuts.
			ctx.inject(["shortcuts"], (scope) => {
				if (!active) return;
				const translate = scope.locale.bind(SETTINGS_NS);
				const binding = { code: "KeyG", modifiers: ["primary", "shift"] };
				const command = {
					id: "liquid-glass.toggle", label: () => translate("glass.shortcut"), aliases: ["liquid glass"],
					defaults: Object.fromEntries(["desktop:macos", "desktop:windows", "desktop:linux", "web:macos", "web:windows"].map((profile) => [profile, binding])),
					regions: ["page"], modals: [],
					resolve: (context) => !active || context.region !== "page" || context.modal !== null ? { status: "pass" } : {
						status: "handled", run: () => {
							if (!active) return;
							settingsError = !writeStorage(KEY_GLASS, readGlassOn() ? "off" : "on");
							if (!settingsError) applyGlass(ctx);
							sync();
						}
					}
				};
				scope.effect(() => {
					let dispose;
					try {
						dispose = scope.shortcuts.register(command);
						shortcutStatus = "registered";
					} catch {
						// A newer host/plugin may reserve this default. Keep an editable,
						// unbound catalog entry rather than intercepting input ourselves.
						try {
							dispose = scope.shortcuts.register({ ...command, defaults: {} });
							shortcutStatus = "unbound";
						} catch { shortcutStatus = "unavailable"; }
					}
					sync();
					let disposed = false;
					const cleanup = () => {
						if (disposed) return;
						disposed = true;
						dispose?.();
						shortcutStatus = "unavailable";
						if (active) sync();
					};
					shortcutDisposers.push(cleanup);
					return cleanup;
				}, "liquid-glass: shortcut");
			});

			const saveOptions = (next, presetAlpha) => {
				const previousAlpha = readStorage(KEY_ALPHA);
				settingsError = false;
				if (presetAlpha !== undefined && !writeStorage(KEY_ALPHA, String(presetAlpha))) settingsError = true;
				if (!settingsError && !writeStorage(KEY_OPTIONS, JSON.stringify(next))) {
					settingsError = true;
					if (presetAlpha !== undefined) writeStorage(KEY_ALPHA, previousAlpha);
				}
				if (!settingsError) { applyGlass(ctx); applyWallpaper(); }
				sync();
				return !settingsError;
			};

			const injected = (actions) => {
				bound = actions;
				sync();
				return {
					setOption: (key, value) => {
						const options = readOptions();
						if (!Object.hasOwn(DEFAULT_OPTIONS, key) || key === "preset") return false;
						const valid = key === "tint" ? Object.keys(TINTS).includes(value)
							: key === "fit" ? ["cover", "contain", "fill"].includes(value)
							: key === "position" ? POSITIONS.includes(value)
							: key === "filter" || key === "autoDim" ? typeof value === "boolean"
							: typeof value === "number" && Number.isFinite(value);
						if (!valid) return false;
						options[key] = key === "dim" ? numberValue(value, 0, 60, 0) : key === "brightness" ? numberValue(value, 20, 200, 100) : value;
						return saveOptions(options);
					},
					setPreset: (name) => {
						if (accessibilityActive || !Object.keys(PRESETS).includes(name)) return false;
						return saveOptions({ ...readOptions(), preset: name }, PRESETS[name].alpha);
					},
					setGlass: (on) => {
						writeStorage(KEY_GLASS, on ? "on" : "off");
						applyGlass(ctx);
						sync();
					},
					setAlpha: (percent) => {
						// UI speaks "transparency %" (bigger = more see-through);
						// the surface token alpha is the inverse (1 - t/100).
						const alpha = Math.min(0.97, Math.max(0.05, 1 - percent / 100));
						writeStorage(KEY_ALPHA, String(Math.round(alpha * 1000) / 1000));
						applyGlass(ctx);
						sync();
					},
					setWallpaper: (url) => {
						if (!writeStorage(KEY_WALLPAPER, url)) return false;
						applyWallpaper();
						sync();
						return true;
					}
				};
			};
			const slotResult = ctx.slots.inject("settings.general.item", () => ctx.slots.register({
				name: "settings.general.item",
				id: "liquid-glass",
				order: 20,
				store,
				locale: SETTINGS_NS,
				inject: injected
			}, GlassRow));
		}
		//#endregion

		exports.SETTINGS_NS = SETTINGS_NS;
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});
