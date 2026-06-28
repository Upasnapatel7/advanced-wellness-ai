// api/chat.js
// Vercel serverless function. Keeps the Gemini API key on the server —
// the React app calls this endpoint instead of calling Gemini directly.

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Server is missing GEMINI_API_KEY' });
  }

  const { message, history = [], userContext = {} } = req.body || {};

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Missing "message" in request body' });
  }

  // Build a short system instruction + recent history for context.
  const systemInstruction = `You are a warm, compassionate, licensed-therapist-style assistant inside a wellness app called Aarohan.
Guidelines:
- Listen actively, validate feelings, ask gentle open-ended follow-up questions.
- Use light therapeutic technique (CBT-style reframing, grounding, mindfulness) where helpful.
- Never diagnose or give medical advice.
- Keep responses warm and complete — aim for 100-200 words, but always finish your thought rather than cutting off.
- If the user expresses intent to self-harm or suicidal ideation, gently and clearly point them to crisis resources (988 Suicide & Crisis Lifeline, Crisis Text Line: text HOME to 741741, or 911 for emergencies) in addition to responding with care.
User's name: ${userContext.name || 'there'}.`;

  // Gemini expects alternating user/model turns.
  const contents = [
    ...history.slice(-8).map((m) => ({
      role: m.type === 'user' ? 'user' : 'model',
      parts: [{ text: m.text }]
    })),
    { role: 'user', parts: [{ text: message }] }
  ];

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          systemInstruction: { parts: [{ text: systemInstruction }] },
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 600
          }
        })
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error('Gemini API error:', response.status, errText);
      return res.status(502).json({ error: 'Gemini API request failed' });
    }

    const data = await response.json();
    const text =
      data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') || '';

    if (!text) {
      return res.status(502).json({ error: 'Empty response from Gemini' });
    }

    return res.status(200).json({ text });
  } catch (error) {
    console.error('Chat handler error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}