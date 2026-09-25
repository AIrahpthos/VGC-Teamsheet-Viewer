import { parsePdfPage, type PdfRoster } from './pdf-teams';

export async function importPdf(file: File, progress: (page: number, total: number) => void): Promise<PdfRoster> {
 if (file.size > 40 * 1024 * 1024) throw Error('Choose a PDF smaller than 40 MB.');
 const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
 pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
 const task = pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()), cMapUrl: '/pdf-assets/cmaps/', cMapPacked: true, standardFontDataUrl: '/pdf-assets/standard_fonts/' });
 task.onPassword = () => { void task.destroy(); };
 try {
  const pdf = await task.promise;
  if (pdf.numPages>2000) throw Error('Choose a PDF with 2,000 pages or fewer.');
  const result: PdfRoster = { version:1, filename:file.name, name:file.name.replace(/\.pdf$/i,''), players:[], skipped:[] };
  for (let i=1;i<=pdf.numPages;i++) {
   const page=await pdf.getPage(i);
   const content=await page.getTextContent();
   const parsed=parsePdfPage(content.items.flatMap(t=>'str' in t ? [{str:t.str,x:t.transform[4],y:t.transform[5],width:t.width}] : []),i);
   if(parsed){if(!result.players.length && parsed.name)result.name=parsed.name;result.players.push(parsed.player)}else result.skipped.push(i);
   page.cleanup();
   progress(i,pdf.numPages);
  }
  if(!result.players.length)throw Error('No RK9 English teamsheet tables were found. Use a text-based tournament PDF like vglists-Masters.pdf; scanned images and other layouts are not supported.');
  return result;
 } finally { await task.destroy(); }
}
