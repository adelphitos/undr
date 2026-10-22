// Vercel serverless: UNDR concierge via Google Gemini (free key from aistudio.google.com).
// Set GEMINI_API_KEY in Vercel env. The page falls back to a local answer engine if this 404s or errors.
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const key = process.env.GEMINI_API_KEY;
  if (!key) return res.status(503).json({ error: 'no key' });
  try {
    const { rules, turns } = req.body || {};
    const contents = [{ role: 'user', parts: [{ text: String(rules || '') }] },
      ...(turns || []).map(t => ({ role: t.role === 'assistant' ? 'model' : 'user', parts: [{ text: String(t.content) }] }))];
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${key}`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ contents, generationConfig: { temperature: 0.7, maxOutputTokens: 400 } })
    });
    const j = await r.json();
    const text = j.candidates?.[0]?.content?.parts?.map(p => p.text).join('') || ''; if (!text && j.error) return res.status(502).json({ error: j.error.message || 'gemini error' });
    res.status(200).json({ text });
  } catch (e) { res.status(500).json({ error: String(e) }); }
}
