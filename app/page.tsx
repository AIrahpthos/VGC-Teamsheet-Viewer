"use client";
import { useEffect, useRef, useState } from "react";
import { Layers, Search } from "lucide-react";
import { Combobox, ComboboxInput, ComboboxContent, ComboboxList, ComboboxItem, ComboboxEmpty } from "@/components/ui/combobox";
import { Skeleton } from "@/components/ui/skeleton";
import { Empty, EmptyHeader, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
type Tournament={id:string;name:string};
type Player={name:string;division:string;country:string;team:string|null};
type Pokemon={name:string;item:string;ability:string;tera:string;moves:string[];sprite?:string;extra?:string};
async function api(params:Record<string,string>){const r=await fetch('/api/rk9?'+new URLSearchParams(params));const d=await r.json() as {error?:string;tournaments:Tournament[];players:Player[];name:string;team:Pokemon[]};if(!r.ok)throw new Error(d.error||'RK9 could not be reached. Please try again.');return d;}
// Mega Stone abilities from Pokemon Showdown's species data (2026-09-18).
// https://github.com/smogon/pokemon-showdown/blob/master/data/pokedex.ts
// Only unambiguous single-ability Mega forms are annotated.
const megaStoneAbilities: Readonly<Record<string, string>> = {
  "venusaurite": "Thick Fat",
  "charizarditex": "Tough Claws",
  "charizarditey": "Drought",
  "blastoisinite": "Mega Launcher",
  "beedrillite": "Adaptability",
  "pidgeotite": "No Guard",
  "raichunitex": "Electric Surge",
  "raichunitey": "No Guard",
  "clefablite": "Magic Bounce",
  "alakazite": "Trace",
  "victreebelite": "Innards Out",
  "slowbronite": "Shell Armor",
  "gengarite": "Shadow Tag",
  "kangaskhanite": "Parental Bond",
  "starminite": "Huge Power",
  "pinsirite": "Aerilate",
  "gyaradosite": "Mold Breaker",
  "aerodactylite": "Tough Claws",
  "dragoninite": "Multiscale",
  "mewtwonitex": "Steadfast",
  "mewtwonitey": "Insomnia",
  "meganiumite": "Mega Sol",
  "feraligite": "Dragonize",
  "ampharosite": "Mold Breaker",
  "steelixite": "Sand Force",
  "scizorite": "Technician",
  "heracronite": "Skill Link",
  "skarmorite": "Stalwart",
  "houndoominite": "Solar Power",
  "tyranitarite": "Sand Stream",
  "sceptilite": "Lightning Rod",
  "blazikenite": "Speed Boost",
  "swampertite": "Swift Swim",
  "gardevoirite": "Pixilate",
  "sablenite": "Magic Bounce",
  "mawilite": "Huge Power",
  "aggronite": "Filter",
  "medichamite": "Pure Power",
  "manectite": "Intimidate",
  "sharpedonite": "Strong Jaw",
  "cameruptite": "Sheer Force",
  "altarianite": "Pixilate",
  "banettite": "Prankster",
  "chimechite": "Levitate",
  "absolite": "Magic Bounce",
  "absolitez": "Sharpness",
  "glalitite": "Refrigerate",
  "salamencite": "Aerilate",
  "metagrossite": "Tough Claws",
  "latiasite": "Levitate",
  "latiosite": "Levitate",
  "staraptite": "Contrary",
  "lopunnite": "Scrappy",
  "garchompite": "Sand Force",
  "garchompitez": "Levitate",
  "lucarionite": "Adaptability",
  "lucarionitez": "Aura Guard",
  "abomasite": "Snow Warning",
  "galladite": "Inner Focus",
  "froslassite": "Snow Warning",
  "darkranite": "Bad Dreams",
  "emboarite": "Mold Breaker",
  "excadrite": "Piercing Drill",
  "audinite": "Healer",
  "scolipite": "Shell Armor",
  "scraftinite": "Intimidate",
  "eelektrossite": "Eelevate",
  "chandelurite": "Infiltrator",
  "golurkite": "Unseen Fist",
  "chesnaughtite": "Bulletproof",
  "delphoxite": "Levitate",
  "greninjite": "Protean",
  "pyroarite": "Fire Mane",
  "floettite": "Fairy Aura",
  "malamarite": "Contrary",
  "barbaracite": "Tough Claws",
  "dragalgite": "Regenerator",
  "hawluchanite": "No Guard",
  "zygardite": "Aura Break",
  "diancite": "Magic Bounce",
  "crabominite": "Iron Fist",
  "golisopite": "Tough Claws",
  "drampanite": "Berserk",
  "magearnite": "Soul-Heart",
  "zeraorite": "Volt Absorb",
  "falinksite": "Defiant",
  "scovillainite": "Spicy Spray",
  "glimmoranite": "Adaptability",
  "baxcalibrite": "Thermal Exchange"
};
function heldItemLabel(item: string): string {
 const ability = megaStoneAbilities[item.toLowerCase().replace(/[^a-z0-9]/g, "")];
 return item ? ability ? `${item} (${ability})` : item : "—";
}

function pokemonSpriteUrl(name: string): string {
 const regional: Record<string, string> = {
  alolan: "alola", galarian: "galar", hisuian: "hisui", paldean: "paldea"
 };
 let species = name.trim().toLowerCase()
  .replace(/♀/g, "-f").replace(/♂/g, "-m")
  .normalize("NFD").replace(/[\u0300-\u036f]/g, "");
 species = species.replace(/^(alolan|galarian|hisuian|paldean)\s+(.+)$/, (_, region: string, base: string) => base + "-" + regional[region]);
 species = species.replace(/\s*\((alolan|galarian|hisuian|paldean)(?: form)?\)$/, (_, region: string) => "-" + regional[region]);
 const id = species.replace(/[^a-z0-9-]/g, "").replace(/^nidoran-([fm])$/, "nidoran$1").replace(/-mega-([xyz])$/, "-mega$1");
 return id ? "https://play.pokemonshowdown.com/sprites/gen5/" + id + ".png" : "";
}

function PokemonIcon({ name, fallback, slot }: { name: string; fallback?: string; slot: number }) {
 const sources = Array.from(new Set([pokemonSpriteUrl(name), fallback].filter((url): url is string => Boolean(url))));
 const [attempt, setAttempt] = useState(0);
 const source = sources[attempt];
 // A bounded source list prevents retries looping if both providers lack an image.
 return source
  ? <img key={source} src={source} alt="" width={32} height={32} className="sprite" referrerPolicy="no-referrer" onError={() => setAttempt(current => current + 1)} />
  : <span className="sprite number" aria-hidden="true">{String(slot).padStart(2, "0")}</span>;
}

export default function Home(){
 const [tournaments,setTournaments]=useState<Tournament[]>([]),[tournament,setTournament]=useState<Tournament|null>(null),[players,setPlayers]=useState<Player[]>([]),[query,setQuery]=useState(''),[selected,setSelected]=useState<Player|null>(null),[team,setTeam]=useState<Pokemon[]>([]),[loading,setLoading]=useState('tournaments'),[error,setError]=useState(''),[manual,setManual]=useState('');const sequence=useRef(0);
 async function loadTournaments(){setLoading('tournaments');setError('');try{const d=await api({action:'tournaments'});setTournaments(d.tournaments)}catch(e){setError((e as Error).message)}finally{setLoading('')}}
 useEffect(()=>{loadTournaments()},[]);
 async function chooseTournament(t:Tournament|null){const seq=++sequence.current;setTournament(t);setSelected(null);setTeam([]);setPlayers([]);setQuery('');setError('');if(!t)return;setLoading('roster');try{const d=await api({action:'roster',id:t.id});if(seq===sequence.current){setPlayers(d.players);if(d.name)setTournament({id:t.id,name:d.name})}}catch(e){if(seq===sequence.current)setError((e as Error).message)}finally{if(seq===sequence.current)setLoading('')}}
 async function choosePlayer(p:Player){const seq=++sequence.current;setSelected(p);setTeam([]);setError('');if(!p.team)return;setLoading('team');try{const d=await api({action:'team',path:p.team});if(seq===sequence.current)setTeam(d.team)}catch(e){if(seq===sequence.current)setError((e as Error).message)}finally{if(seq===sequence.current)setLoading('')}}
 useEffect(()=>{const context=(document as Document & {modelContext?:{registerTool:(tool:unknown,options:{signal:AbortSignal})=>void|Promise<void>}}).modelContext;if(!context)return;const lifecycle=new AbortController();try{Promise.resolve(context.registerTool({name:'search_rk9_players',description:'Select an RK9 tournament and search its public roster by player name.',inputSchema:{type:'object',properties:{tournamentId:{type:'string'},playerName:{type:'string'}},required:['tournamentId','playerName'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:true},execute:async(input:unknown)=>{const value=input as {tournamentId?:string;playerName?:string};if(!value||typeof value.tournamentId!=='string'||!/^[-\\w]{1,100}$/.test(value.tournamentId)||typeof value.playerName!=='string'||!value.playerName.trim())throw Error('Provide a valid tournament ID and player name.');const seq=++sequence.current;const d=await api({action:'roster',id:value.tournamentId});if(seq!==sequence.current)throw Error('Search superseded.');setTournament({id:value.tournamentId,name:d.name});setPlayers(d.players);setQuery(value.playerName);setSelected(null);setTeam([]);setError('');setLoading('');return {players:d.players.filter((p:Player)=>p.name.toLowerCase().includes(value.playerName!.toLowerCase())).slice(0,50)};}},{signal:lifecycle.signal})).catch(()=>{});}catch{}return()=>lifecycle.abort()},[]);
 const normalize=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();const matches=players.filter(p=>normalize(p.name).includes(normalize(query.trim())));
 return <main className="shell"><header className="mast"><span className="mark"><Layers size={25}/></span><h1>Team Sheet</h1><small>POKÉMON VGC / RK9</small></header><section className="controls" aria-label="Find a teamsheet"><div className="field"><label htmlFor="tournament">Tournament</label><Combobox items={tournaments} value={tournament} onValueChange={chooseTournament} isItemEqualToValue={(a:Tournament,b:Tournament)=>a.id===b.id} itemToStringLabel={(t:Tournament)=>t.name}><ComboboxInput id="tournament" placeholder={loading==='tournaments'?'Loading tournaments…':'Search tournaments…'}/><ComboboxContent><ComboboxEmpty>No matching tournaments</ComboboxEmpty><ComboboxList>{(t:Tournament)=><ComboboxItem key={t.id} value={t} className="min-h-12 text-base">{t.name}</ComboboxItem>}</ComboboxList></ComboboxContent></Combobox></div><div className="field"><label htmlFor="player">Player name</label><input id="player" className="search-input" placeholder="Type a player’s name…" value={query} disabled={!tournament||loading==='roster'} onChange={e=>{setQuery(e.target.value);setSelected(null);setTeam([]);sequence.current++;setLoading('')}} autoComplete="off"/></div></section><details className="manual"><summary>Have an RK9 tournament link?</summary><form onSubmit={e=>{e.preventDefault();let id=manual.trim();try{if(id.includes('://')){const u=new URL(id);if(!['rk9.gg','www.rk9.gg'].includes(u.hostname))throw Error();id=u.pathname.split('/').filter(Boolean)[1]||'';}if(!/^[A-Za-z0-9_-]+$/.test(id))throw Error();chooseTournament({id,name:'RK9 tournament'})}catch{setError('Paste an RK9 tournament or roster URL.')}}}><input aria-label="RK9 tournament URL" placeholder="Paste tournament or roster link" value={manual} onChange={e=>setManual(e.target.value)}/><button type="submit">Open tournament</button></form></details>
 {error&&<div className="notice" role="alert">{error}<button className="retry" onClick={()=>selected?choosePlayer(selected):tournament?chooseTournament(tournament):loadTournaments()}>Try again</button></div>}
 {loading&&<div aria-live="polite"><p className="muted" style={{marginTop:24}}>Loading {loading==='team'?'teamsheet':loading==='roster'?'players':'tournaments'}…</p><div className="skeleton-grid">{[0,1,2].map(i=><Skeleton key={i} className="h-44 rounded-xl bg-slate-200"/>)}</div></div>}
 {!loading&&!tournament&&<Empty className="empty-state"><EmptyHeader><Search size={28} className="mx-auto mb-3 text-blue-600"/><EmptyTitle>Find your opponent’s team</EmptyTitle><EmptyDescription>Choose a tournament, then search for a player to open their public teamsheet.</EmptyDescription></EmptyHeader></Empty>}
 {!loading&&tournament&&!selected&&<section><div className="section-head"><h2>{query?'Players':'Find a player'}</h2><span className="muted">{players.length.toLocaleString()} registered</span></div>{!query?<p className="muted">Enter a name above to search this tournament’s roster.</p>:matches.length?<div className="players">{matches.slice(0,50).map((p,i)=><button className="player" key={p.name+p.team+i} onClick={()=>choosePlayer(p)}><span><strong>{p.name}</strong><br/><small>{[p.division,p.country].filter(Boolean).join(' · ')}</small></span><small>{p.team?'View team →':'Not published'}</small></button>)}{matches.length>50&&<p className="muted">Keep typing to narrow down {matches.length} matches.</p>}</div>:<p className="muted">No players match “{query}”. Try a first or last name.</p>}</section>}
 {selected&&<section><div className="section-head"><h2>{selected.name}</h2><span className="muted">{selected.division}</span>{selected.team&&<a href={'https://rk9.gg'+selected.team} target="_blank" rel="noreferrer">Original on RK9 ↗</a>}</div>{!selected.team?<div className="empty-state"><h2>Teamsheet not published</h2><p>RK9 does not currently provide a public teamsheet for this player.</p></div>:<div className="team">{team.map((p,i)=><article className="pokemon" key={i}><header className="pokemon-head"><PokemonIcon key={p.name + (p.sprite || "")} name={p.name} fallback={p.sprite} slot={i+1}/><div><h3>{p.name}</h3>{p.tera&&<span className="tera">Tera · {p.tera}</span>}</div></header><dl className="details"><div><dt>Ability</dt><dd>{p.ability||'—'}</dd></div><div><dt>Held item</dt><dd>{heldItemLabel(p.item)}</dd></div></dl><ul className="moves">{p.moves.map((m,j)=><li key={j}>{m}</li>)}</ul>{p.extra&&<p className="muted px-5 pb-4">{p.extra}</p>}</article>)}</div>}</section>}<footer className="footer">Public teamsheets from RK9. Unofficial viewer; not affiliated with RK9 or Pokémon.</footer></main>
}
