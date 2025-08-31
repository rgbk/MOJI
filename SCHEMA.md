# Database Schema

## Tables Created in Supabase

### game_rooms
- `id` (text, PRIMARY KEY) - Random room ID
- `created_by` (text) - Player who created room ("Player 1")  
- `status` (text, DEFAULT 'waiting') - 'waiting'/'playing'/'finished'
- `created_at` (timestamptz) - Room creation time
- `max_players` (integer, DEFAULT 2) - Max players allowed

### room_players  
- `id` (uuid, PRIMARY KEY) - Auto-generated player ID
- `room_id` (text, REFERENCES game_rooms) - Which room player is in
- `player_name` (text) - "Player 1", "Player 2", etc.
- `is_creator` (boolean, DEFAULT false) - Room creator flag
- `joined_at` (timestamptz) - When player joined room

## Next Steps
- Add game session state tracking table when implementing live gameplay sync