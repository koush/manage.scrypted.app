import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Path to PROMPT.md (single source of truth)
const PROMPT_FILE = '../../src/scripts/PROMPT.md';

// Path to trimmed SDK types (single source of truth)
const SDK_TYPES_FILE = '../../src/scripts/sdk-types-trimmed.d.ts';

function readFileIfExists(filepath: string): string {
  const fullPath = path.join(__dirname, filepath);
  try {
    return fs.readFileSync(fullPath, 'utf-8');
  } catch {
    console.warn(`Warning: Could not read ${filepath}`);
    return '';
  }
}

export function assembleSystemPrompt(): string {
  const parts: string[] = [];

  // Add PROMPT.md first
  const prompt = readFileIfExists(PROMPT_FILE);
  if (prompt) {
    parts.push(prompt);
    parts.push('');
  } else {
    console.warn('Warning: PROMPT.md not found');
  }

  // Add SDK type definitions
  const types = readFileIfExists(SDK_TYPES_FILE);
  if (types) {
    parts.push('---');
    parts.push('');
    parts.push('# SDK Type Definitions');
    parts.push('');
    parts.push('The following TypeScript definitions are available globally in the script context. NO IMPORTS ARE NEEDED - these types are automatically available.');
    parts.push('');
    parts.push('```typescript');
    parts.push(types);
    parts.push('```');
  } else {
    console.warn('Warning: SDK types not found');
  }

  return parts.join('\n');
}

export function getPromptStats(): { promptSize: number; promptLines: number; typesSize: number; typesLines: number } {
  const prompt = readFileIfExists(PROMPT_FILE);
  const types = readFileIfExists(SDK_TYPES_FILE);
  
  return {
    promptSize: prompt.length,
    promptLines: prompt.split('\n').length,
    typesSize: types.length,
    typesLines: types.split('\n').length,
  };
}
