// Tolerant JSON parser for agent output. LLMs occasionally emit slightly
// malformed JSON: unescaped quotes inside strings, smart quotes, trailing
// commas, hanging text outside the object. Try strict parse first, then
// fall back to jsonrepair, then surface a useful error.

import { jsonrepair } from 'jsonrepair';

export function parseAgentJson<T>(content: string): T {
  const match = content.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('No JSON object found in agent response');
  const raw = match[0];

  try {
    return JSON.parse(raw) as T;
  } catch {
    try {
      return JSON.parse(jsonrepair(raw)) as T;
    } catch (err) {
      throw new Error(
        `Could not parse agent JSON: ${err instanceof Error ? err.message : 'unknown'}`
      );
    }
  }
}
