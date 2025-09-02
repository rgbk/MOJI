import { useState, useEffect, useRef, useCallback } from 'react'
import { audioFeedback } from '../lib/audio'

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
  options: UseVoiceRecognitionOptions = {}
): UseVoiceRecognitionReturn {
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
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null)

  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isInitialized = useRef(false)

  // Check browser support and secure context on mount
  useEffect(() => {
    // Check if we're in a secure context (HTTPS or localhost)
    const isSecureContext = window.isSecureContext || window.location.protocol === 'https:' || 
      window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    
    if (!isSecureContext) {
      console.error('🎤 Microphone access requires HTTPS or localhost')
      setIsSupported(false)
      setState('not-supported')
      setError('Microphone access requires a secure connection (HTTPS)')
      return
    }

    const SpeechRecognitionAPI = 
      window.SpeechRecognition || window.webkitSpeechRecognition

    if (SpeechRecognitionAPI) {
      setIsSupported(true)
      setState('idle')
      
      // Check microphone permission status more robustly
      checkMicrophonePermission()
    } else {
      console.warn('🎤 Speech Recognition not supported in this browser')
      setIsSupported(false)
      setState('not-supported')
      setError('Speech recognition is not supported in this browser')
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

    // Handle errors with enhanced messaging
    recognition.onerror = (event: any) => {
      console.error('🎤 Voice recognition error:', { 
        error: event.error, 
        message: event.message,
        timestamp: new Date().toISOString()
      })
      setState('error')
      
      let errorMessage = 'Speech recognition error'
      let shouldUpdatePermissionStatus = false
      
      switch (event.error) {
        case 'not-allowed':
          errorMessage = 'Microphone access denied. Please click the microphone icon in your browser address bar and allow microphone access, then try again.'
          setPermissionGranted(false)
          shouldUpdatePermissionStatus = true
          break
        case 'no-speech':
          errorMessage = 'No speech detected. Please try speaking clearly into your microphone.'
          // Don't change permission status for no-speech
          break
        case 'audio-capture':
          errorMessage = 'Cannot access your microphone. Please check that your microphone is connected and not being used by another application.'
          break
        case 'network':
          errorMessage = 'Network error occurred during speech recognition. Please check your internet connection and try again.'
          break
        case 'aborted':
          errorMessage = 'Speech recognition was stopped.'
          // Don't show error for user-initiated aborts
          setState('idle')
          setError(null)
          return
        case 'service-not-allowed':
          errorMessage = 'Speech recognition service is not allowed. Please enable microphone permissions and ensure you are using HTTPS.'
          setPermissionGranted(false)
          shouldUpdatePermissionStatus = true
          break
        case 'bad-grammar':
          errorMessage = 'Speech recognition configuration error. Please try again.'
          break
        case 'language-not-supported':
          errorMessage = 'The selected language is not supported for speech recognition.'
          break
        default:
          errorMessage = `Speech recognition error: ${event.error}. Please try again.`
      }
      
      setError(errorMessage)
      
      // Reset recognition instance if we got a permission error
      if (shouldUpdatePermissionStatus && recognitionRef.current) {
        recognitionRef.current = null
      }
      
      // Play error sound (only for actual errors, not aborts)
      if (enableAudioFeedback && event.error !== 'aborted') {
        try {
          audioFeedback.playErrorSound()
        } catch (audioError) {
          console.warn('🎤 Failed to play error sound:', audioError)
        }
      }
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
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
      console.log('🎤 Microphone permission granted successfully')
      return true
      
    } catch (err: any) {
      console.error('🎤 Microphone permission error:', err)
      setPermissionGranted(false)
      setState('error')
      
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
    
    try {
      // Try using Permissions API first (more reliable for status checking)
      if (navigator.permissions && navigator.permissions.query) {
        const permissionStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName })
        setPermissionGranted(permissionStatus.state === 'granted')
        console.log('🎤 Microphone permission status:', permissionStatus.state)
        
        // Listen for permission changes
        permissionStatus.onchange = () => {
          const newState = permissionStatus.state === 'granted'
          setPermissionGranted(newState)
          console.log('🎤 Microphone permission changed:', permissionStatus.state)
          
          // Clear errors if permission was granted
          if (newState) {
            setError(null)
            setState('idle')
          }
        }
      } else {
        console.log('🎤 Permissions API not available, will check on first use')
        setPermissionGranted(null)
      }
    } catch (err) {
      console.warn('🎤 Cannot check microphone permission:', err)
      setPermissionGranted(null)
    }
  }, [isSupported])

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