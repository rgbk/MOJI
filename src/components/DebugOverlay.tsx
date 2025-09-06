import { useState, useEffect } from 'react'
import { useLocation, useParams, useNavigate } from 'react-router-dom'
import { HomeIcon } from '@heroicons/react/24/solid'
import { useVoiceRecognition } from '../hooks/useVoiceRecognition'
import { BROWSER_INFO, checkSafariRequirements, detectBrowser } from '../utils/browserDetection'

interface DebugOverlayProps {
  viewName?: string
  additionalInfo?: Record<string, any>
}

function DebugOverlay({ viewName, additionalInfo = {} }: DebugOverlayProps) {
  const location = useLocation()
  const params = useParams()
  const navigate = useNavigate()
  const [isExpanded, setIsExpanded] = useState(false)
  const [timestamp, setTimestamp] = useState(new Date().toLocaleTimeString())
  const [copySuccess, setCopySuccess] = useState(false)

  // Add voice recognition debugging for Safari issues
  const roomId = params.roomId
  const voice = useVoiceRecognition({
    language: 'en-US',
    continuous: false,
    interimResults: true,
    confidenceThreshold: 0.0,
    enableAudioFeedback: false // Don't play sounds in debug mode
  }, roomId)
  
  // Get comprehensive browser and voice info
  const browserInfo = detectBrowser()
  const safariRequirements = BROWSER_INFO.isSafari ? checkSafariRequirements(BROWSER_INFO) : null

  // Update timestamp every second
  useEffect(() => {
    const interval = setInterval(() => {
      setTimestamp(new Date().toLocaleTimeString())
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // Determine detailed view/state name with lobby sub-states
  const getDetailedViewName = () => {
    if (viewName) return viewName
    
    const path = location.pathname
    if (path === '/') return 'Home'
    if (path.startsWith('/admin')) return 'Admin'
    if (path.startsWith('/game/')) return 'Game'
    
    if (path.startsWith('/room/')) {
      // Enhanced lobby state detection
      const { isCreator, playersCount, pendingPlayer, loading } = additionalInfo
      
      if (loading) return 'Lobby-Loading'
      
      if (isCreator === true) {
        if (playersCount === 1) return 'Lobby-Player1-WaitingForPlayer2'
        if (pendingPlayer && pendingPlayer !== 'none') return 'Lobby-Player1-AdmitPlayer2'
        if (playersCount >= 2) return 'Lobby-Player1-ReadyToStart'
        return 'Lobby-Player1'
      } else if (isCreator === false) {
        return 'Lobby-Player2-WaitingForApproval'
      }
      
      return 'Lobby'
    }
    
    return path.replace('/', '') || 'Unknown'
  }

  const autoViewName = getDetailedViewName()

  // Get the actual room/game ID from params
  const actualRoomId = params.roomId || params.gameId
  
  // Get all mic permission keys from localStorage (simplified for new implementation)
  const allMicPermissionKeys = Object.keys(localStorage)
    .filter(key => key.includes('moji-mic-permission'))
    .map(key => ({
      key,
      value: localStorage.getItem(key)
    }))
  
  // Get relevant info
  const debugInfo = {
    view: autoViewName,
    path: location.pathname,
    
    // Voice recognition debug info
    'room_id': actualRoomId || 'none',
    'storage_key': actualRoomId ? `moji-mic-permission-${actualRoomId}` : 'none',
    'storage_value': actualRoomId ? localStorage.getItem(`moji-mic-permission-${actualRoomId}`) : 'none',
    'voice_permission': voice.permissionGranted,
    'voice_error': voice.error || 'none',
    'voice_supported': voice.isSupported,
    'voice_listening': voice.isListening,
    
    time: timestamp,
    
    ...additionalInfo
  }

  // Filter out undefined values
  const filteredInfo = Object.fromEntries(
    Object.entries(debugInfo).filter(([, value]) => value !== undefined)
  )

  // Copy debug state to clipboard with enhanced voice debugging
  const handleCopyState = async (e: React.MouseEvent) => {
    e.stopPropagation()
    
    const stateString = `🐛 MOJI Debug State: ${autoViewName}\n` +
      `🕐 ${timestamp}\n` +
      (BROWSER_INFO.isSafari ? `🦁 Safari Browser Detected\n` : '') +
      (voice.error ? `❌ Voice Error: ${voice.error}\n` : '') +
      `\n📱 Voice Recognition Status:\n` +
      Object.entries(filteredInfo)
        .filter(([key]) => key.startsWith('voice') || key.startsWith('safari'))
        .map(([key, value]) => `  ${key}: ${typeof value === 'object' ? JSON.stringify(value) : value}`)
        .join('\n') +
      `\n\n📋 Full Debug Info:\n` +
      Object.entries(filteredInfo)
        .map(([key, value]) => `${key}: ${typeof value === 'object' ? JSON.stringify(value) : value}`)
        .join('\n')
    
    try {
      await navigator.clipboard.writeText(stateString)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } catch (err) {
      console.warn('Failed to copy to clipboard:', err)
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-[9999] font-mono text-xs flex flex-col items-end space-y-2">
      {/* Home Button */}
      <button
        onClick={() => navigate('/')}
        className="bg-black/90 text-green-400 rounded-lg border border-green-500/50 p-2 hover:bg-green-500/20 transition-colors"
        title="Go to Home"
      >
        <HomeIcon className="w-4 h-4" />
      </button>
      
      {/* Debug Overlay */}
      <div 
        className={`bg-black/90 text-green-400 rounded-lg border border-green-500/50 transition-all duration-200 ${
          isExpanded ? 'p-3 min-w-[250px] max-w-[350px] max-h-[70vh] overflow-y-auto' : 'px-2 py-1'
        }`}
        onClick={() => setIsExpanded(!isExpanded)}
        style={{ cursor: 'pointer' }}
      >
        {!isExpanded ? (
          // Compact view - show view name and voice/Safari status
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              BROWSER_INFO.isSafari && voice.error ? 'bg-red-500 animate-pulse' : 
              BROWSER_INFO.isSafari ? 'bg-yellow-500' :
              'bg-green-400 animate-pulse'
            }`}></div>
            <span className="font-bold">{autoViewName}</span>
            {BROWSER_INFO.isSafari && voice.error && (
              <span className="text-red-400 text-xs">🦁🎤❌</span>
            )}
            {BROWSER_INFO.isSafari && !voice.error && voice.permissionGranted === false && (
              <span className="text-yellow-400 text-xs">🦁🎤⚠️</span>
            )}
          </div>
        ) : (
          // Expanded view - show all debug info
          <div className="space-y-1">
            <div className="flex justify-between items-center border-b border-green-500/30 pb-1 mb-2 sticky top-0 bg-black/90">
              <span className="text-green-300 font-bold">🐛 Debug Info</span>
              <button
                onClick={handleCopyState}
                className={`px-2 py-1 text-xs rounded transition-colors flex-shrink-0 ${
                  copySuccess 
                    ? 'bg-green-700 text-white' 
                    : 'bg-green-600 hover:bg-green-500 text-white'
                }`}
                title="Copy debug state to clipboard"
              >
                {copySuccess ? '✓ Copied!' : '📋 Copy'}
              </button>
            </div>
            {Object.entries(filteredInfo).map(([key, value]) => (
              <div key={key} className="flex justify-between items-start space-x-4">
                <span className="text-green-600 capitalize font-medium min-w-[60px]">
                  {key}:
                </span>
                <span className="text-green-400 text-right flex-1 break-all">
                  {typeof value === 'object' 
                    ? JSON.stringify(value, null, 0)
                    : String(value)
                  }
                </span>
              </div>
            ))}
            <div className="text-xs text-green-600 mt-2 pt-2 border-t border-green-500/30">
              Click to collapse • Copy button for easy sharing
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default DebugOverlay