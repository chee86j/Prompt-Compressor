/*
 * Heuristic compression strategy that ranks sentences by keyword density,
 * position, and length to approximate the requested reduction without
 * external API calls.
 */
const sentenceSplitRegex = /(?<=[.!?])\s+(?=[A-Z0-9"'])/g;
const wordRegex = /[a-z0-9']+/gi;

const stopWords = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'if', 'then', 'so', 'on', 'in', 'at', 'of',
  'for', 'to', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'has', 'had',
  'have', 'that', 'this', 'it', 'as', 'from', 'into', 'about', 'over', 'when', 'while',
  'do', 'does', 'did', 'can', 'could', 'should', 'would', 'our', 'their', 'your'
]);

const now = () => {
  if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
    return performance.now();
  }
  return Date.now();
};

const clampRatio = (value) => {
  if (Number.isNaN(value)) {
    return 0.3;
  }
  const bounded = Math.min(Math.max(value, 0), 0.9);
  return bounded;
};

const tokenize = (text) => {
  const matches = text.match(wordRegex);
  if (!matches) {
    return [];
  }
  return matches.map((word) => word.toLowerCase());
};

const countWords = (words) => {
  return words.reduce((acc, word) => {
    if (stopWords.has(word)) {
      return acc;
    }
    const next = acc;
    next[word] = (next[word] || 0) + 1;
    return next;
  }, {});
};

const buildSentenceObjects = (text, intentKeywords) => {
  const rawSentences = text.split(sentenceSplitRegex).filter((piece) => piece.trim().length > 0);
  if (rawSentences.length === 0) {
    return [];
  }
  return rawSentences.map((sentence, index) => {
    const words = tokenize(sentence);
    const uniqueWords = new Set(words);
    let intentBoost = 0;
    uniqueWords.forEach((word) => {
      if (intentKeywords.includes(word)) {
        intentBoost += 2;
      }
    });
    return {
      index,
      text: sentence.trim(),
      words,
      tokenCount: words.length,
      intentBoost
    };
  });
};

const scoreSentences = (sentences, globalFrequency) => {
  return sentences.map((sentence) => {
    const densityScore = sentence.words.reduce((total, word) => {
      if (stopWords.has(word)) {
        return total;
      }
      return total + (globalFrequency[word] || 0);
    }, 0);
    const lengthScore = sentence.tokenCount > 0 ? Math.min(sentence.tokenCount / 15, 1.5) : 0;
    const positionScore = 1 / (sentence.index + 1);
    const score = densityScore + lengthScore + positionScore + sentence.intentBoost;
    return {
      ...sentence,
      score
    };
  });
};

const selectSentences = (scoredSentences, targetTokens) => {
  const sortedByScore = [...scoredSentences].sort((a, b) => b.score - a.score);
  const selected = new Map();
  let accumulatedTokens = 0;
  for (const sentence of sortedByScore) {
    if (!selected.has(sentence.index)) {
      selected.set(sentence.index, sentence);
      accumulatedTokens += sentence.tokenCount || sentence.text.split(' ').length;
    }
    if (accumulatedTokens >= targetTokens) {
      break;
    }
  }
  if (selected.size === 0 && scoredSentences.length > 0) {
    selected.set(scoredSentences[0].index, scoredSentences[0]);
  }
  const ordered = Array.from(selected.values()).sort((a, b) => a.index - b.index);
  return ordered;
};

const estimateTokens = (text) => tokenize(text).length;

export const compressHeuristic = async ({ text, ratio, intent }) => {
  const startedAt = now();
  const trimmed = text.trim();
  if (!trimmed) {
    return {
      compressedText: '',
      metrics: {
        originalTokens: 0,
        targetTokens: 0,
        finalTokens: 0,
        durationMs: now() - startedAt
      },
      warnings: ['No content provided.']
    };
  }
  const reductionRatio = clampRatio(ratio);
  const originalTokens = estimateTokens(trimmed);
  const targetTokens = Math.max(1, Math.round(originalTokens * (1 - reductionRatio)));
  if (targetTokens >= originalTokens) {
    return {
      compressedText: trimmed,
      metrics: {
        originalTokens,
        targetTokens: originalTokens,
        finalTokens: originalTokens,
        durationMs: now() - startedAt
      },
      warnings: []
    };
  }
  const intentKeywords = intent ? tokenize(intent).filter((word) => !stopWords.has(word)) : [];
  const sentences = buildSentenceObjects(trimmed, intentKeywords);
  if (sentences.length === 0) {
    return {
      compressedText: trimmed,
      metrics: {
        originalTokens,
        targetTokens,
        finalTokens: originalTokens,
        durationMs: now() - startedAt
      },
      warnings: ['Unable to detect sentence boundaries; returning original text.']
    };
  }
  const globalFrequency = countWords(tokenize(trimmed));
  const scoredSentences = scoreSentences(sentences, globalFrequency);
  const chosenSentences = selectSentences(scoredSentences, targetTokens);
  const compressedText = chosenSentences.map((sentence) => sentence.text).join(' ');
  const finalTokens = estimateTokens(compressedText);
  const warnings = [];
  if (finalTokens > targetTokens * 1.1) {
    warnings.push('Heuristic compression exceeded the target budget.');
  }
  if (reductionRatio > 0.5) {
    warnings.push('High reduction ratios may remove important context.');
  }
  return {
    compressedText,
    metrics: {
      originalTokens,
      targetTokens,
      finalTokens,
      durationMs: now() - startedAt
    },
    warnings
  };
};
