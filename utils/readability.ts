
export const calculateFleschKincaid = (text: string) => {
  if (!text || text.trim().length < 20) return 0;

  const cleanText = text.replace(/<[^>]*>?/gm, ' '); // Strip HTML
  const sentences = cleanText.split(/[.!?]+/).filter(s => s.trim().length > 0).length || 1;
  const words = cleanText.trim().split(/\s+/).filter(w => w.length > 0);
  const wordCount = words.length || 1;
  
  // Basic syllable estimation heuristic
  const countSyllables = (word: string) => {
    word = word.toLowerCase().replace(/[^a-z]/g, '');
    if (word.length <= 3) return 1;
    word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
    word = word.replace(/^y/, '');
    const syllables = word.match(/[aeiouy]{1,2}/g);
    return syllables ? syllables.length : 1;
  };

  const totalSyllables = words.reduce((acc, word) => acc + countSyllables(word), 0);

  // Formula: 206.835 - 1.015 * (total words / total sentences) - 84.6 * (total syllables / total words)
  const score = 206.835 - 1.015 * (wordCount / sentences) - 84.6 * (totalSyllables / wordCount);
  
  return Math.max(0, Math.min(100, Math.round(score)));
};

export const getReadabilityLabel = (score: number) => {
  if (score >= 90) return 'Very Easy';
  if (score >= 80) return 'Easy';
  if (score >= 70) return 'Fairly Easy';
  if (score >= 60) return 'Standard';
  if (score >= 50) return 'Fairly Difficult';
  if (score >= 30) return 'Difficult';
  return 'Very Confusing';
};
