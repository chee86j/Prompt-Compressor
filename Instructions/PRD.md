# Prompt Compressor Web MVP - PRD

## Product Vision
Create a browser-based prompt compressor that lets users supply a long prompt, choose a compression ratio, and instantly view a compressed version. The interface must remain clean and intuitive while supporting two compression modes: a fast heuristic summarizer and a parity-oriented pipeline that mirrors the original Python flow via LLM APIs.

## Core Goal
Enable prompt engineers to choose between quick, offline-friendly compression and higher-fidelity API-driven compression from a single-page interface.

## Target Users
- Prompt engineers iterating on LLM prompts
- Demonstration audiences evaluating the compression concept
- Internal stakeholders reviewing UX before investing in full-feature build

## Key User Stories
1. As a user, I can paste or type my prompt into a large text input field.
2. As a user, I can adjust the desired compression percentage via preset controls (for example 10%, 20%, 30%).
3. As a user, I can select either heuristic compression or LLM compression depending on speed versus fidelity needs.
4. As a user, I can click a Compress button and see the revised prompt rendered below the controls.
5. As a user, I can copy the compressed prompt for reuse.

## Functional Requirements
- **Input Area**: multiline text area supporting large prompts, with placeholder guidance and live character count.
- **Compression Selector**:
  - Percentage selector (10-50% range, default 30%).
  - Mode toggle (Heuristic vs LLM Pipeline) with contextual descriptions of trade-offs and required API keys for LLM mode.
- **Action Button**: primary Compress button disabled when input is empty or required keys missing for the chosen mode.
- **Output Display**: read-only container showing the compressed prompt, including copy-to-clipboard affordance.
- **Feedback**: loading indicator during compression, inline error messaging if compression fails, and mode-specific status (e.g., API call progress).

## Compression Logic
- **Heuristic Mode**: JavaScript-based summarizer selecting key sentences using word-count heuristics; runs fully offline in the browser.
- **LLM Pipeline Mode**: Implements the six-step pipeline adapted from the Python project:
  1. Chunking: Markdown-aware segmentation honoring code fences and lists.
  2. Rating: Asynchronous scoring via chosen LLM (OpenAI or Anthropic) using provided intent context.
  3. Planning: Compute current versus target token budget from desired reduction.
  4. Compression Loop: Iteratively compress least-relevant chunks via LLM completions until target met or no progress.
  5. Recount: Recalculate chunk tokens to guide subsequent iterations.
  6. Stitch and Stats: Reconstruct final prompt and report metrics.
- Provide shared abstractions so new providers can plug into rating/compression stages.

## Non-Goals (For This Release)
- Multi-document sessions, persistence, or user accounts.
- Streaming output or real-time collaborative editing.
- Detailed diff visualization between original and compressed text.

## UX Principles
- Clean, single-column layout with clear hierarchy and concise explanatory text.
- Responsive adjustments for tablets and mobile.
- Neutral color palette, ample whitespace, typography optimized for readability.
- Clear state transitions (idle, processing, success, error) and validation for missing API keys.

## Acceptance Criteria
- Works in the latest Chrome, Firefox, and Edge with static hosting.
- Heuristic mode responds within one second for prompts up to five thousand characters.
- LLM mode handles API errors gracefully and surfaces clear guidance when credentials are missing.
- No console errors or uncaught exceptions during typical use.
- README documents setup for both modes, including environment variable configuration for API keys.

## Open Questions
- Should API credentials be stored in localStorage (with user consent) for convenience?
- Do we need rate-limit protection or batching for larger prompts in LLM mode?
- Should absolute token targets be offered alongside percentages?
