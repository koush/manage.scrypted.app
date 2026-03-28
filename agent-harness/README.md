# Agent Harness for Scrypted Scripts

This harness tests whether an LLM agent can generate valid Scrypted scripts given the PROMPT.md documentation.

## Purpose

Evaluate if the documentation in PROMPT.md (plus SDK types) is sufficient for an AI agent to:
1. Generate syntactically correct TypeScript
2. Use proper Scrypted patterns (ScryptedDeviceBase, interfaces, etc.)
3. Implement various script types (switches, automation, mixins)

## Setup

```bash
npm install
```

## Usage

Run all tests sequentially:
```bash
npm test
```

Run all tests in parallel (faster):
```bash
npm test -- -p
# or
npm test -- --parallel
```

Run specific test:
```bash
npm test -- switch
npm test -- camera
npm test -- mixin
```

Run with verbose output:
```bash
npm test -- --verbose
```

## Configuration

Set environment variables for the OpenAI-compatible endpoint:
```bash
export OPENAI_BASE_URL='http://your-llm-server:8001/v1'
export OPENAI_API_KEY='your-api-key'
```

## Test Cases

| Test | Description | Key Patterns |
|------|-------------|--------------|
| Simple Switch | Basic OnOff implementation | ScryptedDeviceBase, turnOn/turnOff |
| Device Toggle | Settings + device control | getSettings, putSetting, setTimeout |
| Motion Light Automation | Event listeners + timers | device.listen(), clearTimeout |
| Notifier Suppressor Mixin | MixinProvider pattern | MixinDeviceBase, canMixin, getMixin |
| Camera Motion Light Loop | Self-triggering prevention | Cooldown logic, state tracking |
| Scene Controller | Multiple devices | Promise.all, device arrays |
| State Synchronizer | State mirroring | denoise option, event filtering |
| Battery Monitor | Polling with setInterval | Battery interface, periodic checks |
| Brightness Ramp | Gradual changes | setInterval, brightness ramping |

## Files

- `src/index.ts` - Main harness runner (supports parallel execution)
- `src/prompts.ts` - Assembles prompt from PROMPT.md + SDK types
- `src/tests.ts` - Test case definitions
- `src/sdk-types-trimmed.d.ts` - Essential SDK type declarations
- `output/` - Generated scripts (scratchpad)

## Adding New Tests

Add to `src/tests.ts`:
```typescript
{
  name: 'My Test',
  description: 'What this tests',
  request: `Create a script that...`,
  expectedInterfaces: ['OnOff', 'Settings'],
  expectedPattern: [
    /extends ScryptedDeviceBase/,
    /implements OnOff/,
    // Add patterns to verify generated code
  ],
}
```

## How It Works

1. Assembles system prompt from:
   - `../PROMPT.md` - Documentation
   - `sdk-types-trimmed.d.ts` - SDK type definitions

2. Sends prompt + test request to LLM endpoint

3. Agent uses `write_script` tool to save generated code

4. Validates:
   - TypeScript compilation (against SDK types)
   - Expected patterns present in code

5. Reports results

## Output Safety

All file writes are sanitized:
- No path separators allowed in filenames
- Only `.ts` extension permitted
- All files written to `output/` directory only

## Results

Current pass rate: **9/9 tests** ✅

The prompt provides sufficient context for an LLM to generate valid Scrypted scripts covering:
- Basic switches
- Settings/configuration
- Event-driven automation
- Loop prevention patterns
- Mixin-based device extension
- Multi-device control
- State synchronization
- Polling patterns
- Gradual state changes
