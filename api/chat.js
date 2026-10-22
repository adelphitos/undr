// Vercel serverless: UNDR concierge via Google Gemini (free key from aistudio.google.com).
// Set GEMINI_API_KEY in Vercel env. Tries several models so a busy one does not break the demo.
const MODELS = ['gemini-flash-latest', 'gemini-3.8-flash'];
export default async function handler(req, res) {
  const key = process.env.GEMINI_API_KEY;
  if (req.method === 'GET') return res.status(200).json({ ok: !!key });
  if (req.method !== 'POST') return res.status(405).end();
  if (!key) return res.status(503).json({ error: 'no key' });
  const { rules, turns } = req.body || {};
  if (!turns?.length) return res.status(400).json({ error: 'no turns' });
  const contents = [{ role: 'user', parts: [{ text: String(rules || '') }] },
    ...turns.map(t => ({ role: t.role === 'assistant' ? 'model' : 'user', parts: [{ text: String(t.content) }] }))];
  let lastErr = 'gemini error';
  for (const model of MODELS) {
    try {
      const ctl = new AbortController(); const timer = setTimeout(() => ctl.abort(), 9000);
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
        method: 'POST', headers: { 'content-type': 'application/json' }, signal: ctl.signal,
        body: JSON.stringify({ contents, generationConfig: { temperature: 0.7, maxOutputTokens: 1500 } })
      });
      const j = await r.json(); clearTimeout(timer);
      const text = j.candidates?.[0]?.content?.parts?.map(p => p.text).filter(Boolean).join('') || '';
      if (text) return res.status(200).json({ text, model });
      lastErr = j.error?.message || `empty reply from ${model}`;
      if (j.error && ![429, 503, 404].includes(j.error.code) && !/demand|overloaded|quota/i.test(lastErr)) break;
    } catch (e) { lastErr = String(e); }
  }
  res.status(502).json({ error: lastErr });
}
