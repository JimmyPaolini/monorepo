export class PronunciationParts {
  phonemes = '';
  phonemic = '';
  phonetic = '';
}

export class Pronunciation {
  classical: PronunciationParts = new PronunciationParts();
  ecclesiastical: PronunciationParts = new PronunciationParts();
  vulgar: PronunciationParts = new PronunciationParts();
}
