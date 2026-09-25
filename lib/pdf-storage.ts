import type { PdfRoster } from './pdf-teams';
// Store the parsed roster, not the source PDF. No uploaded data leaves this device.
const database='rk9-pdf-roster';
async function db(): Promise<IDBDatabase> {
 return new Promise((resolve,reject)=>{
  const request=indexedDB.open(database,1);
  request.onupgradeneeded=()=>request.result.createObjectStore('rosters');
  request.onsuccess=()=>resolve(request.result);
  request.onerror=()=>reject(request.error);
 });
}
export async function storedPdf(write?: PdfRoster | null): Promise<PdfRoster | undefined> {
 const connection=await db();
 try {
  return await new Promise((resolve,reject)=>{
   const tx=connection.transaction('rosters',write===undefined?'readonly':'readwrite');
   const store=tx.objectStore('rosters');
   const request=write===undefined?store.get('current'):write===null?store.delete('current'):store.put(write,'current');
   tx.oncomplete=()=>resolve(write===undefined?request.result:write??undefined);
   tx.onerror=()=>reject(tx.error);
   tx.onabort=()=>reject(tx.error);
  });
 } finally { connection.close(); }
}
