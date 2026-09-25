// Optional integration check: pnpm exec node --experimental-strip-types tests/check-pdf.mjs /path/to/tournament.pdf
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { createRequire } from 'node:module';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { readPdfText } from '../lib/read-pdf-text.ts';
import { parsePdfPage } from '../lib/pdf-teams.ts';
const root=dirname(createRequire(import.meta.url).resolve('pdfjs-dist/package.json'));
const task=getDocument({data:new Uint8Array(readFileSync(process.argv[2])),cMapUrl:root+'/cmaps/',cMapPacked:true,standardFontDataUrl:root+'/standard_fonts/'});
try {
 const pdf=await task.promise, result=[];
 for(let i=1;i<=pdf.numPages;i++) {
  const page=await pdf.getPage(i),text=await readPdfText(page);
  result.push(parsePdfPage(text.items.filter(t=>'str'in t).map(t=>({str:t.str,x:t.transform[4],y:t.transform[5],width:t.width})),i));
  page.cleanup();
 }
 const counts={};for(const r of result){const k=!r?'unsupported':r.player.issue||'readable';counts[k]=(counts[k]||0)+1;}
 console.log(JSON.stringify(counts,null,2));
 if(process.argv[3])writeFileSync(resolve(process.argv[3]),JSON.stringify(result));
} finally { await task.destroy(); }
