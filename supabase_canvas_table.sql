-- Crie esta tabela no Supabase SQL Editor:
create table if not exists canvases (
  user_id uuid references auth.users(id) on delete cascade primary key,
  layout_data jsonb not null,
  updated_at timestamp with time zone default now()
);
