import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useVoiceRecognition } from '../hooks/useVoiceRecognition'
import { MicrophoneIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/solid'

interface MicrophoneSetupProps {
  onPermissionGranted?: () => void
  compact?: boolean
  onDebugInfo?: (info: any) => void
}

function MicrophoneSetup({ onPermissionGranted, compact = false, onDebugInfo }: MicrophoneSetupProps) {
  const { roomId } = useParams()
  const [isTestingMic, setIsTestingMic] = useState(false)
  
  // MicrophoneSetup component rendered
  
  const {
    isSupported,
    permissionGranted,
    error,
    requestPermission,
    resetTranscript
  } = useVoiceRecognition({
    language: 'en-US',
    continuous: false,
    interimResults: true,
    confidenceThreshold: 0.0,
    enableAudioFeedback: true
  }, roomId)

  useEffect(() => {
    if (permissionGranted && onPermissionGranted) {
      onPermissionGranted()
    }
  }, [permissionGranted, onPermissionGranted])

  // Report debug info
  useEffect(() => {
    if (onDebugInfo) {
      onDebugInfo({
        isSupported,
        permissionGranted,
        error: error || 'none',
        isTestingMic
      })
    }
  }, [onDebugInfo, isSupported, permissionGranted, error, isTestingMic])

  const handleEnableMicrophone = async () => {
    setIsTestingMic(true)
    resetTranscript()
    
    try {
      const granted = await requestPermission()
      if (granted) {
        // Permission granted
      }
    } catch (err) {
      // Failed to request permission
    } finally {
      setIsTestingMic(false)
    }
  }

  // Don't show anything if voice is not supported
  if (!isSupported) {
    return compact ? null : (
      <div className="bg-yellow-600/20 border border-yellow-500/50 rounded-lg px-4 py-3 mb-4">
        <p className="text-yellow-300 text-sm">
          🎤 Voice input not supported in this browser
        </p>
      </div>
    )
  }

  // Compact view for when permission is already granted
  if (compact && permissionGranted) {
    return (
      <div className="flex items-center text-green-400 text-sm mb-2">
        <CheckCircleIcon className="w-4 h-4 mr-1" />
        Microphone ready
      </div>
    )
  }

  // Permission already granted
  if (permissionGranted) {
    return (
      <div className="bg-green-600/20 border border-green-500/50 rounded-lg px-4 py-3 mb-4">
        <div className="flex items-center">
          <CheckCircleIcon className="w-5 h-5 text-green-400 mr-2" />
          <div>
            <p className="text-green-300 font-medium">Microphone Ready!</p>
            <p className="text-green-200 text-sm">You can use voice input during the game</p>
          </div>
        </div>
      </div>
    )
  }

  // Permission denied
  if (permissionGranted === false) {
    return (
      <div className="bg-red-600/20 border border-red-500/50 rounded-lg px-4 py-3 mb-4">
        <div className="flex items-center">
          <XCircleIcon className="w-5 h-5 text-red-400 mr-2" />
          <div>
            <p className="text-red-300 font-medium">Microphone Access Denied</p>
            <p className="text-red-200 text-sm mb-2">
              Voice input won't work during the game. Click to try again.
            </p>
            <button
              onClick={handleEnableMicrophone}
              disabled={isTestingMic}
              className="text-xs bg-red-500 hover:bg-red-600 disabled:bg-red-700 px-3 py-1 rounded text-white transition-colors"
            >
              {isTestingMic ? 'Requesting...' : 'Try Again'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Show enable button
  return (
    <div className="bg-blue-600/20 border border-blue-500/50 rounded-lg px-4 py-3 mb-4">
      <div className="flex items-center">
        <MicrophoneIcon className="w-5 h-5 text-blue-400 mr-2" />
        <div className="flex-1">
          <p className="text-blue-300 font-medium">Enable Voice Input</p>
          <p className="text-blue-200 text-sm mb-2">
            Set up your microphone now to use voice input during the game
          </p>
          {error && (
            <p className="text-red-300 text-xs mb-2">{error}</p>
          )}
          <button
            onClick={handleEnableMicrophone}
            disabled={isTestingMic}
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
          >
            {isTestingMic ? (
              <>
                <div className="inline-block animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                Requesting Permission...
              </>
            ) : (
              <>
                <MicrophoneIcon className="w-4 h-4 inline mr-1" />
                Enable Microphone
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default MicrophoneSetup