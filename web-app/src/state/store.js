/*
 * Application store implementing a tiny observable pattern.
 * Keeps prompt text, chosen compression settings, API keys, and status flags.
 */
const cloneDeep = (value) => {
  if (typeof structuredClone === 'function') {
    return structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value));
};

const defaultState = {
  promptText: '',
  compressionRatio: 0.3,
  compressionMode: 'heuristic',
  authorIntent: '',
  apiKeys: {
    openai: '',
    anthropic: ''
  },
  includeProvider: 'auto',
  status: 'idle',
  errors: [],
  output: {
    compressedText: '',
    metrics: {
      originalTokens: null,
      targetTokens: null,
      finalTokens: null,
      durationMs: null
    },
    warnings: []
  }
};

const subscribers = new Set();
let state = cloneDeep(defaultState);

export const getState = () => cloneDeep(state);

export const setState = (partial) => {
  const next = {
    ...state,
    ...partial,
    apiKeys: {
      ...state.apiKeys,
      ...(partial.apiKeys || {})
    },
    output: {
      ...state.output,
      ...(partial.output || {}),
      metrics: {
        ...state.output.metrics,
        ...((partial.output && partial.output.metrics) || {})
      },
      warnings: partial.output && partial.output.warnings ? [...partial.output.warnings] : [...state.output.warnings]
    }
  };
  state = next;
  subscribers.forEach((cb) => cb(getState()));
};

export const resetState = () => {
  state = cloneDeep(defaultState);
  subscribers.forEach((cb) => cb(getState()));
};

export const subscribe = (callback) => {
  subscribers.add(callback);
  callback(getState());
  return () => {
    subscribers.delete(callback);
  };
};

export const selectors = {
  canSubmit: (currentState) => {
    if (!currentState.promptText.trim()) {
      return false;
    }
    if (currentState.compressionMode === 'llm') {
      if (currentState.includeProvider === 'openai') {
        return Boolean(currentState.apiKeys.openai.trim());
      }
      if (currentState.includeProvider === 'anthropic') {
        return Boolean(currentState.apiKeys.anthropic.trim());
      }
      return Boolean(currentState.apiKeys.openai.trim() || currentState.apiKeys.anthropic.trim());
    }
    return true;
  },
  needsApiKey: (currentState) => currentState.compressionMode === 'llm'
};
