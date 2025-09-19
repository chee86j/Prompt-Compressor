import './style.css';
import { compressPrompt } from './strategies/index.js';
import { getState, selectors, setState, subscribe, resetState } from './state/store.js';

/*
 * App bootstrap: render shell, bind events, and keep UI synced with store changes.
 */
const ratioOptions = [0.1, 0.2, 0.3, 0.4, 0.5];

const formatPercent = (ratio) => `${Math.round(ratio * 100)}%`;
const formatMetric = (label, value) => `<div class="metric"><span>${label}</span><strong>${value}</strong></div>`;

const createAppShell = (root) => {
  root.innerHTML = `
    <header class="app-header">
      <div>
        <h1>Prompt Compressor</h1>
        <p class="tagline">Condense long prompts using heuristic or LLM-driven compression.</p>
      </div>
      <a class="docs-link" href="#" data-role="docs-link">View Docs</a>
    </header>
    <main class="app-main">
      <section class="panel controls-panel" aria-label="Compression controls">
        <div class="field">
          <label class="field-label" for="prompt-input">Prompt</label>
          <textarea id="prompt-input" class="textarea" rows="12" placeholder="Paste or write your prompt here" aria-describedby="prompt-counts"></textarea>
          <div id="prompt-counts" class="field-hint"></div>
        </div>
        <div class="field">
          <span class="field-label">Compression target</span>
          <div class="ratio-group" data-role="ratio-group"></div>
        </div>
        <div class="field">
          <span class="field-label">Compression mode</span>
          <div class="mode-group">
            <label class="mode-option">
              <input type="radio" name="mode" value="heuristic" checked />
              <div>
                <span class="mode-title">Heuristic</span>
                <span class="mode-hint">Fast, runs locally with deterministic rules.</span>
              </div>
            </label>
            <label class="mode-option">
              <input type="radio" name="mode" value="llm" />
              <div>
                <span class="mode-title">LLM Pipeline</span>
                <span class="mode-hint">High fidelity, mirrors Python compression loop.</span>
              </div>
            </label>
          </div>
        </div>
        <div class="field" data-role="intent-field">
          <label class="field-label" for="intent-input">Author intent (optional)</label>
          <input id="intent-input" class="input" type="text" placeholder="Highlight what the model must retain" />
        </div>
        <div class="field" data-role="provider-field">
          <label class="field-label" for="provider-select">LLM provider</label>
          <select id="provider-select" class="input">
            <option value="auto">Auto</option>
            <option value="openai">OpenAI</option>
            <option value="anthropic">Anthropic</option>
          </select>
        </div>
        <div class="field collapsible" data-role="key-field">
          <label class="field-label">API keys</label>
          <div class="key-grid">
            <label class="key-input">
              <span>OpenAI</span>
              <input type="password" data-role="openai-key" class="input" placeholder="sk-..." autocomplete="off" />
            </label>
            <label class="key-input">
              <span>Anthropic</span>
              <input type="password" data-role="anthropic-key" class="input" placeholder="anthropic-..." autocomplete="off" />
            </label>
          </div>
          <p class="field-hint">Keys stay in memory only. Prefer running via a secure proxy.</p>
        </div>
        <div class="actions">
          <button type="button" class="btn btn-primary" data-role="compress">Compress</button>
          <button type="button" class="btn" data-role="clear">Clear</button>
        </div>
        <div class="status" aria-live="polite" data-role="status"></div>
      </section>
      <section class="panel output-panel" aria-label="Compressed prompt">
        <header class="output-header">
          <div>
            <h2>Compressed Output</h2>
            <span class="output-meta" data-role="output-meta"></span>
          </div>
          <button type="button" class="btn btn-ghost" data-role="copy" aria-live="polite">Copy</button>
        </header>
        <pre class="output-text" data-role="output-text" tabindex="0"></pre>
        <div class="metrics" data-role="metrics"></div>
        <div class="warnings" data-role="warnings" aria-live="polite"></div>
      </section>
    </main>
  `;

  const ratioGroup = root.querySelector('[data-role="ratio-group"]');
  ratioOptions.forEach((ratio) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'ratio-button';
    button.dataset.ratio = String(ratio);
    button.textContent = formatPercent(ratio);
    button.setAttribute('aria-pressed', 'false');
    ratioGroup.appendChild(button);
  });

  return {
    promptInput: root.querySelector('#prompt-input'),
    countsLabel: root.querySelector('#prompt-counts'),
    ratioButtons: Array.from(root.querySelectorAll('.ratio-button')),
    modeRadios: Array.from(root.querySelectorAll('input[name="mode"]')),
    intentField: root.querySelector('[data-role="intent-field"]'),
    intentInput: root.querySelector('#intent-input'),
    providerField: root.querySelector('[data-role="provider-field"]'),
    providerSelect: root.querySelector('#provider-select'),
    keyField: root.querySelector('[data-role="key-field"]'),
    openaiKeyInput: root.querySelector('[data-role="openai-key"]'),
    anthropicKeyInput: root.querySelector('[data-role="anthropic-key"]'),
    compressButton: root.querySelector('[data-role="compress"]'),
    clearButton: root.querySelector('[data-role="clear"]'),
    statusBox: root.querySelector('[data-role="status"]'),
    outputMeta: root.querySelector('[data-role="output-meta"]'),
    outputText: root.querySelector('[data-role="output-text"]'),
    metricsBox: root.querySelector('[data-role="metrics"]'),
    warningsBox: root.querySelector('[data-role="warnings"]'),
    copyButton: root.querySelector('[data-role="copy"]')
  };
};

const syncRatioButtons = (refs, ratio) => {
  refs.ratioButtons.forEach((button) => {
    const isActive = Number.parseFloat(button.dataset.ratio) === ratio;
    button.classList.toggle('is-active', isActive);
    button.setAttribute('aria-pressed', String(isActive));
  });
};

const syncCounts = (refs, text) => {
  const characters = text.length;
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  refs.countsLabel.textContent = `${words} words | ${characters} characters`;
};

const syncModeVisibility = (refs, state) => {
  const isHeuristic = state.compressionMode === 'heuristic';
  refs.intentField.classList.toggle('is-hidden', isHeuristic);
  refs.providerField.classList.toggle('is-hidden', isHeuristic);
  refs.keyField.classList.toggle('is-hidden', isHeuristic);
};

const syncButtons = (refs, state) => {
  const canSubmit = selectors.canSubmit(state);
  refs.compressButton.disabled = !canSubmit || state.status === 'loading';
  refs.clearButton.disabled = state.status === 'loading';
  refs.copyButton.disabled = !state.output.compressedText;
};

const syncStatus = (refs, state) => {
  const statusMessages = [];
  if (state.status === 'loading') {
    statusMessages.push('Compressing prompt...');
  }
  if (state.errors.length > 0) {
    state.errors.forEach((message) => statusMessages.push(message));
  }
  refs.statusBox.textContent = statusMessages.join(' ');
  refs.statusBox.classList.toggle('is-error', state.errors.length > 0);
};

const syncOutput = (refs, state) => {
  refs.outputMeta.textContent = `${formatPercent(state.compressionRatio)} | ${state.compressionMode.toUpperCase()}`;
  refs.outputText.textContent = state.output.compressedText || 'Compressed prompt will appear here.';
  if (!state.output.compressedText) {
    refs.outputText.classList.add('is-empty');
  } else {
    refs.outputText.classList.remove('is-empty');
  }
  const metrics = state.output.metrics;
  if (metrics.originalTokens !== null) {
    refs.metricsBox.innerHTML = [
      formatMetric('Original tokens', metrics.originalTokens),
      formatMetric('Target tokens', metrics.targetTokens),
      formatMetric('Final tokens', metrics.finalTokens),
      formatMetric('Duration', `${metrics.durationMs.toFixed(1)} ms`)
    ].join('');
  } else {
    refs.metricsBox.innerHTML = '';
  }
  if (state.output.warnings && state.output.warnings.length > 0) {
    refs.warningsBox.innerHTML = state.output.warnings
      .map((warning) => `<p class="warning">${warning}</p>`)
      .join('');
  } else {
    refs.warningsBox.innerHTML = '';
  }
};

const attachEventHandlers = (refs) => {
  refs.promptInput.addEventListener('input', (event) => {
    setState({ promptText: event.target.value });
  });

  refs.intentInput.addEventListener('input', (event) => {
    setState({ authorIntent: event.target.value });
  });

  refs.providerSelect.addEventListener('change', (event) => {
    setState({ includeProvider: event.target.value });
  });

  refs.openaiKeyInput.addEventListener('input', (event) => {
    setState({ apiKeys: { openai: event.target.value } });
  });

  refs.anthropicKeyInput.addEventListener('input', (event) => {
    setState({ apiKeys: { anthropic: event.target.value } });
  });

  refs.ratioButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const ratio = Number.parseFloat(button.dataset.ratio);
      setState({ compressionRatio: ratio });
    });
  });

  refs.modeRadios.forEach((radio) => {
    radio.addEventListener('change', (event) => {
      if (event.target.checked) {
        setState({ compressionMode: event.target.value });
      }
    });
  });

  refs.compressButton.addEventListener('click', async () => {
    const state = getState();
    if (!selectors.canSubmit(state)) {
      setState({
        errors: ['Fill prompt and required API keys before compressing.']
      });
      return;
    }
    setState({
      status: 'loading',
      errors: [],
      output: {
        compressedText: '',
        metrics: {
          originalTokens: null,
          targetTokens: null,
          finalTokens: null,
          durationMs: 0
        },
        warnings: []
      }
    });
    try {
      const result = await compressPrompt({
        text: state.promptText,
        ratio: state.compressionRatio,
        intent: state.authorIntent,
        mode: state.compressionMode,
        provider: state.includeProvider,
        apiKeys: state.apiKeys
      });
      setState({
        status: 'success',
        output: {
          compressedText: result.compressedText,
          metrics: result.metrics,
          warnings: result.warnings || []
        }
      });
    } catch (error) {
      setState({
        status: 'error',
        errors: [error.message || 'Compression failed.'],
        output: {
          compressedText: '',
          metrics: {
            originalTokens: null,
            targetTokens: null,
            finalTokens: null,
            durationMs: 0
          },
          warnings: []
        }
      });
    }
  });

  refs.clearButton.addEventListener('click', () => {
    resetState();
  });

  refs.copyButton.addEventListener('click', async () => {
    const value = getState().output.compressedText;
    if (!value) {
      return;
    }
    try {
      await navigator.clipboard.writeText(value);
      refs.copyButton.textContent = 'Copied';
      setTimeout(() => {
        refs.copyButton.textContent = 'Copy';
      }, 1200);
    } catch (error) {
      refs.statusBox.textContent = 'Copy failed. Select and copy manually.';
      refs.statusBox.classList.add('is-error');
    }
  });
};

const init = () => {
  const root = document.querySelector('#app');
  const refs = createAppShell(root);
  attachEventHandlers(refs);
  subscribe((state) => {
    syncCounts(refs, state.promptText);
    syncRatioButtons(refs, state.compressionRatio);
    syncModeVisibility(refs, state);
    refs.intentInput.value = state.authorIntent;
    refs.providerSelect.value = state.includeProvider;
    refs.openaiKeyInput.value = state.apiKeys.openai;
    refs.anthropicKeyInput.value = state.apiKeys.anthropic;
    refs.promptInput.value = state.promptText;
    syncButtons(refs, state);
    syncStatus(refs, state);
    syncOutput(refs, state);
  });
};

init();
