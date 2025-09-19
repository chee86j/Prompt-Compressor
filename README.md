# Prompt Compressor — Shape Every Word to Win

Prompt Compressor is the fastest way to turn sprawling prompts into laser-focused briefs your models can trust. Built for prompt engineers, product teams, and marketers, the app pairs a gorgeous, accessibility-first UI with smart compression logic so you can deliver clarity without sacrificing intent.

## Why Teams Choose Prompt Compressor

- **Stay On-Brand Instantly** — Curate prompts with a refined, sky-blue workspace that keeps writers calm and focused.
- **Right-Sized Prompts on Demand** — Dial in your target reduction with one tap and see the impact immediately.
- **Explain the Headlines** — Our heuristic engine preserves high-signal statements and intent keywords so your models never miss the brief.
- **Team-Friendly Experience** — Responsive layout, keyboard-friendly controls, and copy-to-clipboard helpers make live collaboration effortless.
- **Future-Proof Architecture** — A toggle for the upcoming LLM pipeline keeps you ready to plug in OpenAI or Anthropic workflows the moment you want parity with the original Python tool.

## Feature Highlights

| Experience | What You Get |
| --- | --- |
| Elegant Control Center | Adjustable compression percentages (10% to 50%), mode toggles, and API key fields wrapped in a polished sky-blue theme. |
| Smart Feedback Loop | Real-time word/character counts, warning banners when reductions push the limits, and success states that announce themselves. |
| Copy-Ready Output | Read-only preview with keyboard focus support and a single-click copy button for handoff into your IDE, CMS, or conversation with an LLM. |
| Built for Every Screen | Mobile-first design, flexible panels, and touch-sized targets ensure the experience travels from desktop to tablet to phone. |
| Extensible Core | Strategies are modular—today you get an in-browser heuristic compressor; tomorrow you can drop in the six-step LLM pipeline via our adapter interfaces. |

## Tour the Interface

1. **Paste or write** your long-form prompt into the spacious editor.
2. **Choose your reduction** using the segmented control (you can always tweak it later).
3. **Refine the intent** field to highlight what absolutely must survive (the heuristic gives those sentences extra weight).
4. **Press Compress** and watch the condensed prompt arrive with metrics for original, target, and final token counts.
5. **Copy and ship**—the call-to-action button is always within keyboard reach.

> LLM pipeline mode is on the roadmap. The toggle is already wired into the UI so you can practise the workflow and be ready for full parity release.

## Run It Locally

```bash
# from the project root
cd web-app

# install dependencies
npm install

# launch the dev server (Vite)
npm run dev
```

Vite will print a local URL (usually `http://127.0.0.1:5173`). Open it in your favourite browser and explore.

### Optional: Quality Checks

```bash
# lint the JavaScript source
npm run lint

# run Jest unit tests for the heuristic strategy
npm run test
```

## Who This Is For

- **Prompt Engineers** needing to control tokens without losing nuance.
- **Product Managers** shaping conversational flows and onboarding sequences.
- **Marketing Directors** crafting campaigns that land perfectly within model limits.
- **Enablement Leads** teaching teams how to write high-impact prompts faster.

## Roadmap Snapshot

- ✅ Polished heuristic compression with UX crafted for creative teams.
- 🔄 Adapter-ready strategy layer prepared for the LLM pipeline release.
- 🔜 Secure proxy kit for OpenAI/Anthropic keys, streaming progress indicators, and guided templates for popular use cases.

## Spread the Word

If Prompt Compressor saves you time, share it with your team—or tell us what should come next. We are building the simplest, most satisfying way to make every token count.