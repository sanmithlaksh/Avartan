-- Supabase SQL Schema for Avartan / The Hidden Orbit
-- Run this in the Supabase SQL Editor (https://supabase.com/dashboard/project/jbydaklyvepixtzrcgfp/sql)

CREATE TABLE IF NOT EXISTS public.teams (
  id BIGSERIAL PRIMARY KEY,
  "Name 1" TEXT DEFAULT '',
  "Name 2" TEXT DEFAULT '',
  "Team Name" TEXT UNIQUE NOT NULL,
  "Password" TEXT NOT NULL,
  "Current level" INTEGER DEFAULT 1,
  "levels completion" INTEGER DEFAULT 0,
  "level 1 points" INTEGER DEFAULT 0,
  "level 2 points" INTEGER DEFAULT 0,
  "level 3 points" INTEGER DEFAULT 0,
  "total level points" INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

-- Allow anonymous read and write access for competition gameplay
CREATE POLICY "Allow public read on teams" 
ON public.teams FOR SELECT 
TO anon, authenticated 
USING (true);

CREATE POLICY "Allow public insert on teams" 
ON public.teams FOR INSERT 
TO anon, authenticated 
WITH CHECK (true);

CREATE POLICY "Allow public update on teams" 
ON public.teams FOR UPDATE 
TO anon, authenticated 
USING (true);

-- Insert Default Admin / Trial account
INSERT INTO public.teams (
  "Name 1", "Name 2", "Team Name", "Password", 
  "Current level", "levels completion", 
  "level 1 points", "level 2 points", "level 3 points", "total level points"
)
VALUES (
  'Admin', 'Co-Admin', 'Admin', 'Aryan', 
  1, 0, 
  0, 0, 0, 0
)
ON CONFLICT ("Team Name") DO UPDATE SET 
  "Password" = EXCLUDED."Password",
  "Current level" = EXCLUDED."Current level",
  "levels completion" = EXCLUDED."levels completion";

-- Insert the mds112 team account
INSERT INTO public.teams (
  "Name 1", "Name 2", "Team Name", "Password", 
  "Current level", "levels completion", 
  "level 1 points", "level 2 points", "level 3 points", "total level points"
)
VALUES (
  '', '', 'mds112', '2120', 
  1, 0, 
  0, 0, 0, 0
)
ON CONFLICT ("Team Name") DO NOTHING;
