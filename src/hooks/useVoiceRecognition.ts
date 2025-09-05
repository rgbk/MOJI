import { useState, useEffect, useRef, useCallback } from 'react'
import { audioFeedback } from '../lib/audio'
import { 
  BROWSER_INFO, 
  SAFARI_LIMITATIONS, 
  getSafariErrorMessage, 
  logSafariDebugInfo,
  checkSafariRequirements 
} from '../utils/browserDetection'
import { 
  voiceErrorRateLimiter, 
  safariVoiceErrorRateLimiter, 
  createRateLimitedErrorHandler,
  getVoiceErrorKey 
} from '../utils/errorRateLimit'

// SpeechRecognition types are defined in src/types/speech.d.ts

export type VoiceRecognitionState = 
  | 'idle' 
  | 'listening' 
  | 'processing' 
  | 'error' 
  | 'not-supported'

export interface VoiceRecognitionResult {
  transcript: string
  confidence: number
  isFinal: boolean
}

export interface UseVoiceRecognitionOptions {
  language?: string
  continuous?: boolean
  interimResults?: boolean
  maxAlternatives?: number
  confidenceThreshold?: number
  enableAudioFeedback?: boolean
}

export interface UseVoiceRecognitionReturn {
  state: VoiceRecognitionState
  transcript: string
  confidence: number
  isSupported: boolean
  isListening: boolean
  error: string | null
  permissionGranted: boolean | null
  startListening: () => void
  stopListening: () => void
  resetTranscript: () => void
  requestPermission: () => Promise<boolean>
  // Push-to-Talk specific methods
  startPushToTalk: () => void
  stopPushToTalk: () => void
}

export function useVoiceRecognition(
  options: UseVoiceRecognitionOptions = {},
  roomId?: string
): UseVoiceRecognitionReturn {
  const hookId = Math.random().toString(36).substr(2, 9) // Generate unique ID for debugging
  const {
    language = 'en-US',
    continuous = false,
    interimResults = true,
    maxAlternatives = 1,
    confidenceThreshold = 0.5,
    enableAudioFeedback = true
  } = options

  const [state, setState] = useState<VoiceRecognitionState>('idle')
  const [transcript, setTranscript] = useState('')
  const [confidence, setConfidence] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [isSupported, setIsSupported] = useState(false)
  // Initialize permission state from localStorage for Safari, sessionStorage for others
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(() => {
    if (roomId) {
      const storageKey = `moji-mic-permission-${roomId}`
      // Safari loses sessionStorage on navigation, so use localStorage
      const storage = BROWSER_INFO.isSafari ? localStorage : sessionStorage
      const saved = storage.getItem(storageKey)
      console.log('🎤 Initializing permission from storage:', { hookId, roomId, saved, usedLocalStorage: BROWSER_INFO.isSafari })
      return saved === 'granted' ? true : null
    }
    return null
  })

  // Add effect to listen for permission changes in sessionStorage from other hook instances
  useEffect(() => {
    if (!roomId) return

    const sessionKey = `moji-mic-permission-${roomId}`
    
    // Create a custom event for cross-tab/cross-component permission sync
    const handlePermissionSync = (event: CustomEvent) => {
      if (event.detail.roomId === roomId) {
        const isGranted = event.detail.granted
        console.log('🎤 Syncing permission state from another component:', { hookId, roomId, granted: isGranted })
        setPermissionGranted(isGranted)
      }
    }

    // Listen for custom permission sync events
    window.addEventListener('voicePermissionSync', handlePermissionSync as EventListener)

    // Also check sessionStorage periodically to catch any missed updates
    const syncInterval = setInterval(() => {
      const currentPermission = sessionStorage.getItem(sessionKey)
      const isCurrentlyGranted = currentPermission === 'granted'
      const currentState = permissionGranted
      
      // Only update if the state has actually changed
      if ((currentState === null && isCurrentlyGranted) || 
          (currentState === true && !isCurrentlyGranted) ||
          (currentState === false && isCurrentlyGranted)) {
        console.log('🎤 Permission state changed in sessionStorage, syncing:', { 
          roomId, 
          from: currentState, 
          to: isCurrentlyGranted 
        })
        setPermissionGranted(isCurrentlyGranted ? true : (currentPermission === null ? null : false))
      }
    }, 500) // Check every 500ms

    return () => {
      window.removeEventListener('voicePermissionSync', handlePermissionSync as EventListener)
      clearInterval(syncInterval)
    }
  }, [roomId, permissionGranted])

  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isInitialized = useRef(false)
  
  // Safari-specific state
  const safariDebugLogged = useRef(false)
  const rateLimiter = BROWSER_INFO.isSafari ? safariVoiceErrorRateLimiter : voiceErrorRateLimiter
  
  // Helper function for base error messages
  const getBaseErrorMessage = useCallback((error: string): string => {
    switch (error) {
      case 'not-allowed':
        return 'Microphone access denied. Please click the microphone icon in your browser address bar and allow microphone access, then try again.'
      case 'no-speech':
        return 'No speech detected. Please try speaking clearly into your microphone.'
      case 'audio-capture':
        return 'Cannot access your microphone. Please check that your microphone is connected and not being used by another application.'
      case 'network':
        return 'Network error occurred during speech recognition. Please check your internet connection and try again.'
      case 'service-not-allowed':
        return 'Speech recognition service is not allowed. Please enable microphone permissions and ensure you are using HTTPS.'
      case 'bad-grammar':
        return 'Speech recognition configuration error. Please try again.'
      case 'language-not-supported':
        return 'The selected language is not supported for speech recognition.'
      case 'aborted':
        return 'Speech recognition was stopped.'
      default:
        return `Speech recognition error: ${error}. Please try again.`
    }
  }, [])

  // Check browser support and secure context on mount
  useEffect(() => {
    console.log('🎤 useVoiceRecognition hook mounted/re-initialized')
    
    // Safari-specific debugging info (log once)
    if (BROWSER_INFO.isSafari && !safariDebugLogged.current) {
      logSafariDebugInfo()
      safariDebugLogged.current = true
    }
    
    // Check Safari requirements
    if (BROWSER_INFO.isSafari) {
      const requirements = checkSafariRequirements(BROWSER_INFO)
      if (requirements.issues.length > 0) {
        console.warn('🦁 Safari compatibility issues detected:', requirements.issues)
      }
    }
    
    // Check if we're in a secure context (HTTPS or localhost)
    const isSecureContext = window.isSecureContext || window.location.protocol === 'https:' || 
      window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    
    if (!isSecureContext) {
      const errorMsg = BROWSER_INFO.isSafari 
        ? 'Safari requires HTTPS for microphone access. Please use https:// instead of http://'
        : 'Microphone access requires a secure connection (HTTPS)'
      
      console.error('🎤 Microphone access requires HTTPS or localhost')
      setIsSupported(false)
      setState('not-supported')
      setError(errorMsg)
      return
    }

    const SpeechRecognitionAPI = 
      window.SpeechRecognition || window.webkitSpeechRecognition

    if (SpeechRecognitionAPI) {
      setIsSupported(true)
      setState('idle')
      
      if (BROWSER_INFO.isSafari) {
        console.log('🦁 Safari: Web Speech API is available')
      }
      
      // Check microphone permission status more robustly
      checkMicrophonePermission()
    } else {
      const errorMsg = BROWSER_INFO.isSafari 
        ? 'Web Speech API is not available in this version of Safari. Please update to a newer version or try Chrome.'
        : 'Speech recognition is not supported in this browser'
      
      console.warn('🎤 Speech Recognition not supported in this browser')
      setIsSupported(false)
      setState('not-supported')
      setError(errorMsg)
    }
  }, [])

  // Initialize speech recognition
  const initializeRecognition = useCallback(() => {
    if (!isSupported) return null

    const SpeechRecognitionAPI = 
      window.SpeechRecognition || window.webkitSpeechRecognition

    const recognition = new SpeechRecognitionAPI()
    
    // Configure recognition settings
    recognition.continuous = continuous
    recognition.interimResults = interimResults
    recognition.lang = language
    recognition.maxAlternatives = maxAlternatives

    // Handle results
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      console.log('🎤 Voice recognition result:', { eventType: 'result', resultIndex: event.resultIndex, resultsLength: event.results.length })
      
      let finalTranscript = ''
      let interimTranscript = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        const alternative = result[0]

        if (result.isFinal) {
          finalTranscript += alternative.transcript
        } else {
          interimTranscript += alternative.transcript
        }
      }

      const currentTranscript = finalTranscript || interimTranscript
      const currentConfidence = event.results[event.results.length - 1]?.[0]?.confidence || 0

      console.log('🎤 Transcript update:', { 
        transcript: currentTranscript, 
        confidence: currentConfidence, 
        isFinal: !!finalTranscript 
      })

      setTranscript(currentTranscript)
      setConfidence(currentConfidence)

      // For Push-to-Talk: Always keep listening, never auto-stop based on confidence
      // The transcript will be submitted when user releases the button
    }
    
    // Add more detailed event handlers for debugging
    recognition.onspeechstart = () => {
      console.log('🎤 Speech detected - user is speaking')
    }
    
    recognition.onspeechend = () => {
      console.log('🎤 Speech ended - user stopped speaking')
    }
    
    recognition.onaudiostart = () => {
      console.log('🎤 Audio capture started')
    }
    
    recognition.onaudioend = () => {
      console.log('🎤 Audio capture ended')
    }
    
    recognition.onsoundstart = () => {
      console.log('🎤 Sound detected (may not be speech)')
    }
    
    recognition.onsoundend = () => {
      console.log('🎤 Sound ended')
    }
    
    recognition.onnomatch = () => {
      console.log('🎤 No speech match found')
      setError('No speech was recognized. Please try speaking more clearly.')
    }

    // Handle start
    recognition.onstart = () => {
      console.log('🎤 Voice recognition started')
      setState('listening')
      setError(null)
      
      // Play start listening sound
      if (enableAudioFeedback) {
        audioFeedback.playStartListeningSound()
      }
      
      // Set a timeout to automatically stop listening after 15 seconds (Push-to-Talk safety)
      timeoutRef.current = setTimeout(() => {
        console.log('⏰ Push-to-Talk timeout reached (15s)')
        if (recognitionRef.current) {
          recognitionRef.current.stop()
        }
      }, 15000)
    }

    // Handle end
    recognition.onend = () => {
      console.log('🎤 Voice recognition ended')
      setState('idle')
      
      // Play stop listening sound
      if (enableAudioFeedback) {
        audioFeedback.playStopListeningSound()
      }
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }

    // Handle errors with enhanced messaging and Safari-specific handling
    recognition.onerror = (event: any) => {
      const errorKey = getVoiceErrorKey(event.error)
      const logPrefix = BROWSER_INFO.isSafari ? '🦁 Safari voice error:' : '🎤 Voice recognition error:'
      
      // Use rate limiter to prevent error spam
      const rateLimitedHandler = createRateLimitedErrorHandler(
        rateLimiter,
        (errorMessage: string, count: number) => {
          // This will be called if the error should be processed
          console.error(logPrefix, { 
            error: event.error, 
            message: event.message,
            timestamp: new Date().toISOString(),
            errorCount: count
          })
          
          // Handle aborted errors differently (don't set error state)
          if (event.error === 'aborted') {
            setState('idle')
            setError(null)
            if (timeoutRef.current) {
              clearTimeout(timeoutRef.current)
              timeoutRef.current = null
            }
            return
          }
          
          setState('error')
          
          // Get Safari-specific error message if applicable
          const baseErrorMessage = getBaseErrorMessage(event.error)
          const finalErrorMessage = BROWSER_INFO.isSafari 
            ? getSafariErrorMessage(event.error, BROWSER_INFO)
            : baseErrorMessage
          
          setError(finalErrorMessage)
          
          // Handle permission status updates
          const shouldUpdatePermissionStatus = ['not-allowed', 'service-not-allowed'].includes(event.error)
          if (shouldUpdatePermissionStatus) {
            setPermissionGranted(false)
            
            // Update sessionStorage and sync with other instances
            if (roomId) {
              const storageKey = `moji-mic-permission-${roomId}`
      const storage = BROWSER_INFO.isSafari ? localStorage : sessionStorage
              storage.removeItem(storageKey)
              
              // Dispatch custom event to sync with other hook instances
              window.dispatchEvent(new CustomEvent('voicePermissionSync', {
                detail: { roomId, granted: false }
              }))
              console.log('🎤 Dispatched permission error sync event:', { roomId, granted: false, error: event.error })
            }
            
            if (recognitionRef.current) {
              recognitionRef.current = null
            }
          }
          
          // Play error sound (only for actual errors, not aborts)
          if (enableAudioFeedback && event.error !== 'aborted') {
            try {
              audioFeedback.playErrorSound()
            } catch (audioError) {
              console.warn(logPrefix.replace('error:', 'Failed to play error sound:'), audioError)
            }
          }
          
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current)
            timeoutRef.current = null
          }
        },
        (errorKey: string, cooldownMs: number) => {
          // This will be called if the error is rate limited
          if (BROWSER_INFO.isSafari) {
            console.warn(`🦁 Safari: Error "${errorKey}" rate limited (${Math.round(cooldownMs/1000)}s remaining)`)
          }
        }
      )
      
      // Process the error through rate limiter
      rateLimitedHandler(errorKey, event.error)
    }

    return recognition
  }, [isSupported, continuous, interimResults, language, maxAlternatives, confidenceThreshold, enableAudioFeedback])

  // Request microphone permission proactively with better error handling
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      setError('Speech recognition is not supported in this browser')
      return false
    }
    
    // Check if we're in a secure context
    const isSecureContext = window.isSecureContext || window.location.protocol === 'https:' || 
      window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    
    if (!isSecureContext) {
      setError('Microphone access requires a secure connection (HTTPS)')
      return false
    }
    
    try {
      console.log('🎤 Requesting microphone permission...')
      
      // Check if navigator.mediaDevices is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('getUserMedia not supported')
      }
      
      // Request permission through getUserMedia (most reliable method)
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      })
      
      // Stop all tracks immediately - we just wanted permission
      stream.getTracks().forEach(track => {
        track.stop()
        console.log('🎤 Stopped audio track:', track.kind)
      })
      
      setPermissionGranted(true)
      setError(null)
      setState('idle')
      
      // Save permission to room-specific sessionStorage
      if (roomId) {
        const storageKey = `moji-mic-permission-${roomId}`
      const storage = BROWSER_INFO.isSafari ? localStorage : sessionStorage
        storage.setItem(storageKey, 'granted')
        console.log('🎤 Saved permission to sessionStorage for room:', roomId)
        
        // Dispatch custom event to sync with other hook instances
        window.dispatchEvent(new CustomEvent('voicePermissionSync', {
          detail: { roomId, granted: true }
        }))
        console.log('🎤 Dispatched permission sync event:', { roomId, granted: true })
      }
      
      console.log('🎤 Microphone permission granted by user')
      
      console.log('🎤 Microphone permission granted successfully')
      return true
      
    } catch (err: any) {
      console.error('🎤 Microphone permission error:', err)
      setPermissionGranted(false)
      setState('error')
      
      // Clear permission from room-specific sessionStorage
      if (roomId) {
        const storageKey = `moji-mic-permission-${roomId}`
      const storage = BROWSER_INFO.isSafari ? localStorage : sessionStorage
        storage.removeItem(storageKey)
        console.log('🎤 Cleared permission from sessionStorage for room:', roomId)
        
        // Dispatch custom event to sync with other hook instances
        window.dispatchEvent(new CustomEvent('voicePermissionSync', {
          detail: { roomId, granted: false }
        }))
        console.log('🎤 Dispatched permission denied sync event:', { roomId, granted: false })
      }
      
      console.log('🎤 Microphone permission denied by user')
      
      // Provide specific error messages based on error type
      let errorMessage = 'Unable to access microphone'
      
      if (err.name === 'NotAllowedError') {
        errorMessage = 'Microphone access denied. Please click the microphone icon in your browser address bar and allow microphone access, then try again.'
      } else if (err.name === 'NotFoundError') {
        errorMessage = 'No microphone found. Please connect a microphone and try again.'
      } else if (err.name === 'NotSupportedError') {
        errorMessage = 'Microphone access is not supported in this browser.'
      } else if (err.name === 'NotReadableError') {
        errorMessage = 'Microphone is being used by another application. Please close other apps using your microphone and try again.'
      } else if (err.name === 'OverconstrainedError') {
        errorMessage = 'Microphone settings are not compatible. Please try with a different microphone.'
      } else if (err.name === 'SecurityError') {
        errorMessage = 'Microphone access blocked for security reasons. Please use HTTPS.'
      } else if (err.message && err.message.includes('secure')) {
        errorMessage = 'Microphone access requires a secure connection (HTTPS).'
      }
      
      setError(errorMessage)
      return false
    }
  }, [isSupported])

  // Start listening function with enhanced permission handling
  const startListening = useCallback(async () => {
    if (!isSupported || state === 'listening') {
      console.log('🎤 Cannot start listening:', { isSupported, state })
      return
    }
    
    // Check if permission was explicitly denied
    if (permissionGranted === false) {
      console.log('🎤 Permission previously denied, requesting again...')
      const granted = await requestPermission()
      if (!granted) {
        return // Error message already set by requestPermission
      }
    }
    
    // If permission status is unknown, request it
    if (permissionGranted === null) {
      console.log('🎤 Permission status unknown, requesting...')
      const granted = await requestPermission()
      if (!granted) {
        return // Error message already set by requestPermission
      }
    }

    try {
      console.log('🎤 Starting speech recognition...')
      
      // Always create a fresh recognition instance to avoid stale state issues
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort()
        } catch (e) {
          console.warn('🎤 Could not abort previous recognition:', e)
        }
        recognitionRef.current = null
      }
      
      recognitionRef.current = initializeRecognition()
      
      if (recognitionRef.current) {
        setTranscript('')
        setConfidence(0)
        setError(null)
        setState('processing') // Set to processing before start to show loading state
        
        // Start recognition - this may still fail if permissions changed
        recognitionRef.current.start()
        console.log('🎤 Speech recognition start() called successfully')
      } else {
        throw new Error('Failed to create speech recognition instance')
      }
    } catch (err: any) {
      console.error('🎤 Speech recognition start error:', err)
      setState('error')
      
      if (err.name === 'InvalidStateError') {
        setError('Speech recognition is already running. Please wait and try again.')
        // Reset the recognition instance
        if (recognitionRef.current) {
          try {
            recognitionRef.current.abort()
          } catch (abortErr) {
            console.warn('🎤 Failed to abort recognition:', abortErr)
          }
          recognitionRef.current = null
        }
      } else {
        setError('Failed to start speech recognition. Please try again.')
      }
    }
  }, [isSupported, state, permissionGranted, initializeRecognition, requestPermission])

  // Stop listening function
  const stopListening = useCallback(() => {
    if (recognitionRef.current && state === 'listening') {
      recognitionRef.current.stop()
    }
  }, [state])

  // Reset transcript function
  const resetTranscript = useCallback(() => {
    setTranscript('')
    setConfidence(0)
    setError(null)
    if (state !== 'listening') {
      setState('idle')
    }
  }, [state])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort()
        recognitionRef.current = null
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      isInitialized.current = false
    }
  }, [])

  // Push-to-Talk specific methods
  const startPushToTalk = useCallback(() => {
    console.log('🎤 Starting Push-to-Talk')
    if (!isSupported || state === 'listening') {
      console.log('🎤 Cannot start - not supported or already listening')
      return
    }
    startListening()
  }, [isSupported, state, startListening])

  const stopPushToTalk = useCallback(() => {
    console.log('🎤 Stopping Push-to-Talk')
    if (recognitionRef.current && state === 'listening') {
      recognitionRef.current.stop()
    }
  }, [state])
  
  // Check microphone permission status
  const checkMicrophonePermission = useCallback(async () => {
    if (!isSupported) return
    
    // Don't re-check if we already have a granted permission
    if (permissionGranted === true) {
      console.log('🎤 Permission already granted, skipping re-check')
      return
    }
    
    try {
      // Try using Permissions API first (more reliable for status checking)
      if (navigator.permissions && navigator.permissions.query) {
        const permissionStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName })
        const isGranted = permissionStatus.state === 'granted'
        
        console.log('🎤 Browser permission check:', {
          state: permissionStatus.state,
          granted: isGranted,
          currentState: permissionGranted,
          browser: BROWSER_INFO.isSafari ? 'Safari' : 'Other'
        })
        
        // Only update state if it's different from current state
        if (permissionGranted !== isGranted) {
          console.log('🎤 Permission state changed:', { from: permissionGranted, to: isGranted })
          setPermissionGranted(isGranted)
        }
        
        // Listen for permission changes
        permissionStatus.onchange = () => {
          const newState = permissionStatus.state === 'granted'
          setPermissionGranted(newState)
          console.log('🎤 Microphone permission changed:', {
            state: permissionStatus.state,
            granted: newState
          })
          
          // Clear errors if permission was granted
          if (newState) {
            setError(null)
            setState('idle')
          }
        }
      } else {
        console.log('🎤 Permissions API not available, preserving current state')
        // Don't change permission state if API is not available
        if (permissionGranted !== true) {
          setPermissionGranted(null)
        }
      }
    } catch (err) {
      console.warn('🎤 Cannot check microphone permission:', err)
      // Don't reset to null if we already have permission
      if (permissionGranted !== true) {
        setPermissionGranted(null)
      }
    }
  }, [isSupported, permissionGranted])

  return {
    state,
    transcript: transcript.trim(),
    confidence,
    isSupported,
    isListening: state === 'listening',
    error,
    permissionGranted,
    startListening,
    stopListening,
    resetTranscript,
    requestPermission,
    // Push-to-Talk methods
    startPushToTalk,
    stopPushToTalk
  }
}