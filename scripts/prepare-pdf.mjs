import { copyFile, mkdir, cp } from 'node:fs/promises';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
await mkdir(new URL('../public/', import.meta.url), { recursive: true });
await copyFile(require.resolve('pdfjs-dist/legacy/build/pdf.worker.min.mjs'), new URL('../public/pdf.worker.min.mjs', import.meta.url));

for (const folder of ['cmaps', 'standard_fonts']) await cp(new URL(`./${folder}/`, new URL('file://' + require.resolve('pdfjs-dist/package.json'))), new URL(`../public/pdf-assets/${folder}/`, import.meta.url), { recursive: true });
