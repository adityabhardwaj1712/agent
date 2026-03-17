import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { message } = await req.json();
    
    if (!message || !message.trim()) {
      return NextResponse.json({ error: 'message is required' }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Server is missing OPENAI_API_KEY' }, { status: 500 });
    }

    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content: 'You are AgentCloud, a helpful AI coding assistant. Answer briefly.',
          },
          { role: 'user', content: message },
        ],
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      return NextResponse.json({ error: 'Upstream API error', status: response.status, text }, { status: 502 });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    return NextResponse.json({
      reply: content || '',
      raw: data,
    });
  } catch (err) {
    console.error('LLM error:', err);
    return NextResponse.json({ error: 'LLM request failed', detail: String(err) }, { status: 500 });
  }
}
