// dsh-liquid-glass — browser half (client plugin bundle).
//
// Loaded by dsh-client-modules at /plugins/dsh-liquid-glass/client.js and
// executed through the vendored cordis Loader's lazy-CJS module table
// (window.__ModuleLoader__.load). The factory body is plain CJS with require()
// resolved against the shell's module table — the same shape the shipped ui-*
// packages emit.
//
// Theme surfaces and image/video backgrounds through public host APIs.
// Preferences/images use localStorage; local video Blobs use IndexedDB.
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
		const UI = require("@deepseek-ai/dsh-client-ui-primitives");


		//#region constants & storage
		const SETTINGS_NS = "settings.liquid-glass";
		const KEY_GLASS = "dsh-liquid-glass:glass";
		const KEY_GLASS_SURFACES = "dsh-liquid-glass:glass-surfaces";
		const KEY_ALPHA = "dsh-liquid-glass:glass-alpha";
		const KEY_WALLPAPER = "dsh-liquid-glass:wallpaper";
		const DEFAULT_ALPHA = 0.62;
		const GLASS_SOURCE = "dsh-liquid-glass:glass";
		const GLASS_CSS_ID = "dsh-liquid-glass-glass-css";
		const MATERIAL_SOURCE = "dsh-liquid-glass:material";
		const KEY_OPTIONS = "dsh-liquid-glass:options";
		const KEY_APPEARANCES = "dsh-liquid-glass:appearances";
		let activeScheme = "light";
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
		const DEFAULT_OPTIONS = { preset: "regular", tint: "neutral", filter: true, dim: 0, autoDim: true, fit: "cover", position: "center center", brightness: 100, videoMode: "motion", wallpaperOpacity: 100, glassBlur: null, readingDim: 35, vignette: 0, panX: null, panY: null, zoom: 100 };
		const enumValue = (value, choices, fallback) => choices.includes(value) ? value : fallback;
		const numberValue = (value, min, max, fallback) => typeof value === "number" && Number.isFinite(value) ? Math.round(Math.min(max, Math.max(min, value))) : fallback;
		function sanitizeOptions(saved) {
			const o = saved && typeof saved === "object" ? saved : {};
			return {
				preset: enumValue(o.preset, Object.keys(PRESETS), "regular"),
				tint: enumValue(o.tint, Object.keys(TINTS), "neutral"),
				filter: typeof o.filter === "boolean" ? o.filter : true,
				dim: numberValue(o.dim, 0, 60, 0),
				autoDim: typeof o.autoDim === "boolean" ? o.autoDim : true,
				fit: enumValue(o.fit, ["cover", "contain", "fill"], "cover"),
				position: enumValue(o.position, POSITIONS, "center center"),
				brightness: numberValue(o.brightness, 20, 200, 100),
				videoMode: enumValue(o.videoMode, ["motion", "still"], "motion"),
				wallpaperOpacity: numberValue(o.wallpaperOpacity, 0, 100, 100),
				glassBlur: numberValue(o.glassBlur, 0, 40, null),
				readingDim: numberValue(o.readingDim, 0, 100, 35),
				vignette: numberValue(o.vignette, 0, 100, 0),
				panX: numberValue(o.panX, 0, 100, null),
				panY: numberValue(o.panY, 0, 100, null),
				zoom: numberValue(o.zoom, 100, 250, 100)
			};
		}
		function readProfiles() {
			try {
				const saved = JSON.parse(readStorage(KEY_APPEARANCES));
				if (saved?.version !== 1 || typeof saved.separate !== "boolean") return null;
				for (const scheme of ["light", "dark"]) {
					const profile = saved[scheme];
					if (!profile || !Number.isFinite(profile.alpha) || !profile.options || typeof profile.options !== "object" || Array.isArray(profile.options)) return null;
				}
				return saved;
			} catch { return null; }
		}
		function currentProfile() {
			const profiles = readProfiles();
			return profiles?.[profiles.separate ? activeScheme : "light"];
		}
		function readOptions() {
			const profile = currentProfile();
			if (profile) return sanitizeOptions(profile.options);
			try { return sanitizeOptions(JSON.parse(readStorage(KEY_OPTIONS))); }
			catch { return { ...DEFAULT_OPTIONS }; }
		}

		let accessibilityActive = false;
		let prefersOpaque = false;
		const HOST_VALIDATION = { platform: "web", dshVersion: "0.2.2-rc.1", checkedOn: "2026-11-19" };
		let previewPreset = null;
		let previewComposition = null;
		const backgroundOptions = () => previewComposition ? { ...readOptions(), ...previewComposition } : readOptions();
		function wallpaperComposition(options) {
			return { fit: options.fit, position: options.position, panX: options.panX, panY: options.panY, zoom: options.zoom };
		}
		function placement(options) {
			const [horizontal, vertical] = options.position.split(" ");
			const x = options.panX ?? ({ left: 0, center: 50, right: 100 })[horizontal];
			const y = options.panY ?? ({ top: 0, center: 50, bottom: 100 })[vertical];
			const origin = x + "% " + y + "%";
			const position = options.panX === null && options.panY === null ? options.position : origin;
			return { x, y, origin, position, transform: options.zoom === 100 ? "none" : "scale(" + options.zoom / 100 + ")" };
		}

		function appearance() {
			const saved = backgroundOptions();
			const options = previewPreset ? { ...saved, preset: previewPreset, glassBlur: null } : saved;
			const preset = accessibilityActive ? "frost" : options.preset;
			const material = PRESETS[preset];
			const requestedAlpha = previewPreset ? material.alpha : readAlpha();
			const alpha = prefersOpaque ? 1 : accessibilityActive ? Math.max(0.5, requestedAlpha) : requestedAlpha;
			// A preset's exact recipe holds at its default opacity. Making it
			// more transparent reduces blur; increased opacity never adds cost.
			const presetBlur = Math.round(material.blur * Math.min(1, alpha / material.alpha) * 10) / 10;
			const blur = accessibilityActive ? material.blur : options.glassBlur ?? presetBlur;
			return { ...options, filter: !prefersOpaque && options.filter, preset, alpha, blur, saturate: material.saturate, accessibility: accessibilityActive, prefersOpaque, scheme: activeScheme, separateAppearance: readProfiles()?.separate === true };
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
		function writeSettingsBatch(changes) {
			const originals = changes.map(([key]) => [key, readStorage(key)]);
			for (const [index, [key, value]] of changes.entries()) {
				if (writeStorage(key, value)) continue;
				let restored = true;
				for (const [writtenKey, original] of originals.slice(0, index).reverse()) {
					if (!writeStorage(writtenKey, original)) restored = false;
				}
				return restored ? "glass.saveFailed" : "glass.restoreFailed";
			}
			return null;
		}
		function storageFitsExcept(exceptKey, extraLength) {
			try {
				const storage = window.localStorage;
				let used = 0;
				for (let i = 0; i < storage.length; i++) {
					const key = storage.key(i);
					if (key !== exceptKey) used += (storage.getItem(key) || "").length;
				}
				// Assume a typical ~5 MiB budget, estimating UTF-16 values at
				// 2 bytes per code unit. Browser quotas/accounting vary; the
				// actual write can still fail and must report that failure.
				return (used + extraLength) * 2 <= 5 * 1024 * 1024;
			} catch { return true; } // If estimation is unavailable, let the write decide.
		}
		function wallpaperFitsStorage(value) {
			// Replacing the wallpaper frees its previous value.
			return storageFitsExcept(KEY_WALLPAPER, value.length);
		}

		//#region wallpaper rotation pool
		// The pool is a localStorage record of saved backgrounds. Images keep
		// their data URL in the record; videos keep only metadata and their
		// Blob stays in the same IndexedDB store as the single video.
		const KEY_ROTATION = "dsh-liquid-glass:rotation";
		const MAX_ROTATION_ITEMS = 6;
		const sameRotationBackground = (first, second) => first.kind === second.kind
			&& (first.kind === "video" ? first.id === second.id : first.url === second.url);
		const validNewImageUrl = url => typeof url === "string" && /^data:image\/(?:jpeg|png|webp|gif);base64,/i.test(url);
		function remoteWallpaperUrl(value) {
			if (typeof value !== "string" || !/^https?:\/\//i.test(value)) return null;
			try {
				const url = new URL(value);
				return url.username || url.password ? null : url.href;
			} catch { return null; }
		}
		const ROTATION_ORDERS = ["sequential", "random"];
		const ROTATION_TIMINGS = ["refresh", "hourly", "daily", "timeslot"];
		function validRotationItem(item) {
			if (!item || typeof item !== "object" || Array.isArray(item)) return false;
			if (typeof item.id !== "string" || !/^[\w-]{1,80}$/.test(item.id)) return false;
			if (item.kind === "image") return typeof item.url === "string" && item.url.length > 0;
			if (item.kind === "video") return typeof item.name === "string";
			return false;
		}
		function sanitizeRotation(saved) {
			const r = saved && typeof saved === "object" && !Array.isArray(saved) ? saved : {};
			const items = Array.isArray(r.items) ? r.items.filter(validRotationItem) : [];
			return {
				version: 1,
				enabled: typeof r.enabled === "boolean" ? r.enabled : false,
				order: enumValue(r.order, ROTATION_ORDERS, "sequential"),
				timing: enumValue(r.timing, ROTATION_TIMINGS, "refresh"),
				items,
				index: numberValue(r.index, 0, Math.max(0, items.length - 1), 0),
				lastSwitch: typeof r.lastSwitch === "number" && Number.isFinite(r.lastSwitch) && r.lastSwitch >= 0 ? r.lastSwitch : 0
			};
		}
		function readRotation() {
			try { return sanitizeRotation(JSON.parse(readStorage(KEY_ROTATION))); }
			catch { return sanitizeRotation(null); }
		}
		function writeRotation(record) {
			return writeStorage(KEY_ROTATION, JSON.stringify(record));
		}
		/** Morning 06–12, afternoon 12–18, evening 18–24, night 00–06. */
		function timeSlotOf(date) {
			const hour = date.getHours();
			if (hour >= 6 && hour < 12) return "morning";
			if (hour >= 12 && hour < 18) return "afternoon";
			if (hour >= 18) return "evening";
			return "night";
		}
		function rotationDue(rotation, now) {
			if (!rotation.enabled || rotation.items.length < 2) return false;
			if (rotation.timing === "refresh") return true;
			if (rotation.timing === "hourly") return now - rotation.lastSwitch >= 60 * 60 * 1000;
			if (rotation.timing === "daily") return new Date(rotation.lastSwitch).toDateString() !== new Date(now).toDateString();
			if (rotation.timing === "timeslot") return timeSlotOf(new Date(rotation.lastSwitch)) !== timeSlotOf(new Date(now));
			return false;
		}
		function nextRotationIndex(rotation) {
			const n = rotation.items.length;
			if (n === 0) return -1;
			if (n === 1) return 0;
			if (rotation.order === "random") {
				const next = Math.floor(Math.random() * n);
				return next === rotation.index ? (next + 1) % n : next;
			}
			return (rotation.index + 1) % n;
		}
		/** Pool entry for the currently saved background, or null when there is none. */
		function currentBackgroundItem() {
			const video = readVideo();
			if (video) return { id: video.id, kind: "video", name: video.name };
			const url = readWallpaper();
			if (url) return { id: window.crypto.randomUUID(), kind: "image", url };
			return null;
		}
		/** A pooled video Blob stays in IndexedDB until its pool entry is removed. */
		function deleteVideoIfUnpooled(id) {
			if (!id) return;
			if (readRotation().items.some((item) => item.kind === "video" && item.id === id)) return;
			void mediaRecord("delete", id).catch(() => {});
		}
		//#endregion
		const readGlassOn = () => {
			const raw = readStorage(KEY_GLASS);
			if (raw === null) return DEFAULT_GLASS_ON;
			return raw === "on";
		};
		const readGlassSurfaces = () => readStorage(KEY_GLASS_SURFACES) !== "off";
		const readAlpha = () => {
			const profile = currentProfile();
			const raw = profile ? profile.alpha : readStorage(KEY_ALPHA);
			if (raw === null) return DEFAULT_ALPHA;
			const n = Number(raw);
			return Number.isFinite(n) && n > 0 ? Math.min(0.97, Math.max(0.05, n)) : DEFAULT_ALPHA;
		};
		const readWallpaper = () => readStorage(KEY_WALLPAPER);
		let previewSelection = null;
		const currentVideoSelection = () => previewSelection ? (previewSelection.kind === "video" ? { ...previewSelection.meta, file: previewSelection.file } : null) : readVideo();
		const currentWallpaperUrl = () => previewSelection ? (previewSelection.kind === "image" ? previewSelection.url : null) : readWallpaper();
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
		function opaqueRgb(value) {
			const hex = hexToRgb(value);
			if (hex) return [hex.r, hex.g, hex.b];
			const match = /^rgba?\(([^)]+)\)$/i.exec(value);
			if (!match) return null;
			const values = match[1].trim().split(/[\s,/]+/).map(Number);
			if (values.length !== 3 && !(values.length === 4 && values[3] === 1)) return null;
			const rgb = values.slice(0, 3);
			return rgb.every(channel => channel >= 0 && channel <= 255) ? rgb : null;
		}
		function relativeLuminance(rgb) {
			const [r, g, b] = rgb.map(channel => {
				const srgb = channel / 255;
				return srgb <= 0.04045 ? srgb / 12.92 : Math.pow((srgb + 0.055) / 1.055, 2.4);
			});
			return 0.2126 * r + 0.7152 * g + 0.0722 * b;
		}
		function minimumContentContrast(text, color, opacity) {
			const fg = relativeLuminance(text);
			const mix = backdrop => relativeLuminance(color.map(channel => channel * opacity + backdrop * (1 - opacity)));
			const darkest = mix(0), lightest = mix(255);
			// The estimate uses worst-case channel bounds, so it doesn't need
			// to sample the wallpaper or inspect host content elements.
			if (fg >= darkest && fg <= lightest) return 1;
			return fg < darkest ? (darkest + 0.05) / (fg + 0.05) : (fg + 0.05) / (lightest + 0.05);
		}
		//#endregion

		//#region locale
		const zh = {
			"glass.opaqueSystem": "系统已要求减少透明度，暂时隐藏壁纸并使用不透明界面。",
			"diagnostics.title": "诊断与兼容性",
			"diagnostics.verified": "已验证 DSH 版本",
			"diagnostics.date": "验证日期",
			"diagnostics.settings": "设置入口",
			"diagnostics.theme": "主题接口",
			"diagnostics.shortcuts": "快捷键服务",
			"diagnostics.ready": "已接入",
			"diagnostics.unavailable": "暂不可用",
			"diagnostics.copy": "复制 JSON 报告",
			"diagnostics.show": "查看 JSON",
			"diagnostics.report": "诊断 JSON 报告",
			"diagnostics.copied": "诊断报告已复制。",
			"diagnostics.copyFailed": "剪贴板不可用，可从下方手动复制。",
			"diagnostics.currentHint": "当前安装版本可在通用设置中查看。",
			"wallpaper.recent": "最近使用的图片",
			"wallpaper.recentUse": "恢复最近的背景",
			"wallpaper.recentRemove": "移除最近记录",
			"wallpaper.compose": "拖动调整背景构图",
			"wallpaper.dragHint": "拖动图片调整位置，也可滚动或使用滑块调整缩放。",
			"wallpaper.panX": "水平焦点",
			"wallpaper.panY": "垂直焦点",
			"wallpaper.zoom": "背景缩放",
			"wallpaper.applyComposition": "保存构图",
			"wallpaper.cancelComposition": "取消构图",
			"glass.tryingPreset": "正在预览预设",
			"glass.applyPreset": "应用预设",
			"glass.cancelPreset": "取消预览",
			"glass.undoPreset": "撤销预设切换",
			"glass.presetRestoreFailed": "外观设置未能完全回滚，请检查当前外观。",
			"wallpaper.readingDim": "阅读保护自动暗化",
			"wallpaper.vignette": "阅读保护边缘暗角",
			"glass.contrastEstimate": "内容文字最低对比度估算",
			"glass.contrastUnavailable": "当前主题没有可用于计算的不透明文字色。",
			"glass.contrastHint": "按当前文字色和内容层估算，覆盖底图最亮和最暗的情况。WCAG 2.2 AA 普通文本目标为 4.5∶1。",
			"glass.blur": "菜单玻璃模糊",
			"wallpaper.opacity": "壁纸不透明度",
			"glass.surfaces": "玻璃效果",
			"glass.restoreNative": "恢复原生外观",
			"glass.restoreTitle": "确认恢复原生外观",
			"glass.restoreHint": "关闭玻璃和壁纸，恢复外观默认设置并停止轮换。已添加的轮换壁纸会保留。",
			"glass.restoreConfirm": "恢复原生",
			"glass.restoreCancel": "取消",
			"glass.restoreBusy": "请先保存或放弃当前背景编辑，再恢复原生外观。",
			"glass.restoreFailed": "恢复原生外观时写入失败，部分设置未能回滚。请重新打开设置，检查当前外观。",
			"glass.restored": "已恢复原生外观。",
			"rotation.addImages": "添加图片",
			"rotation.replace": "替换图片",
			"rotation.select": "使用背景",
			"rotation.settings": "轮换设置",
			"rotation.limit": "轮换最多可添加 6 个背景。请先移除部分条目。",
			"rotation.added": "已添加",
			"rotation.remaining": "剩余 {count}",
			"rotation.capacityFull": "已达上限",
			"rotation.duplicate": "这张图片已经在背景列表里。",
			"rotation.restoreFailed": "保存失败，未能完整恢复原轮换列表。",
			"wallpaper.saveLeave": "保存并离开",
			"wallpaper.discard": "放弃更改",
			"wallpaper.keepEditing": "继续编辑",
			"wallpaper.leaveDescription": "当前背景仅为预览，尚未保存。",
			"wallpaper.leaveTitle": "保存背景更改？",
			"wallpaper.videoPreview": "背景视频预览",
			"wallpaper.imagePreview": "背景图片预览",
			"wallpaper.link": "使用链接",
			"wallpaper.addLink": "添加",
			"wallpaper.invalidUrl": "请输入有效的 HTTP 或 HTTPS 图片链接。",
			"video.format": "请选择 MP4 或 WebM 视频。",
			"video.size": "视频需大于 0 且不超过 100 MiB。",
			"video.decode": "无法播放这个视频，请使用浏览器支持的 MP4 或 WebM 编码。",
			"video.storage": "视频保存或读取失败，请检查本地存储空间与权限。",
			"video.missing": "本地视频已不可用，请重新选择文件。",
			"video.blocked": "自动播放被阻止，请点击播放。",
			"video.play": "播放视频",
			"video.pause": "暂停视频",
			"video.reduced": "系统已启用减少动态效果，视频保持暂停。",
			"glass.presets": "质感预设",
			"glass.regular": "标准",
			"glass.clear": "清透",
			"glass.frost": "磨砂",
			"glass.tint": "色调",
			"glass.neutral": "原色",
			"glass.cool": "冷白",
			"glass.warm": "暖灰",
			"glass.ink": "墨色",
			"glass.filter": "弹出菜单模糊",
			"glass.accessibility": "系统减透明或增强对比度已启用：使用磨砂质感，透明度最高 50%。",
			"glass.saveFailed": "设置保存失败，请检查浏览器存储空间或权限。",
			"glass.shortcut": "切换液态玻璃",
			"glass.shortcutUnavailable": "快捷键服务不可用，仍可使用上方开关。",
			"wallpaper.dim": "壁纸暗化",
			"wallpaper.autoDim": "阅读保护",
			"wallpaper.autoDimHint": "提高内容、代码与弹出菜单的不透明度，并暗化明亮图片和视频。跨域图片不会自动取样。",
			"glass.separateAppearance": "分别记住浅色与深色设置",
			"glass.editing.light": "当前编辑浅色外观；恢复默认仅影响浅色设置。背景文件共用。",
			"glass.editing.dark": "当前编辑深色外观；恢复默认仅影响深色设置。背景文件共用。",
			"video.mode": "视频背景",
			"video.motion": "动态播放",
			"video.still": "静止画面",
			"video.stillHint": "已启用静止画面；可在高级设置中切换为动态播放。",
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
			"row.title": "主题背景",
			"row.description": "调整界面通透效果，设置图片或视频背景",
			"row.configure": "展开主题背景设置",
			"row.advanced": "高级设置",
			"row.disabledHint": "开启主题背景后应用这些设置。",
			"glass.adjusted": "已微调，可重新选择预设恢复该质感。",
			"glass.reset": "恢复效果默认值",
			"glass.alpha": "透明度",
			"wallpaper.title": "背景",
			"wallpaper.choose": "选择图片或视频…",
			"wallpaper.upload": "上传图片或视频",
			"wallpaper.badType": "仅支持 JPG / PNG / WebP / GIF 格式的图片",
			"wallpaper.urlPlaceholder": "或粘贴图片 URL",
			"wallpaper.remove": "移除背景",
			"wallpaper.replace": "更换背景",
			"wallpaper.save": "保存",
			"wallpaper.badUrl": "图片链接加载失败，请检查后重试",
			"wallpaper.badFile": "图片文件读取或解码失败，请选择有效的图片",
			"wallpaper.tooLarge": "GIF 超出本浏览器的预计剩余存储空间，请缩小文件后重试",
			"wallpaper.saveFailed": "背景图保存失败，请释放浏览器存储空间或检查存储权限后重试",
			"wallpaper.checking": "校验中…",
			"rotation.enable": "启用壁纸轮换",
			"rotation.order": "轮换顺序",
			"rotation.sequential": "顺序",
			"rotation.random": "随机",
			"rotation.timing": "切换时机",
			"rotation.refresh": "每次打开",
			"rotation.hourly": "每小时",
			"rotation.daily": "每天",
			"rotation.timeslot": "按时段",
			"rotation.next": "下一张",
			"rotation.addCurrent": "添加当前背景",
			"rotation.remove": "移除",
			"rotation.video": "视频",
			"rotation.tooLarge": "池子已满：该背景超出浏览器预计剩余存储空间。",
			"rotation.saveFailed": "轮换设置保存失败，请检查浏览器存储空间或权限。",
		};
		const en = {
			"glass.opaqueSystem": "Your system requests reduced transparency, so wallpaper is temporarily hidden and surfaces are opaque.",
			"diagnostics.title": "Diagnostics and compatibility",
			"diagnostics.verified": "Verified DSH version",
			"diagnostics.date": "Validation date",
			"diagnostics.settings": "Settings slot",
			"diagnostics.theme": "Theme interface",
			"diagnostics.shortcuts": "Shortcut service",
			"diagnostics.ready": "Connected",
			"diagnostics.unavailable": "Unavailable",
			"diagnostics.copy": "Copy JSON report",
			"diagnostics.show": "View JSON",
			"diagnostics.report": "Diagnostics JSON report",
			"diagnostics.copied": "Diagnostics report copied.",
			"diagnostics.copyFailed": "Clipboard access is unavailable. Copy the report below.",
			"diagnostics.currentHint": "Find the installed version in General settings.",
			"wallpaper.recent": "Recent images",
			"wallpaper.recentUse": "Restore recent background",
			"wallpaper.recentRemove": "Remove from recent images",
			"wallpaper.compose": "Adjust wallpaper composition",
			"wallpaper.dragHint": "Drag to place the image, or use the wheel or sliders to adjust zoom.",
			"wallpaper.panX": "Horizontal focus",
			"wallpaper.panY": "Vertical focus",
			"wallpaper.zoom": "Wallpaper zoom",
			"wallpaper.applyComposition": "Save composition",
			"wallpaper.cancelComposition": "Cancel composition",
			"glass.tryingPreset": "Previewing preset",
			"glass.applyPreset": "Apply preset",
			"glass.cancelPreset": "Cancel preview",
			"glass.undoPreset": "Undo preset change",
			"glass.presetRestoreFailed": "Some appearance settings could not be rolled back. Check the current appearance.",
			"wallpaper.readingDim": "Reading protection dim",
			"wallpaper.vignette": "Reading protection vignette",
			"glass.contrastEstimate": "Estimated minimum content text contrast",
			"glass.contrastUnavailable": "The current theme does not provide an opaque text color for this estimate.",
			"glass.contrastHint": "Estimated from the current text color and content surface over the lightest and darkest backdrops. WCAG 2.2 AA targets 4.5:1 for ordinary text.",
			"glass.blur": "Menu glass blur",
			"wallpaper.opacity": "Wallpaper opacity",
			"glass.surfaces": "Glass surfaces",
			"glass.restoreNative": "Restore native appearance",
			"glass.restoreTitle": "Restore native appearance?",
			"glass.restoreHint": "Turn off glass and wallpaper, reset appearance preferences, and stop rotation. Saved rotation wallpapers are kept.",
			"glass.restoreConfirm": "Restore native",
			"glass.restoreCancel": "Cancel",
			"glass.restoreBusy": "Save or discard your background edits before restoring the native appearance.",
			"glass.restoreFailed": "Some settings could not be rolled back. Reopen settings to check the current appearance.",
			"glass.restored": "Native appearance restored.",
			"rotation.addImages": "Add images",
			"rotation.replace": "Replace image",
			"rotation.select": "Use background",
			"rotation.settings": "Rotation settings",
			"rotation.limit": "You can add up to six backgrounds for rotation. Remove an entry to add more.",
			"rotation.added": "Added",
			"rotation.remaining": "{count} remaining",
			"rotation.capacityFull": "Limit reached",
			"rotation.duplicate": "This image is already in the background collection.",
			"rotation.restoreFailed": "Saving failed and the previous rotation collection could not be fully restored.",
			"wallpaper.saveLeave": "Save and leave",
			"wallpaper.discard": "Discard changes",
			"wallpaper.keepEditing": "Keep editing",
			"wallpaper.leaveDescription": "The current background is a preview and has not been saved.",
			"wallpaper.leaveTitle": "Save background changes?",
			"wallpaper.videoPreview": "Background video preview",
			"wallpaper.imagePreview": "Background image preview",
			"wallpaper.link": "Use a link",
			"wallpaper.addLink": "Add",
			"wallpaper.invalidUrl": "Enter a valid HTTP or HTTPS image URL.",
			"video.format": "Choose an MP4 or WebM video.",
			"video.size": "Choose a non-empty video up to 100 MiB.",
			"video.decode": "This video cannot be played. Use a browser-supported MP4 or WebM codec.",
			"video.storage": "Video could not be saved or read. Check local storage space and permissions.",
			"video.missing": "The local video is unavailable. Choose the file again.",
			"video.blocked": "Autoplay was blocked. Select Play video to retry.",
			"video.play": "Play video",
			"video.pause": "Pause video",
			"video.reduced": "Reduce motion is enabled. The video stays paused.",
			"glass.presets": "Material preset",
			"glass.regular": "Regular",
			"glass.clear": "Clear",
			"glass.frost": "Frost",
			"glass.tint": "Tint",
			"glass.neutral": "Neutral",
			"glass.cool": "Cool white",
			"glass.warm": "Warm gray",
			"glass.ink": "Ink",
			"glass.filter": "Blur popup menus",
			"glass.accessibility": "System transparency or contrast protection is active: Frost material, at most 50% transparency.",
			"glass.saveFailed": "Settings could not be saved. Check browser storage space or permissions.",
			"glass.shortcut": "Toggle Liquid Glass",
			"glass.shortcutUnavailable": "Keyboard shortcuts are unavailable; use the switch above.",
			"wallpaper.dim": "Wallpaper dim",
			"wallpaper.autoDim": "Reading protection",
			"wallpaper.autoDimHint": "Increase content, code and menu opacity and dim bright images and videos. Cross-origin images are excluded from automatic sampling.",
			"glass.separateAppearance": "Remember light and dark settings separately",
			"glass.editing.light": "Editing light appearance. Reset affects light settings only. Background files are shared.",
			"glass.editing.dark": "Editing dark appearance. Reset affects dark settings only. Background files are shared.",
			"video.mode": "Video background",
			"video.motion": "Motion",
			"video.still": "Still frame",
			"video.stillHint": "Still frame is enabled. Choose Motion in Advanced settings to play.",
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
			"row.title": "Theme background",
			"row.description": "Adjust transparency and choose an image or video background",
			"row.configure": "Expand theme background settings",
			"row.advanced": "Advanced settings",
			"row.disabledHint": "Enable theme background to apply these settings.",
			"glass.adjusted": "Customized. Select a preset again to restore its material.",
			"glass.reset": "Reset appearance",
			"glass.alpha": "Transparency",
			"wallpaper.title": "Background",
			"wallpaper.choose": "Choose image or video…",
			"wallpaper.upload": "Upload image or video",
			"wallpaper.badType": "Only JPG / PNG / WebP / GIF images are supported",
			"wallpaper.urlPlaceholder": "…or paste an image URL",
			"wallpaper.remove": "Remove background",
			"wallpaper.replace": "Replace",
			"wallpaper.save": "Save",
			"wallpaper.badUrl": "Image failed to load from this URL. Please check and retry.",
			"wallpaper.badFile": "Image file could not be read or decoded. Please choose a valid image.",
			"wallpaper.tooLarge": "This GIF exceeds the estimated remaining browser storage. Please use a smaller file.",
			"wallpaper.saveFailed": "Background could not be saved. Free browser storage or check storage permissions and retry.",
			"wallpaper.checking": "Checking…",
			"rotation.enable": "Rotate wallpapers",
			"rotation.order": "Rotation order",
			"rotation.sequential": "In order",
			"rotation.random": "Random",
			"rotation.timing": "Switch when",
			"rotation.refresh": "On every open",
			"rotation.hourly": "Every hour",
			"rotation.daily": "Every day",
			"rotation.timeslot": "By time of day",
			"rotation.next": "Next wallpaper",
			"rotation.addCurrent": "Add current background",
			"rotation.remove": "Remove",
			"rotation.video": "Video",
			"rotation.tooLarge": "The pool is full: this background exceeds the estimated remaining browser storage.",
			"rotation.saveFailed": "Rotation settings could not be saved. Check browser storage space or permissions.",
		};
		//#endregion

		//#region local video backgrounds
		const KEY_VIDEO = "dsh-liquid-glass:video";
		const KEY_VIDEO_PAUSED = "dsh-liquid-glass:video-paused";
		const MAX_VIDEO_BYTES = 100 * 1024 * 1024;
		const RECENT_WALLPAPERS = "dsh-liquid-glass:recent-images:v1";
		const MAX_RECENT_WALLPAPERS = 12;
		let recentQueue = Promise.resolve();
		const isRecentImageUrl = url => typeof url === "string" && (validNewImageUrl(url) || /^https?:\/\//i.test(url));
		function readRecentEntries(record) {
			return Array.isArray(record) ? record
				.filter(item => validRotationItem(item) && item.kind === "image" && isRecentImageUrl(item.url))
				.slice(0, MAX_RECENT_WALLPAPERS)
				.map(item => ({ ...item, composition: wallpaperComposition(sanitizeOptions(item.composition)) })) : [];
		}
		function readVideo() {
			try {
				const value = JSON.parse(readStorage(KEY_VIDEO));
				return value && typeof value.id === "string" && /^[\w-]{1,80}$/.test(value.id) && typeof value.name === "string" ? value : null;
			} catch { return null; }
		}
		function mediaRecord(mode, id, payload, history = false) {
			return new Promise((resolve, reject) => {
				if (!window.indexedDB) { reject(new Error("video.storage")); return; }
				let abandoned = false;
				const database = history ? "dsh-liquid-glass-history" : "dsh-liquid-glass-media";
				const table = history ? "recent" : "videos";
				const request = window.indexedDB.open(database, 1);
				request.onupgradeneeded = () => request.result.createObjectStore(table);
				request.onerror = () => reject(new Error("video.storage"));
				request.onblocked = () => { abandoned = true; reject(new Error("video.storage")); };
				request.onsuccess = () => {
					const db = request.result;
					if (abandoned) { db.close(); return; }
					db.onversionchange = () => db.close();
					try {
						const tx = db.transaction(table, mode === "get" ? "readonly" : "readwrite");
						const store = tx.objectStore(table);
						const operation = mode === "put" ? store.put(payload, id) : mode === "delete" ? store.delete(id) : store.get(id);
						let updated;
						if (mode === "update") operation.onsuccess = () => {
							try {
								updated = payload(operation.result);
								store.put(updated, id);
							} catch { tx.abort(); }
						};
						tx.oncomplete = () => { const value = mode === "update" ? updated : operation.result; db.close(); resolve(value); };
						tx.onabort = tx.onerror = () => { db.close(); reject(new Error("video.storage")); };
					} catch { db.close(); reject(new Error("video.storage")); }
				};
			});
		}
		function validateVideo(file) {
			if (!file || !/^video\/(mp4|webm)$/.test(file.type)) return Promise.reject(new Error("video.format"));
			if (file.size <= 0 || file.size > MAX_VIDEO_BYTES) return Promise.reject(new Error("video.size"));
			return new Promise((resolve, reject) => {
				const probe = document.createElement("video");
				const url = window.URL.createObjectURL(file);
				const finish = (error) => {
					clearTimeout(timer);
					probe.onloadeddata = probe.onerror = null;
					probe.removeAttribute("src"); probe.load();
					window.URL.revokeObjectURL(url);
					error ? reject(new Error(error)) : resolve();
				};
				const timer = setTimeout(() => finish("video.decode"), 15000);
				probe.onloadeddata = () => finish(probe.videoWidth > 0 ? null : "video.decode");
				probe.onerror = () => finish("video.decode");
				probe.muted = true; probe.playsInline = true; probe.preload = "auto"; probe.src = url;
			});
		}
		let videoEl = null;
		let videoObjectUrl = null;
		let videoId = null;
		let videoGeneration = 0;
		let videoStatus = "paused";
		let videoPlaybackError = "";
		let notifyVideo = () => {};
		let reducedMotion = false;
		function videoShouldPause() { return !readGlassOn() || readStorage(KEY_VIDEO_PAUSED) === "on" || document.hidden || reducedMotion || readOptions().videoMode === "still"; }
		function updateVideoPlayback() {
			const element = videoEl;
			if (!element) return;
			if (videoShouldPause()) {
				element.pause(); videoStatus = "paused"; notifyVideo(); return;
			}
			if (!element.paused) return;
			element.play().then(() => {
				if (videoEl !== element) return;
				if (videoShouldPause()) { element.pause(); videoStatus = "paused"; }
				else { videoStatus = "playing"; videoPlaybackError = ""; }
				notifyVideo();
			}).catch(error => {
				if (videoEl !== element || videoShouldPause()) return;
				videoStatus = "paused";
				videoPlaybackError = error.name === "NotAllowedError" ? "video.blocked" : "video.decode";
				notifyVideo();
			});
		}
		function stopVideo() {
			videoGeneration++;
			if (videoEl) { videoEl.pause(); videoEl.onerror = null; videoEl.removeAttribute("src"); videoEl.load(); videoEl.remove(); }
			if (videoObjectUrl) window.URL.revokeObjectURL(videoObjectUrl);
			videoEl = videoObjectUrl = videoId = null;
			videoStatus = "paused"; videoPlaybackError = "";
		}
		function styleVideo() {
			if (!videoEl) return;
			const options = backgroundOptions();
			const geometry = placement(options);
			videoEl.style.objectFit = options.fit;
			videoEl.style.objectPosition = geometry.position;
			videoEl.style.transformOrigin = geometry.origin;
			videoEl.style.transform = geometry.transform;
			videoEl.style.filter = `brightness(${options.brightness}%)`;
			videoEl.style.opacity = String(options.wallpaperOpacity / 100);
		}
		function applyVideo(meta) {
			if (videoId === meta.id) { styleVideo(); updateVideoPlayback(); return; }
			stopVideo(); videoId = meta.id; videoStatus = "loading";
			const generation = videoGeneration;
			notifyVideo();
			void Promise.resolve(meta.file || mediaRecord("get", meta.id)).then(file => {
				if (generation !== videoGeneration) return;
				if (!file) throw new Error("video.missing");
				videoObjectUrl = window.URL.createObjectURL(file);
				videoEl = document.createElement("video");
				videoEl.id = "dsh-liquid-glass-video";
				videoEl.style.cssText = "position:fixed;inset:0;width:100%;height:100%;z-index:-2;pointer-events:none;";
				videoEl.setAttribute("aria-hidden", "true");
				videoEl.muted = videoEl.defaultMuted = videoEl.loop = videoEl.playsInline = true;
				videoEl.disablePictureInPicture = true;
				videoEl.preload = "auto";
				videoEl.onerror = () => { videoPlaybackError = "video.decode"; videoStatus = "paused"; notifyVideo(); };
				videoEl.src = videoObjectUrl;
				document.body.prepend(videoEl);
				styleVideo(); updateVideoPlayback();
			}).catch(error => {
				if (generation !== videoGeneration) return;
				videoPlaybackError = error.message === "video.missing" ? "video.missing" : "video.storage";
				videoStatus = "paused"; notifyVideo();
			});
		}
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
			return Math.max(options.dim, options.autoDim && (bright || currentVideoSelection()) ? options.readingDim : 0);
		}
		function updateDim() {
			if (!wallpaperDimEl) return;
			const options = readOptions();
			wallpaperDimEl.style.backgroundColor = `rgba(0, 0, 0, ${effectiveDim(options) * options.wallpaperOpacity / 10000})`;
			const vignette = options.autoDim ? options.vignette * options.wallpaperOpacity / 10000 : 0;
			wallpaperDimEl.style.backgroundImage = vignette
				? `radial-gradient(ellipse at center, transparent 40%, rgba(0, 0, 0, ${vignette}) 100%)`
				: "none";
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

		function applyWallpaper(ctx) {
			if (!readGlassSurfaces()) applyGlass(ctx);
			const url = currentWallpaperUrl();
			const video = currentVideoSelection();
			if (prefersOpaque || !readGlassOn() || (!video && url === null)) {
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
			if (video) {
				wallpaperEl?.remove(); wallpaperEl = null;
				if (wallpaperSample) wallpaperSample.onload = wallpaperSample.onerror = null;
				wallpaperSample = null; sampledLuminance = null; sampleUrl = undefined; wallpaperRevision++;
				applyVideo(video); updateDim(); return;
			}
			stopVideo();
			if (wallpaperEl === null || !document.body.contains(wallpaperEl)) {
				wallpaperEl = document.createElement("div");
				wallpaperEl.style.cssText = "position:fixed;inset:0;z-index:-2;pointer-events:none;background-size:cover;background-position:center;background-repeat:no-repeat;";
				document.body.prepend(wallpaperEl);
			}
			const options = backgroundOptions();
			const geometry = placement(options);
			wallpaperEl.style.backgroundImage = `url("${url.replace(/["\\\n\r]/g, (c) => `\\${c.charCodeAt(0).toString(16)} `)}")`;
			wallpaperEl.style.backgroundSize = options.fit === "fill" ? "100% 100%" : options.fit;
			wallpaperEl.style.backgroundPosition = geometry.position;
			wallpaperEl.style.transformOrigin = geometry.origin;
			wallpaperEl.style.transform = geometry.transform;
			wallpaperEl.style.filter = `brightness(${options.brightness}%)`;
			wallpaperEl.style.opacity = String(options.wallpaperOpacity / 100);

			sampleWallpaper(url);
			updateDim();
		}

		function teardownWallpaper() {
			stopVideo();
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
		 * Public shell surfaces use the selected tint and opacity. Reading
		 * protection shields content and dialogs while the base and sidebar
		 * retain the chosen transparency.
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
			const filter = material.filter ? `blur(var(--preview-blur,${material.blur}px)) saturate(${material.saturate}%)` : "none";
			// Only a plugin-owned, childless decoration gets a new filter.
			// Host surfaces retain their existing filter placement via the token API.
			return `[data-liquid-glass-preview]::before{backdrop-filter:${filter};-webkit-backdrop-filter:${filter};}`;
		}
		function glassCss(material) {
			const tint = TINTS[material.tint];
			return [
				"/* dsh-liquid-glass: no host DOM selectors or ancestor filters */",
				"[data-liquid-glass-preview]{position:relative;isolation:isolate;border-radius:12px;padding:18px;}",
				`[data-liquid-glass-preview]::before{content:"";position:absolute;inset:0;z-index:-1;pointer-events:none;border-radius:inherit;background:var(--preview-light,${toRgba(tint.light, material.alpha)});border:1px solid rgba(255,255,255,0.65);box-shadow:inset 0 1px 0 rgba(255,255,255,0.8);}`,
				`body[data-ds-dark-theme] [data-liquid-glass-preview]::before{background:var(--preview-dark,${toRgba(tint.dark, material.alpha)});border-color:rgba(255,255,255,0.18);box-shadow:inset 0 1px 0 rgba(255,255,255,0.28);}`,
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
			if (!readGlassSurfaces()) {
				// Open just the host canvas so the background remains visible.
				if (!prefersOpaque && (currentWallpaperUrl() || currentVideoSelection())) {
					glassDispose = ctx.theme.overrideTokens("dsh-liquid-glass:wallpaper-canvas", {
						"--dsw-alias-bg-base": { light: "transparent", dark: "transparent" }
					});
				}
				return;
			}
			const material = appearance();
			const { alpha } = material;
			const contentAlpha = material.autoDim ? Math.max(0.94, alpha) : alpha;
			const tint = TINTS[material.tint];
			const filter = material.filter ? `blur(${material.blur}px) saturate(${material.saturate}%)` : "none";
			// These are existing host material tokens, not inferred DOM classes.
			materialDispose = ctx.theme.overrideTokens(MATERIAL_SOURCE, {
				"--dsw-menu-backdrop-filter": { light: filter, dark: filter },
				"--dsw-menu-surface-fill": { light: toRgba(tint.light, Math.max(0.55, contentAlpha)), dark: toRgba(tint.dark, Math.max(0.55, contentAlpha)) },
				"--dsw-specific-menu": { light: toRgba(tint.light, Math.max(0.55, contentAlpha)), dark: toRgba(tint.dark, Math.max(0.55, contentAlpha)) }
			});
			const overrides = {};
			for (const key of GLASS_TOKENS) {
				const surfaceAlpha = key === "--dsw-alias-bg-base" || key === "--dsw-specific-sidebar-fill" ? alpha
					: material.autoDim && (key === "--dsw-alias-bg-layer-2" || key === "--dsw-alias-bg-overlay") ? 1 : contentAlpha;
				overrides[key] = {
					light: toRgba(tint.light, surfaceAlpha),
					dark: toRgba(tint.dark, surfaceAlpha)
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
					glassSurfaces: true,
					presetUi: { trial: null, canUndo: false, error: null },
					recentWallpapers: [],
					composingWallpaper: false,
					alpha: DEFAULT_ALPHA,
					wallpaper: null,
					options: DEFAULT_OPTIONS,
					accessibility: false,
					settingsError: false,
					shortcutStatus: "unavailable",
					video: null,
					rotation: null,
					revision: -1
				}),
				actions: {
					sync: (d, on, alpha, wallpaper, revision, options, accessibility, settingsError, shortcutStatus, video, rotation, glassSurfaces, presetUi, recentWallpapers, composingWallpaper) => {
						if (revision <= d.revision) return;
						d.on = on;
						d.glassSurfaces = glassSurfaces;
						d.presetUi = presetUi;
						d.recentWallpapers = recentWallpapers;
						d.composingWallpaper = composingWallpaper;
						d.alpha = alpha;
						d.wallpaper = wallpaper;
						d.revision = revision;
						d.options = options;
						d.accessibility = accessibility;
						d.settingsError = settingsError;
						d.shortcutStatus = shortcutStatus;
						d.video = video;
						d.rotation = rotation;
					}
				}
			});
		}
		//#endregion

		//#region settings presentation
		// DeveloperToolsRow layout from host 0.2.2-rc.2. The host exports atoms,
		// not its setting row or a slider. Never depend on private hashed classes.
		const backgroundOverlayCss = `
			.dsh-background-overlay {
				position: absolute;
				inset: 0;
				display: flex;
				align-items: center;
				justify-content: center;
				gap: 12px;
				background: rgba(0, 0, 0, .24);
				opacity: 0;
				pointer-events: none;
				transition: opacity .15s;
			}
			:is([data-background-upload], [data-background-tile]):is(:hover, :has(:focus-visible)) .dsh-background-overlay { opacity: 1; }
			:is([data-background-upload], [data-background-tile]):is(:hover, :has(:focus-visible)) .dsh-background-overlay button { pointer-events: auto; }
			@media (hover: none) {
				.dsh-background-overlay { opacity: 1; }
				.dsh-background-overlay button { pointer-events: auto; }
			}
			@media (prefers-reduced-motion: reduce) { .dsh-background-overlay { transition: none; } }
		`;
		const CARD_COLUMNS = 3;
		const CARD_GAP = 12;
		const cardFrame = { height: "128px", minWidth: 0, boxSizing: "border-box", borderRadius: "12px" };
		const DISCLOSURE_MARKER = 8;
		const DISCLOSURE_GAP = 4;
		const disclosureCss = `
			.dsh-liquid-disclosure {
				display: flex;
				align-items: center;
				justify-content: flex-start;
				gap: ${DISCLOSURE_GAP}px;
				list-style: none;
				cursor: pointer;
			}
			summary.dsh-liquid-disclosure::-webkit-details-marker { display: none; }
			.dsh-liquid-disclosure::before {
				content: "";
				flex: 0 0 ${DISCLOSURE_MARKER}px;
				block-size: ${DISCLOSURE_MARKER}px;
				background: var(--dsw-alias-label-secondary);
				clip-path: polygon(0 0, 100% 50%, 0 100%);
			}
			.dsh-liquid-disclosure:dir(rtl)::before { transform: rotate(180deg); }
			details[open] > .dsh-liquid-disclosure::before,
			.dsh-liquid-disclosure[aria-expanded="true"]::before { transform: rotate(90deg); }
		`;
		const styles = {
			group: { borderBottom: "0.5px solid var(--dsw-alias-border-l2)", padding: "16px 0" },
			headerRow: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: "24px" },
			title: { color: "var(--dsw-alias-label-primary)", fontSize: "14px", fontWeight: 400, lineHeight: "20px" },
			subtitle: { color: "var(--dsw-alias-label-secondary)", marginTop: "4px", fontSize: "12px", lineHeight: "18px" },
			hint: { color: "var(--dsw-alias-label-secondary)", fontSize: "12px", lineHeight: "18px" },
			sectionLabel: { color: "var(--dsw-alias-label-primary)", fontSize: "14px", lineHeight: "20px" },
			row: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" },
			stack: { display: "flex", flexDirection: "column", gap: "16px", minWidth: 0 },
			panel: { display: "flex", flexDirection: "column", gap: "16px", paddingTop: "20px" },
			sliderRow: { display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" },
			sliderLabel: { color: "var(--dsw-alias-label-primary)", fontSize: "14px", lineHeight: "20px" },
			slider: { flex: "1 1 120px", minWidth: 0, accentColor: "var(--dsw-alias-brand-primary)" },
			sliderValue: { color: "var(--dsw-alias-label-secondary)", fontSize: "12px", width: "40px", textAlign: "right" },
			previewWrap: { borderRadius: "var(--dsw-radius-md)", overflow: "hidden", border: "0.5px solid var(--dsw-alias-border-l2)", width: "140px", aspectRatio: "16 / 9", background: "var(--dsw-alias-bg-layer-1)", flexShrink: 0 },
			previewImage: { width: "100%", height: "100%", backgroundSize: "cover", backgroundPosition: "center", backgroundRepeat: "no-repeat" },
			buttonColumn: { display: "flex", flexDirection: "column", gap: "8px" },
			dirtyHint: { color: "var(--dsw-alias-label-secondary)", fontSize: "12px", lineHeight: "18px" },
			backgroundTile: { ...cardFrame, position: "relative", width: `calc((100% - ${(CARD_COLUMNS - 1) * CARD_GAP}px) / ${CARD_COLUMNS})`, flexShrink: 0, overflow: "hidden", background: "var(--dsw-alias-bg-layer-1)" },
			backgroundMedia: { display: "block", width: "100%", height: "100%", objectFit: "cover" },
			backgroundIcon: { background: "transparent", border: 0, boxShadow: "none", filter: "drop-shadow(0 1px 2px rgba(0,0,0,.65))", width: "32px", height: "32px", minWidth: 0, padding: 0 },
		};

		function Slider({ label, value, min, max, step, format, onChange }) {
			return (0, jsx.jsxs)("div", {
				style: styles.sliderRow,
				children: [
					(0, jsx.jsx)("span", { style: styles.sliderLabel, children: label }),
					(0, jsx.jsx)("input", { type: "range", "aria-label": label, min, max, step, value, style: styles.slider, onChange: (e) => onChange(Number(e.target.value)) }),
					(0, jsx.jsx)("span", { style: styles.sliderValue, children: format(value) })
				]
			});
		}
		//#endregion

		//#region component
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

		/** Both image and video drafts preview immediately and commit only on Save. */
		function WallpaperSection({ url, onApply, onVideo, video, previewBackground, setVideoPaused, rotationControls, t }) {
			const [draft, setDraft] = _react.useState(undefined);
			const [thumb, setThumb] = _react.useState(null);
			const [error, setError] = _react.useState("");
			const [busy, setBusy] = _react.useState(false);
			const [leaving, setLeaving] = _react.useState(false);
			const rootRef = _react.useRef(null);
			const fileRef = _react.useRef(null);
			const intent = _react.useRef(null);
			const bypass = _react.useRef(false);
			const pending = _react.useRef(0);
			const dirty = draft !== undefined;
			const selected = draft ?? (video?.meta ? { kind: "video", meta: video.meta } : { kind: "image", url });
			const hasMedia = selected.kind === "video" || !!selected.url;
			const isVideo = selected.kind === "video";
			const inGallery = !dirty && rotationControls?.rotation.items.some(item => isVideo
				? item.kind === "video" && item.id === selected.meta.id
				: item.kind === "image" && item.url === selected.url);
			_react.useEffect(() => {
				setDraft(undefined); setError("");
			}, [url, video?.meta?.id]);
			_react.useEffect(() => {
				let disposed = false, objectUrl;
				if (selected.kind === "image") setThumb(selected.url);
				else {
					setThumb(null);
					Promise.resolve(selected.file || mediaRecord("get", selected.meta.id)).then(file => {
						if (disposed || !file) return;
						objectUrl = window.URL.createObjectURL(file); setThumb(objectUrl);
					}).catch(() => { if (!disposed) setError(t("video.storage")); });
				}
				return () => { disposed = true; if (objectUrl) window.URL.revokeObjectURL(objectUrl); };
			}, [selected.kind, selected.url, selected.file, selected.meta?.id]);
			_react.useEffect(() => () => { pending.current++; previewBackground?.(null); }, []);
			const stage = selection => {
				setDraft(selection); setError(""); previewBackground?.(selection);
			};
			const choose = async file => {
				if (!file || busy) return;
				const revision = ++pending.current;
				setError(""); setBusy(true);
				if (/^video\//.test(file.type) || /\.(mp4|webm)$/i.test(file.name || "")) {
					try { await validateVideo(file); if (revision === pending.current) stage({ kind: "video", file, meta: { id: window.crypto.randomUUID(), name: file.name } }); }
					catch (e) { if (revision === pending.current) setError(t(["video.format", "video.size", "video.decode", "video.storage"].includes(e.message) ? e.message : "video.decode")); }
					finally { if (revision === pending.current) setBusy(false); }
				} else pickImageFile(file,
					value => { if (revision === pending.current) { stage({ kind: "image", url: value }); setBusy(false); } },
					key => { if (revision === pending.current) { setError(t(key)); setBusy(false); } });
			};
			const save = async () => {
				if (!dirty || busy) return false;
				if (draft.kind === "image" && /^data:image\/gif[;,]/i.test(draft.url || "") && !wallpaperFitsStorage(draft.url)) { setError(t("wallpaper.tooLarge")); return false; }
				setBusy(true); setError("");
				try {
					const ok = draft.kind === "video" ? await onVideo(draft.file) : onApply(draft.url);
					if (ok === false) { setError(t("wallpaper.saveFailed")); return false; }
					previewBackground?.(null); setDraft(undefined); return true;
				} finally { setBusy(false); }
			};
			const discard = () => { pending.current++; previewBackground?.(null); setDraft(undefined); setError(""); setBusy(false); };
			const proceed = () => {
				const action = intent.current; intent.current = null; setLeaving(false);
				bypass.current = true;
				try { action?.(); } finally { bypass.current = false; }
			};
			// Host 0.2.2 has no public leave guard. Keep this adapter confined to
			// semantic settings chrome (dialog/nav/header), never hashed CSS classes.
			_react.useEffect(() => {
				if (!dirty && !busy) return;
				const ask = (event, action) => {
					event.preventDefault(); event.stopImmediatePropagation();
					intent.current = action; setLeaving(true);
				};
				const closeControl = panel => panel?.querySelector(':scope > div > button:last-child');
				const click = event => {
					if (bypass.current || leaving) return;
					const panel = rootRef.current?.closest('[data-shortcut-modal="settings"]');
					if (!panel || !event.target?.closest) return;
					const button = event.target.closest('button');
					const nav = button && panel.querySelector('nav')?.contains(button);
					const close = button && button === closeControl(panel);
					const collapse = button?.hasAttribute('data-liquid-glass-disclosure');
					const mask = event.target.parentElement === panel.parentElement && event.target.getAttribute('aria-hidden') === 'true';
					if (nav || close || collapse || mask) ask(event, () => (button || event.target).click());
				};
				const key = event => {
					if (bypass.current || leaving || event.key !== 'Escape' || document.querySelector('[role="menu"]')) return;
					const panel = rootRef.current?.closest('[data-shortcut-modal="settings"]');
					if (panel) ask(event, () => closeControl(panel)?.click());
				};
				const unload = event => { event.preventDefault(); event.returnValue = ""; };
				window.addEventListener?.('click', click, true); window.addEventListener?.('keydown', key, true); window.addEventListener?.('beforeunload', unload);
				return () => { window.removeEventListener?.('click', click, true); window.removeEventListener?.('keydown', key, true); window.removeEventListener?.('beforeunload', unload); };
			}, [dirty, busy, leaving]);
			const iconButton = (label, icon, onClick, danger = false, disabled = false) => h(UI.Button, { type: "button", size: "sm", variant: "ghost", disabled: busy || disabled, "aria-label": t(label), title: t(label), onClick,
				style: { ...styles.backgroundIcon, color: danger ? "#ff6b6b" : "white" }, icon: h(icon, { size: 18 }) });
			const toggleVideo = () => setVideoPaused(video?.status === "playing");
			const videoLabel = video?.still ? "video.stillHint" : video?.reducedMotion ? "video.reduced" : video?.status === "playing" ? "video.pause" : "video.play";
			const currentCard = !inGallery && (hasMedia || !rotationControls) && h("div", {
				key: "current", "data-background-upload": "", style: { ...styles.backgroundTile, border: "1px dashed var(--dsw-alias-border-l2)" },
						onDragOver: e => { e.preventDefault(); if (e.dataTransfer) e.dataTransfer.dropEffect = "copy"; }, onDrop: e => { e.preventDefault(); void choose(e.dataTransfer.files?.[0]); }, children: [
						!hasMedia && h(UI.Button, { type: "button", variant: "ghost", disabled: busy, onClick: () => fileRef.current?.click(), "aria-label": t("wallpaper.choose"), style: { width: "100%", height: "100%", flexDirection: "column", gap: "8px", background: "transparent" }, children: [h(UI.IconPlusOutlineRegular, { size: 24 }), h("span", { children: t(busy ? "wallpaper.checking" : "wallpaper.upload") })] }),
						hasMedia && (isVideo ? h("video", { src: thumb || undefined, muted: true, playsInline: true, preload: "metadata", "aria-label": t("wallpaper.videoPreview"), style: styles.backgroundMedia }) : h("img", { src: thumb || undefined, alt: t("wallpaper.imagePreview"), style: styles.backgroundMedia })),
						hasMedia && h("div", { className: "dsh-background-overlay", children: [
							iconButton("wallpaper.replace", UI.IconRefreshOutlineRegular, () => fileRef.current?.click()),
							iconButton("wallpaper.remove", UI.IconTrashOutlineRegular, () => stage({ kind: "image", url: null }), true)] }),
						hasMedia && isVideo && h("div", { style: { position: "absolute", left: "8px", bottom: "8px" }, children: iconButton(videoLabel, video?.status === "playing" ? UI.IconPauseOutlineRegular : UI.IconPlayOutlineRegular, toggleVideo, false, video?.reducedMotion || video?.still) }),
						busy && h("div", { role: "status", style: { position: "absolute", bottom: 0, background: "rgba(0,0,0,.7)", color: "white", width: "100%", textAlign: "center", fontSize: "12px" }, children: t("wallpaper.checking") })] });
			return h("div", { ref: rootRef, "data-background-editor": "", style: styles.stack, children: [
				rotationControls ? h(RotationSection, { ...rotationControls, editorLocked: dirty || busy, onVideoFile: choose, t, children: currentCard }) : currentCard,
				h("div", { style: { display: "flex", alignItems: "center", flexWrap: "wrap", gap: "8px" }, children: [
					inGallery && isVideo && h(UI.Button, { size: "sm", variant: "ghost", disabled: busy || video?.reducedMotion || video?.still, onClick: toggleVideo, children: t(videoLabel) }),
					dirty && h(UI.Button, { variant: "primary", size: "sm", disabled: busy, onClick: save, children: t("wallpaper.save") })] }),
				h("input", { type: "file", ref: fileRef, style: { display: "none" }, disabled: busy, accept: "image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm", onChange: e => { void choose(e.target.files?.[0]); e.target.value = ""; } }),
				error && h("div", { role: "alert", style: styles.dirtyHint, children: error }),
				h(UI.Modal, { open: leaving, title: t("wallpaper.leaveTitle"), description: t("wallpaper.leaveDescription"), closeLabel: t("wallpaper.keepEditing"), onClose: () => { intent.current = null; setLeaving(false); }, footer: [
					h(UI.Button, { disabled: busy, onClick: () => { intent.current = null; setLeaving(false); }, children: t("wallpaper.keepEditing") }),
					h(UI.Button, { disabled: busy, onClick: () => { discard(); proceed(); }, children: t("wallpaper.discard") }),
					h(UI.Button, { variant: "primary", disabled: busy || !dirty, onClick: async () => { if (await save()) proceed(); }, children: t("wallpaper.saveLeave") })], children: error && h("div", { role: "alert", children: error }) })] });
		}

		const h = jsx.jsxs;
		function Choices({ label, value, values, onChange, t, prefix }) {
			const [open, setOpen] = _react.useState(false);
			return h("div", { style: styles.row, children: [
				h("span", { style: styles.sectionLabel, children: label }),
				h(UI.Menu, { open, onClose: () => setOpen(false), portal: true, autoFocus: true, align: "end",
					selectedId: value, items: values.map(v => ({ id: v, label: t(`${prefix}.${v}`) })),
					onSelect: v => { onChange(v); setOpen(false); },
					anchor: h(UI.Button, { "aria-label": label, "aria-haspopup": "menu", "aria-expanded": open,
						onClick: () => setOpen(!open), children: [t(`${prefix}.${value}`), h(UI.IconChevronDownOutlineRegular, { size: 12 })] }) })
			] });
		}

		function MaterialCards({ value, alpha, tint, blur, options, onChange, disabled, label }) {
			return h("div", { role: "group", "aria-label": label, style: { display: "grid", gridTemplateColumns: `repeat(${CARD_COLUMNS},minmax(0,1fr))`, gap: `${CARD_GAP}px` }, children: options.map(option => {
				const recipe = PRESETS[option.value], selected = option.value === value;
				const opacity = selected ? alpha : recipe.alpha;
				return h(UI.Button, { key: option.value, variant: "outline", disabled, "aria-pressed": selected, "aria-label": option.label,
					onClick: () => onChange(option.value), style: { ...cardFrame, display: "flex", flexDirection: "column", padding: "6px", gap: "8px", border: selected ? "2px solid var(--dsw-alias-brand-primary,#4b68ff)" : "2px solid transparent", boxShadow: "0 0 0 .5px var(--dsw-alias-border-l2)" }, children: [
					h("div", { "aria-hidden": true, style: { position: "relative", width: "100%", height: "84px", overflow: "hidden", borderRadius: "7px", background: "radial-gradient(ellipse at 25% 20%,#a8bffa,transparent 65%),radial-gradient(ellipse at 85% 90%,#d5b6cb,transparent 60%),#879cab" }, children: [
						h("div", { "data-liquid-glass-preview": "", style: { position: "absolute", inset: "10px 8px", padding: 0, borderRadius: "6px", display: "flex", overflow: "hidden", "--preview-alpha": opacity, "--preview-light": toRgba(TINTS[tint].light, opacity), "--preview-dark": toRgba(TINTS[tint].dark, opacity), "--preview-blur": `${selected ? blur : recipe.blur}px` }, children: [
							h("div", { style: { width: "24%", padding: "9px 5px", borderRight: ".5px solid var(--dsw-alias-border-l2)" }, children: [0,1,2].map(n => h("div", { key: n, style: { height: "3px", marginBottom: "5px", borderRadius: "3px", background: "var(--dsw-alias-label-secondary)", opacity: .35 } })) }),
							h("div", { style: { flex: 1, padding: "10px 8px" }, children: [
								h("div", { style: { width: "55%", height: "5px", background: "var(--dsw-alias-label-primary)", opacity: .65, borderRadius: "3px", marginBottom: "8px" } }),
								h("div", { style: { height: "15px", background: "var(--dsw-alias-label-secondary)", opacity: .15, borderRadius: "4px" } })] })] })] }),
					h("span", { style: { fontSize: "12px", lineHeight: "18px", paddingBottom: "2px" }, children: option.label })] });
			}) });
		}

		function Check(props) { return h(UI.Checkbox, props); }
		function Expander({ label, open, controls, onClick }) {
			return h(UI.Button, { variant: "ghost", size: "sm", "aria-label": label,
				"aria-expanded": open, "aria-controls": controls, "data-liquid-glass-disclosure": "", onClick,
				style: { background: "transparent", padding: 0, minWidth: "20px", width: "20px", height: "20px", position: "absolute", left: "-22px", top: 0 },
				icon: h(open ? UI.IconChevronDownOutlineRegular : UI.IconChevronRightOutlineRegular, { size: 12 }) });
		}
		function RotationVideoThumbnail({ item, t, style }) {
			const [src, setSrc] = _react.useState("");
			_react.useEffect(() => {
				let cancelled = false, url = "";
				setSrc("");
				void mediaRecord("get", item.id).then(file => {
					if (cancelled || !file) return;
					url = window.URL.createObjectURL(file);
					setSrc(url);
				}).catch(() => {});
				return () => { cancelled = true; if (url) window.URL.revokeObjectURL(url); };
			}, [item.id]);
			return src
				? h("video", { src, muted: true, playsInline: true, preload: "metadata", "aria-label": t("wallpaper.videoPreview"), style: style ?? { width: "64px", height: "40px", objectFit: "cover", borderRadius: "6px", flexShrink: 0 } })
				: h("div", { style: { width: "64px", height: "40px", borderRadius: "6px", background: "var(--dsw-alias-bg-layer-1)", alignItems: "center", justifyContent: "center", fontSize: "12px", flexShrink: 0, ...style, display: "flex" }, children: t("rotation.video") });
		}
		function RotationSection({ rotation, wallpaper, video, setRotationEnabled, setRotationOrder, setRotationTiming, addCurrentToRotation, addRotationImages, replaceRotationImage, selectRotationItem, removeRotationItem, nextRotation, editorLocked, onVideoFile, t, children: leadingCard }) {
			const [error, setError] = _react.useState("");
			const [busy, setBusy] = _react.useState(false);
			const [linkOpen, setLinkOpen] = _react.useState(false);
			const [urlText, setUrlText] = _react.useState("");
			const [linkError, setLinkError] = _react.useState("");
			const [addedLink, setAddedLink] = _react.useState("");
			const addInput = _react.useRef(null);
			const replaceInput = _react.useRef(null);
			const replacement = _react.useRef(null);
			const selection = _react.useRef(0);
			const linkProbe = _react.useRef(null);
			const addedTile = _react.useRef(null);
			const linkFormId = _react.useId();
			_react.useEffect(() => () => { selection.current++; linkProbe.current?.(); }, []);
			_react.useEffect(() => {
				if (!addedLink || !addedTile.current) return;
				addedTile.current.scrollIntoView({ block: "nearest", inline: "nearest" });
				addedTile.current.firstElementChild?.focus({ preventScroll: true });
				setAddedLink("");
			}, [addedLink, rotation?.items.length]);
			if (!rotation) return null;
			const count = rotation.items.length;
			const remaining = Math.max(0, MAX_ROTATION_ITEMS - count);
			const atLimit = remaining === 0;
			const disabled = busy || editorLocked;
			const hasBackground = !!(video?.meta || wallpaper);
			const isCurrent = item => item.kind === "video" ? item.id === video?.meta?.id : item.url === wallpaper;
			const canAddCurrent = hasBackground && !atLimit && !rotation.items.some(isCurrent);
			const report = result => setError(result === true ? "" : t(`rotation.${typeof result === "string" ? result : "saveFailed"}`));
			const addLink = event => {
				event.preventDefault();
				if (disabled || atLimit || linkProbe.current) return;
				const link = remoteWallpaperUrl(urlText.trim());
				if (!link) { setLinkError("wallpaper.invalidUrl"); return; }
				if (remoteWallpaperUrl(wallpaper) === link || rotation.items.some(item => item.kind === "image" && remoteWallpaperUrl(item.url) === link)) {
					setLinkError("rotation.duplicate");
					return;
				}
				setBusy(true);
				setLinkError("");
				const image = new Image();
				const cleanup = () => { clearTimeout(timer); image.onload = image.onerror = null; linkProbe.current = null; };
				const fail = () => { cleanup(); setLinkError("wallpaper.badUrl"); setBusy(false); };
				const timer = setTimeout(fail, 15000);
				linkProbe.current = cleanup;
				image.onload = () => {
					cleanup();
					const result = addRotationImages([link], { source: "link" });
					setBusy(false);
					if (result !== true) {
						setLinkError("rotation." + (typeof result === "string" ? result : "saveFailed"));
						return;
					}
					setAddedLink(link);
					setUrlText("");
					setLinkOpen(false);
				};
				image.onerror = fail;
				image.src = link;
			};
			const readFiles = async (files, id) => {
				if (disabled || linkProbe.current || (!id && atLimit) || files.length === 0) return;
				if (!id && files.length === 1 && (/^video\//.test(files[0].type) || /\.(mp4|webm)$/i.test(files[0].name || ""))) {
					await onVideoFile(files[0]);
					return;
				}
				if (files.length > MAX_ROTATION_ITEMS) { report("limit"); return; }
				const revision = ++selection.current;
				setBusy(true);
				setError("");
				try {
					const urls = await Promise.all(files.map(file => new Promise((resolve, reject) => pickImageFile(file, resolve, reject))));
					if (revision !== selection.current) return;
					report(id ? replaceRotationImage(id, urls[0]) : addRotationImages(urls));
				} catch (key) {
					if (revision === selection.current) setError(t(typeof key === "string" ? key : "wallpaper.badFile"));
				} finally {
					if (revision === selection.current) setBusy(false);
				}
			};
			const pickFiles = (event, id) => {
				const files = Array.from(event.target.files || []);
				event.target.value = "";
				void readFiles(files, id);
			};
			const fillButton = { padding: 0, width: "100%", height: "100%", minWidth: 0, background: "transparent", border: 0, borderRadius: "inherit" };
			return h("div", { style: styles.stack, "data-liquid-glass-wallpapers": "", children: [
				h("input", { type: "file", multiple: true, ref: addInput, hidden: true, accept: "image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm", "aria-label": t("rotation.addImages"), onChange: event => pickFiles(event, null) }),
				h("input", { type: "file", ref: replaceInput, hidden: true, accept: "image/jpeg,image/png,image/webp,image/gif", "aria-label": t("rotation.replace"), onChange: event => pickFiles(event, replacement.current) }),
				h("div", { "data-liquid-glass-wallpaper-strip": "", tabIndex: 0,
					style: { display: "flex", flexWrap: "nowrap", minWidth: 0, maxWidth: "100%", overflowX: "auto", gap: `${CARD_GAP}px`, padding: "2px 0" },
					children: [
						...(leadingCard ? [leadingCard] : []),
						...rotation.items.map((item, index) => h("div", { key: item.id, ref: addedLink && item.url === addedLink ? addedTile : undefined, "data-background-tile": "", style: { ...styles.backgroundTile, border: isCurrent(item) ? "2px solid var(--dsw-alias-brand-primary)" : "1px solid var(--dsw-alias-border-l2)" }, children: [
							h(UI.Button, { variant: "ghost", style: fillButton, disabled, "aria-label": `${t("rotation.select")} ${index + 1}`, "aria-pressed": isCurrent(item), onClick: () => report(selectRotationItem(item.id)), children: item.kind === "image"
								? h("img", { src: item.url, alt: "", style: styles.backgroundMedia })
								: h(RotationVideoThumbnail, { item, t, style: styles.backgroundMedia }) }),
							h("div", { className: "dsh-background-overlay", children: [
								item.kind === "image" && h(UI.Button, { type: "button", size: "sm", variant: "ghost", disabled, "aria-label": `${t("rotation.replace")} ${index + 1}`, title: t("rotation.replace"),
									onClick: () => { replacement.current = item.id; replaceInput.current?.click(); }, style: { ...styles.backgroundIcon, color: "white" }, icon: h(UI.IconRefreshOutlineRegular, { size: 18 }) }),
								h(UI.Button, { type: "button", size: "sm", variant: "ghost", disabled, "aria-label": `${t("rotation.remove")} ${index + 1}`, title: t("rotation.remove"),
									onClick: () => report(removeRotationItem(item.id, { clearBackground: true })), style: { ...styles.backgroundIcon, color: "#ff6b6b" }, icon: h(UI.IconTrashOutlineRegular, { size: 18 }) })
							] })
						] })),
						...(!atLimit ? [h("div", { key: "upload", "data-background-add": "", style: { ...styles.backgroundTile, border: "1px dashed var(--dsw-alias-border-l2)" },
							onDragOver: event => event.preventDefault(),
							onDrop: event => { event.preventDefault(); void readFiles(Array.from(event.dataTransfer.files || []), null); },
							children: h(UI.Button, { type: "button", variant: "ghost", disabled, "aria-label": t("rotation.addImages"), title: t("wallpaper.choose"),
								onClick: () => addInput.current?.click(), style: { ...fillButton, flexDirection: "column", gap: "8px" },
								children: [h(UI.IconPlusOutlineRegular, { size: 24 }), h("span", { children: t("rotation.addImages") })] }) })] : [])
					] }),
				h("div", { style: { display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }, "data-background-link-row": "", children: [
					h("span", { role: "status", style: { ...styles.hint, fontVariantNumeric: "tabular-nums" }, children: [
						t("rotation.added") + " ",
						h("span", { style: { color: "var(--dsw-alias-label-primary)", fontWeight: 600 }, children: count }),
						`/${MAX_ROTATION_ITEMS} · `,
						atLimit ? t("rotation.capacityFull") : t("rotation.remaining").replace("{count}", remaining)
					] }),
					h(UI.Button, { type: "button", size: "sm", variant: "ghost", disabled: disabled || atLimit, "aria-label": t("wallpaper.link"),
						"aria-expanded": !atLimit && linkOpen, "aria-controls": !atLimit && linkOpen ? linkFormId : undefined,
						onClick: () => setLinkOpen(!linkOpen), children: t("wallpaper.link") }),
					canAddCurrent && h(UI.Button, { size: "sm", disabled, onClick: () => report(addCurrentToRotation()), children: t("rotation.addCurrent") })
				] }),
				!atLimit && linkOpen && h("form", { id: linkFormId, "data-background-link-form": "", noValidate: true, onSubmit: addLink, children: [
					h("div", { style: { display: "flex", alignItems: "center", gap: "8px" }, children: [
						h("div", { style: { minWidth: 0, flex: 1 }, children: h(UI.Input, {
							autoFocus: true, type: "url", value: urlText, disabled, "aria-label": t("wallpaper.urlPlaceholder"),
							"aria-invalid": !!linkError, "aria-describedby": linkError ? linkFormId + "-error" : undefined, placeholder: t("wallpaper.urlPlaceholder"),
							onChange: event => { setUrlText(event.target.value); setLinkError(""); }
						}) }),
						h(UI.Button, { type: "submit", size: "sm", variant: "primary", disabled: disabled || !urlText.trim(), children: t("wallpaper.addLink") })
					] }),
					linkError && h("div", { id: linkFormId + "-error", role: "alert", style: styles.dirtyHint, children: t(linkError) })
				] }),
				rotation.items.length > 1 && h("details", { children: [
					h("summary", { className: "dsh-liquid-disclosure", style: styles.hint, children: t("rotation.settings") }),
					h("div", { style: styles.stack, children: [
						h(Check, { label: t("rotation.enable"), checked: rotation.enabled, onChange: value => report(setRotationEnabled(value)) }),
						rotation.enabled && h(Choices, { label: t("rotation.order"), value: rotation.order, values: ROTATION_ORDERS, onChange: value => report(setRotationOrder(value)), t, prefix: "rotation" }),
						rotation.enabled && h(Choices, { label: t("rotation.timing"), value: rotation.timing, values: ROTATION_TIMINGS, onChange: value => report(setRotationTiming(value)), t, prefix: "rotation" }),
						rotation.enabled && h(UI.Button, { size: "sm", disabled, onClick: () => report(nextRotation()), children: t("rotation.next") })
					] })
				] }),
				busy && h("div", { role: "status", style: styles.hint, children: t("wallpaper.checking") }),
				error && h("div", { role: "alert", style: styles.dirtyHint, children: error })
			] });
		}

		function RecentWallpapers({ items, restore, remove, t }) {
			const [error, setError] = _react.useState(false);
			if (!items.length) return null;
			return h("details", { children: [
				h("summary", { className: "dsh-liquid-disclosure", style: styles.hint, children: t("wallpaper.recent") }),
				h("div", { style: { display: "flex", overflowX: "auto", gap: "8px", padding: "4px 2px" }, children: items.map((item, index) => h("div", {
					key: item.id, style: { ...styles.stack, gap: "4px", flexShrink: 0 }, children: [
						h(UI.Button, { size: "sm", variant: "ghost", "aria-label": t("wallpaper.recentUse") + " " + (index + 1),
							onClick: () => setError(!restore(item.id)), children: h("img", { src: item.url, alt: "", loading: "lazy",
								style: { width: "64px", height: "40px", objectFit: "cover", borderRadius: "6px" } }) }),
						h(UI.Button, { size: "sm", variant: "ghost", "aria-label": t("wallpaper.recentRemove") + " " + (index + 1),
							onClick: async () => setError(!await remove(item.id)), icon: h(UI.IconTrashOutlineRegular, { size: 14 }) })
					]
				})) }),
				error && h("div", { role: "alert", style: styles.hint, children: t("wallpaper.saveFailed") })
			] });
		}
		function WallpaperCompositionEditor({ wallpaper, video, options, composing, preview, save, cancel, t }) {
			const [open, setOpen] = _react.useState(false);
			const frame = _react.useRef(null);
			const drag = _react.useRef(null);
			const wheel = _react.useRef(null);
			const geometry = placement(options);
			const mediaStyle = { width: "100%", height: "100%", objectFit: options.fit, objectPosition: geometry.position,
				transform: geometry.transform, transformOrigin: geometry.origin, pointerEvents: "none" };
			wheel.current = event => {
				event.preventDefault();
				preview({ zoom: options.zoom + (event.deltaY < 0 ? 5 : -5) });
			};
			_react.useEffect(() => {
				if (!open || !frame.current) return;
				const target = frame.current;
				const scroll = event => wheel.current(event);
				target.addEventListener("wheel", scroll, { passive: false });
				return () => target.removeEventListener("wheel", scroll);
			}, [open]);
			_react.useEffect(() => () => { cancel(); }, [cancel]);
			const dragStart = event => {
				if (event.button !== 0 || drag.current) return;
				const rect = event.currentTarget.getBoundingClientRect();
				drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY, panX: geometry.x, panY: geometry.y, width: rect.width, height: rect.height };
				event.currentTarget.setPointerCapture?.(event.pointerId);
			};
			const dragMove = event => {
				const start = drag.current;
				if (!start || start.id !== event.pointerId || !start.width || !start.height) return;
				preview({
					panX: start.panX - (event.clientX - start.x) * 100 / start.width,
					panY: start.panY - (event.clientY - start.y) * 100 / start.height
				});
			};
			const dragEnd = () => { drag.current = null; };
			return h("details", { onToggle: event => { setOpen(event.currentTarget.open); if (!event.currentTarget.open) cancel(); }, children: [
				h("summary", { className: "dsh-liquid-disclosure", style: styles.hint, children: t("wallpaper.compose") }),
				open && h("div", { style: styles.stack, children: [
					h("div", { ref: frame, "data-liquid-glass-compose-preview": "", style: { position: "relative", maxWidth: "360px", height: "132px", overflow: "hidden",
						borderRadius: "8px", touchAction: "none", cursor: "grab", background: "var(--dsw-alias-bg-layer-1)" },
						onPointerDown: dragStart, onPointerMove: dragMove, onPointerUp: dragEnd, onLostPointerCapture: dragEnd, onPointerCancel: dragEnd,
						children: wallpaper
							? h("img", { src: wallpaper, alt: "", draggable: false, style: mediaStyle })
							: h(RotationVideoThumbnail, { item: video, t, style: mediaStyle }) }),
					h("div", { style: styles.hint, children: t("wallpaper.dragHint") }),
					...[["panX", geometry.x, 0, 100], ["panY", geometry.y, 0, 100], ["zoom", options.zoom, 100, 250]].map(([key, value, min, max]) => h(Slider, {
						key, label: t("wallpaper." + key), value, min, max, step: 1, format: v => v + "%", onChange: v => preview({ [key]: v })
					})),
					composing && h("div", { style: styles.row, children: [
						h(UI.Button, { size: "sm", onClick: cancel, children: t("wallpaper.cancelComposition") }),
						h(UI.Button, { size: "sm", variant: "primary", onClick: save, children: t("wallpaper.applyComposition") })
					] })
				] })
			] });
		}

		function DiagnosticsPanel({ getDiagnostics, t }) {
			const [showReport, setShowReport] = _react.useState(false);
			const [status, setStatus] = _react.useState("");
			const report = getDiagnostics();
			const reportText = () => JSON.stringify(getDiagnostics(), null, 2);
			const copy = async () => {
				try {
					await window.navigator.clipboard.writeText(reportText());
					setStatus("diagnostics.copied");
				} catch {
					setShowReport(true);
					setStatus("diagnostics.copyFailed");
				}
			};
			const statusText = available => t(available ? "diagnostics.ready" : "diagnostics.unavailable");
			return h("details", { children: [
				h("summary", { style: styles.hint, children: t("diagnostics.title") }),
				h("dl", { style: { ...styles.hint, display: "grid", gridTemplateColumns: "minmax(0, 1fr) max-content", gap: "6px 12px" }, children: [
					h("dt", { children: t("diagnostics.verified") }),
					h("dd", { style: { margin: 0 }, children: report.validation.dshVersion + " (Web)" }),
					h("dt", { children: t("diagnostics.date") }),
					h("dd", { style: { margin: 0 }, children: report.validation.checkedOn }),
					h("dt", { children: t("diagnostics.settings") }),
					h("dd", { style: { margin: 0 }, children: statusText(report.hooks.settingsMounted) }),
					h("dt", { children: t("diagnostics.theme") }),
					h("dd", { style: { margin: 0 }, children: statusText(report.hooks.themeInterface) }),
					h("dt", { children: t("diagnostics.shortcuts") }),
					h("dd", { style: { margin: 0 }, children: statusText(report.hooks.shortcutStatus !== "unavailable") })
				] }),
				h("p", { style: styles.hint, children: t("diagnostics.currentHint") }),
				h("div", { style: styles.row, children: [
					h(UI.Button, { size: "sm", onClick: copy, children: t("diagnostics.copy") }),
					h(UI.Button, { size: "sm", variant: "ghost", "aria-expanded": showReport, onClick: () => setShowReport(!showReport), children: t("diagnostics.show") })
				] }),
				status && h("p", { role: "status", style: styles.hint, children: t(status) }),
				showReport && h("textarea", { readOnly: true, rows: 8, value: reportText(), "aria-label": t("diagnostics.report"),
					style: { width: "100%", marginTop: "8px", fontFamily: "monospace", resize: "vertical" } })
			] });
		}

		function GlassRow({ t, useStore, setGlass, setAlpha, setWallpaper, setOption, setPreset, resetAppearance, setVideo, setVideoPaused, previewBackground, setSeparateAppearance, setRotationEnabled, setRotationOrder, setRotationTiming, addCurrentToRotation, removeRotationItem, nextRotation, addRotationImages, replaceRotationImage, selectRotationItem, setGlassSurfaces, restoreNativeAppearance, readContentContrast, previewPreset: previewPresetChoice, cancelPresetPreview, applyPresetPreview, undoPreset, previewWallpaperComposition, cancelWallpaperComposition, saveWallpaperComposition, restoreRecentWallpaper, removeRecentWallpaper, getDiagnostics }) {
			const on = useStore(s => s.on);
			const glassSurfaces = useStore(s => s.glassSurfaces);
			const presetUi = useStore(s => s.presetUi);
			_react.useEffect(() => () => { cancelPresetPreview(); }, [cancelPresetPreview]);
			const alpha = useStore(s => s.alpha);
			const wallpaper = useStore(s => s.wallpaper);
			const video = useStore(s => s.video);
			const options = useStore(s => s.options);
			const recentWallpapers = useStore(s => s.recentWallpapers);
			const composingWallpaper = useStore(s => s.composingWallpaper);
			const accessibility = useStore(s => s.accessibility);
			const settingsError = useStore(s => s.settingsError);
			const shortcutStatus = useStore(s => s.shortcutStatus);
			const rotation = useStore(s => s.rotation);
			const [open, setOpen] = _react.useState(false);
			const [advanced, setAdvanced] = _react.useState(false);
			const contrast = advanced && on && glassSurfaces && options.autoDim ? readContentContrast() : null;
			const [restoreOpen, setRestoreOpen] = _react.useState(false);
			const [restoreStatus, setRestoreStatus] = _react.useState(null);
			const restore = () => {
				setRestoreStatus(restoreNativeAppearance());
				setRestoreOpen(false);
			};

			const id = _react.useId();
			const presetId = `${id}-preset`;
			const preset = accessibility ? "frost" : options.preset;
			const adjusted = !presetUi.trial && !accessibility && Math.abs(alpha - PRESETS[preset].alpha) > 0.001;
			const choice = (label, value, values, key, prefix) => h(Choices, { label: t(label), value, values, onChange: v => setOption(key, v), t, prefix });
			const slider = (label, value, min, max, change) => h(Slider, { label: t(label), value, min, max, step: 1, format: v => `${v}%`, onChange: change });
			return h("div", { style: styles.group, "data-liquid-glass-settings": "", children: [
				h("style", { children: glassCss({ ...options, alpha }) + backgroundOverlayCss + disclosureCss }),
				h("div", { style: styles.headerRow, children: [
					h("div", { style: { position: "relative", minWidth: 0, flex: 1 }, children: [
						h(Expander, { label: t("row.configure"), open, controls: `${id}-panel`, onClick: () => { if (open) cancelPresetPreview(); setOpen(!open); } }),
						h("div", { style: { minWidth: 0 }, children: [
							h("div", { style: styles.title, children: t("row.title") }),
							h("div", { style: styles.subtitle, children: t("row.description") })] })] }),
					h(UI.Switch, { checked: on, label: t("row.title"), onChange: setGlass })] }),
				settingsError && h("div", { role: "alert", style: styles.dirtyHint, children: t(presetUi.error ?? "glass.saveFailed") }),
				open && h("div", { id: `${id}-panel`, style: styles.panel, children: [
					!on && h("div", { role: "status", style: styles.hint, children: t("row.disabledHint") }),
					h("div", { style: styles.row, children: [
						h(Check, { checked: glassSurfaces, label: t("glass.surfaces"), onChange: setGlassSurfaces }),
						h(UI.Button, { size: "sm", onClick: () => { setRestoreStatus(null); setRestoreOpen(true); }, children: t("glass.restoreNative") })
					] }),
					h(UI.Modal, { open: restoreOpen, title: t("glass.restoreTitle"), description: t("glass.restoreHint"),
						closeLabel: t("glass.restoreCancel"), onClose: () => setRestoreOpen(false), footer: [
							h(UI.Button, { onClick: () => setRestoreOpen(false), children: t("glass.restoreCancel") }),
							h(UI.Button, { variant: "primary", onClick: restore, children: t("glass.restoreConfirm") })
						] }),
					restoreStatus && h("div", { role: restoreStatus.error ? "alert" : "status", style: styles.hint, children: t(restoreStatus.error ?? "glass.restored") }),
					h(MaterialCards, { id: presetId, alpha, blur: options.blur, tint: options.tint, label: t("glass.presets"), value: preset, disabled: accessibility,
						options: Object.keys(PRESETS).map(value => ({ value, label: t(`glass.${value}`) })), onChange: on && glassSurfaces ? previewPresetChoice : setPreset }),
					presetUi.trial && h("div", { style: styles.row, children: [
						h("span", { role: "status", style: styles.hint, children: [t("glass.tryingPreset"), " · ", t(`glass.${presetUi.trial}`)] }),
						h("div", { style: { display: "flex", gap: "8px" }, children: [
							h(UI.Button, { size: "sm", onClick: cancelPresetPreview, children: t("glass.cancelPreset") }),
							h(UI.Button, { size: "sm", variant: "primary", onClick: applyPresetPreview, children: t("glass.applyPreset") })
						] })
					] }),
					!presetUi.trial && presetUi.canUndo && h(UI.Button, { size: "sm", variant: "ghost", onClick: undoPreset, style: { alignSelf: "flex-start" }, children: t("glass.undoPreset") }),
					h("div", {  style: styles.stack, children: [
						!options.prefersOpaque && slider("glass.alpha", Math.round((1 - alpha) * 100), 3, accessibility ? 50 : 95, setAlpha),
						adjusted && h("div", { style: styles.hint, children: t("glass.adjusted") })] }),
					accessibility && h("div", { role: "status", style: styles.hint, children: t(options.prefersOpaque ? "glass.opaqueSystem" : "glass.accessibility") }),
					h("div", { role: "group", "aria-label": t("wallpaper.title"), style: styles.stack, children: [
						h("div", { style: styles.sectionLabel, children: t("wallpaper.title") }),
						h(WallpaperSection, { url: video?.meta ? null : wallpaper, onApply: setWallpaper, onVideo: setVideo, previewBackground, setVideoPaused, video, t,
							rotationControls: { rotation, wallpaper, video, setRotationEnabled, setRotationOrder, setRotationTiming, addCurrentToRotation,
								addRotationImages, replaceRotationImage, selectRotationItem, removeRotationItem, nextRotation } }),
						video?.error && h("div", { role: "alert", style: styles.dirtyHint, children: t(video.error) }),
						(wallpaper || video?.meta) && h(WallpaperCompositionEditor, { wallpaper: video?.meta ? null : wallpaper, video: video?.meta,
							options, composing: composingWallpaper, preview: previewWallpaperComposition, save: saveWallpaperComposition,
							cancel: cancelWallpaperComposition, t }),
						h(RecentWallpapers, { items: recentWallpapers, restore: restoreRecentWallpaper, remove: removeRecentWallpaper, t })
					] }),
					h("div", { style: styles.row, children: [
						h(UI.Button, { type: "button", size: "sm", variant: "ghost", className: "dsh-liquid-disclosure",
							"aria-expanded": advanced, "aria-controls": `${id}-advanced`, onClick: () => setAdvanced(!advanced),
							style: { ...styles.sectionLabel, padding: 0, minWidth: 0, height: "auto" }, children: t("row.advanced") }),
						h(UI.Button, { size: "sm", onClick: resetAppearance, children: t("glass.reset") })] }),
					advanced && h("div", { id: `${id}-advanced`, style: { ...styles.stack, paddingInlineStart: `${DISCLOSURE_MARKER + DISCLOSURE_GAP}px` }, children: [
						h(Check, { label: t("glass.separateAppearance"), checked: options.separateAppearance, onChange: setSeparateAppearance }),
						options.separateAppearance && h("div", { style: styles.hint, children: t(`glass.editing.${options.scheme}`) }),
						h(Check, { label: t("wallpaper.autoDim"), checked: options.autoDim, onChange: v => setOption("autoDim", v) }),
						h("div", { style: styles.hint, children: t("wallpaper.autoDimHint") }),
						options.autoDim && (wallpaper || video?.meta) && h("div", { style: styles.stack, children: [
							slider("wallpaper.readingDim", options.readingDim, 0, 100, v => setOption("readingDim", v)),
							slider("wallpaper.vignette", options.vignette, 0, 100, v => setOption("vignette", v))
						] }),
						on && glassSurfaces && options.autoDim && h("div", { style: styles.hint, children: [
							contrast === null ? t("glass.contrastUnavailable") : [
								t("glass.contrastEstimate"), " ", (Math.floor(contrast * 100) / 100).toFixed(2), "∶1. ", t("glass.contrastHint")
							]
						] }),
						video?.meta && choice("video.mode", options.videoMode, ["motion", "still"], "videoMode", "video"),
						choice("glass.tint", options.tint, Object.keys(TINTS), "tint", "glass"),
						h(Check, { label: t("glass.filter"), checked: options.filter, onChange: v => setOption("filter", v) }),
						glassSurfaces && !accessibility && options.filter && h(Slider, { label: t("glass.blur"), value: Math.round(options.blur), min: 0, max: 40, step: 1,
							format: v => `${v} px`, onChange: v => setOption("glassBlur", v) }),
						(wallpaper || video?.meta) && h("div", { style: styles.stack, children: [
							slider("wallpaper.opacity", options.wallpaperOpacity, 0, 100, v => setOption("wallpaperOpacity", v)),
							slider("wallpaper.dim", options.dim, 0, 60, v => setOption("dim", v)),
							choice("wallpaper.fit", options.fit, ["cover", "contain", "fill"], "fit", "wallpaper"),
							choice("wallpaper.position", options.position, POSITIONS, "position", "position"),
							slider("wallpaper.brightness", options.brightness, 20, 200, v => setOption("brightness", v))] }),
						shortcutStatus === "unavailable" && h("div", { style: styles.hint, children: t("glass.shortcutUnavailable") }),
						h(DiagnosticsPanel, { getDiagnostics, t })] })] })] });
		}
		//#endregion

		//#region plugin body
		const inject = ["slots", "locale", "theme"];

		let stopRuntime = null;
		function apply(ctx) {
			stopRuntime?.();
			const readScheme = () => ctx.theme.getTheme().active.colorScheme === "dark" ? "dark" : "light";
			activeScheme = readScheme();
			let active = true;
			let presetUndo = null;
			let presetError = null;
			let recentWallpapers = [];
			let settingsError = false;
			let shortcutStatus = "unavailable";
			let videoSaveError = "";
			let videoSaving = false;
			let selectionRevision = 0;
			const mediaDisposers = [];
			const shortcutDisposers = [];
			const store = createGlassStore();
			let bound;
			let revision = 0;
			const sync = () => {
				revision += 1;
				const material = appearance();
				bound?.sync(readGlassOn(), material.alpha, readWallpaper(), revision, material, accessibilityActive, settingsError, shortcutStatus, { meta: readVideo(), status: videoStatus, error: videoSaveError || videoPlaybackError, saving: videoSaving, reducedMotion, still: material.videoMode === "still" }, readRotation(), readGlassSurfaces(), { trial: previewPreset, canUndo: !!presetUndo, error: presetError }, recentWallpapers, !!previewComposition);
			};

			const queueRecent = change => {
				recentQueue = recentQueue.then(async () => {
					try {
						const record = change
							? await mediaRecord("update", RECENT_WALLPAPERS, previous => change(readRecentEntries(previous), previous !== undefined), true)
							: await mediaRecord("get", RECENT_WALLPAPERS, undefined, true);
						if (active) {
							recentWallpapers = readRecentEntries(record);
							sync();
						}
						return true;
					} catch { return false; }
				});
				return recentQueue;
			};
			const rememberWallpaper = (url, seedOnly = false) => {
				if (!isRecentImageUrl(url)) return;
				const composition = wallpaperComposition(readOptions());
				void queueRecent((items, initialized) => {
					if (seedOnly && initialized) return items;
					const existing = items.find(item => item.url === url);
					const recent = { kind: "image", id: existing?.id ?? window.crypto.randomUUID(), url, composition };
					return [recent, ...items.filter(item => item.url !== url)].slice(0, MAX_RECENT_WALLPAPERS);
				});
			};

			/** Commit one pool entry as the saved background (storage only). */
			const commitBackground = (item) => {
				if (item.kind === "image") {
					const previous = readWallpaper();
					const oldVideo = readVideo();
					if (!writeStorage(KEY_WALLPAPER, item.url)) return false;
					if (!writeStorage(KEY_VIDEO, null)) { writeStorage(KEY_WALLPAPER, previous); return false; }
					videoSaveError = ""; previewSelection = null;
					deleteVideoIfUnpooled(oldVideo?.id);
					previewComposition = null;
					rememberWallpaper(item.url);
					return true;
				}
				const previousVideo = readVideo();
				if (!writeStorage(KEY_VIDEO, JSON.stringify({ id: item.id, name: item.name }))) return false;
				if (!writeStorage(KEY_WALLPAPER, null)) {
					writeStorage(KEY_VIDEO, previousVideo ? JSON.stringify(previousVideo) : null);
					return false;
				}
				videoSaveError = ""; previewSelection = null; previewComposition = null;
				deleteVideoIfUnpooled(previousVideo?.id);
				return true;
			};
			const saveRotation = (next, pick) => {
				const rotationText = JSON.stringify(next);
				if (!storageFitsExcept(KEY_ROTATION, rotationText.length)) return "tooLarge";
				const previousRotation = readStorage(KEY_ROTATION);
				if (!writeStorage(KEY_ROTATION, rotationText)) return "saveFailed";
				if (pick && !commitBackground(pick)) {
					return writeStorage(KEY_ROTATION, previousRotation) ? "saveFailed" : "restoreFailed";
				}
				if (pick) applyWallpaper(ctx);
				sync();
				return true;
			};

			// Rotation is evaluated when the app opens. No background timer:
			// a live switch could discard an unsaved background draft, and
			// hourly/daily/time-of-day switches are all covered on next open.
			const rotateOnBoot = () => {
				if (!active) return;
				const rotation = readRotation();
				if (!rotationDue(rotation, Date.now())) return;
				const nextIndex = nextRotationIndex(rotation);
				if (nextIndex < 0) return;
				if (!commitBackground(rotation.items[nextIndex])) return;
				writeRotation({ ...rotation, index: nextIndex, lastSwitch: Date.now() });
			};

			notifyVideo = () => { if (active) sync(); };
			let motionQuery;
			try { motionQuery = window.matchMedia?.("(prefers-reduced-motion: reduce)"); } catch { /* Motion queries are optional. */ }
			reducedMotion = motionQuery?.matches === true;
			const motionChanged = () => { reducedMotion = motionQuery?.matches === true; updateVideoPlayback(); sync(); };
			motionQuery?.addEventListener?.("change", motionChanged);
			document.addEventListener?.("visibilitychange", updateVideoPlayback);
			mediaDisposers.push(() => {
				motionQuery?.removeEventListener?.("change", motionChanged);
				document.removeEventListener?.("visibilitychange", updateVideoPlayback);
			});

			const queries = ["(prefers-reduced-transparency: reduce)", "(prefers-contrast: more)"].map((query) => {
				try { return window.matchMedia?.(query); } catch { return null; }
			});
			const updateAccessibility = () => {
				if (!active) return;
				const wasOpaque = prefersOpaque;
				prefersOpaque = queries[0]?.matches === true;
				accessibilityActive = prefersOpaque || queries[1]?.matches === true;
				if (accessibilityActive) previewPreset = null;
				applyGlass(ctx);
				if (wasOpaque !== prefersOpaque) applyWallpaper(ctx);
				sync();
			};
			prefersOpaque = queries[0]?.matches === true;
			accessibilityActive = prefersOpaque || queries[1]?.matches === true;
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
				previewSelection = null;
				previewPreset = null;
				previewComposition = null;
				for (const dispose of [...mediaDisposers, ...shortcutDisposers]) dispose();
				// overrideTokens disposers emit theme/change too; the handler below
				// must be inert before disposing, or it resurrects the glass layer.
				teardownGlass();
				teardownWallpaper();
			};
			stopRuntime = stop;
			rotateOnBoot();
			if (!readVideo() && readWallpaper()) rememberWallpaper(readWallpaper(), true);
			else void queueRecent();
			applyWallpaper(ctx);
			applyGlass(ctx);
			sync();

			// A ThemeRuntime rebuild can drop our override layer; re-apply on
			// every theme change event, retaining explicit light/dark tint pairs.
			ctx.on("theme/change", () => {
				if (!active || applyingGlass) return;
				const scheme = readScheme();
				const changed = scheme !== activeScheme;
				activeScheme = scheme;
				if (changed) { previewPreset = null; previewComposition = null; }
				if (readGlassOn()) applyGlass(ctx);
				if (changed) { applyWallpaper(ctx); sync(); }
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
							if (!settingsError) { previewPreset = null; applyGlass(ctx); applyWallpaper(ctx); }
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

			const savePresetChanges = (changes, previous) => {
				let error = writeSettingsBatch(changes);
				if (!error) {
					try {
						applyGlass(ctx);
						return null;
					} catch {
						error = writeSettingsBatch(previous) ? "glass.restoreFailed" : "glass.saveFailed";
					}
				}
				// Reapply the saved appearance after an unsuccessful transition.
				try { applyGlass(ctx); } catch { error = "glass.restoreFailed"; }
				return error;
			};
			const optionChanges = (next, presetAlpha) => {
				const profiles = readProfiles();
				if (profiles) {
					const profile = { alpha: presetAlpha ?? readAlpha(), options: sanitizeOptions(next) };
					const updated = profiles.separate ? { ...profiles, [activeScheme]: profile } : { ...profiles, light: profile, dark: profile };
					return [[KEY_APPEARANCES, JSON.stringify(updated)]];
				}
				const changes = [[KEY_OPTIONS, JSON.stringify(next)]];
				if (presetAlpha !== undefined) changes.unshift([KEY_ALPHA, String(presetAlpha)]);
				return changes;
			};
			const saveOptions = (next, presetAlpha, rememberPreset = false) => {
				if (!active) return false;
				const changes = optionChanges(next, presetAlpha);
				const previous = rememberPreset ? changes.map(([key]) => [key, readStorage(key)]) : null;
				const error = previous ? savePresetChanges(changes, previous) : writeSettingsBatch(changes);
				settingsError = !!error;
				presetError = error === "glass.restoreFailed" ? "glass.presetRestoreFailed" : null;
				if (!error) {
					previewPreset = null;
					presetUndo = previous ? { previous, applied: changes } : null;
				}
				if (!previous && error !== "glass.saveFailed") { applyGlass(ctx); applyWallpaper(ctx); }
				sync();
				return !error;
			};
			const setPreset = name => {
				if (!active || accessibilityActive || !Object.hasOwn(PRESETS, name)) return false;
				previewPreset = null;
				return saveOptions({ ...readOptions(), preset: name, glassBlur: null }, PRESETS[name].alpha, true);
			};
			const cancelPresetPreview = () => {
				if (!active || !previewPreset) return false;
				previewPreset = null;
				applyGlass(ctx);
				sync();
				return true;
			};

			const cancelWallpaperComposition = () => {
				if (!active || !previewComposition) return false;
				previewComposition = null;
				applyWallpaper(ctx);
				sync();
				return true;
			};

			const injected = (actions) => {
				bound = actions;
				sync();
				return {
					getDiagnostics: () => ({
						schemaVersion: 1,
						plugin: "dsh-liquid-glass",
						validation: { ...HOST_VALIDATION },
						hooks: {
							settingsMounted: !!bound,
							themeInterface: typeof ctx.theme?.overrideTokens === "function",
							themeTokensApplied: !!(glassDispose || materialDispose),
							locale: typeof ctx.locale?.register === "function",
							shortcutStatus,
							indexedDBAvailable: !!window.indexedDB
						},
						accessibility: { reducedMotion, reducedTransparency: prefersOpaque, increasedContrast: queries[1]?.matches === true },
						appearance: { scheme: activeScheme, enabled: readGlassOn(), glassSurfaces: readGlassSurfaces() },
						background: {
							kind: readVideo() ? "video" : readWallpaper() ? "image" : "none",
							rendered: !!(wallpaperEl || videoEl),
							rotationItems: readRotation().items.length,
							recentImages: recentWallpapers.length
						}
					}),
					previewWallpaperComposition: patch => {
						if (!active || !patch || (!readWallpaper() && !readVideo()) || previewSelection || videoSaving) return false;
						const options = backgroundOptions();
						const geometry = placement(options);
						previewComposition = {
							panX: numberValue(patch.panX, 0, 100, geometry.x),
							panY: numberValue(patch.panY, 0, 100, geometry.y),
							zoom: numberValue(patch.zoom, 100, 250, options.zoom)
						};
						applyWallpaper(ctx);
						sync();
						return true;
					},
					cancelWallpaperComposition,
					saveWallpaperComposition: () => {
						if (!previewComposition || !active || previewSelection || videoSaving) return false;
						const draft = previewComposition;
						previewComposition = null;
						if (!saveOptions({ ...readOptions(), ...draft })) {
							previewComposition = draft;
							applyWallpaper(ctx);
							sync();
							return false;
						}
						if (!readVideo()) rememberWallpaper(readWallpaper());
						return true;
					},
					restoreRecentWallpaper: id => {
						if (!active || videoSaving || previewSelection || previewComposition) return false;
						const item = recentWallpapers.find(entry => entry.id === id);
						if (!item) return false;
						const previousVideo = readVideo();
						const options = { ...readOptions(), ...item.composition };
						const changes = [...optionChanges(options), [KEY_WALLPAPER, item.url], [KEY_VIDEO, null]];
						const error = writeSettingsBatch(changes);
						if (error) {
							if (error === "glass.restoreFailed") { applyGlass(ctx); applyWallpaper(ctx); sync(); }
							return false;
						}
						presetUndo = null;
						videoSaveError = "";
						deleteVideoIfUnpooled(previousVideo?.id);
						applyWallpaper(ctx);
						sync();
						rememberWallpaper(item.url);
						return true;
					},
					removeRecentWallpaper: id => active && queueRecent(items => items.filter(item => item.id !== id)),
					previewPreset: name => {
						if (!active || !readGlassOn() || !readGlassSurfaces() || accessibilityActive || !Object.hasOwn(PRESETS, name)) return false;
						previewPreset = name;
						settingsError = false;
						presetError = null;
						applyGlass(ctx);
						sync();
						return true;
					},
					cancelPresetPreview,
					applyPresetPreview: () => !!previewPreset && setPreset(previewPreset),
					undoPreset: () => {
						if (!active || !presetUndo || previewPreset) return false;
						if (presetUndo.applied.some(([key, value]) => readStorage(key) !== value)) {
							presetUndo = null;
							sync();
							return false;
						}
						const error = savePresetChanges(presetUndo.previous, presetUndo.applied);
						settingsError = !!error;
						presetError = error === "glass.restoreFailed" ? "glass.presetRestoreFailed" : null;
						if (!error) presetUndo = null;
						sync();
						return !error;
					},
					readContentContrast: () => {
						const material = appearance();
						const cssText = window.getComputedStyle?.(document.body)?.getPropertyValue("--dsw-alias-label-primary")?.trim() || "";
						const text = opaqueRgb(cssText);
						const tint = hexToRgb(TINTS[material.tint][material.scheme]);
						return text ? minimumContentContrast(text, [tint.r, tint.g, tint.b], Math.max(0.94, material.alpha)) : null;
					},
					setGlassSurfaces: enabled => {
						if (!active || typeof enabled !== "boolean") return false;
						settingsError = !writeStorage(KEY_GLASS_SURFACES, enabled ? null : "off");
						if (!settingsError) {
							if (!enabled) previewPreset = null;
							applyGlass(ctx);
						}
						sync();
						return !settingsError;
					},
					restoreNativeAppearance: () => {
						if (!active || videoSaving || previewSelection) return { error: "glass.restoreBusy" };
						const previousVideo = readVideo();
						const items = readRotation().items;
						const changes = [
							[KEY_GLASS, "off"], [KEY_GLASS_SURFACES, null],
							[KEY_ALPHA, null], [KEY_OPTIONS, null], [KEY_APPEARANCES, null],
							[KEY_WALLPAPER, null], [KEY_VIDEO, null], [KEY_VIDEO_PAUSED, null],
							[KEY_ROTATION, items.length ? JSON.stringify(sanitizeRotation({ items })) : null]
						];
						const error = writeSettingsBatch(changes);
						if (error === "glass.saveFailed") return { error };
						previewPreset = null;
						previewComposition = null;
						presetUndo = null;
						presetError = null;
						applyGlass(ctx);
						applyWallpaper(ctx);
						sync();
						if (error) return { error };
						deleteVideoIfUnpooled(previousVideo?.id);
						return {};
					},
					setSeparateAppearance: (separate) => {
						if (!active || typeof separate !== "boolean") return false;
						if ((readProfiles()?.separate === true) === separate) return true;
						const profile = { alpha: readAlpha(), options: readOptions() };
						settingsError = !writeStorage(KEY_APPEARANCES, JSON.stringify({ version: 1, separate, light: profile, dark: profile }));
						if (!settingsError) { previewPreset = null; presetUndo = null; presetError = null; applyGlass(ctx); }
						sync(); return !settingsError;
					},
					setOption: (key, value) => {
						const options = readOptions();
						if (!Object.hasOwn(DEFAULT_OPTIONS, key) || key === "preset") return false;
						const valid = key === "tint" ? Object.keys(TINTS).includes(value)
							: key === "fit" ? ["cover", "contain", "fill"].includes(value)
							: key === "videoMode" ? ["motion", "still"].includes(value)
							: key === "position" ? POSITIONS.includes(value)
							: key === "filter" || key === "autoDim" ? typeof value === "boolean"
							: typeof value === "number" && Number.isFinite(value);
						if (!valid) return false;
						options[key] = value;
						if (key === "position") { options.panX = null; options.panY = null; }
						const saved = saveOptions(sanitizeOptions(options));
						if (saved && !readVideo() && (key === "position" || key === "fit")) rememberWallpaper(readWallpaper());
						return saved;
					},
					setPreset,
					previewBackground: selection => {
						if (!active) return;
						if (selection) previewComposition = null;
						previewSelection = selection;
						applyWallpaper(ctx);
						sync();
					},
					resetAppearance: () => saveOptions({ ...DEFAULT_OPTIONS }, DEFAULT_ALPHA),
					setGlass: (on) => {
						settingsError = !writeStorage(KEY_GLASS, on ? "on" : "off");
						if (!settingsError) previewPreset = null;
						applyGlass(ctx); applyWallpaper(ctx);
						sync();
					},
					setAlpha: (percent) => {
						// UI speaks "transparency %" (bigger = more see-through);
						// the surface token alpha is the inverse (1 - t/100).
						if (!active || typeof percent !== "number" || !Number.isFinite(percent)) return false;
						const alpha = Math.min(0.97, Math.max(0.05, 1 - percent / 100));
						if (readProfiles()) return saveOptions(readOptions(), Math.round(alpha * 1000) / 1000);
						settingsError = !writeStorage(KEY_ALPHA, String(Math.round(alpha * 1000) / 1000));
						if (!settingsError) { previewPreset = null; presetUndo = null; presetError = null; }
						applyGlass(ctx);
						sync();
					},
					setVideo: async (file) => {
						if (videoSaving || !active) return false;
						videoSaving = true; videoSaveError = ""; sync();
						const selection = ++selectionRevision;
						let id;
						try {
							await validateVideo(file);
							if (!active || selection !== selectionRevision) return false;
							id = window.crypto.randomUUID();
							await mediaRecord("put", id, file);
							if (!active || selection !== selectionRevision) { await mediaRecord("delete", id); return false; }
							const previous = readVideo();
							if (!writeStorage(KEY_VIDEO, JSON.stringify({ id, name: file.name }))) throw new Error("video.storage");
							previewSelection = null; previewComposition = null;
							applyWallpaper(ctx);
							deleteVideoIfUnpooled(previous?.id);
							return true;
						} catch (error) {
							if (id && readVideo()?.id !== id) void mediaRecord("delete", id).catch(() => {});
							if (active) videoSaveError = ["video.format", "video.size", "video.decode", "video.storage"].includes(error.message) ? error.message : "video.storage";
							return false;
						} finally { videoSaving = false; if (active) sync(); }
					},
					setVideoPaused: paused => {
						settingsError = !writeStorage(KEY_VIDEO_PAUSED, paused ? "on" : "off");
						if (!settingsError) updateVideoPlayback();
						sync();
						return !settingsError;
					},

					setRotationEnabled: (enabled) => {
						if (!active || typeof enabled !== "boolean") return false;
						const rotation = readRotation();
						let next = { ...rotation, enabled, lastSwitch: enabled ? Date.now() : rotation.lastSwitch };
						if (enabled) {
							const current = currentBackgroundItem();
							const match = current ? next.items.findIndex((item) => item.kind === current.kind && (item.kind === "video" ? item.id === current.id : item.url === current.url)) : -1;
							if (match >= 0) next = { ...next, index: match };
							else if (next.items.length === 0 && current && (current.kind === "video" || storageFitsExcept(KEY_ROTATION, JSON.stringify({ ...next, items: [current] }).length))) {
								// First enable seeds the pool with the saved background.
								next = { ...next, items: [current], index: 0 };
							}
						}
						if (!writeRotation(next)) return false;
						sync(); return true;
					},
					setRotationOrder: (order) => {
						if (!active || !ROTATION_ORDERS.includes(order)) return false;
						if (!writeRotation({ ...readRotation(), order })) return false;
						sync(); return true;
					},
					setRotationTiming: (timing) => {
						if (!active || !ROTATION_TIMINGS.includes(timing)) return false;
						if (!writeRotation({ ...readRotation(), timing })) return false;
						sync(); return true;
					},
					addCurrentToRotation: () => {
						if (!active) return "saveFailed";
						const rotation = readRotation();
						const current = currentBackgroundItem();
						if (!current) return "saveFailed";
						const match = rotation.items.findIndex((item) => item.kind === current.kind && (item.kind === "video" ? item.id === current.id : item.url === current.url));
						if (match >= 0) {
							if (!writeRotation({ ...rotation, index: match })) return "saveFailed";
							sync(); return true;
						}
						if (rotation.items.length >= MAX_ROTATION_ITEMS) return "limit";
						const next = { ...rotation, items: [...rotation.items, current], index: rotation.items.length };
						if (current.kind === "image" && !storageFitsExcept(KEY_ROTATION, JSON.stringify(next).length)) return "tooLarge";
						if (!writeRotation(next)) return "saveFailed";
						sync(); return true;
					},
					addRotationImages: (urls, { source } = {}) => {
						if (!active || videoSaving || previewSelection || !Array.isArray(urls)) return "saveFailed";
						const fromLink = source === "link";
						const link = fromLink && remoteWallpaperUrl(urls[0]);
						if (fromLink ? urls.length !== 1 || !link || link !== urls[0] : !urls.every(validNewImageUrl)) return "saveFailed";
						const rotation = readRotation();
						const imageKey = url => fromLink ? remoteWallpaperUrl(url) ?? url : url;
						const duplicates = new Set(rotation.items.filter(item => item.kind === "image").map(item => imageKey(item.url)));
						const current = currentBackgroundItem();
						if (current?.kind === "image") duplicates.add(imageKey(current.url));
						const additions = [...new Set(urls)].filter(url => !duplicates.has(url));
						if (additions.length === 0) return fromLink ? "duplicate" : true;
						const items = rotation.items.slice();
						if (current && items.length === 0 && additions.length < MAX_ROTATION_ITEMS) items.push(current);
						const currentIndex = current ? items.findIndex(item => sameRotationBackground(item, current)) : -1;
						if (items.length + additions.length > MAX_ROTATION_ITEMS) return "limit";
						items.push(...additions.map(url => ({ id: window.crypto.randomUUID(), kind: "image", url })));
						const index = current ? (currentIndex >= 0 ? currentIndex : rotation.index) : fromLink ? items.length - 1 : 0;
						const enabled = rotation.enabled || (rotation.items.length < 2 && items.length >= 2);
						return saveRotation({ ...rotation, items, index, enabled, lastSwitch: Date.now() }, current ? null : items[index]);
					},
					replaceRotationImage: (id, url) => {
						if (!active || videoSaving || previewSelection || !validNewImageUrl(url)) return "saveFailed";
						const rotation = readRotation();
						const index = rotation.items.findIndex(item => item.id === id && item.kind === "image");
						if (index < 0) return "saveFailed";
						if (rotation.items[index].url === url) return true;
						if (rotation.items.some(item => item.kind === "image" && item.url === url)) return "duplicate";
						const replacement = { id, kind: "image", url };
						const items = rotation.items.slice();
						items[index] = replacement;
						const selected = readWallpaper() === rotation.items[index].url && !readVideo();
						return saveRotation({ ...rotation, items }, selected ? replacement : null);
					},
					selectRotationItem: id => {
						if (!active || videoSaving || previewSelection) return "saveFailed";
						const rotation = readRotation();
						const index = rotation.items.findIndex(item => item.id === id);
						if (index < 0) return "saveFailed";
						return saveRotation({ ...rotation, index, lastSwitch: Date.now() }, rotation.items[index]);
					},
					removeRotationItem: (id, { clearBackground } = {}) => {
						if (!active || typeof id !== "string") return false;
						const rotation = readRotation();
						const item = rotation.items.find((entry) => entry.id === id);
						if (!item) return false;
						const items = rotation.items.filter((entry) => entry.id !== id);
						const next = { ...rotation, items, index: Math.min(rotation.index, Math.max(0, items.length - 1)) };
						const current = clearBackground && currentBackgroundItem();
						if (current && sameRotationBackground(item, current)) {
							if (videoSaving || previewSelection) return "saveFailed";
							return saveRotation(next, { kind: "image", url: null });
						}
						if (!writeRotation(next)) return false;
						if (item.kind === "video" && readVideo()?.id !== item.id) void mediaRecord("delete", item.id).catch(() => {});
						sync(); return true;
					},
					nextRotation: () => {
						if (!active) return false;
						const rotation = readRotation();
						if (!rotation.enabled || rotation.items.length < 2) return false;
						const nextIndex = nextRotationIndex(rotation);
						if (nextIndex < 0) return false;
						const item = rotation.items[nextIndex];
						if (!commitBackground(item)) return false;
						writeRotation({ ...rotation, index: nextIndex, lastSwitch: Date.now() });
						applyWallpaper(ctx);
						sync();
						return true;
					},

					setWallpaper: (url) => {
						selectionRevision++;
						const previous = readWallpaper();
						const oldVideo = readVideo();
						if (!writeStorage(KEY_WALLPAPER, url)) return false;
						if (!writeStorage(KEY_VIDEO, null)) { writeStorage(KEY_WALLPAPER, previous); return false; }
						videoSaveError = ""; previewSelection = null; previewComposition = null;
						deleteVideoIfUnpooled(oldVideo?.id); // Noncritical orphan cleanup; selection already committed.
						rememberWallpaper(url);
						applyWallpaper(ctx);
						sync();
						return true;
					}
				};
			};
			const slotResult = ctx.slots.inject("settings.general.item", () => ctx.slots.register({
				name: "settings.general.item",
				id: "liquid-glass",
				order: 10.5,
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
