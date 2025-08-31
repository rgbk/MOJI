-- Add puzzle_sequence column to game_rooms table
-- Run this in your Supabase SQL Editor

ALTER TABLE game_rooms 
ADD COLUMN puzzle_sequence INTEGER[];