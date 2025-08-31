-- Add approved column to room_players table
-- Run this in your Supabase SQL Editor

-- Add the approved column with default true for existing players (creators)
-- and false for new joiners
ALTER TABLE room_players 
ADD COLUMN approved BOOLEAN DEFAULT false;

-- Update existing players (creators should be auto-approved)
UPDATE room_players 
SET approved = true 
WHERE is_creator = true;

-- Enable Row Level Security (RLS) if not already enabled
-- This allows realtime to work properly
ALTER TABLE room_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_rooms ENABLE ROW LEVEL SECURITY;

-- Allow all operations for now (you can tighten this later)
CREATE POLICY "Allow all for room_players" ON room_players FOR ALL USING (true);
CREATE POLICY "Allow all for game_rooms" ON game_rooms FOR ALL USING (true);