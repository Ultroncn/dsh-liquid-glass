// Optional installed-host contract check. No host files are changed.
// DSH_HOST_INSTALL=/path/to/install node test/smoke.test.mjs
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

export async function importWithHostTable(install, registration, moduleTable, manifest) {
  const packages = join(install, 'node_modules/@deepseek-ai');
  const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'));
  const version = readJson(join(packages, 'dsh/package.json')).version;
  const assets = join(packages, 'dsh-web-frontend/dist/assets');
  let shell;
  let bundle;
  for (const file of readdirSync(assets).filter((name) => name.endsWith('.js.map'))) {
    const map = readJson(join(assets, file));
    const index = map.sources.findIndex((name) => name.endsWith('/client/web/lib/index.js'));
    if (index < 0) continue;
    shell = map.sourcesContent[index];
    bundle = readFileSync(join(assets, file.slice(0, -4)), 'utf8');
    break;
  }
  assert.ok(shell, 'installed frontend source map must expose the official web shell');
  const seedBlock = /function getStaticModules\(\)\s*\{\s*return\s*\{([\s\S]*?)\n\s*\};/.exec(shell)?.[1];
  assert.ok(seedBlock, 'read the installed shell seed table, not an assumed package list');
  const seeds = new Set([...seedBlock.matchAll(/"([^"]+)"\s*:/g)].map((match) => match[1]));
  for (const id of Object.keys(moduleTable)) {
    assert.ok(seeds.has(id), `${id} must be an official platform seed`);
    assert.ok(bundle.includes(`"${id}":`) || id === 'react' && bundle.includes('react:'), `${id} must also be present in the shipped executable bundle`);
  }
  assert.ok(!seeds.has('@deepseek-ai/dsh-client-runtime/client'), 'the broken runtime import is not a seed');
  for (const id of manifest.dsh.client.inject) {
    const pkg = readJson(join(install, 'node_modules', id, 'package.json'));
    assert.equal(pkg.name, id);
    assert.equal(pkg.dsh.client.platform, 'web');
  }

  // Run the shipped module resolver, with verified seed implementations supplied
  // by the smoke harness. This tests module resolution; UI/services remain mocks.
  let bootstrap;
  new Function('window', readFileSync(join(packages, 'dsh-client-modules/lib/client.js'), 'utf8'))({
    __ModuleLoader__: { load: (value) => { bootstrap = value; } },
  });
  const bootstrapExports = bootstrap.factory((id) => { throw new Error(`unexpected bootstrap dependency: ${id}`); });
  const target = { mode: 'queue', pendingQueue: [registration] };
  const modules = bootstrapExports.createClientModuleSystem(target, { id: bootstrap.id, exports: bootstrapExports }, {
    boot: { rev: 'activation-contract', release: { version }, entries: [], batches: [] },
    staticModules: moduleTable,
  });
  // Negative control: the exact original import must fail in the real resolver.
  target.load({ id: 'activation-negative-control', factory: (require) => require('@deepseek-ai/dsh-client-runtime/client') });
  await assert.rejects(modules.import('activation-negative-control'), /missed the module table/);
  const plugin = await modules.import(registration.id);
  assert.equal(typeof plugin.apply, 'function');
  console.log(`  ✅ official host ${version}: every mock seed verified against the installed shell and executable bundle`);
  console.log('  ✅ official host: manifest dependencies exist and declare web clients');
  console.log('  ✅ official ClientModuleSystem rejects the original import and imports the repaired plugin');
  return plugin;
}
