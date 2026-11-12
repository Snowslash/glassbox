// Transport only. Descriptors own file identities, refusal text and science.
// A caller may omit hash for a schema-only contract; pinned validators reject
// missing digests. No shared cache, lesson state or fallback recording.
export async function readVerifiedBundle(descriptor, {
  signal, fetch = (url, options) => globalThis.fetch(url, options), hash,
} = {}) {
  const values = {}, hashes = {};
  try {
    signal?.throwIfAborted();
    for (const [key, url] of Object.entries(descriptor.files)) {
      const response = await fetch(url, {signal, cache:'no-cache'});
      signal?.throwIfAborted();
      if (!response.ok) throw Error(`Data request failed (${response.status}).`);
      const bytes = new Uint8Array(await response.arrayBuffer());
      signal?.throwIfAborted();
      if (hash) hashes[key] = await hash(bytes);
      signal?.throwIfAborted();
      descriptor.verifyHash?.(key, hashes[key]);
      signal?.throwIfAborted();
      values[key] = JSON.parse(new TextDecoder().decode(bytes));
    }
    const result = await descriptor.validate(values, hashes);
    signal?.throwIfAborted();
    return result;
  } catch (error) {
    // A late failure from a transport ignoring AbortSignal is still cancelled.
    signal?.throwIfAborted();
    throw error;
  }
}
