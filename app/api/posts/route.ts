import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { PostCreateInput } from '@/lib/types';

// CORS headers for Chrome extension
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Create a Supabase client with a user's access token
function createClientWithToken(token: string) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    }
  );
}

// Handle preflight requests
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

// POST - Create a new post (used by Chrome extension)
export async function POST(request: NextRequest) {
  try {
    // Check for auth token in header (for extension)
    const authHeader = request.headers.get('authorization');

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);

      // Create client with the user's token for proper RLS
      const supabase = createClientWithToken(token);

      // Verify the token and get user
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        console.error('Auth error:', authError);
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401, headers: corsHeaders }
        );
      }

      const body: PostCreateInput = await request.json();

      // Validate required fields
      if (!body.tweet_id || !body.tweet_url) {
        return NextResponse.json(
          { error: 'Missing required fields: tweet_id and tweet_url' },
          { status: 400, headers: corsHeaders }
        );
      }

      // Check for duplicate tweet
      const { data: existing } = await supabase
        .from('posts')
        .select('id')
        .eq('user_id', user.id)
        .eq('tweet_id', body.tweet_id)
        .single();

      if (existing) {
        return NextResponse.json(
          { error: 'Post already exists on whiteboard', id: existing.id },
          { status: 409, headers: corsHeaders }
        );
      }

      // Calculate random position for new post
      const position_x = body.position_x ?? Math.random() * 500;
      const position_y = body.position_y ?? Math.random() * 500;

      const { data, error } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          tweet_id: body.tweet_id,
          tweet_url: body.tweet_url,
          author_handle: body.author_handle,
          author_name: body.author_name,
          author_avatar: body.author_avatar,
          content: body.content,
          media: body.media,
          position_x,
          position_y,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating post:', error);
        return NextResponse.json(
          { error: 'Failed to create post: ' + error.message },
          { status: 500, headers: corsHeaders }
        );
      }

      return NextResponse.json({ success: true, post: data }, { headers: corsHeaders });
    }

    // Fallback to cookie-based auth (for web requests)
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401, headers: corsHeaders }
      );
    }

    const body: PostCreateInput = await request.json();

    if (!body.tweet_id || !body.tweet_url) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400, headers: corsHeaders }
      );
    }

    const position_x = body.position_x ?? Math.random() * 500;
    const position_y = body.position_y ?? Math.random() * 500;

    const { data, error } = await supabase
      .from('posts')
      .insert({
        user_id: user.id,
        tweet_id: body.tweet_id,
        tweet_url: body.tweet_url,
        author_handle: body.author_handle,
        author_name: body.author_name,
        author_avatar: body.author_avatar,
        content: body.content,
        media: body.media,
        position_x,
        position_y,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating post:', error);
      return NextResponse.json(
        { error: 'Failed to create post: ' + error.message },
        { status: 500, headers: corsHeaders }
      );
    }

    return NextResponse.json({ success: true, post: data }, { headers: corsHeaders });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}

// GET - List all posts for current user
export async function GET(request: NextRequest) {
  try {
    // Check for auth token in header (for extension)
    const authHeader = request.headers.get('authorization');

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const supabase = createClientWithToken(token);

      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401, headers: corsHeaders }
        );
      }

      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching posts:', error);
        return NextResponse.json(
          { error: 'Failed to fetch posts' },
          { status: 500, headers: corsHeaders }
        );
      }

      return NextResponse.json({ posts: data }, { headers: corsHeaders });
    }

    // Fallback to cookie-based auth
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401, headers: corsHeaders }
      );
    }

    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching posts:', error);
      return NextResponse.json(
        { error: 'Failed to fetch posts' },
        { status: 500, headers: corsHeaders }
      );
    }

    return NextResponse.json({ posts: data }, { headers: corsHeaders });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}
