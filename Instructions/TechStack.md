# Prompt Compressor Web MVP - Tech Stack Decisions

## Platform
- **Runtime**: Browser (ES2020 target) with optional Node-based proxy for LLM calls when required.
- **Language**: Plain JavaScript (ES modules); no TypeScript per requirement.
- **Markup & Styling**: Semantic HTML5 plus modern CSS (Flexbox/Grid) with design tokens.

## Architecture
- UI delivered as static assets (`index.html`, `styles/`, `src/`).
- Compression orchestrator module exposes two strategies: `heuristic` (local) and `llmPipeline` (remote).
- LLM pipeline calls proxied through a lightweight Node/Express layer to keep API keys server-side (recommended) or via browser fetch when the user supplies keys directly (fallback).

## Dependencies
- **UI**: No heavy frameworks; rely on native DOM APIs.
- **State Management**: Simple observable store implemented in-house.
- **HTTP**: Native fetch; if a proxy is used, the Node side leverages `node-fetch` or native fetch in Node 20.
- **LLM SDKs**:
  - OpenAI: `openai` npm package (Responses API) when running through the proxy.
  - Anthropic: `@anthropic-ai/sdk` for the alternative provider.
- **Tokenizer**: `@dqbd/tiktoken` (WASM) loaded in the proxy for accurate token counts; browser fallback uses word counts.
- **Utility**: Optional `clipboard-copy` for robust copying support.

## Tooling
- **Dev Server**: `http-server` (frontend) plus optional `nodemon` for the proxy during development.
- **Linting**: ESLint with `eslint-config-standard` (single quotes enforced).
- **Formatting**: Prettier optional; ESLint handles core style.
- **Testing**:
  - Browser logic: Jest or Vitest targeting ES modules (run via jsdom) for compression heuristics.
  - LLM pipeline: integration tests using mocked SDK clients (for example `nock`).

## Compression Strategies
- **Heuristic**:
  - Sentence segmentation via regex.
  - Word-count token estimation and scoring by position, length, and keyword frequency.
  - Deterministic selection to reach the target ratio.
- **LLM Pipeline**:
  - Port Python algorithm: chunking, rating, planning, compression loop, recount, stitch.
  - Abstractions `TokenizerAdapter`, `LlmClient`, `CompressionStrategy` to decouple providers.
  - Concurrency management and retry/backoff for API rate limits.

## Security Considerations
- Encourage proxy deployment so API keys remain server-side.
- When browser-only mode is used, store keys in memory (never persist) and warn users of risks.
- Implement rate limiting and input size checks on the proxy.

## Deployment
- Frontend: static hosting (Netlify, Vercel, GitHub Pages).
- Proxy: optional Node service deployable to Render, Fly.io, or Vercel Edge Functions.
- Environment variables for the proxy: `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, concurrency limits.

## Future Enhancements
- Add provider selection with auto-detection of available keys.
- Support streaming responses for compression loop progress.
- Persist user preferences (mode, percentage) in localStorage once security is reviewed.
