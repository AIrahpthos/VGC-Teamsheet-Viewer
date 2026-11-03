import { readdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const directory = new URL('../dist/client/', import.meta.url);
const template = await readFile(new URL('./offline-worker.js', import.meta.url), 'utf8');
const files = (await readdir(directory, { recursive: true, withFileTypes: true }))
  .filter(entry => entry.isFile() && !['sw.js', '_headers', '_redirects'].includes(entry.name) && !entry.name.endsWith('.map'))
  .map(entry => entry.parentPath.slice(directory.pathname.length) + '/' + entry.name)
  .map(path => '/' + path.replace(/^\/+/, ''))
  .sort();
const hash = createHash('sha256').update(template);
for (const file of files) {
  hash.update(file).update(await readFile(new URL('.' + file, directory)));
}
const version = hash.digest('hex').slice(0, 16);
await writeFile(new URL('sw.js', directory), template
  .replace('__OFFLINE_VERSION__', version)
  .replace('/* __OFFLINE_ASSETS__ */ []', JSON.stringify(files)));
console.log(`Offline bundle ${version}: ${files.length} files`);
