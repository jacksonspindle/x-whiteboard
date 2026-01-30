import { createClient } from '@/lib/supabase/server';
import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { prompt, posts } = await request.json() as {
      prompt: string;
      posts: { author: string; content: string }[];
    };

    if (!prompt || !posts?.length) {
      return NextResponse.json(
        { error: 'Missing prompt or posts' },
        { status: 400 }
      );
    }

    const postsContext = posts
      .map((p, i) => `[Post ${i + 1}] @${p.author}: ${p.content}`)
      .join('\n\n');

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: 'You are a helpful assistant analyzing social media posts from X (Twitter). The user has selected posts on their whiteboard and wants your analysis. Keep your response concise, focused, and well-structured. Do not use markdown headers. Use plain text with line breaks for readability.',
      messages: [
        {
          role: 'user',
          content: `Here are the selected posts:\n\n${postsContext}\n\nUser question: ${prompt}`,
        },
      ],
    });

    const responseText = message.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('\n');

    return NextResponse.json({ response: responseText });
  } catch (error) {
    console.error('AI API Error:', error);
    return NextResponse.json(
      { error: 'Failed to get AI response' },
      { status: 500 }
    );
  }
}
