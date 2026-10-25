// Shared moderation rules (mirrors backend/supabase.sql: msg_problem / nick_problem). Keep both lists in sync.
export const RULES = 'Be kind · no links, handles, emails or phone numbers · max 40 chars';
export const BAD = ['fuck', 'shit', 'cunt', 'bitch', 'nigg', 'fag', 'slut', 'whore', 'dick', 'cock', 'pussy', 'rape', 'nazi', 'hitler', 'kkk', 'porn', 'sex', 'penis', 'vagina', 'cum', 'twat', 'wank', 'retard', 'asshole', 'bastard', 'chink', 'spic', 'kike', 'tranny', 'dyke', 'coon', 'gook', 'wetback', 'kys', 'killyourself', 'nude', 'onlyfans', 'xxx', 'anal', 'jizz', 'boob', 'tits', 'heil', 'isis', 'jihad', 'pedo', 'molest', 'incest'];
// Reserved / impersonation nicknames (substring match after normalising).
export const RESERVED = ['admin', 'moderator', 'mod', 'staff', 'official', 'support', 'fidget', 'phantastic', 'vanguard', 'google', 'android', 'system', 'root', 'owner', 'developer', 'dev', 'huy', 'null', 'undefined', 'anonymous', 'everyone', 'here'];
export const norm = s => (s || '').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[@4]/g, 'a').replace(/3/g, 'e').replace(/[1!|]/g, 'i').replace(/0/g, 'o').replace(/[5$]/g, 's').replace(/7/g, 't').replace(/[^a-z]/g, '');
export const isBad = s => { const z = norm(s); return BAD.some(b => z.includes(b)); };
// Reserved: short words (<=4 letters, e.g. mod/dev/huy) only when the nickname is just that word (+digits/_-); longer ones match anywhere.
export const isReserved = s => { const z = norm(s), w = String(s || '').toLowerCase().replace(/[^a-z]/g, ''); return RESERVED.some(r => r.length <= 4 ? w === r : z.includes(r)); };
