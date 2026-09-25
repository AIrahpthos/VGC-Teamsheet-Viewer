import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parsePdfPage } from '../lib/pdf-teams.ts';
const text=(str,x,y,width=20)=>({str,x,y,width});
function sheet(blank=false){
 const items=[text('José Example [AU] - Trainer',20,790,180),text('(T#7) Masters - Example Regional',20,775,200),text('EN',30,750),...Array.from({length:6},(_,i)=>text(String(i+1),128+i*81,750,4))];
 const labels=['Pokémon','Tera Type','Ability','Held Item','Move 1','Move 2','Move 3','Move 4'];
 const values=['Pikachu','Electric','Static','Light Ball','Thunderbolt','Protect','Surf','Volt Switch'];
 for(let r=0;r<8;r++){items.push(text(labels[r],30,740-r*10,40));if(!blank)for(let c=0;c<6;c++)items.push(text(values[r],120+c*81,740-r*10));}
 items.push(text('FR',30,650));items.push(text('French text must not leak',120,640));return items;
}
test('extracts the English team and player identity independently of item order',()=>{
 const result=parsePdfPage(sheet().reverse(),7);
 assert.equal(result.player.name,'José Example');assert.equal(result.name,'Masters - Example Regional');
 assert.equal(result.player.pokemon.length,6);assert.equal(result.player.pokemon[5].moves[3],'Volt Switch');
});
test('keeps a blank sheet searchable without claiming it is a team',()=>{const p=parsePdfPage(sheet(true),2).player;assert.equal(p.team,null);assert.match(p.issue,/blank/);});
test('empty move and item cells do not shift following columns',()=>{
 const items=sheet().filter(t=>!(t.x===120 && [710,690,680,670].includes(t.y)));
 const p=parsePdfPage(items,3).player;assert.ok(p.team);assert.equal(p.pokemon[0].item,'');assert.deepEqual(p.pokemon[0].moves,['Thunderbolt','','','']);assert.equal(p.pokemon[1].moves[3],'Volt Switch');
});
test('incomplete nonempty columns are flagged rather than dropped',()=>{const p=parsePdfPage(sheet().filter(t=>!(t.x===120 && t.y===720)),4).player;assert.equal(p.team,null);assert.match(p.issue,/incomplete/);});
test('splits merged bracketed forms across adjacent species columns',()=>{
 const items=sheet().filter(t=>!(t.y===740 && [282,363].includes(t.x)));
 items.push(text('Ogerpon [Hearthflame Mask]Calyrex [Shadow Rider]',250,740,162));
 const p=parsePdfPage(items,5).player;assert.equal(p.pokemon[2].name,'Ogerpon [Hearthflame Mask]');assert.equal(p.pokemon[3].name,'Calyrex [Shadow Rider]');
});
test('unsupported and image-only pages cannot masquerade as teams',()=>{assert.equal(parsePdfPage([],1),null);assert.equal(parsePdfPage([text('Random PDF',20,790)],1),null);});

// A reader-only stream models the missing Safari async-iterator API.
test('PDF text import works without ReadableStream async iteration', async()=>{
 const {readPdfText}=await import('../lib/read-pdf-text.ts');
 const stream=new ReadableStream({start(controller){controller.enqueue({items:[{str:'First'}]});controller.enqueue({items:[{str:'Second'}]});controller.close();}});
 Object.defineProperty(stream,Symbol.asyncIterator,{value:undefined});
 const result=await readPdfText({streamTextContent:()=>stream});
 assert.deepEqual(result.items,[{str:'First'},{str:'Second'}]);
 assert.equal(stream.locked,false);
});
test('PDF text import preserves errors and releases the reader',async()=>{
 const {readPdfText}=await import('../lib/read-pdf-text.ts');
 const stream=new ReadableStream({start(controller){controller.error(new Error('Unreadable page'));}});
 await assert.rejects(readPdfText({streamTextContent:()=>stream}),/Unreadable page/);
 assert.equal(stream.locked,false);
});

function championsSheet(blank=false) {
 return sheet(blank).map(t=> {
  if(t.y===730)return {...t,str:t.str==='Tera Type'?'Ability':t.str==='Electric'?'Static':t.str};
  if(t.y===720)return {...t,str:t.str==='Ability'?'Held Item':t.str==='Static'?'Light Ball':t.str};
  if(t.y===710)return {...t,str:t.str==='Held Item'?'Stat Alignment':t.str==='Light Ball'?'Adamant':t.str};
  return t;
 });
}
test('Champions PDF maps Stat Alignment separately from Tera Type',()=>{
 const p=parsePdfPage(championsSheet(),26).player;
 assert.equal(p.pokemon.length,6);
 assert.equal(p.pokemon[0].tera,'');
 assert.equal(p.pokemon[0].ability,'Static');
 assert.equal(p.pokemon[0].item,'Light Ball');
 assert.equal(p.pokemon[0].extra,'Stat alignment · Adamant');
 assert.deepEqual(p.pokemon[0].moves,['Thunderbolt','Protect','Surf','Volt Switch']);
});
test('blank Champions tables remain searchable',()=>{
 const p=parsePdfPage(championsSheet(true),1).player;
 assert.equal(p.team,null);assert.match(p.issue,/blank/);
});
test('missing required Champions row is rejected',()=>{
 const p=parsePdfPage(championsSheet().filter(t=>t.str!=='Ability'),1).player;
 assert.equal(p.team,null);assert.match(p.issue,/Unrecognised English/);
});
