import { useState, useEffect } from 'react'
import { useLocation, useParams, useNavigate } from 'react-router-dom'
import { HomeIcon } from '@heroicons/react/24/solid'

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

  // Get relevant info
  const debugInfo = {
    view: autoViewName,
    path: location.pathname,
    params: Object.keys(params).length > 0 ? params : undefined,
    search: location.search || undefined,
    hash: location.hash || undefined,
    time: timestamp,
    ...additionalInfo
  }

  // Filter out undefined values
  const filteredInfo = Object.fromEntries(
    Object.entries(debugInfo).filter(([, value]) => value !== undefined)
  )

  // Copy debug state to clipboard
  const handleCopyState = async (e: React.MouseEvent) => {
    e.stopPropagation()
    
    const stateString = `🐛 Debug State: ${autoViewName}\n` + 
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
          isExpanded ? 'p-3 min-w-[250px]' : 'px-2 py-1'
        }`}
        onClick={() => setIsExpanded(!isExpanded)}
        style={{ cursor: 'pointer' }}
      >
        {!isExpanded ? (
          // Compact view - just show view name
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="font-bold">{autoViewName}</span>
          </div>
        ) : (
          // Expanded view - show all debug info
          <div className="space-y-1">
            <div className="flex justify-between items-center border-b border-green-500/30 pb-1 mb-2">
              <span className="text-green-300 font-bold">🐛 Debug Info</span>
              <button
                onClick={handleCopyState}
                className={`px-2 py-1 text-xs rounded transition-colors ${
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