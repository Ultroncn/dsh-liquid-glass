import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = dirname(dirname(fileURLToPath(import.meta.url)));

function option(name, fallback) {
  const index = process.argv.indexOf(name);
  if (index === -1) return fallback;
  if (!process.argv[index + 1]) throw new Error(`${name} requires a value`);
  return process.argv[index + 1];
}

/**
 * Release notes come from the changelog section for the released version.
 * The changelog is the single source of truth: a release must never publish
 * with notes that were written somewhere else and drift from it.
 */
export function sectionFor(changelog, version) {
  const lines = changelog.split(/\r?\n/);
  const heading = new RegExp(`^##\\s+${version.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:\\s|—|$)`);
  const start = lines.findIndex((line) => heading.test(line));
  if (start === -1) return undefined;
  let end = lines.length;
  for (let index = start + 1; index < lines.length; index += 1) {
    if (/^##\s/.test(lines[index])) {
      end = index;
      break;
    }
  }
  const body = lines.slice(start + 1, end).join('\n').trim();
  return body === '' ? undefined : body;
}

try {
  if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
    const changelogPath = resolve(option('--changelog', join(repositoryRoot, 'CHANGELOG.md')));
    const manifestPath = resolve(option('--package', join(repositoryRoot, 'package.json')));
    const tag = option('--tag', process.env.GITHUB_REF_NAME);
    if (!tag) throw new Error('release tag is required');
    const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
    const expected = `v${manifest.version}`;
    if (tag !== expected) {
      throw new Error(`release tag ${tag} does not match ${manifest.name}@${manifest.version} (expected ${expected})`);
    }
    const section = sectionFor(await readFile(changelogPath, 'utf8'), manifest.version);
    if (section === undefined) {
      throw new Error(`CHANGELOG.md has no release section for ${manifest.version}`);
    }
    const output = option('--output');
    const notes = `${section}\n`;
    if (output) {
      await writeFile(resolve(output), notes);
      process.stdout.write(`release notes written: ${output} (${notes.length} bytes)\n`);
    } else {
      process.stdout.write(notes);
    }
  }
} catch (error) {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
}
