import { supabase } from './supabase'

export interface GameRoom {
  id: string
  created_by: string
  status: 'waiting' | 'playing' | 'finished'
  created_at: string
  max_players: number
  puzzle_sequence?: number[]
  current_puzzle_index?: number
  game_state?: 'playing' | 'showing_answer'
  round_winner?: string
  player1_score?: number
  player2_score?: number
  players_ready_for_next?: string[]
}

export interface RoomPlayer {
  id: string
  room_id: string
  player_name: string
  is_creator: boolean
  joined_at: string
  approved: boolean
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
        is_creator: true,
        approved: true
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
        is_creator: false,
        approved: false
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to join room: ${error.message}`)
    }
    
    // Mark this player as Player 2 in sessionStorage
    sessionStorage.setItem(`room-creator-${roomId}`, 'false')

    return data
  },

  async approvePlayer(playerId: string): Promise<void> {
    const { error } = await supabase
      .from('room_players')
      .update({ approved: true })
      .eq('id', playerId)

    if (error) {
      throw new Error(`Failed to approve player: ${error.message}`)
    }
  },

  async startGame(roomId: string, puzzleSequence: number[]): Promise<void> {
    const { error } = await supabase
      .from('game_rooms')
      .update({ 
        status: 'playing',
        puzzle_sequence: puzzleSequence,
        current_puzzle_index: 0,
        game_state: 'playing',
        player1_score: 0,
        player2_score: 0,
        players_ready_for_next: []
      })
      .eq('id', roomId)

    if (error) {
      throw new Error(`Failed to start game: ${error.message}`)
    }
  },

  async updateGameState(roomId: string, updates: Partial<GameRoom>): Promise<void> {
    const { error } = await supabase
      .from('game_rooms')
      .update(updates)
      .eq('id', roomId)

    if (error) {
      throw new Error(`Failed to update game state: ${error.message}`)
    }
  },

  async markPlayerReady(roomId: string, playerId: string): Promise<void> {
    // Get current room state
    const room = await this.getRoomById(roomId)
    if (!room) return

    const currentReady = room.players_ready_for_next || []
    if (!currentReady.includes(playerId)) {
      const updatedReady = [...currentReady, playerId]
      
      // If both players are ready, move to next puzzle
      const updates: Partial<GameRoom> = {
        players_ready_for_next: updatedReady
      }

      if (updatedReady.length >= 2) {
        const nextIndex = (room.current_puzzle_index || 0) + 1
        updates.current_puzzle_index = nextIndex
        updates.game_state = 'playing'
        updates.players_ready_for_next = []
        updates.round_winner = undefined
      }

      await this.updateGameState(roomId, updates)
    }
  }
}