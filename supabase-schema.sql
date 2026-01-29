-- X Whiteboard Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension (should already be enabled)
create extension if not exists "uuid-ossp";

-- Groups table (create first since posts references it)
create table if not exists groups (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  color text default '#3b82f6',
  position_x float default 0,
  position_y float default 0,
  created_at timestamptz default now()
);

-- Posts table
create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  tweet_id text not null,
  tweet_url text not null,
  author_handle text,
  author_name text,
  author_avatar text,
  content text,
  media jsonb, -- array of {type: 'image'|'video', url: string, thumbnail?: string}
  position_x float default 0,
  position_y float default 0,
  width float default 300,
  height float default 200,
  group_id uuid references groups(id) on delete set null,
  created_at timestamptz default now()
);

-- Create indexes for better query performance
create index if not exists posts_user_id_idx on posts(user_id);
create index if not exists posts_tweet_id_idx on posts(tweet_id);
create index if not exists posts_group_id_idx on posts(group_id);
create index if not exists groups_user_id_idx on groups(user_id);

-- Enable Row Level Security
alter table posts enable row level security;
alter table groups enable row level security;

-- RLS Policies for posts
create policy "Users can view their own posts"
  on posts for select
  using (auth.uid() = user_id);

create policy "Users can insert their own posts"
  on posts for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own posts"
  on posts for update
  using (auth.uid() = user_id);

create policy "Users can delete their own posts"
  on posts for delete
  using (auth.uid() = user_id);

-- RLS Policies for groups
create policy "Users can view their own groups"
  on groups for select
  using (auth.uid() = user_id);

create policy "Users can insert their own groups"
  on groups for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own groups"
  on groups for update
  using (auth.uid() = user_id);

create policy "Users can delete their own groups"
  on groups for delete
  using (auth.uid() = user_id);

-- Enable realtime for posts table (for live updates on whiteboard)
alter publication supabase_realtime add table posts;
