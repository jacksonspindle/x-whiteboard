-- Text notes table for free-form text on canvas
create table text_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  content text not null default '',
  position_x float default 0,
  position_y float default 0,
  width float default 200,
  height float default 100,
  font_size int default 16,
  color text default '#1a1a1a',
  created_at timestamptz default now()
);

-- Enable RLS
alter table text_notes enable row level security;

-- Users can only access their own text notes
create policy "Users can CRUD their own text_notes" on text_notes
  for all using (auth.uid() = user_id);

-- Enable realtime
alter publication supabase_realtime add table text_notes;
