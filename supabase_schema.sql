-- Supabase Database Schema for Card Game
-- Run this in your Supabase SQL Editor to recreate the tables

-- Create games table
CREATE TABLE IF NOT EXISTS public.games (
  id UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  state JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  host_id UUID DEFAULT gen_random_uuid(),
  room_code TEXT DEFAULT upper(substring(md5(random()::text), 1, 8))
);

-- Create players table
CREATE TABLE IF NOT EXISTS public.players (
  id UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  game_id UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  name TEXT,
  user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  selected_deck TEXT
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;

-- Create policies to allow all operations (customize as needed for your security requirements)
CREATE POLICY "Allow all operations on games" ON public.games FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on players" ON public.players FOR ALL USING (true) WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_games_host_id ON public.games(host_id);
CREATE INDEX IF NOT EXISTS idx_players_game_id ON public.players(game_id);
CREATE INDEX IF NOT EXISTS idx_games_room_code ON public.games(room_code);

