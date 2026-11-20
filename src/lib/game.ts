import seed from '@/data/questions.json';

export type Difficulty = 'easy' | 'medium' | 'hard';
export type Rarity = 'Common' | 'Uncommon' | 'Rare' | 'Legendary';
export type Answer = { text: string; normalized: string; aliases: string[]; rarity: Rarity; points: number; explanation: string };
export type Question = { id: string; prompt: string; category: string; difficulty: Difficulty; status: 'active' | 'review' | 'archived'; dateAdded: string; verification: string; answers: Answer[] };
export const POINTS: Record<Rarity, number> = { Common: 10, Uncommon: 25, Rare: 50, Legendary: 100 };
export const library = seed as Question[];
export const categories = [...new Set(library.map(q => q.category))];
export function normalize(text: string) {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]/g, '');
}
export function validateAnswer(question: Question, text: string) {
  const value = normalize(text);
  if (!value) return undefined;
  return question.answers.find(a => a.normalized === value || normalize(a.text) === value || a.aliases.some(alias => normalize(alias) === value));
}
export function rng(seedValue: string) {
  let state = 2166136261;
  for (const char of seedValue) { state ^= char.charCodeAt(0); state = Math.imul(state, 16777619); }
  return () => { state += 0x6d2b79f5; let t = state; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
function shuffle<T>(items: T[], random: () => number) { return items.map(value => ({ value, order: random() })).sort((a,b) => a.order - b.order).map(item => item.value); }
export function generatePack(questions: Question[], seedValue: string, recent: string[] = []): Question[] {
  const active = questions.filter(q => q.status === 'active');
  const unique = [...new Map(active.map(q => [q.id, q])).values()];
  if (unique.length < 7) throw new Error('At least seven active questions are needed.');
  const random = rng(seedValue);
  const shuffled = shuffle(unique, random);
  const pool = [...shuffled.filter(q => !recent.includes(q.id)), ...shuffled.filter(q => recent.includes(q.id)).sort((a,b) => recent.indexOf(a.id) - recent.indexOf(b.id))];
  const chosen: Question[] = [];
  const slots: (Difficulty | 'flexible')[] = ['medium','medium','medium','easy','medium','hard','flexible'];
  for (const slot of slots) {
    const unused = pool.filter(q => !chosen.some(p => p.id === q.id));
    const unseen = unused.filter(q => !recent.includes(q.id));
    const available = unseen.length ? unseen : unused;
    const differentCategory = available.filter(q => !chosen.some(p => p.category === q.category));
    const diverse = differentCategory.length ? differentCategory : available;
    const matching = diverse.filter(q => slot === 'flexible' ? q.answers.length >= 20 : q.difficulty === slot);
    const candidate = matching[0] ?? diverse[0];
    if (candidate) chosen.push(candidate);
  }
  return shuffle(chosen, random);
}
export function dailyPack(date: string, questions = library) { return generatePack(questions, `krillion-daily-${date}`); }
export function utcDate() { return new Date().toISOString().slice(0,10); }
export function questionWarnings(q: Question, all: Question[]): string[] {
  const warnings: string[] = [];
  if (!q.category.trim()) warnings.push('Missing category.');
  if (!q.prompt.trim().endsWith('?') && !/^name\b/i.test(q.prompt)) warnings.push('Review the wording: use a clear question or “Name…” prompt.');
  if (q.prompt.trim().length < 15) warnings.push('The prompt needs more context.');
  if (q.answers.length < 5) warnings.push('Few accepted answers. Confirm this is a naturally limited set.');
  if (/any (nba player|country in europe|mammal)/i.test(q.prompt) && q.answers.length < 20) warnings.push('This broad prompt needs at least 20 accepted answers.');
  if (q.answers.some(a => !a.explanation.trim())) warnings.push('An answer is missing an explanation.');
  if (!q.verification.trim()) warnings.push('Add a source or verification note.');
  if (all.some(other => other.id !== q.id && normalize(other.prompt) === normalize(q.prompt))) warnings.push('Duplicate prompt detected.');
  const aliases = q.answers.flatMap(a => [normalize(a.text), ...a.aliases.map(normalize)]);
  if (new Set(aliases).size !== aliases.length) warnings.push('Duplicate or ambiguous answer aliases detected.');
  return warnings;
}
export const STORAGE = { history: 'krillion-history-v1', edits: 'krillion-editor-v1', feedback: 'krillion-feedback-v1', daily: 'krillion-daily-v1' };
export function readLocal<T>(key: string, fallback: T): T { try { const value = localStorage.getItem(key); return value ? JSON.parse(value) as T : fallback; } catch { return fallback; } }
export function saveLocal(key: string, value: unknown) { try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; } }