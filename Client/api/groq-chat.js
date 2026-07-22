// Vercel serverless function - proxy tới Groq API.
// Key thật (GROQ_API_KEY) chỉ được cấu hình trong Environment Variables của
// dự án trên Vercel, KHÔNG bao giờ nằm trong code/bundle JS gửi cho trình duyệt.
module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    res.status(500).json({
      error: 'GROQ_API_KEY chưa được cấu hình trong Environment Variables trên Vercel',
    });
    return;
  }

  try {
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(req.body),
    });

    const data = await groqRes.json();
    res.status(groqRes.status).json(data);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
};
