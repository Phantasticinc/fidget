// Nicknames only (no real names); 3-16 chars, letters/digits/_-; light profanity + leetspeak filter.
const K = 'fidget.nick';
import { isBad, isReserved } from './rules.js';
export function check(n) {
  n = (n || '').trim();
  if (!/^[A-Za-z0-9_-]{3,16}$/.test(n)) return 'Use 3–16 letters, numbers, _ or -';
  if (isBad(n)) return 'Please pick a friendlier nickname';
  if (isReserved(n)) return 'That nickname is reserved';
  if (/^\d+$/.test(n) || /\d{7,}/.test(n)) return 'No phone numbers in nicknames';
  return null;
}
const ADJ = ['Calm', 'Swift', 'Lucky', 'Fuzzy', 'Mellow', 'Zippy', 'Cosmic', 'Sunny'], ANI = ['Otter', 'Panda', 'Fox', 'Koala', 'Owl', 'Gecko', 'Lynx', 'Puffin'];
export function get() { let n = localStorage.getItem(K); if (!n) { n = ADJ[(Math.random() * 8) | 0] + ANI[(Math.random() * 8) | 0] + ((Math.random() * 90 + 10) | 0); localStorage.setItem(K, n); } return n; }
export function set(n) { const e = check(n); if (!e) localStorage.setItem(K, n.trim()); return e; }
