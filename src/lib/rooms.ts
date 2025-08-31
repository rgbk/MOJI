import { supabase } from './supabase'

export interface GameRoom {
  id: string
  created_by: string
  status: 'waiting' | 'playing' | 'finished'
  created_at: string
  max_players: number
}

export interface RoomPlayer {
  id: string
  room_id: string
  player_name: string
  is_creator: boolean
  joined_at: string
}

export const roomService = {
  async createRoom(): Promise<GameRoom> {
    const roomId = Math.random().toString(36).substr(2, 8).toUpperCase()
    
    const { data, error } = await supabase
      .from('game_rooms')
      .insert({
        id: roomId,
        created_by: 'Player 1',
        status: 'waiting'
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create room: ${error.message}`)
    }

    // Add creator as first player
    await supabase
      .from('room_players')
      .insert({
        room_id: roomId,
        player_name: 'Player 1',
        is_creator: true
      })

    // Mark this room as created by me in sessionStorage
    sessionStorage.setItem(`room-creator-${roomId}`, 'true')

    return data
  },

  async getRoomById(roomId: string): Promise<GameRoom | null> {
    const { data, error } = await supabase
      .from('game_rooms')
      .select('*')
      .eq('id', roomId)
      .single()

    if (error) {
      return null
    }

    return data
  },

  async getRoomPlayers(roomId: string): Promise<RoomPlayer[]> {
    const { data, error } = await supabase
      .from('room_players')
      .select('*')
      .eq('room_id', roomId)
      .order('joined_at')

    if (error) {
      throw new Error(`Failed to get players: ${error.message}`)
    }

    return data || []
  },

  async joinRoom(roomId: string): Promise<RoomPlayer> {
    const { data, error } = await supabase
      .from('room_players')
      .insert({
        room_id: roomId,
        player_name: 'Player 2',
        is_creator: false
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to join room: ${error.message}`)
    }

    return data
  }
}