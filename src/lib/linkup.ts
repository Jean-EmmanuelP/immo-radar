// LinkUp SDK wrapper — every search MUST use depth='deep'.
// Never instantiate LinkupClient directly elsewhere.

import { LinkupClient } from 'linkup-sdk';

let _client: LinkupClient | null = null;

function getClient(): LinkupClient {
  if (!_client) {
    const apiKey = process.env.LINKUP_API_KEY;
    if (!apiKey) throw new Error('Missing LINKUP_API_KEY env var');
    _client = new LinkupClient({ apiKey });
  }
  return _client;
}

export async function linkupStructured<T = Record<string, unknown>>(
  query: string,
  schema: Record<string, unknown>,
): Promise<{ data: T; sources: Array<{ name: string; url: string }> }> {
  const client = getClient();
  const res = await client.search({
    query,
    depth: 'deep',
    outputType: 'structured',
    structuredOutputSchema: schema,
    includeSources: true,
  });
  return res as { data: T; sources: Array<{ name: string; url: string }> };
}

export async function linkupSourcedAnswer(query: string) {
  const client = getClient();
  return client.search({
    query,
    depth: 'deep',
    outputType: 'sourcedAnswer',
    includeInlineCitations: true,
  });
}
