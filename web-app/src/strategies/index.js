/*
 * Strategy registry dispatches to heuristic or LLM compression implementations.
 * LLM strategy is stubbed until pipeline integration lands in a later phase.
 */
import { compressHeuristic } from './heuristicStrategy.js';

const notImplemented = async () => {
  throw new Error('LLM compression is not available yet.');
};

const strategies = {
  heuristic: compressHeuristic,
  llm: notImplemented
};

export const compressPrompt = async (options) => {
  const mode = options.mode || 'heuristic';
  const strategy = strategies[mode];
  if (!strategy) {
    throw new Error(`Unknown compression mode: ${mode}`);
  }
  return strategy(options);
};

export const getSupportedModes = () => Object.keys(strategies);
