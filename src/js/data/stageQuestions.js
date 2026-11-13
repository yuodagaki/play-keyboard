export function stageQuestionPool(stage, words) {
  if (stage.phase === 'A') return stage.availableKeys;
  if (['B', 'B2', 'B3'].includes(stage.phase)) return stage.hiraganaSet;
  if (stage.phase === 'G') return words?.sentences?.[stage.wordDifficulty] ?? ['ねこがいる'];
  return words?.[stage.wordLength]?.[stage.wordDifficulty] ?? ['ねこ'];
}
