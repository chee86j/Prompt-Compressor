# Prompt Compressor Web MVP - Architecture & UX Blueprint

## UI Composition
- **Shell Layout**: single-page view with vertical stack (header, controls card, output card) using responsive breakpoints (desktop two-column split at 960px).
- **Header**: product name, mode explanation, link to docs.
- **Controls Card**:
  - Prompt textarea (autosize up to 60vh) with character/word counts and aria-label.
  - Compression percentage selector (segmented buttons: 10, 20, 30, 40, 50) with keyboard support.
  - Mode toggle (radio group) switching between Heuristic and LLM Pipeline; include inline helper text describing requirements.
  - Intent input (optional) surfaced only in LLM mode.
  - API key inputs (OpenAI, Anthropic) collapsed by default; reveal when LLM mode selected.
  - Primary `Compress` button plus secondary `Clear` button.
  - Status row for validation messages and inline loaders.
- **Output Card**:
  - Title bar showing selected mode and ratio.
  - Read-only `<pre>` for compressed prompt with copy button (accessible via keyboard).
  - Metrics strip (original length, estimated tokens, reduction achieved, duration) when available.

## State Model
```
appState = {
  promptText: '',
  compressionRatio: 0.3,
  compressionMode: 'heuristic' | 'llm',
  authorIntent: '',
  apiKeys: {
    openai: '',
    anthropic: ''
  },
  includeProvider: 'auto' | 'openai' | 'anthropic',
  status: 'idle' | 'loading' | 'success' | 'error',
  errors: [],
  output: {
    compressedText: '',
    metrics: {
      originalTokens: null,
      targetTokens: null,
      finalTokens: null,
      durationMs: null
    }
  }
}
```
- Store implemented as observable module with `getState`, `setState`, `subscribe` functions.
- Derived selectors: `canSubmit`, `needsApiKey`, `isHeuristic` to drive UI enablement.

## Compression Strategy Interfaces
```
export function compressPrompt({
  text,
  ratio,
  mode,
  intent,
  provider,
  apiKeys
}) => Promise<CompressionResult>
```
- Strategy registry resolves to `heuristicStrategy` or `llmPipelineStrategy` based on mode and provider availability.
- `CompressionResult` includes `compressedText`, `metrics`, and optional `warnings`.
- Shared utility for token estimation uses `@dqbd/tiktoken` via proxy; fallback to word count on frontend.

## LLM Pipeline Service Contract
- REST endpoint `/api/compress` (POST) expecting payload `{ text, ratio, intent, provider, apiKeys? }`.
- Proxy resolves provider based on env vars unless client-supplied key provided.
- Response shape `{ compressedText, metrics, chunks, summary }` aligning with Python outputs.
- Additional endpoints:
  - `/api/tokenize` for accurate counts.
  - `/api/providers` to list available credentials (optional).

## Data Flow (LLM Mode)
1. UI validates inputs and emits `compress` action.
2. Store switches to `loading`; `compressionOrchestrator` invokes selected strategy.
3. `llmPipelineStrategy` calls proxy `/api/compress`; proxy orchestrates six steps and returns result.
4. Orchestrator updates store with response, sets status to `success`, surfaces metrics.
5. UI renders output card and resets loaders; errors funnel to toast/inline message area.

## Accessibility Checklist
- All interactive controls reachable via keyboard (`tabindex`, `aria-pressed` for segmented buttons).
- Textarea labeled and announces remaining character budget.
- Mode toggle uses native radio inputs for screen-reader friendliness.
- Loading states announced using `aria-live="polite"` region.
- Copy button exposes text feedback (tooltip + aria-live confirmation).

## Visual Design Tokens
- **Colors**: neutral background `#f5f7fa`, primary accent `#2f6fed`, warning `#d14343`, success `#2b9b6b`.
- **Typography**: `font-family: 'Inter', sans-serif;` base size 16px (1rem), headings scaled (1.5rem, 1.25rem).
- **Spacing Scale**: `4px * n` increments (4, 8, 12, 16, 24, 32).
- **Radius**: 12px cards, 999px pills.
- **Shadows**: subtle drop shadow for cards `0 8px 20px rgba(15,23,42,0.08)`.

## Responsive Breakpoints
- Mobile-first styles.
- `@media (min-width: 600px)`: increase padding, two-column layout for controls metrics.
- `@media (min-width: 960px)`: split layout horizontally (controls left 45%, output right 55%).

## Risks & Mitigations
- **API Latency / Rate Limits**: apply proxy-level concurrency guard and exponential backoff.
- **Token Accuracy**: fallback logic ensures graceful degradation with warning banner.
- **Security**: strongly encourage proxy deployment; display caution when user inputs keys client-side.
- **Heuristic Quality**: provide helper tooltip clarifying trade-offs; log improvements backlog.
