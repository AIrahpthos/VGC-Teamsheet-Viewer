/** Coordinate-based reader for multilingual RK9 tournament PDFs (one player per page). */
export type PdfPokemon = { name: string; item: string; ability: string; tera: string; moves: string[] };
export type PdfPlayer = {
 name: string; country: string; division: string; team: string | null;
 pdfPage: number; trainer: string; pokemon: PdfPokemon[]; issue?: string;
};
export type PdfRoster = { version: 1; filename: string; name: string; players: PdfPlayer[]; skipped: number[] };
export type PositionedText = { str: string; x: number; y: number; width: number };
const tidy = (s: string) => s.replace(/\s+/g, ' ').trim();
const key = (s: string) => tidy(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

export function parsePdfPage(items: PositionedText[], page: number): { name: string; player: PdfPlayer } | null {
 const text = items.filter(t => t.str.trim()).sort((a,b) => b.y-a.y || a.x-b.x);
 const english = text.find(t => t.str.trim() === 'EN');
 if (!english) return null;
 const header = text.filter(t => t.y > english.y + 3);
 const lines: PositionedText[][] = [];
 for (const t of header) {
  const line = lines.find(l => Math.abs(l[0].y-t.y) < 2);
  if (line) line.push(t); else lines.push([t]);
 }
 const headers = lines.map(l => tidy(l.sort((a,b)=>a.x-b.x).map(t=>t.str).join(' ')));
 const identity = headers.map(t=>t.match(/^(.+?)\s*\[([A-Za-z]{2,3})\]\s*(?:[-–—]\s*(.*))?$/)).find(Boolean);
 if (!identity) return null;
 const title = headers.find(t=>/\b(Masters|Seniors|Juniors)\b/i.test(t)) || '';
 const name = title.replace(/^\(T#\d+\)\s*/, '');
 const division = title.match(/\b(Masters|Seniors|Juniors)\b/i)?.[0] || '';
 const player: PdfPlayer = { name: identity[1].trim(), country: identity[2], trainer: identity[3] || '', division, team: null, pdfPage: page, pokemon: [] };
 const fail = (issue: string) => ({ name, player: { ...player, issue } });
 const columns = text.filter(t=>Math.abs(t.y-english.y)<2 && /^[1-6]$/.test(t.str.trim())).sort((a,b)=>a.x-b.x);
 if (columns.length !== 6 || columns.some((t,i)=>t.str.trim()!==String(i+1))) return fail('Unrecognised PDF table. Check the original page.');
 const centers = columns.map(t=>t.x+t.width/2);
 const left = centers[0]-(centers[1]-centers[0])/2;
 const nextLanguage = text.find(t=>t.y<english.y-2 && t.x<left && /^(FR|IT|DE|ES|JP|JA|KO|SC|TC|EN)$/.test(t.str.trim()));
 const table = text.filter(t=>t.y<english.y-2 && (!nextLanguage || t.y>nextLanguage.y+2));
 const labels = ['pokemon','tera type','ability','held item','move 1','move 2','move 3','move 4'];
 const rows = labels.map(label=>table.find(t=>t.x<left && key(t.str)===label));
 if (rows.some(t=>!t)) return fail('Unrecognised English table. Check the original page.');
 const anchors = rows as PositionedText[];
 // Midpoints keep an empty cell from shifting later Pokémon into the wrong slot.
 const cells: PositionedText[][][] = anchors.map(()=>centers.map(()=>[]));
 const fragments = table.flatMap(t => {
  // PDF.js can combine adjacent long form names into one text item. A closing
  // form bracket followed by another species is an explicit cell boundary.
  if (Math.abs(t.y-anchors[0].y)<2) {
   const parts=t.str.split(/(?<=\])\s*(?=[A-Z])/);
   if(parts.length>1) return parts.map((str,i)=>({...t,str,x:t.x+t.width*i/parts.length,width:t.width/parts.length}));
  }
  return [t];
 });
 for (const t of fragments.filter(t=>t.x+t.width/2>=left)) {
  const row = anchors.reduce((best,a,i)=>Math.abs(t.y-a.y)<Math.abs(t.y-anchors[best].y)?i:best,0);
  const height = Math.min(...anchors.filter((_,i)=>i!==row).map(a=>Math.abs(a.y-anchors[row].y)));
  if (Math.abs(t.y-anchors[row].y)>height/2) return fail('Text extends beyond a recognised row. Check the original page.');
  const cx=t.x+t.width/2;
  const col=centers.reduce((best,x,i)=>Math.abs(cx-x)<Math.abs(cx-centers[best])?i:best,0);
  if (Math.abs(cx-centers[col])>(centers[1]-centers[0])/2) return fail('Text extends beyond a recognised column. Check the original page.');
  cells[row][col].push(t);
 }
 const values=cells.map(row=>row.map(cell=>tidy(cell.sort((a,b)=>b.y-a.y||a.x-b.x).map(t=>t.str).join(' '))));
 if (values.every(row=>row.every(v=>!v))) return fail('This player’s team table is blank in the PDF.');
 for (let col=0;col<6;col++) {
  const [species,tera,ability,item,...moves]=values.map(row=>row[col]);
  if (!species && values.every(row=>!row[col])) continue;
  if (!species || !tera || !ability || moves.every(m=>!m)) return fail('This team is incomplete or could not be read reliably. Check the original page.');
  player.pokemon.push({ name:species, tera, ability, item, moves });
 }
 if (!player.pokemon.length) return fail('No Pokémon could be read on this page.');
 player.team=`pdf:${page}`;
 return { name, player };
}
