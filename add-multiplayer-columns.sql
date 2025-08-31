-- Add multiplayer game state columns to game_rooms table
-- Run this in your Supabase SQL Editor after add-puzzle-sequence.sql

ALTER TABLE game_rooms 
ADD COLUMN current_puzzle_index INTEGER DEFAULT 0,
ADD COLUMN game_state TEXT DEFAULT 'playing',
ADD COLUMN round_winner TEXT,
ADD COLUMN player1_score INTEGER DEFAULT 0,
ADD COLUMN player2_score INTEGER DEFAULT 0,
ADD COLUMN players_ready_for_next TEXT[] DEFAULT '{}';

-- Update existing games to have proper initial state
UPDATE game_rooms 
SET current_puzzle_index = 0,
    game_state = 'playing',
    player1_score = 0,
    player2_score = 0,
    players_ready_for_next = '{}'
WHERE status = 'playing';