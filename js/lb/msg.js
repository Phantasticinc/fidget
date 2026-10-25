// Victory messages: ≤40 chars, shown next to a score. Filters profanity/slurs (with leetspeak), URLs, emails, phone numbers, @handles.
// The server (backend/supabase.sql) re-checks the same rules; this file is the first line of defence and the UX.
export const MAX = 40;
export const PRESETS = ['Too smooth 😎', 'Calm hands, fast mind', 'Come get me!', 'New record, who dis', 'Practice pays off', 'GG everyone', 'Bubble wrap legend', 'Just warming up'];
const BAD = ['fuck', 'shit', 'cunt', 'bitch', 'nigg', 'nigga', 'fag', 'slut', 'whore', 'dick', 'cock', 'pussy', 'rape', 'nazi', 'hitler', 'kkk', 'porn', 'sex', 'penis', 'vagina', 'cum', 'twat', 'wank', 'retard', 'asshole', 'bastard', 'chink', 'spic', 'kike', 'tranny', 'dyke', 'coon', 'gook', 'wetback', 'kys', 'killyourself', 'nude', 'onlyfans', 'xxx'];
const norm = s => s.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[@4]/g, 'a').replace(/3/g, 'e').replace(/[1!|]/g, 'i').replace(/0/g, 'o').replace(/[5$]/g, 's').replace(/7/g, 't').replace(/[^a-z]/g, '');
const URL_RE = /(https?:|www\.|\b[a-z0-9-]+\s*(\.|dot)\s*(com|net|org|io|gg|me|co|app|xyz|ly|tv|link|ru|info)\b)/i;
const CONTACT_RE = /([\w.+-]+\s*(@|\bat\b)\s*[\w-]+\s*(\.|dot)\s*\w+)|(@\w{2,})|(\+?\d[\d\s().-]{6,}\d)|\b(snap(chat)?|insta(gram)?|tiktok|discord|whatsapp|telegram|kik|dm me|add me)\b/i;
export function clean(s) { return (s || '').replace(/[\u0000-\u001f\u007f\u200b-\u200f\u202a-\u202e\u2066-\u2069]/g, '').replace(/\s+/g, ' ').trim(); }
export function check(s) {
  s = clean(s);
  if (!s) return 'Type a message or pick one below';
  if ([...s].length > MAX) return `Keep it to ${MAX} characters`;
  if (URL_RE.test(s)) return 'No links, please';
  if (CONTACT_RE.test(s)) return 'No contact info or handles, please';
  const z = norm(s); if (BAD.some(b => z.includes(b))) return 'Please keep it friendly';
  return null;
}
// mine: metric -> text (stored locally; sent with the score when an online board is configured)
const K = 'fidget.msgs', HK = 'fidget.hiddenMsgs';
const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) || d; } catch (_) { return d; } };
export const mine = m => load(K, {})[m] || '';
export function setMine(m, s) { const e = check(s); if (e) return e; const o = load(K, {}); o[m] = clean(s); localStorage.setItem(K, JSON.stringify(o)); return null; }
// Report = hide on this device (key: short device id + text). Kept to the last 200.
const hkey = (dev, text) => `${dev || ''}|${text}`;
export const hidden = (dev, text) => load(HK, []).includes(hkey(dev, text));
export function report(dev, text) { const a = load(HK, []); a.push(hkey(dev, text)); localStorage.setItem(HK, JSON.stringify(a.slice(-200))); }
