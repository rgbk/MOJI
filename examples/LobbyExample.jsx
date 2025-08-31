import React, { useState, useEffect } from 'react';
import { GameLobby } from '../components/GameLobby';
import '../styles/GameLobby.css';

/**
 * Example implementation of the Game Lobby
 * This shows how to integrate the lobby system into your app
 */
export function LobbyExample() {
  const [roomId, setRoomId] = useState(null);
  const [playerName, setPlayerName] = useState('');

  // Check URL parameters for room ID (for shareable links)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const roomFromUrl = urlParams.get('room');
    if (roomFromUrl) {
      setRoomId(roomFromUrl);
    }
  }, []);

  // If we have a room ID from URL, show join interface
  // Otherwise, show create room interface
  return (
    <div className="lobby-container">
      <div className="header">
        <h1>Multiplayer Game Lobby</h1>
        <p>Create or join a game room to play with friends!</p>
      </div>

      <GameLobby 
        roomId={roomId} 
        playerName={playerName} 
      />

      {/* Debug info (remove in production) */}
      <div className="debug-info" style={{ marginTop: '20px', padding: '10px', background: '#f0f0f0', fontSize: '12px' }}>
        <strong>Debug Info:</strong>
        <br />Room ID from URL: {roomId || 'None'}
        <br />Player Name: {playerName || 'Not set'}
      </div>
    </div>
  );
}

// Additional utility function for generating room links
export function generateRoomLink(roomId) {
  const baseUrl = window.location.origin + window.location.pathname;
  return `${baseUrl}?room=${roomId}`;
}

// Hook for managing URL parameters
export function useUrlParams() {
  const [params, setParams] = useState(new URLSearchParams(window.location.search));

  useEffect(() => {
    const handleUrlChange = () => {
      setParams(new URLSearchParams(window.location.search));
    };

    window.addEventListener('popstate', handleUrlChange);
    return () => window.removeEventListener('popstate', handleUrlChange);
  }, []);

  const updateParam = (key, value) => {
    const newParams = new URLSearchParams(window.location.search);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    const newUrl = `${window.location.pathname}?${newParams.toString()}`;
    window.history.pushState({}, '', newUrl);
    setParams(newParams);
  };

  return { params, updateParam };
}