/**
 * dsh-liquid-glass smoke test — runs the real client.js under a mocked DSH
 * browser runtime (ModuleLoader, document, localStorage, cordis ctx) and
 * exercises the whole plugin lifecycle plus every user-facing action.
 * Run: node test/smoke.test.mjs
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const source = readFileSync(join(here, '../lib/client.js'), 'utf8');
const manifest = JSON.parse(readFileSync(join(here, '../package.json'), 'utf8'));

let failures = 0;
function assert(cond, label) {
  if (cond) { console.log(`  ✅ ${label}`); }
  else { failures += 1; console.log(`  ❌ ${label}`); }
}

//#region mocks
const storageMap = new Map();
const createdElements = [];
const headChildren = [];
const bodyChildren = [];
const canvasCalls = [];
const pendingImages = [];
const compressedDataUrl = 'data:image/jpeg;base64,compressed';
let samplePixels = new Uint8ClampedArray([255, 255, 255, 255]);
let sampleError = false;
const materialCalls = [];
const liveLayers = new Map();
const eventHandlers = [];
const effectCleanups = [];
let publishThemeEvents = false;
const emitThemeChange = () => { for (const handler of eventHandlers) handler(); };
const mediaQueries = new Map();
function mediaQuery(query) {
  if (!mediaQueries.has(query)) mediaQueries.set(query, {
    matches: false, listeners: new Set(),
    addEventListener(type, listener) { this.listeners.add(listener); },
    removeEventListener(type, listener) { this.listeners.delete(listener); },
    change(matches) { this.matches = matches; for (const listener of [...this.listeners]) listener(); },
  });
  return mediaQueries.get(query);
}
const shortcutCommands = new Map();
let shortcutConflict = false;
let shortcutsAvailable = true;
let shortcutFailure = false;
let shortcutBindingOverride; // undefined = default; null = removed by the user.
let shortcutRegistrations = 0;
function dispatchShortcut(gesture = {}, context = { region: 'page', modal: null, target: null }, profile = 'web:windows') {
  const event = { code: 'KeyG', control: true, meta: false, shift: true, alt: false, repeat: false, composing: false, defaultPrevented: false, ...gesture };
  if (event.composing || event.defaultPrevented || event.repeat) return false;
  for (const command of shortcutCommands.values()) {
    const binding = shortcutBindingOverride === undefined ? command.defaults[profile] : shortcutBindingOverride;
    if (!binding) continue;
    const modifiers = binding.modifiers.map((m) => m === 'primary' ? profile.endsWith('macos') ? 'meta' : 'control' : m);
    if (binding.code !== event.code || ['control', 'meta', 'shift', 'alt'].some((m) => event[m] !== modifiers.includes(m))) continue;
    if (!command.regions.includes(context.region) || context.modal && !command.modals.includes(context.modal)) return false;
    const resolution = command.resolve(context);
    if (resolution.status === 'handled') { resolution.run(); return true; }
  }
  return false;
}

class ImageMock {
  width = 4000;
  height = 2000;
  set src(value) { this.source = value; pendingImages.push(this); }
}

class FileReaderMock {
  readAsDataURL(file) {
    this.result = file.dataUrl;
    if (file.readError) this.onerror?.();
    else this.onload?.();
  }
}

function finishImage(success = true) {
  const image = pendingImages.shift();
  if (!image) throw new Error('Expected an image decode/load request');
  if (success) image.onload();
  else image.onerror();
  return image;
}

function makeElement(tag) {
  const el = {
    tagName: tag.toUpperCase(),
    id: '',
    style: { setProperty() {}, },
    children: [],
    attrs: {},
    textContent: '',
    setAttribute(k, v) { this.attrs[k] = v; },
    appendChild(c) { this.children.push(c); return c; },
    prepend(c) { this.children.unshift(c); return c; },
    remove() {
      this.removed = true;
      for (const children of [bodyChildren, headChildren]) {
        const index = children.indexOf(this);
        if (index >= 0) children.splice(index, 1);
      }
    },
    contains() { return true; },
  };
  if (tag === 'canvas') {
    el.getContext = () => ({
      drawImage: (...args) => canvasCalls.push({ args }),
      getImageData: () => {
        if (sampleError) throw new DOMException('Tainted canvas', 'SecurityError');
        return { data: samplePixels };
      },
    });
    el.toDataURL = (type, quality) => {
      Object.assign(canvasCalls.at(-1), { type, quality, width: el.width, height: el.height });
      return compressedDataUrl;
    };
  }
  createdElements.push(el);
  return el;
}

const documentMock = {
  createElement: (tag) => makeElement(tag),
  head: { appendChild: (c) => headChildren.push(c) },
  body: {
    prepend: (c) => bodyChildren.unshift(c),
    appendChild: (c) => bodyChildren.push(c),
    contains: (c) => bodyChildren.includes(c) && !c.removed,
  },
  getElementById: (id) => createdElements.find((e) => e.id === id && !e.removed) || null,
};

// Only seeds actually used by this plugin. Verified in the installed official
// 0.2.2-rc.2 web frontend's getStaticModules(), via its shipped source map.
// Package directories / boot entries alone do not enumerate platform seeds.
const moduleTable = {
  'react/jsx-runtime': {
    jsx: (type, props) => ({ type, props }),
    jsxs: (type, props) => ({ type, props }),
  },
  react: {
    useState: (initial) => {
      const render = activeRender;
      const index = render.cursor++;
      if (!(index in render.hooks)) render.hooks[index] = initial;
      return [render.hooks[index], (value) => {
        if (!Object.is(render.hooks[index], value)) render.updated = true;
        render.hooks[index] = value;
      }];
    },
    useEffect: (effect, deps) => {
      const render = activeRender;
      const index = render.cursor++;
      const previous = render.hooks[index];
      if (!previous || deps.some((value, i) => !Object.is(value, previous[i]))) {
        render.hooks[index] = deps;
        render.effects.push(effect);
      }
    },
    useRef: (v) => ({ current: v }),
    Fragment: Symbol('Fragment'),
  },
  '@deepseek-ai/dsh-client-store': {
    // Official StoreHandle / StoreInstance contract, not the old fictitious
    // { state, actions } handle. This plugin's sync action updates flat fields.
    defineStore: (spec) => ({
      spec,
      create() {
        let state = Object.freeze(spec.init());
        const listeners = new Set();
        const store = {
          getSnapshot: () => state,
          subscribe: (listener) => { listeners.add(listener); return () => listeners.delete(listener); },
          update: (mutate) => {
            const next = { ...state };
            mutate(next);
            if (Object.keys(next).every((key) => Object.is(next[key], state[key]))) return;
            state = Object.freeze(next);
            for (const listener of [...listeners]) listener();
          },
        };
        const actions = Object.fromEntries(Object.entries(spec.actions).map(([name, mutate]) => [
          name, (...args) => store.update((draft) => mutate(draft, ...args)),
        ]));
        return { ...store, store, actions, clearPersisted() {} };
      },
    }),
  },
};
const requestedModules = new Set();
function requireFromHostTable(name) {
  if (!Object.hasOwn(moduleTable, name)) throw new Error(`client-modules: require("${name}") missed the module table`);
  requestedModules.add(name);
  return moduleTable[name];
}

let loadedModule = null;
const windowMock = {
  location: { href: 'https://dsh.local/app', origin: 'https://dsh.local' },
  matchMedia: mediaQuery,
  __ModuleLoader__: {
    load: (def) => { loadedModule = def; },
  },
  localStorage: {
    get length() { return storageMap.size; },
    key: (index) => [...storageMap.keys()][index] ?? null,
    getItem: (k) => (storageMap.has(k) ? storageMap.get(k) : null),
    setItem: (k, v) => storageMap.set(k, String(v)),
    removeItem: (k) => storageMap.delete(k),
  },
};

// Render the real settings component and retain its hook state across events.
let activeRender;
function mountComponent(component, getProps) {
  const render = { hooks: [] };
  return () => {
    let tree;
    do {
      Object.assign(render, { cursor: 0, effects: [], updated: false });
      activeRender = render;
      tree = component(getProps());
      activeRender = null;
      for (const effect of render.effects) effect();
    } while (render.updated);
    return tree;
  };
}

function findNode(tree, predicate) {
  if (!tree || typeof tree !== 'object') return null;
  if (Array.isArray(tree)) {
    for (const child of tree) {
      const found = findNode(child, predicate);
      if (found) return found;
    }
    return null;
  }
  return predicate(tree) ? tree : findNode(tree.props?.children, predicate);
}

const ctxCalls = { overrideTokens: [], register: [], slotRegister: [], localeRegister: [], effects: [], on: [] };
const ctxMock = {
  theme: {
    register: (t) => { ctxCalls.register.push(t); return () => {}; },
    setTheme: () => {},
    getTheme: () => ({ preference: 'system', revision: 1, active: 'light' }),
    overrideTokens: (source, overrides) => {
      // Preserve the original eight-token layer assertions; the new material
      // layer has separate coverage below and is tracked in the same live map.
      if (source === 'dsh-liquid-glass:material') materialCalls.push({ source, overrides });
      else ctxCalls.overrideTokens.push({ source, overrides });
      liveLayers.set(source, overrides);
      if (publishThemeEvents) emitThemeChange();
      return () => {
        if (liveLayers.get(source) !== overrides) return;
        liveLayers.delete(source);
        if (publishThemeEvents) emitThemeChange();
      };
    },
  },
  slots: {
    inject: (name, cb) => cb(),
    register: (meta, component) => { ctxCalls.slotRegister.push({ meta, component }); return () => {}; },
  },
  locale: {
    bind: (ns) => (key) => (ctxCalls.localeRegister[0]?.dicts?.zh?.[key]) || key,
    register: (ns, dicts) => { ctxCalls.localeRegister.push({ ns, dicts }); return () => {}; },
    get: (ns, key) => (ctxCalls.localeRegister[0]?.dicts?.zh?.[key]) || key,
  },
  inject: (names, callback) => { if (shortcutsAvailable) callback(ctxMock); },
  shortcuts: {
    register: (command) => {
      shortcutRegistrations++;
      if (shortcutFailure || shortcutConflict && Object.keys(command.defaults).length) throw new Error('Conflicting shortcut defaults');
      if (shortcutCommands.has(command.id)) throw new Error('Duplicate shortcut');
      shortcutCommands.set(command.id, command);
      return () => { if (shortcutCommands.get(command.id) === command) shortcutCommands.delete(command.id); };
    },
  },
  effect: (fn, label) => {
    ctxCalls.effects.push(label);
    if (typeof fn === 'function') {
      const cleanup = fn();
      if (typeof cleanup === 'function') effectCleanups.push({ label, cleanup });
    }
  },
  on: (event, cb) => { ctxCalls.on.push(event); eventHandlers.push(cb); },
};
//#endregion

//#region execute the real client.js
const fn = new Function('window', 'document', 'require', 'Image', 'FileReader', source);
fn(windowMock, documentMock, requireFromHostTable, ImageMock, FileReaderMock);
//#endregion

console.log('\n[1] module registration');
assert(loadedModule !== null, 'client.js registers itself via __ModuleLoader__.load');
assert(loadedModule.id === 'dsh-liquid-glass', `module id is "dsh-liquid-glass" (got "${loadedModule.id}")`);

console.log('\n[2] factory exports');
let factoryResult = loadedModule.factory(requireFromHostTable);
if (process.env.DSH_HOST_INSTALL) {
  const { importWithHostTable } = await import('./host-module-table.mjs');
  factoryResult = await importWithHostTable(process.env.DSH_HOST_INSTALL, loadedModule, moduleTable, manifest);
}
assert(typeof factoryResult.apply === 'function', 'exports.apply is a function');
assert(Array.isArray(factoryResult.inject), 'exports.inject is an array');
// Manifest edges are package names; exports.inject contains Cordis service names.
// slots is provided by the web shell (no package edge); locale/theme are plugins.
const serviceProviders = {
  locale: '@deepseek-ai/dsh-client-locale',
  theme: '@deepseek-ai/dsh-client-ui-theme',
};
const expectedPackages = Object.values(serviceProviders);
assert(JSON.stringify(manifest.dsh.client.inject) === JSON.stringify(expectedPackages), 'real manifest inject declares exactly the installed locale and theme packages');
const expectedServices = ['slots', ...Object.keys(serviceProviders).filter((service) => manifest.dsh.client.inject.includes(serviceProviders[service]))];
assert(JSON.stringify(factoryResult.inject) === JSON.stringify(expectedServices), 'Cordis service injection matches the real manifest providers and shell slots service');
assert(manifest.version === '0.2.0' && manifest.dsh.client.platform === 'web' && manifest.dsh.client.immediately === true, 'version 0.2.0 and web activation flags are preserved');
assert(JSON.stringify([...requestedModules].sort()) === JSON.stringify(Object.keys(moduleTable).sort()), 'factory imports only the verified React, JSX, and client-store platform seeds');
for (const missing of ['@deepseek-ai/dsh-client-runtime/client', '@deepseek-ai/dsh-client-store/client', 'unknown-package']) {
  let rejected = false;
  try { requireFromHostTable(missing); } catch (error) { rejected = error.message.includes('missed the module table'); }
  assert(rejected, `module table rejects unsupported require: ${missing}`);
}

console.log('\n[3] apply() under a mocked cordis ctx');
factoryResult.apply(ctxMock);
assert(ctxCalls.overrideTokens.length === 1, `glass layer applied on boot (default ON) — overrideTokens called ${ctxCalls.overrideTokens.length}x`);
const boot = ctxCalls.overrideTokens[0];
assert(boot.source === 'dsh-liquid-glass:glass', 'glass override uses the glass source id');
const tokenKeys = Object.keys(boot.overrides);
assert(tokenKeys.includes('--dsw-alias-bg-base'), 'page base token is translucent (full-shell transparency)');
assert(tokenKeys.includes('--dsw-alias-bg-layer-1'), 'surface layer token included');
assert(tokenKeys.length === 8, `exactly 8 surface tokens covered (got ${tokenKeys.length})`);
const baseLight = boot.overrides['--dsw-alias-bg-base'].light;
assert(/rgba\(255, 255, 255, 0.62\)/.test(baseLight), `light surface is rgba(255,255,255,0.62) by default (got ${baseLight})`);
const styleInjected = headChildren.some((c) => c.id === 'dsh-liquid-glass-glass-css');
assert(styleInjected, 'transparency stylesheet injected into <head>');
const cssText = headChildren.find((c) => c.id === 'dsh-liquid-glass-glass-css')?.textContent || '';
assert(cssText.includes('data-plugin-css') === false, 'stylesheet does not leak the marker into CSS text');
assert(headChildren.find((c) => c.id === 'dsh-liquid-glass-glass-css')?.attrs['data-plugin-css'] === 'dsh-liquid-glass', 'stylesheet carries data-plugin-css marker attribute');

console.log('\n[4] settings row registration');
assert(ctxCalls.slotRegister.length === 1, `exactly one settings row (got ${ctxCalls.slotRegister.length})`);
const rowMeta = ctxCalls.slotRegister[0].meta;
assert(typeof rowMeta.store.create === 'function' && rowMeta.store.spec && !('state' in rowMeta.store) && !('actions' in rowMeta.store), 'settings registers an official StoreHandle, not a pre-created mutable store');
assert(rowMeta.store.spec.persist === undefined, 'store does not add a new persistence namespace or replace the existing localStorage keys');
assert(rowMeta.name === 'settings.general.item', 'row lands in Settings → General');
assert(rowMeta.locale === 'settings.liquid-glass', 'row carries the locale namespace');
assert(ctxCalls.localeRegister.length === 1, 'locale dictionaries registered once');
const zhDict = ctxCalls.localeRegister[0].dicts.zh;
assert(zhDict['row.title'] === '液态玻璃', 'zh title is 液态玻璃');
assert(!('theme.paper' in zhDict), 'no leftover theme-catalog strings in the dictionary');

console.log('\n[5] user actions — toggle off');
const slotInjectFn = rowMeta.inject;
const rowStore = rowMeta.store.create();
const actions = slotInjectFn(rowStore.actions);
const initialSnapshot = rowStore.getSnapshot();
let notifications = 0;
const unsubscribe = rowStore.subscribe(() => notifications++);
assert(typeof actions.setGlass === 'function', 'setGlass action exposed');
assert(typeof actions.setAlpha === 'function', 'setAlpha action exposed');
assert(typeof actions.setWallpaper === 'function', 'setWallpaper action exposed');
ctxCalls.overrideTokens.length = 0;
actions.setGlass(false);
assert(notifications === 1 && !rowStore.getSnapshot().on && initialSnapshot.on, 'a mounted settings subscriber receives a new snapshot without mutating its previous snapshot');
unsubscribe();
assert(storageMap.get('dsh-liquid-glass:glass') === 'off', 'toggle-off persisted as "off"');
assert(ctxCalls.overrideTokens.length === 0, 'toggle-off removes the token layer (no new overrideTokens)');
assert(createdElements.find((e) => e.id === 'dsh-liquid-glass-glass-css')?.removed === true, 'toggle-off removes the stylesheet');

console.log('\n[6] user actions — toggle on + sliders');
actions.setGlass(true);
assert(notifications === 1, 'settings subscriber cleanup stops notifications');
assert(ctxCalls.overrideTokens.length === 1, 'toggle-on reapplies the token layer');
actions.setAlpha(40);
assert(storageMap.get('dsh-liquid-glass:glass-alpha') === '0.6', 'transparency 40% persisted as surface alpha 0.6');
const afterAlpha = ctxCalls.overrideTokens.at(-1).overrides['--dsw-alias-bg-base'].light;
assert(afterAlpha.includes('0.6'), `override reflects surface alpha 0.6 for 40% transparency (got ${afterAlpha})`);

console.log('\n[7] wallpaper actions');
actions.setWallpaper('https://example.com/bg.jpg');
assert(storageMap.get('dsh-liquid-glass:wallpaper') === 'https://example.com/bg.jpg', 'wallpaper URL persisted');
const wpEl = createdElements.filter((e) => e.tagName === 'DIV' && !e.removed).at(-1);
assert(wpEl && /example\.com/.test(wpEl.style.backgroundImage || ''), 'wallpaper element created with the URL as background-image');
actions.setWallpaper(null);
assert(storageMap.get('dsh-liquid-glass:wallpaper') === undefined, 'wallpaper removal clears storage');

console.log('\n[8] slider bounds and persisted transparency');
let currentStore = rowStore;
let currentActions = actions;
for (const [percent, expectedAlpha] of [[-10, 0.97], [3, 0.97], [38, 0.62], [70, 0.3], [95, 0.05], [110, 0.05]]) {
  currentActions.setAlpha(percent);
  const label = `${percent}% transparency uses alpha ${expectedAlpha}`;
  assert(Math.abs(Number(storageMap.get('dsh-liquid-glass:glass-alpha')) - expectedAlpha) < 1e-12, `${label} in storage`);
  if (percent === 70 || percent === 95) {
    assert(storageMap.get('dsh-liquid-glass:glass-alpha') === String(expectedAlpha), `${percent}% transparency stores exactly "${expectedAlpha}"`);
  }
  const surfaceAlpha = Number(/rgba\(255, 255, 255, ([0-9.]+)\)/.exec(ctxCalls.overrideTokens.at(-1).overrides['--dsw-alias-bg-base'].light)?.[1]);
  assert(Math.abs(surfaceAlpha - expectedAlpha) < 1e-12, `${label} in the rendered surface`);
  assert(Math.abs(currentStore.getSnapshot().alpha - expectedAlpha) < 1e-12, `${label} in the settings store`);

  // Recreate the plugin to exercise the saved value on the boot path too.
  factoryResult.apply(ctxMock);
  const reloadedMeta = ctxCalls.slotRegister.at(-1).meta;
  currentStore = reloadedMeta.store.create();
  currentActions = reloadedMeta.inject(currentStore.actions);
  const reloadedSurfaceAlpha = Number(/rgba\(255, 255, 255, ([0-9.]+)\)/.exec(ctxCalls.overrideTokens.at(-1).overrides['--dsw-alias-bg-base'].light)?.[1]);
  assert(Math.abs(reloadedSurfaceAlpha - expectedAlpha) < 1e-12, `${label} after reload`);
  assert(Math.abs(currentStore.getSnapshot().alpha - expectedAlpha) < 1e-12, `${label} in the reloaded settings store`);
}

console.log('\n[9] GIF uploads and storage estimates');
const WALLPAPER_KEY = 'dsh-liquid-glass:wallpaper';
const dictionaries = ctxCalls.localeRegister[0].dicts;
for (const locale of ['zh', 'en']) {
  assert(['wallpaper.tooLarge', 'wallpaper.saveFailed', 'wallpaper.badFile'].every((key) => typeof dictionaries[locale][key] === 'string' && dictionaries[locale][key].length > 0), `${locale} includes GIF quota, save failure, and decode failure messages`);
}
const t = (key) => dictionaries.en[key] ?? key;
const rowComponent = ctxCalls.slotRegister.at(-1).component;
const row = rowComponent({ t, useStore: (select) => select(currentStore.getSnapshot()), ...currentActions });
const section = findNode(row, (node) => node.type?.name === 'WallpaperSection');
const renderWallpaper = mountComponent(section.type, () => ({ ...section.props, url: currentStore.getSnapshot().wallpaper }));
let wallpaperTree = renderWallpaper();
const upload = (file) => {
  findNode(wallpaperTree, (node) => node.type === 'input' && node.props.type === 'file').props.onChange({ target: { files: [file], value: 'picked' } });
  wallpaperTree = renderWallpaper();
};
const save = () => {
  findNode(wallpaperTree, (node) => node.type === 'button' && node.props.children === t('wallpaper.save')).props.onClick();
  wallpaperTree = renderWallpaper();
};
const inlineError = (key) => !!findNode(wallpaperTree, (node) => node.type === 'div' && node.props.children === t(key) && node.props.style?.color === '#e5484d');
const previewHas = (value) => !!findNode(wallpaperTree, (node) => node.props?.style?.backgroundImage === `url("${value}")`);
// A two-frame GIF fixture; the mocked decoder checks control flow, not playback.
const gifDataUrl = 'data:image/gif;base64,R0lGODlhAQABAIEAAAAAAP///////////yH/C05FVFNDQVBFMi4wAwEAAAAh+QQICgAAACwAAAAAAQABAAAIBAABBAQAIfkECAoAAAAsAAAAAAEAAQCB/wAA////////CAQAAQQEADs=';
const gifFile = { type: 'image/gif', dataUrl: gifDataUrl };
upload(gifFile);
assert(!previewHas(gifDataUrl) && !storageMap.has(WALLPAPER_KEY), 'GIF is not drafted or stored before image decoding succeeds');
assert(finishImage().source === gifDataUrl, 'GIF validation decodes the original FileReader data URL');
wallpaperTree = renderWallpaper();
assert(previewHas(gifDataUrl), 'pickImageFile keeps the exact image/gif data URL as the draft');
assert(canvasCalls.length === 0, 'GIF bypasses canvas re-encoding');
save();
assert(storageMap.get(WALLPAPER_KEY) === gifDataUrl && currentStore.getSnapshot().wallpaper === gifDataUrl, 'saving a GIF preserves its original data in storage and the settings store');

// Leave enough room for either GIF by itself, but not both together.
const replacementGif = { type: 'image/gif', dataUrl: `${gifDataUrl}AAAA` };
const otherLength = [...storageMap].filter(([key]) => key !== WALLPAPER_KEY).reduce((sum, [, value]) => sum + value.length, 0);
storageMap.set('other-plugin:padding', 'x'.repeat(5 * 1024 * 1024 / 2 - otherLength - replacementGif.dataUrl.length));
upload(replacementGif);
finishImage();
wallpaperTree = renderWallpaper();
assert(previewHas(replacementGif.dataUrl), 'storage estimate counts other values and reclaims the wallpaper being replaced');
save();
assert(storageMap.get(WALLPAPER_KEY) === replacementGif.dataUrl, 'GIF fits exactly at the estimated budget');
const overQuotaGif = { type: 'image/gif', dataUrl: `${replacementGif.dataUrl}AAAA` };
upload(overQuotaGif);
finishImage();
wallpaperTree = renderWallpaper();
assert(inlineError('wallpaper.tooLarge'), 'over-quota GIF shows the inline storage error');
assert(previewHas(replacementGif.dataUrl) && storageMap.get(WALLPAPER_KEY) === replacementGif.dataUrl, 'over-quota GIF leaves the previous draft and storage unchanged');
storageMap.delete('other-plugin:padding');
upload(gifFile);
finishImage();
wallpaperTree = renderWallpaper();
storageMap.set('other-plugin:padding', 'x'.repeat(5 * 1024 * 1024 / 2));
save();
assert(inlineError('wallpaper.tooLarge') && storageMap.get(WALLPAPER_KEY) === replacementGif.dataUrl, 'save rechecks GIF room when storage fills after selection');
storageMap.delete('other-plugin:padding');

console.log('\n[10] image validation and static compression');
const previousDraft = gifDataUrl;
upload({ type: 'image/gif', dataUrl: 'data:image/gif;base64,corrupt' });
finishImage(false);
wallpaperTree = renderWallpaper();
assert(inlineError('wallpaper.badFile') && previewHas(previousDraft), 'corrupt GIF is rejected after decode failure without replacing the draft');
upload({ ...gifFile, readError: true });
assert(inlineError('wallpaper.badFile'), 'file read failure appears inline');
upload({ type: 'text/plain', dataUrl: 'data:text/plain,hello' });
assert(inlineError('wallpaper.badType') && pendingImages.length === 0, 'unsupported files are rejected before decoding');
for (const type of ['image/jpeg', 'image/png', 'image/webp']) {
  upload({ type, dataUrl: `data:${type};base64,fixture` });
  finishImage();
  wallpaperTree = renderWallpaper();
  const call = canvasCalls.at(-1);
  assert(previewHas(compressedDataUrl) && call.type === 'image/jpeg' && call.quality === 0.85 && call.width === 1920 && call.height === 960, `${type} retains the 1920px JPEG compression path at quality 0.85`);
}

console.log('\n[11] storage write failures and recovery');
const savedWallpaper = storageMap.get(WALLPAPER_KEY);
const savedRevision = currentStore.getSnapshot().revision;
const previousBodyCount = bodyChildren.length;
const previousElement = bodyChildren.at(-1);
const previousBackground = previousElement.style.backgroundImage;
const originalSetItem = windowMock.localStorage.setItem;
windowMock.localStorage.setItem = () => { throw new DOMException('Storage full', 'QuotaExceededError'); };
assert(currentActions.setWallpaper('data:image/jpeg;base64,unpersisted') === false, 'setWallpaper returns false when setItem throws QuotaExceededError');
save();
assert(inlineError('wallpaper.saveFailed'), 'failed local wallpaper save shows the inline error');
assert(storageMap.get(WALLPAPER_KEY) === savedWallpaper && currentStore.getSnapshot().wallpaper === savedWallpaper && currentStore.getSnapshot().revision === savedRevision, 'failed save leaves persisted wallpaper and store revision unchanged');
assert(bodyChildren.length === previousBodyCount && !previousElement.removed && previousElement.style.backgroundImage === previousBackground, 'failed save does not apply or replace the wallpaper layer');
const urlInput = findNode(wallpaperTree, (node) => node.type === 'input' && node.props.placeholder === t('wallpaper.urlPlaceholder'));
urlInput.props.onChange({ target: { value: 'https://example.com/replacement.jpg' } });
wallpaperTree = renderWallpaper();
save();
finishImage();
wallpaperTree = renderWallpaper();
assert(inlineError('wallpaper.saveFailed'), 'failed remote wallpaper save also shows the inline error after URL validation');
windowMock.localStorage.setItem = originalSetItem;
save();
finishImage();
wallpaperTree = renderWallpaper();
assert(storageMap.get(WALLPAPER_KEY) === 'https://example.com/replacement.jpg' && currentStore.getSnapshot().wallpaper === 'https://example.com/replacement.jpg' && !inlineError('wallpaper.saveFailed'), 'retry succeeds and clears the save error once storage works');
const originalRemoveItem = windowMock.localStorage.removeItem;
windowMock.localStorage.removeItem = () => { throw new DOMException('Storage blocked', 'SecurityError'); };
findNode(wallpaperTree, (node) => node.type === 'button' && node.props.children === t('wallpaper.remove')).props.onClick();
wallpaperTree = renderWallpaper();
save();
assert(inlineError('wallpaper.saveFailed') && currentStore.getSnapshot().wallpaper === 'https://example.com/replacement.jpg', 'failed wallpaper removal reports an inline error and preserves the applied value');
windowMock.localStorage.removeItem = originalRemoveItem;

console.log('\n[12] Toggle style and slider contract');
const toggle = findNode(row, (node) => node.type?.name === 'Toggle');
const checkedToggle = toggle.type({ checked: true, onChange() {} });
const uncheckedToggle = toggle.type({ checked: false, onChange() {} });
assert(checkedToggle.props.style.border === '1px solid transparent' && uncheckedToggle.props.style.border === '1px solid var(--dsw-alias-border-l2)', 'Toggle keeps its conditional border in both states');
const slider = findNode(row, (node) => node.type?.name === 'Slider');
assert(slider.props.min === 3 && slider.props.max === 95, 'transparency slider range stays 3%–95%');


console.log('\n[13] scoped frost, presets, and tint');
const OPTIONS_KEY = 'dsh-liquid-glass:options';
const ALPHA_KEY = 'dsh-liquid-glass:glass-alpha';
const currentCss = () => documentMock.getElementById('dsh-liquid-glass-glass-css')?.textContent ?? '';
const material = () => materialCalls.at(-1).overrides;
const baseAlpha = () => Number(/, ([\d.]+)\)$/.exec(ctxCalls.overrideTokens.at(-1).overrides['--dsw-alias-bg-base'].light)[1]);
const renderRow = () => ctxCalls.slotRegister.at(-1).component({ t, useStore: (select) => select(currentStore.getSnapshot()), ...currentActions });
function reload() {
  factoryResult.apply(ctxMock);
  const meta = ctxCalls.slotRegister.at(-1).meta;
  currentStore = meta.store.create();
  currentActions = meta.inject(currentStore.actions);
}
const wallpaperLayer = () => bodyChildren.find((el) => !el.removed && el.style.backgroundImage);
const dimLayer = () => documentMock.getElementById('dsh-liquid-glass-wallpaper-dim');
const sampleImage = () => createdElements.filter((el) => el.tagName === 'IMG' && el.onload).at(-1);
assert(materialCalls[0].overrides['--dsw-menu-backdrop-filter'].light === 'blur(12px) saturate(180%)', 'default frost extends the existing host menu material token');
assert(!/body\s*>|body\s*\{|html\s*\{|\[class|\.\w*__[\w-]+/.test(currentCss()), 'no blanket body rules, host class guesses, or root filters');
const filterRules = [...currentCss().matchAll(/([^{}]+)\{([^{}]*backdrop-filter[^{}]*)\}/g)];
assert(filterRules.length === 1 && filterRules[0][1].trim() === '[data-liquid-glass-preview]::before', 'new backdrop filters are scoped only to a childless plugin preview decoration');
assert(!/backdrop-filter/.test(source.slice(source.indexOf('function applyWallpaper()'), source.indexOf('function teardownWallpaper()'))), 'wallpaper never receives a backdrop filter');
assert(!currentCss().includes('!important') && !source.includes('querySelector'), 'material styling neither overrides host selectors nor scans host DOM');
for (const [preset, alpha, blur, saturation] of [['regular', 0.62, 12, 180], ['clear', 0.35, 6, 140], ['frost', 0.78, 20, 200]]) {
  const button = findNode(renderRow(), (node) => node.type === 'button' && node.props.children === t(`glass.${preset}`));
  button.props.onClick();
  const slider = findNode(renderRow(), (node) => node.type?.name === 'Slider' && node.props.label === t('glass.alpha'));
  assert(baseAlpha() === alpha && slider.props.value === Math.round((1 - alpha) * 100) && JSON.parse(storageMap.get(OPTIONS_KEY)).preset === preset, `${preset} synchronizes token opacity, slider, and persisted preset`);
  assert(material()['--dsw-menu-backdrop-filter'].light === `blur(${blur}px) saturate(${saturation}%)` && currentCss().includes(`blur(${blur}px) saturate(${saturation}%)`), `${preset} uses its exact blur and saturation recipe in host material and preview`);
}
currentActions.setPreset('regular');
currentActions.setAlpha(80);
assert(material()['--dsw-menu-backdrop-filter'].light === 'blur(3.9px) saturate(180%)' && currentStore.getSnapshot().options.preset === 'regular', 'manual transparency fine-tunes a preset and reduces blur');
const filterCheck = findNode(renderRow(), (node) => node.type?.name === 'Check' && node.props.label === t('glass.filter'));
filterCheck.type(filterCheck.props).props.children[0].props.onChange({ target: { checked: false } });
assert(material()['--dsw-menu-backdrop-filter'].light === 'none' && currentCss().includes('backdrop-filter:none'), 'filter switch disables both host material blur and preview blur');
currentActions.setGlass(false);
assert(liveLayers.size === 0 && currentCss() === '', 'glass off disposes both token layers and all plugin material CSS');
currentActions.setGlass(true);
assert(material()['--dsw-menu-backdrop-filter'].light === 'none', 'filter preference survives a glass off/on cycle');
currentActions.setOption('filter', true);
for (const [tint, light, dark] of [['cool', '237, 245, 255', '21, 27, 38'], ['warm', '245, 240, 232', '36, 32, 28'], ['ink', '220, 226, 235', '16, 20, 28']]) {
  currentActions.setOption('tint', tint);
  const modes = ctxCalls.overrideTokens.at(-1).overrides['--dsw-alias-bg-base'];
  assert(modes.light === `rgba(${light}, 0.2)` && modes.dark === `rgba(${dark}, 0.2)`, `${tint} tint supplies explicit light and dark surface colors`);
}
reload();
assert(currentStore.getSnapshot().options.tint === 'ink' && currentStore.getSnapshot().options.filter && baseAlpha() === 0.2, 'tint, filter, and fine-tuned opacity survive reload');
assert(currentCss().includes('inset 0 1px 0') && currentCss().includes('border:1px solid') && currentCss().includes('body[data-ds-dark-theme] [data-liquid-glass-preview]::before'), 'preview rim has a 1px border and separate light/dark inset highlights');
assert(material()['--dsw-alias-settings-card-stroke'].light !== material()['--dsw-alias-settings-card-stroke'].dark, 'host settings-card rim extends its existing light/dark stroke token');
assert(Object.keys(material()).sort().join('|') === ['--dsw-alias-settings-card-stroke', '--dsw-menu-backdrop-filter', '--dsw-menu-surface-fill', '--dsw-specific-menu'].sort().join('|'), 'material layer uses only locally verified host tokens, with no invented per-message API');
currentActions.setAlpha(95);
assert(material()['--dsw-menu-surface-fill'].light.endsWith(', 0.55)') && material()['--dsw-specific-menu'].dark.endsWith(', 0.55)'), 'menu fill has a 0.55 opacity floor at maximum shell transparency');

console.log('\n[14] wallpaper fit, nine positions, brightness, and manual dim');
currentActions.setWallpaper('https://remote.example/wallpaper.jpg');
for (const [fit, cssSize] of [['cover', 'cover'], ['contain', 'contain'], ['fill', '100% 100%']]) {
  currentActions.setOption('fit', fit);
  reload();
  assert(wallpaperLayer().style.backgroundSize === cssSize && currentStore.getSnapshot().options.fit === fit, `${fit} persists and reapplies its wallpaper size after reload`);
}
const positions = ['left top', 'center top', 'right top', 'left center', 'center center', 'right center', 'left bottom', 'center bottom', 'right bottom'];
for (const position of positions) {
  currentActions.setOption('position', position);
  reload();
  assert(wallpaperLayer().style.backgroundPosition === position && currentStore.getSnapshot().options.position === position, `${position} persists and reapplies after reload`);
}
for (const [input, expected] of [[-10, 20], [20, 20], [100, 100], [200, 200], [900, 200]]) {
  currentActions.setOption('brightness', input);
  reload();
  assert(wallpaperLayer().style.filter === `brightness(${expected}%)` && currentStore.getSnapshot().options.brightness === expected, `brightness ${input}% clamps to ${expected}% and survives reload`);
}
for (const [input, expected] of [[-2, 0], [25, 25], [60, 60], [90, 60]]) {
  currentActions.setOption('dim', input);
  reload();
  assert(dimLayer().style.backgroundColor === `rgba(0, 0, 0, ${expected / 100})` && currentStore.getSnapshot().options.dim === expected, `manual dim ${input}% clamps to ${expected}% and survives reload`);
}
assert(!dimLayer().style.filter && bodyChildren.indexOf(dimLayer()) > bodyChildren.indexOf(wallpaperLayer()), 'dim paints after the wallpaper and is independent of image brightness');
const beforeInvalid = storageMap.get(OPTIONS_KEY);
assert(['position', 'fit', 'tint', 'filter', 'autoDim', 'brightness', 'unknown', '__proto__'].every((key) => currentActions.setOption(key, 'invalid') === false) && currentActions.setOption('dim', NaN) === false && currentActions.setPreset('invalid') === false && storageMap.get(OPTIONS_KEY) === beforeInvalid, 'invalid option and preset values do not mutate persisted settings');

console.log('\n[15] automatic wallpaper readability protection');
currentActions.setOption('brightness', 100);
currentActions.setOption('dim', 10);
currentActions.setWallpaper('data:image/png;base64,white');
samplePixels = new Uint8ClampedArray([255, 255, 255, 255]);
sampleImage().onload();
assert(dimLayer().style.backgroundColor === 'rgba(0, 0, 0, 0.35)', 'bright local wallpaper automatically receives 35% black dim');
const sampleCall = canvasCalls.at(-1);
assert(sampleCall.args.slice(1).join(',') === '0,0,16,16', 'automatic luminance analysis downsamples to 16 by 16 pixels');
currentActions.setOption('dim', 50);
assert(dimLayer().style.backgroundColor === 'rgba(0, 0, 0, 0.5)', 'manual dim above 35% wins without compounding two dark layers');
currentActions.setOption('dim', 0);
currentActions.setOption('autoDim', false);
assert(dimLayer().style.backgroundColor === 'rgba(0, 0, 0, 0)', 'automatic dim can be disabled independently');
currentActions.setOption('autoDim', true);
currentActions.setOption('brightness', 20);
assert(dimLayer().style.backgroundColor === 'rgba(0, 0, 0, 0)', 'brightness adjustment is considered before automatic dim');
currentActions.setOption('brightness', 100);
assert(dimLayer().style.backgroundColor === 'rgba(0, 0, 0, 0.35)', 'restoring brightness reuses the sample and restores automatic dim');
currentActions.setWallpaper('data:image/png;base64,black');
samplePixels = new Uint8ClampedArray([0, 0, 0, 255]);
sampleImage().onload();
assert(dimLayer().style.backgroundColor === 'rgba(0, 0, 0, 0)', 'black wallpaper receives no automatic darkening');
currentActions.setWallpaper('data:image/png;base64,mixed');
samplePixels = new Uint8ClampedArray([255, 255, 255, 255, 0, 0, 0, 255]);
sampleImage().onload();
assert(dimLayer().style.backgroundColor === 'rgba(0, 0, 0, 0)', 'mixed wallpaper uses average luminance rather than its brightest pixel');
currentActions.setWallpaper('data:image/png;base64,transparent');
samplePixels = new Uint8ClampedArray([255, 255, 255, 0]);
sampleImage().onload();
assert(dimLayer().style.backgroundColor === 'rgba(0, 0, 0, 0)', 'fully transparent samples do not trigger bright-image protection');
currentActions.setWallpaper('data:image/png;base64,old');
const staleSample = sampleImage().onload;
currentActions.setWallpaper('data:image/png;base64,new');
samplePixels = new Uint8ClampedArray([255, 255, 255, 255]);
staleSample();
assert(dimLayer().style.backgroundColor === 'rgba(0, 0, 0, 0)', 'late image results cannot darken a replacement wallpaper');
sampleImage().onload();
assert(dimLayer().style.backgroundColor === 'rgba(0, 0, 0, 0.35)', 'the current wallpaper sample is still accepted');
const sampleCount = createdElements.filter((el) => el.tagName === 'IMG').length;
currentActions.setOption('dim', 20);
currentActions.setWallpaper('https://cross-origin.example/image.jpg');
assert(createdElements.filter((el) => el.tagName === 'IMG').length === sampleCount && dimLayer().style.backgroundColor === 'rgba(0, 0, 0, 0.2)', 'cross-origin URLs skip pixel probes and clear stale automatic dim');
currentActions.setWallpaper('/same-origin.jpg');
sampleError = true;
sampleImage().onload();
sampleError = false;
assert(dimLayer().style.backgroundColor === 'rgba(0, 0, 0, 0.2)', 'tainted canvas safely falls back to manual dim');
currentActions.setWallpaper('/same-origin-white.jpg');
sampleImage().onload();
assert(dimLayer().style.backgroundColor === 'rgba(0, 0, 0, 0.35)', 'same-origin wallpaper can be sampled');
currentActions.setWallpaper('/broken.jpg');
sampleImage().onerror();
assert(dimLayer().style.backgroundColor === 'rgba(0, 0, 0, 0.2)', 'failed analysis image load retains manual dim');
currentActions.setWallpaper(null);
assert(!wallpaperLayer() && !dimLayer(), 'wallpaper removal removes both image and dim layers');

console.log('\n[16] system accessibility response and preference restoration');
const reducedTransparency = mediaQuery('(prefers-reduced-transparency: reduce)');
const increasedContrast = mediaQuery('(prefers-contrast: more)');
currentActions.setOption('tint', 'neutral');
currentActions.setPreset('clear');
currentActions.setAlpha(95);
const savedOptions = storageMap.get(OPTIONS_KEY);
reducedTransparency.change(true);
assert(baseAlpha() === 0.5 && currentStore.getSnapshot().alpha === 0.5 && currentStore.getSnapshot().options.preset === 'frost' && material()['--dsw-menu-backdrop-filter'].light === 'blur(20px) saturate(200%)', 'reduced transparency applies Frost and caps transparency at 50%');
let accessibleRow = renderRow();
assert(findNode(accessibleRow, (node) => node.type?.name === 'Slider' && node.props.label === t('glass.alpha')).props.max === 50 && findNode(accessibleRow, (node) => node.props?.children === t('glass.accessibility')).props.role === 'status', 'settings show the effective cap and accessible status');
assert(findNode(accessibleRow, (node) => node.type === 'button' && node.props.children === t('glass.clear')).props.disabled && currentActions.setPreset('clear') === false, 'preset controls cannot bypass an active system preference');
assert(storageMap.get(ALPHA_KEY) === '0.05' && storageMap.get(OPTIONS_KEY) === savedOptions, 'system protection never overwrites saved appearance preferences');
reload();
assert(baseAlpha() === 0.5 && currentStore.getSnapshot().accessibility, 'system protection is read on boot, not only on change');
increasedContrast.change(true);
reducedTransparency.change(false);
assert(baseAlpha() === 0.5 && currentStore.getSnapshot().accessibility, 'increased contrast independently keeps protection active');
increasedContrast.change(false);
assert(baseAlpha() === 0.05 && currentStore.getSnapshot().options.preset === 'clear' && !currentStore.getSnapshot().accessibility, 'normal system settings restore the original preset and opacity');
increasedContrast.change(true);
currentActions.setAlpha(3);
assert(baseAlpha() === 0.97, 'system protection never makes an already opaque preference more transparent');
currentActions.setGlass(false);
increasedContrast.change(false);
assert(liveLayers.size === 0, 'system preference changes respect glass being disabled');
currentActions.setGlass(true);

console.log('\n[17] host-managed shortcut, settings overrides, and conflict handling');
const command = shortcutCommands.get('liquid-glass.toggle');
assert(command?.label() === dictionaries.zh['glass.shortcut'] && shortcutCommands.size === 1, 'one localized command is registered through the official shortcut service');
assert(Object.keys(command.defaults).length === 5 && !command.defaults['web:linux'] && Object.values(command.defaults).every((v) => v.code === 'KeyG' && v.modifiers.join(',') === 'primary,shift'), 'Ctrl/Cmd+Shift+G is declared only for locally verified supported profiles');
assert(dispatchShortcut() && !currentStore.getSnapshot().on && storageMap.get('dsh-liquid-glass:glass') === 'off', 'host-dispatched Ctrl+Shift+G toggles glass off and synchronizes settings');
assert(dispatchShortcut({ control: false, meta: true }, undefined, 'web:macos') && currentStore.getSnapshot().on, 'host-dispatched Cmd+Shift+G toggles glass on');
assert(!dispatchShortcut({}, undefined, 'web:linux'), 'Linux Web does not receive an unsupported default binding');
assert([{ repeat: true }, { composing: true }, { defaultPrevented: true }, { alt: true }, { shift: false }].every((event) => !dispatchShortcut(event)) && currentStore.getSnapshot().on, 'repeats, IME, consumed input, and mismatched modifiers do not toggle');
assert(['editable', 'terminal'].every((region) => !dispatchShortcut({}, { region, modal: null })) && !dispatchShortcut({}, { region: 'page', modal: 'settings' }), 'editable input, terminals, and modal dialogs retain their keyboard ownership');
assert(command.resolve({ region: 'editable', modal: null }).status === 'pass' && command.resolve({ region: 'page', modal: 'settings' }).status === 'pass', 'command resolver also protects input and dialogs under desktop dispatch');
shortcutBindingOverride = null;
assert(!dispatchShortcut() && currentStore.getSnapshot().on, 'removing the binding in host settings disables the shortcut');
shortcutBindingOverride = { code: 'KeyL', modifiers: ['primary', 'shift'] };
assert(!dispatchShortcut() && dispatchShortcut({ code: 'KeyL' }) && !currentStore.getSnapshot().on, 'a host settings remap takes effect without a private key listener');
shortcutBindingOverride = undefined;
currentActions.setGlass(true);
windowMock.localStorage.setItem = () => { throw new DOMException('Storage full', 'QuotaExceededError'); };
dispatchShortcut();
assert(currentStore.getSnapshot().on && currentStore.getSnapshot().settingsError, 'shortcut storage failure preserves glass state and exposes an inline error');
windowMock.localStorage.setItem = originalSetItem;
shortcutConflict = true;
reload();
assert(currentStore.getSnapshot().shortcutStatus === 'unbound' && Object.keys(shortcutCommands.get('liquid-glass.toggle').defaults).length === 0 && !dispatchShortcut(), 'host default conflicts fall back to an editable unbound command');
shortcutConflict = false;
shortcutFailure = true;
reload();
assert(currentStore.getSnapshot().shortcutStatus === 'unavailable' && liveLayers.size === 2, 'shortcut registration failure leaves the theme usable');
shortcutFailure = false;
shortcutsAvailable = false;
reload();
assert(shortcutCommands.size === 0 && currentStore.getSnapshot().shortcutStatus === 'unavailable' && liveLayers.size === 2, 'compositions without the optional shortcut service keep working');
shortcutsAvailable = true;
reload();
assert(!source.includes('addEventListener("keydown",') || source.match(/addEventListener\("keydown",/g).length === 1, 'the only DOM key listener remains the pre-existing lightbox Escape handler');

console.log('\n[18] new settings validation, storage failure, and localization');
currentActions.setPreset('regular');
const priorOptions = storageMap.get(OPTIONS_KEY);
const priorAlpha = storageMap.get(ALPHA_KEY);
windowMock.localStorage.setItem = (key, value) => {
  if (key === OPTIONS_KEY) throw new DOMException('Storage full', 'QuotaExceededError');
  return originalSetItem(key, value);
};
assert(currentActions.setPreset('clear') === false && storageMap.get(ALPHA_KEY) === priorAlpha && storageMap.get(OPTIONS_KEY) === priorOptions && baseAlpha() === 0.62, 'failed preset persistence rolls opacity back and preserves the rendered material');
assert(currentActions.setOption('dim', 40) === false && currentStore.getSnapshot().settingsError && !!findNode(renderRow(), (node) => node.props?.role === 'alert' && node.props.children === t('glass.saveFailed')), 'new settings write failures produce a visible inline error');
windowMock.localStorage.setItem = originalSetItem;
assert(currentActions.setOption('dim', 40) && !currentStore.getSnapshot().settingsError, 'successful retry clears the new settings error');
for (const corrupt of ['{broken', 'null', '42', '{"preset":"unknown","tint":"unknown","fit":"stretch","position":"bad","brightness":"huge","dim":null,"filter":"no","autoDim":"no"}']) {
  storageMap.set(OPTIONS_KEY, corrupt);
  reload();
  assert(currentStore.getSnapshot().options.preset === 'regular' && currentStore.getSnapshot().options.tint === 'neutral' && currentStore.getSnapshot().options.fit === 'cover' && currentStore.getSnapshot().options.brightness === 100 && currentStore.getSnapshot().options.dim === 0 && currentStore.getSnapshot().options.filter && currentStore.getSnapshot().options.autoDim, `corrupt options safely fall back: ${corrupt}`);
}
assert(Object.keys(dictionaries.en).sort().join('|') === Object.keys(dictionaries.zh).sort().join('|'), 'every settings and position label has both English and Chinese translations');
const fitChoice = findNode(renderRow(), (node) => node.type?.name === 'Choices' && node.props.label === t('wallpaper.fit'));
fitChoice.type(fitChoice.props).props.children[1].props.onChange({ target: { value: 'contain' } });
assert(currentStore.getSnapshot().options.fit === 'contain', 'wallpaper fit UI is wired to the persisted action');
const positionChoice = findNode(renderRow(), (node) => node.type?.name === 'Choices' && node.props.label === t('wallpaper.position'));
assert(positionChoice.props.values.length === 9 && positionChoice.type(positionChoice.props).type === 'label', 'nine-position control has a visible accessible label');

console.log('\n[19] theme events, cleanup, and missing browser capabilities');
publishThemeEvents = true;
const beforeEvent = ctxCalls.overrideTokens.length;
emitThemeChange();
assert(ctxCalls.overrideTokens.length === beforeEvent + 1 && liveLayers.size === 2, 'theme change reapplies both layers once despite synchronous override/dispose events');
currentActions.setGlass(false);
assert(liveLayers.size === 0 && currentCss() === '', 'toggle off cannot resurrect token layers through synchronous theme events');
currentActions.setGlass(true);
currentActions.setWallpaper('data:image/png;base64,pending-disposal');
const lateLoad = sampleImage().onload;
const registeredCommand = shortcutCommands.get('liquid-glass.toggle');
const disposeRuntime = effectCleanups.filter(({ label }) => label === 'liquid-glass: cleanup').at(-1).cleanup;
disposeRuntime();
const afterDispose = ctxCalls.overrideTokens.length;
lateLoad();
emitThemeChange();
reducedTransparency.change(true);
assert(liveLayers.size === 0 && ctxCalls.overrideTokens.length === afterDispose && currentCss() === '' && !wallpaperLayer() && !dimLayer(), 'disposal removes styles and both wallpaper layers and ignores late image/theme/media callbacks');
assert(shortcutCommands.size === 0 && [...mediaQueries.values()].every((q) => q.listeners.size === 0) && registeredCommand.resolve({ region: 'page', modal: null }).status === 'pass', 'disposal releases the shortcut and all accessibility listeners');
disposeRuntime();
assert(liveLayers.size === 0, 'runtime cleanup is idempotent');
publishThemeEvents = false;
reducedTransparency.matches = false;
const modernMatchMedia = windowMock.matchMedia;
windowMock.matchMedia = undefined;
reload();
assert(!currentStore.getSnapshot().accessibility && liveLayers.size === 2, 'browsers without matchMedia retain normal appearance');
windowMock.matchMedia = () => { throw new Error('Unavailable'); };
reload();
assert(!currentStore.getSnapshot().accessibility, 'matchMedia failures do not block plugin startup');
const legacyListeners = new Set();
const legacyQuery = { matches: true, addListener: (listener) => legacyListeners.add(listener), removeListener: (listener) => legacyListeners.delete(listener) };
windowMock.matchMedia = () => legacyQuery;
reload();
assert(currentStore.getSnapshot().accessibility && legacyListeners.size === 1, 'legacy MediaQueryList listeners also activate protection');
effectCleanups.filter(({ label }) => label === 'liquid-glass: cleanup').at(-1).cleanup();
assert(legacyListeners.size === 0, 'legacy media listeners are removed on disposal');
windowMock.matchMedia = modernMatchMedia;

console.log(failures === 0 ? '\n🎉 ALL CHECKS PASSED\n' : `\n💥 ${failures} CHECK(S) FAILED\n`);
process.exit(failures === 0 ? 0 : 1);
