-- Create connections table for arrow connections between posts and text notes
create table connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  from_id text not null,
  from_type text not null check (from_type in ('post', 'textNote')),
  to_id text not null,
  to_type text not null check (to_type in ('post', 'textNote')),
  created_at timestamptz default now()
);

-- Enable RLS
alter table connections enable row level security;

-- Users can only see their own connections
create policy "Users can view own connections"
  on connections for select
  using (auth.uid() = user_id);

-- Users can create their own connections
create policy "Users can create own connections"
  on connections for insert
  with check (auth.uid() = user_id);

-- Users can delete their own connections
create policy "Users can delete own connections"
  on connections for delete
  using (auth.uid() = user_id);

-- Enable realtime
alter publication supabase_realtime add table connections;
