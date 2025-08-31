import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase'; // Adjust path as needed

/**
 * Hook for managing game room realtime functionality
 * Handles room creation, joining, and realtime updates
 */
export function useGameRoom(roomId = null) {
  const [room, setRoom] = useState(null);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  // Create a new game room
  const createRoom = useCallback(async (creatorName, maxPlayers = 2) => {
    try {
      setLoading(true);
      setError(null);

      // Generate a unique room ID
      const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();

      // Create the room
      const { data: roomData, error: roomError } = await supabase
        .from('game_rooms')
        .insert([
          {
            id: roomId,
            created_by: creatorName, // Using name instead of auth.uid() for simplicity
            status: 'waiting',
            max_players: maxPlayers
          }
        ])
        .select()
        .single();

      if (roomError) throw roomError;

      // Add creator as first player
      const { error: playerError } = await supabase
        .from('room_players')
        .insert([
          {
            room_id: roomId,
            player_name: creatorName,
            is_creator: true
          }
        ]);

      if (playerError) throw playerError;

      return roomData;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Join an existing room
  const joinRoom = useCallback(async (roomId, playerName) => {
    try {
      setLoading(true);
      setError(null);

      // Check if room exists and has space
      const { data: roomData, error: roomError } = await supabase
        .from('game_rooms')
        .select('*, room_players(*)')
        .eq('id', roomId)
        .single();

      if (roomError) throw roomError;
      if (!roomData) throw new Error('Room not found');
      if (roomData.room_players.length >= roomData.max_players) {
        throw new Error('Room is full');
      }

      // Check if player already in room
      const existingPlayer = roomData.room_players.find(p => p.player_name === playerName);
      if (existingPlayer) {
        throw new Error('Player name already taken in this room');
      }

      // Add player to room
      const { error: joinError } = await supabase
        .from('room_players')
        .insert([
          {
            room_id: roomId,
            player_name: playerName,
            is_creator: false
          }
        ]);

      if (joinError) throw joinError;

      return roomData;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Admit a player (for room creator)
  const admitPlayer = useCallback(async (playerId) => {
    try {
      // This could update a player status or room status
      // For now, we'll just update the room status to 'active'
      const { error } = await supabase
        .from('game_rooms')
        .update({ status: 'active' })
        .eq('id', roomId);

      if (error) throw error;
    } catch (err) {
      setError(err.message);
    }
  }, [roomId]);

  // Remove a player from room
  const removePlayer = useCallback(async (playerId) => {
    try {
      const { error } = await supabase
        .from('room_players')
        .delete()
        .eq('id', playerId);

      if (error) throw error;
    } catch (err) {
      setError(err.message);
    }
  }, []);

  // Load initial room data
  useEffect(() => {
    if (!roomId) {
      setLoading(false);
      return;
    }

    const loadRoomData = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .rpc('get_room_with_players', { room_id_param: roomId });

        if (error) throw error;
        if (data) {
          setRoom(data.room);
          setPlayers(data.players || []);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadRoomData();
  }, [roomId]);

  // Set up realtime subscriptions
  useEffect(() => {
    if (!roomId) return;

    let roomSubscription;
    let playersSubscription;

    const setupRealtimeSubscriptions = async () => {
      try {
        // Subscribe to room changes
        roomSubscription = supabase
          .channel(`room-${roomId}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'game_rooms',
              filter: `id=eq.${roomId}`
            },
            (payload) => {
              console.log('Room update:', payload);
              if (payload.eventType === 'UPDATE') {
                setRoom(payload.new);
              } else if (payload.eventType === 'DELETE') {
                setRoom(null);
                setError('Room has been deleted');
              }
            }
          )
          .subscribe((status) => {
            console.log('Room subscription status:', status);
            setIsConnected(status === 'SUBSCRIBED');
          });

        // Subscribe to player changes
        playersSubscription = supabase
          .channel(`players-${roomId}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'room_players',
              filter: `room_id=eq.${roomId}`
            },
            (payload) => {
              console.log('Players update:', payload);
              
              if (payload.eventType === 'INSERT') {
                setPlayers(prev => [...prev, payload.new]);
              } else if (payload.eventType === 'UPDATE') {
                setPlayers(prev => 
                  prev.map(player => 
                    player.id === payload.new.id ? payload.new : player
                  )
                );
              } else if (payload.eventType === 'DELETE') {
                setPlayers(prev => 
                  prev.filter(player => player.id !== payload.old.id)
                );
              }
            }
          )
          .subscribe((status) => {
            console.log('Players subscription status:', status);
          });

      } catch (err) {
        console.error('Error setting up realtime subscriptions:', err);
        setError('Failed to connect to realtime updates');
      }
    };

    setupRealtimeSubscriptions();

    // Cleanup subscriptions
    return () => {
      if (roomSubscription) {
        supabase.removeChannel(roomSubscription);
      }
      if (playersSubscription) {
        supabase.removeChannel(playersSubscription);
      }
    };
  }, [roomId]);

  return {
    room,
    players,
    loading,
    error,
    isConnected,
    createRoom,
    joinRoom,
    admitPlayer,
    removePlayer
  };
}