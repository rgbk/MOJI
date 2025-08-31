-- Enable Realtime for multiplayer game lobby system
-- Run these commands in your Supabase SQL Editor

-- 1. First, enable Row Level Security (RLS) on both tables if not already enabled
ALTER TABLE game_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_players ENABLE ROW LEVEL SECURITY;

-- 2. Enable Realtime replication for both tables
ALTER PUBLICATION supabase_realtime ADD TABLE game_rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE room_players;

-- 3. Create RLS policies for game_rooms table
-- Allow anyone to read game rooms (for joining via link)
CREATE POLICY "Anyone can read game rooms" ON game_rooms
  FOR SELECT USING (true);

-- Allow authenticated users to create game rooms
CREATE POLICY "Authenticated users can create game rooms" ON game_rooms
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Allow room creators to update their rooms
CREATE POLICY "Room creators can update their rooms" ON game_rooms
  FOR UPDATE USING (created_by = auth.uid()::text);

-- 4. Create RLS policies for room_players table
-- Allow anyone to read room players (to see who's in the room)
CREATE POLICY "Anyone can read room players" ON room_players
  FOR SELECT USING (true);

-- Allow anyone to join a room (insert themselves as a player)
CREATE POLICY "Anyone can join a room" ON room_players
  FOR INSERT WITH CHECK (true);

-- Allow players to update their own records
CREATE POLICY "Players can update their own records" ON room_players
  FOR UPDATE USING (player_name = current_setting('request.jwt.claims', true)::json->>'name' OR auth.uid()::text = player_name);

-- Allow room creators to delete players (for kicking/admitting)
CREATE POLICY "Room creators can manage players" ON room_players
  FOR DELETE USING (
    room_id IN (
      SELECT id FROM game_rooms WHERE created_by = auth.uid()::text
    )
  );

-- 5. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_game_rooms_created_by ON game_rooms(created_by);
CREATE INDEX IF NOT EXISTS idx_game_rooms_status ON game_rooms(status);
CREATE INDEX IF NOT EXISTS idx_room_players_room_id ON room_players(room_id);
CREATE INDEX IF NOT EXISTS idx_room_players_player_name ON room_players(player_name);

-- 6. Create a function to get room with players (useful for initial data loading)
CREATE OR REPLACE FUNCTION get_room_with_players(room_id_param TEXT)
RETURNS JSON AS $$
BEGIN
  RETURN (
    SELECT json_build_object(
      'room', row_to_json(gr.*),
      'players', COALESCE(
        (
          SELECT json_agg(row_to_json(rp.*) ORDER BY rp.joined_at)
          FROM room_players rp
          WHERE rp.room_id = room_id_param
        ),
        '[]'::json
      )
    )
    FROM game_rooms gr
    WHERE gr.id = room_id_param
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;