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
