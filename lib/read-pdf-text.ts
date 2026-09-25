/** Read PDF text without ReadableStream async iteration, which Safari may lack. */
export async function readPdfText<T>(page: {
 streamTextContent(): ReadableStream<{ items: T[] }>;
}): Promise<{ items: T[] }> {
 const reader = page.streamTextContent().getReader();
 const items: T[] = [];
 try {
  while (true) {
   const { value, done } = await reader.read();
   if (done) break;
   for (const item of value.items) items.push(item);
  }
  return { items };
 } catch (error) {
  await reader.cancel().catch(() => {});
  throw error;
 } finally {
  reader.releaseLock();
 }
}
