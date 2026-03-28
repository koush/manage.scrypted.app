import OpenAI from 'openai';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import { assembleSystemPrompt, getPromptStats } from './prompts.js';
import { TEST_CASES, TestCase } from './tests.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.join(__dirname, '..', 'output');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Check for required environment variables
const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_BASE_URL) {
  console.error('Error: OPENAI_BASE_URL environment variable is required');
  process.exit(1);
}
if (!OPENAI_API_KEY) {
  console.error('Error: OPENAI_API_KEY environment variable is required');
  process.exit(1);
}

// OpenAI client configured from environment
const client = new OpenAI({
  baseURL: OPENAI_BASE_URL,
  apiKey: OPENAI_API_KEY,
});

// Tool definition for writing scripts
const tools: OpenAI.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'write_script',
      description: 'Write the generated TypeScript script to a file. Use this to save your completed script. The filename should be descriptive (e.g., "motion-light.ts"). Write ONLY the TypeScript code, no markdown fences.',
      parameters: {
        type: 'object',
        properties: {
          filename: {
            type: 'string',
            description: 'The filename for the script (e.g., "motion-light.ts"). Must end in .ts and contain no path separators.',
          },
          content: {
            type: 'string',
            description: 'The complete TypeScript source code for the Scrypted script. No markdown, just the raw TypeScript.',
          },
        },
        required: ['filename', 'content'],
      },
    },
  },
];

interface WriteScriptArgs {
  filename: string;
  content: string;
}

function sanitizeFilename(filename: string): string | null {
  // Remove any path separators to prevent directory traversal
  const basename = path.basename(filename);
  
  // Must end in .ts
  if (!basename.endsWith('.ts')) {
    return null;
  }
  
  // No path separators allowed
  if (basename !== filename) {
    return null;
  }
  
  // Only allow alphanumeric, dash, underscore, and .ts extension
  if (!/^[a-zA-Z0-9_-]+\.ts$/.test(basename)) {
    return null;
  }
  
  return basename;
}

function handleWriteScript(args: WriteScriptArgs): { success: boolean; path?: string; error?: string } {
  const sanitized = sanitizeFilename(args.filename);
  
  if (!sanitized) {
    return { 
      success: false, 
      error: `Invalid filename: "${args.filename}". Must be alphanumeric with .ts extension, no path separators.` 
    };
  }
  
  const outputPath = path.join(OUTPUT_DIR, sanitized);
  
  // Double-check we're still in output directory (belt and suspenders)
  const resolved = path.resolve(outputPath);
  if (!resolved.startsWith(path.resolve(OUTPUT_DIR))) {
    return { success: false, error: 'Path traversal attempt blocked' };
  }
  
  try {
    fs.writeFileSync(outputPath, args.content, 'utf-8');
    return { success: true, path: outputPath };
  } catch (err) {
    return { success: false, error: `Failed to write file: ${err}` };
  }
}

function validateTypescript(filepath: string): { valid: boolean; errors?: string } {
  try {
    // Run tsc --noEmit on the whole project (includes global types from tsconfig)
    execSync(`npx tsc --noEmit`, {
      cwd: path.join(__dirname, '..'),
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return { valid: true };
  } catch (err: any) {
    const stderr = err.stderr || err.stdout || err.message;
    // Filter to just errors from this file
    const filename = path.basename(filepath);
    const errorLines = stderr.split('\n')
      .filter((line: string) => line.includes(`output/${filename}`))
      .slice(0, 5)
      .join('\n');
    return { valid: false, errors: errorLines || stderr };
  }
}

function checkPatterns(content: string, patterns: RegExp[]): { passed: string[]; failed: string[] } {
  const passed: string[] = [];
  const failed: string[] = [];
  
  for (const pattern of patterns) {
    if (pattern.test(content)) {
      passed.push(pattern.toString());
    } else {
      failed.push(pattern.toString());
    }
  }
  
  return { passed, failed };
}

async function runTest(
  systemPrompt: string, 
  test: TestCase,
  verbose: boolean = false
): Promise<{ 
  success: boolean; 
  files: string[]; 
  compileErrors?: string;
  patternResults?: { passed: string[]; failed: string[] };
}> {
  console.log(`\n${'─'.repeat(60)}`);
  console.log(`Test: ${test.name}`);
  console.log('─'.repeat(60));
  
  if (verbose) {
    console.log(`Request:\n${test.request.slice(0, 200)}...\n`);
  }
  
  const files: string[] = [];
  
  try {
    const response = await client.chat.completions.create({
      model: 'local-model',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: test.request },
      ],
      tools,
      tool_choice: 'auto',
      temperature: 0.3, // Lower temperature for more deterministic code
    });

    const message = response.choices[0]?.message;
    
    if (!message) {
      console.log('✗ No response from model');
      return { success: false, files };
    }

    // Handle tool calls
    if (message.tool_calls && message.tool_calls.length > 0) {
      for (const toolCall of message.tool_calls) {
        if (toolCall.function.name === 'write_script') {
          try {
            const args: WriteScriptArgs = JSON.parse(toolCall.function.arguments);
            const result = handleWriteScript(args);
            
            if (result.success) {
              files.push(result.path!);
              console.log(`✓ Wrote: ${path.basename(result.path!)}`);
            } else {
              console.log(`✗ Tool call failed: ${result.error}`);
            }
          } catch (err) {
            console.log(`✗ Failed to parse tool arguments: ${err}`);
          }
        }
      }
    } else if (message.content) {
      // Model responded with text instead of tool call
      // Try to extract code from markdown fences
      console.log('⚠ Model responded with text (no tool call). Extracting code...');
      const codeMatch = message.content.match(/```(?:typescript|ts)?\n([\s\S]*?)```/);
      if (codeMatch) {
        const filename = `${test.name.toLowerCase().replace(/\s+/g, '-')}.ts`;
        const result = handleWriteScript({ filename, content: codeMatch[1].trim() });
        if (result.success) {
          files.push(result.path!);
          console.log(`✓ Extracted: ${path.basename(result.path!)}`);
        }
      } else {
        console.log('✗ No code block found in response');
      }
    }

    // Validate generated files
    if (files.length > 0) {
      const filepath = files[0];
      const content = fs.readFileSync(filepath, 'utf-8');
      
      // Check TypeScript compilation
      console.log('\nValidating TypeScript...');
      const compileResult = validateTypescript(filepath);
      if (compileResult.valid) {
        console.log('✓ TypeScript compiles successfully');
      } else {
        console.log('✗ TypeScript compilation failed:');
        console.log(`  ${compileResult.errors?.split('\n').slice(0, 3).join('\n  ')}`);
        return { success: false, files, compileErrors: compileResult.errors };
      }
      
      // Check patterns
      console.log('\nChecking expected patterns...');
      const patternResults = checkPatterns(content, test.expectedPattern);
      if (patternResults.failed.length === 0) {
        console.log(`✓ All ${patternResults.passed.length} patterns found`);
      } else {
        console.log(`✓ Found: ${patternResults.passed.length}/${test.expectedPattern.length}`);
        for (const p of patternResults.failed) {
          console.log(`  ✗ Missing: ${p}`);
        }
      }
      
      return { 
        success: compileResult.valid && patternResults.failed.length === 0, 
        files,
        patternResults,
      };
    }

    return { success: false, files };
  } catch (err) {
    console.log(`✗ Error: ${err}`);
    return { success: false, files };
  }
}

async function main() {
  const args = process.argv.slice(2);
  const verbose = args.includes('-v') || args.includes('--verbose');
  const testFilter = args.find(a => !a.startsWith('-'));
  
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║        Scrypted Script Agent Harness                     ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log(`\nOutput directory: ${OUTPUT_DIR}`);
  
  // Assemble and check prompt
  console.log('\nAssembling system prompt...');
  const systemPrompt = assembleSystemPrompt();
  const stats = getPromptStats();
  console.log(`Prompt size: ${(systemPrompt.length / 1024).toFixed(1)} KB (${stats.promptLines} lines)`);
  console.log(`SDK types: ${(stats.typesSize / 1024).toFixed(1)} KB (${stats.typesLines} lines)`);
  
  // Filter tests if specified
  const testsToRun = testFilter 
    ? TEST_CASES.filter(t => t.name.toLowerCase().includes(testFilter.toLowerCase()))
    : TEST_CASES;
  
  if (testsToRun.length === 0) {
    console.log('\nNo tests match filter:', testFilter);
    return;
  }
  
  console.log(`\nRunning ${testsToRun.length} test(s)${args.includes('-p') || args.includes('--parallel') ? ' in parallel' : ''}...`);
  
  const results: { test: string; success: boolean; duration: number }[] = [];
  
  // Check for parallel flag
  const runParallel = args.includes('-p') || args.includes('--parallel');
  
  if (runParallel) {
    // Run all tests in parallel
    const promises = testsToRun.map(async (test) => {
      const start = Date.now();
      const result = await runTest(systemPrompt, test, verbose);
      const duration = Date.now() - start;
      return { test: test.name, success: result.success, duration };
    });
    const parallelResults = await Promise.all(promises);
    results.push(...parallelResults);
  } else {
    // Run tests sequentially
    for (const test of testsToRun) {
      const start = Date.now();
      const result = await runTest(systemPrompt, test, verbose);
      const duration = Date.now() - start;
      results.push({ test: test.name, success: result.success, duration });
    }
  }
  
  // Summary
  console.log('\n' + '═'.repeat(60));
  console.log('SUMMARY');
  console.log('═'.repeat(60));
  
  for (const r of results) {
    const status = r.success ? '✓ PASS' : '✗ FAIL';
    console.log(`${status} | ${r.test} (${r.duration}ms)`);
  }
  
  const passed = results.filter(r => r.success).length;
  console.log(`\n${passed}/${results.length} tests passed`);
  
  // List generated files
  const generatedFiles = fs.readdirSync(OUTPUT_DIR).filter(f => f.endsWith('.ts'));
  if (generatedFiles.length > 0) {
    console.log(`\nGenerated files in output/:`);
    for (const f of generatedFiles) {
      console.log(`  - ${f}`);
    }
  }
}

main().catch(console.error);
