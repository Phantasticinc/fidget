// Nicknames only (no real names); 3-16 chars, letters/digits/_-; light profanity + leetspeak filter.
const K = 'fidget.nick';
const BAD = ['fuck', 'shit', 'cunt', 'bitch', 'nigg', 'fag', 'slut', 'whore', 'dick', 'cock', 'pussy', 'rape', 'nazi', 'hitler', 'kkk', 'porn', 'sex', 'penis', 'vagina', 'anal', 'cum', 'twat', 'wank', 'retard', 'asshole', 'bastard'];
const norm = s => s.toLowerCase().replace(/[@4]/g, 'a').replace(/3/g, 'e').replace(/[1!|]/g, 'i').replace(/0/g, 'o').replace(/[5$]/g, 's').replace(/7/g, 't').replace(/[^a-z]/g, '');
export function check(n) {
  n = (n || '').trim();
  if (!/^[A-Za-z0-9_-]{3,16}$/.test(n)) return 'Use 3–16 letters, numbers, _ or -';
  const z = norm(n); if (BAD.some(b => z.includes(b))) return 'Please pick a friendlier nickname';
  return null;
}
const ADJ = ['Calm', 'Swift', 'Lucky', 'Fuzzy', 'Mellow', 'Zippy', 'Cosmic', 'Sunny'], ANI = ['Otter', 'Panda', 'Fox', 'Koala', 'Owl', 'Gecko', 'Lynx', 'Puffin'];
export function get() { let n = localStorage.getItem(K); if (!n) { n = ADJ[(Math.random() * 8) | 0] + ANI[(Math.random() * 8) | 0] + ((Math.random() * 90 + 10) | 0); localStorage.setItem(K, n); } return n; }
export function set(n) { const e = check(n); if (!e) localStorage.setItem(K, n.trim()); return e; }
