import React, { useState, useEffect } from 'react';
import { useGameRoom } from '../hooks/useGameRoom';

/**
 * Game Lobby Component
 * Handles room creation, joining, and realtime player management
 */
export function GameLobby({ roomId: initialRoomId, playerName }) {
  const [roomId, setRoomId] = useState(initialRoomId);
  const [currentPlayerName, setCurrentPlayerName] = useState(playerName || '');
  const [shareableLink, setShareableLink] = useState('');
  const [mode, setMode] = useState(initialRoomId ? 'joining' : 'creating');

  const {
    room,
    players,
    loading,
    error,
    isConnected,
    createRoom,
    joinRoom,
    admitPlayer,
    removePlayer
  } = useGameRoom(roomId);

  // Get current player info
  const currentPlayer = players.find(p => p.player_name === currentPlayerName);
  const isCreator = currentPlayer?.is_creator || false;
  const waitingPlayers = players.filter(p => !p.is_creator);

  // Generate shareable link when room is created
  useEffect(() => {
    if (room && isCreator) {
      const baseUrl = window.location.origin + window.location.pathname;
      const link = `${baseUrl}?room=${room.id}`;
      setShareableLink(link);
    }
  }, [room, isCreator]);

  // Handle room creation
  const handleCreateRoom = async (e) => {
    e.preventDefault();
    if (!currentPlayerName.trim()) return;

    const newRoom = await createRoom(currentPlayerName, 2);
    if (newRoom) {
      setRoomId(newRoom.id);
      setMode('created');
    }
  };

  // Handle room joining
  const handleJoinRoom = async (e) => {
    e.preventDefault();
    if (!currentPlayerName.trim() || !roomId) return;

    const joinedRoom = await joinRoom(roomId, currentPlayerName);
    if (joinedRoom) {
      setMode('joined');
    }
  };

  // Handle player admission (for room creator)
  const handleAdmitPlayer = async (playerId) => {
    await admitPlayer(playerId);
  };

  // Handle player removal (for room creator)
  const handleRemovePlayer = async (playerId) => {
    await removePlayer(playerId);
  };

  // Copy shareable link to clipboard
  const copyShareableLink = async () => {
    try {
      await navigator.clipboard.writeText(shareableLink);
      alert('Link copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy link:', err);
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = shareableLink;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('Link copied to clipboard!');
    }
  };

  // Connection status indicator
  const ConnectionStatus = () => (
    <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
      <span className={`status-dot ${isConnected ? 'green' : 'red'}`}></span>
      {isConnected ? 'Connected' : 'Disconnected'}
    </div>
  );

  // Loading state
  if (loading) {
    return (
      <div className="game-lobby loading">
        <h2>Loading...</h2>
        <ConnectionStatus />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="game-lobby error">
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  // Room creation form
  if (mode === 'creating') {
    return (
      <div className="game-lobby creating">
        <h2>Create Game Room</h2>
        <form onSubmit={handleCreateRoom}>
          <div className="form-group">
            <label>Your Name:</label>
            <input
              type="text"
              value={currentPlayerName}
              onChange={(e) => setCurrentPlayerName(e.target.value)}
              placeholder="Enter your name"
              required
              maxLength={20}
            />
          </div>
          <button type="submit" disabled={!currentPlayerName.trim()}>
            Create Room
          </button>
        </form>
      </div>
    );
  }

  // Room joining form
  if (mode === 'joining' && !room) {
    return (
      <div className="game-lobby joining">
        <h2>Join Game Room</h2>
        <p>Room ID: <strong>{roomId}</strong></p>
        <form onSubmit={handleJoinRoom}>
          <div className="form-group">
            <label>Your Name:</label>
            <input
              type="text"
              value={currentPlayerName}
              onChange={(e) => setCurrentPlayerName(e.target.value)}
              placeholder="Enter your name"
              required
              maxLength={20}
            />
          </div>
          <button type="submit" disabled={!currentPlayerName.trim()}>
            Join Room
          </button>
        </form>
      </div>
    );
  }

  // Room lobby view
  return (
    <div className="game-lobby active">
      <div className="lobby-header">
        <h2>Game Room: {room.id}</h2>
        <ConnectionStatus />
      </div>

      <div className="room-info">
        <p>Status: <span className={`status ${room.status}`}>{room.status}</span></p>
        <p>Players: {players.length}/{room.max_players}</p>
      </div>

      {/* Shareable link for room creator */}
      {isCreator && shareableLink && (
        <div className="shareable-link">
          <h3>Invite Players</h3>
          <div className="link-container">
            <input
              type="text"
              value={shareableLink}
              readOnly
              className="link-input"
            />
            <button onClick={copyShareableLink} className="copy-button">
              Copy Link
            </button>
          </div>
        </div>
      )}

      {/* Players list */}
      <div className="players-list">
        <h3>Players</h3>
        {players.map((player) => (
          <div key={player.id} className={`player-card ${player.is_creator ? 'creator' : ''}`}>
            <div className="player-info">
              <span className="player-name">{player.player_name}</span>
              {player.is_creator && <span className="creator-badge">Creator</span>}
              <span className="joined-time">
                Joined: {new Date(player.joined_at).toLocaleTimeString()}
              </span>
            </div>

            {/* Action buttons for room creator */}
            {isCreator && !player.is_creator && (
              <div className="player-actions">
                {room.status === 'waiting' && (
                  <button
                    onClick={() => handleAdmitPlayer(player.id)}
                    className="admit-button"
                  >
                    ADMIT
                  </button>
                )}
                <button
                  onClick={() => handleRemovePlayer(player.id)}
                  className="remove-button"
                >
                  Remove
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Game start button for creator */}
      {isCreator && players.length >= 2 && room.status === 'waiting' && (
        <div className="game-controls">
          <button
            onClick={() => handleAdmitPlayer(null)} // This will change room status to 'active'
            className="start-game-button"
          >
            Start Game
          </button>
        </div>
      )}

      {/* Waiting message for non-creators */}
      {!isCreator && room.status === 'waiting' && (
        <div className="waiting-message">
          <p>Waiting for {players.find(p => p.is_creator)?.player_name} to start the game...</p>
        </div>
      )}
    </div>
  );
}