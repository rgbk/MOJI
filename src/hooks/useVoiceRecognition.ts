import { useState, useEffect, useRef, useCallback } from 'react'
import { audioFeedback } from '../lib/audio'
import { BROWSER_INFO } from '../utils/browserDetection'

export type VoiceRecognitionState = 
  | 'idle' 
  | 'listening' 
  | 'processing' 
  | 'error' 
  | 'not-supported'

export interface UseVoiceRecognitionOptions {
  language?: string
  continuous?: boolean
  interimResults?: boolean
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

// Safari-specific detection for proper permission handling
function getSpeechRecognitionClass(): typeof SpeechRecognition | null {
  if (typeof window === 'undefined') return null
  
  // Check for native SpeechRecognition first
  if ('SpeechRecognition' in window) {
    return window.SpeechRecognition
  }
  
  // Check for webkit prefixed version (Safari, Chrome)
  if ('webkitSpeechRecognition' in window) {
    return (window as any).webkitSpeechRecognition
  }
  
  return null
}

export function useVoiceRecognition(
  options: UseVoiceRecognitionOptions = {},
  roomId?: string
): UseVoiceRecognitionReturn {
  const {
    language = 'en-US',
    continuous = false,
    interimResults = true,
    confidenceThreshold = 0.5,
    enableAudioFeedback = true
  } = options

  const [state, setState] = useState<VoiceRecognitionState>('idle')
  const [transcript, setTranscript] = useState('')
  const [confidence, setConfidence] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null)
  const [isListening, setIsListening] = useState(false)

  const recognitionRef = useRef<any>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const safariDelayRef = useRef<NodeJS.Timeout | null>(null)
  const isStartingRef = useRef(false)

  // Get the speech recognition class
  const SpeechRecognitionClass = getSpeechRecognitionClass()
  const isSupported = SpeechRecognitionClass !== null

  // Store permission in localStorage to persist across Safari navigation
  useEffect(() => {
    if (roomId && permissionGranted !== null) {
      const storageKey = `moji-mic-permission-${roomId}`
      localStorage.setItem(storageKey, permissionGranted ? 'granted' : 'denied')
      console.log('🎤 Saved permission to storage:', { roomId, granted: permissionGranted })
    }
  }, [roomId, permissionGranted])
  
  // Initialize permission from localStorage on mount
  useEffect(() => {
    if (roomId) {
      const storageKey = `moji-mic-permission-${roomId}`
      const saved = localStorage.getItem(storageKey)
      if (saved === 'granted') {
        setPermissionGranted(true)
        console.log('🎤 Restored permission from storage for room:', roomId)
      } else if (saved === 'denied') {
        setPermissionGranted(false)
      }
    }
  }, [roomId])

  // Simplified error messages
  const getErrorMessage = useCallback((error: string): string => {
    if (BROWSER_INFO.isSafari) {
      return 'Safari microphone access denied. Please tap the microphone icon in your browser address bar, select "Allow", and try again.'
    }
    return 'Microphone access denied. Please check browser permissions and try again.'
  }, [])

  // Initialize and check browser support
  useEffect(() => {
    console.log('🎤 Custom voice recognition hook initialized')
    
    // Check secure context
    const isSecureContext = window.isSecureContext || 
      window.location.protocol === 'https:' || 
      window.location.hostname === 'localhost'
    
    if (!isSecureContext) {
      setState('not-supported')
      setError('Microphone access requires HTTPS')
      return
    }

    if (isSupported) {
      setState('idle')
      console.log('🎤 Speech recognition supported')
    } else {
      setState('not-supported')
      setError('Speech recognition not supported in this browser')
    }
  }, [isSupported])

  // Safari-specific permission check that avoids false positives
  const checkMicrophonePermission = useCallback(async (): Promise<'granted' | 'denied' | 'prompt'> => {
    if (BROWSER_INFO.isSafari) {
      // Safari incognito mode often shows false positives, so we need to actually test
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } 
        })
        stream.getTracks().forEach(track => track.stop())
        console.log('🎤 Safari: Real permission test passed')
        return 'granted'
      } catch (err: any) {
        console.log('🎤 Safari: Real permission test failed:', err.name)
        if (err.name === 'NotAllowedError') {
          return 'denied'
        }
        return 'prompt'
      }
    } else {
      // For other browsers, check the permissions API if available
      if (navigator.permissions) {
        try {
          const permission = await navigator.permissions.query({ name: 'microphone' as any })
          return permission.state as 'granted' | 'denied' | 'prompt'
        } catch {
          // Fallback to prompt if permissions API fails
          return 'prompt'
        }
      }
      return 'prompt'
    }
  }, [])

  // Request permission with proper Safari handling
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      setError('Speech recognition not supported')
      return false
    }
    
    try {
      console.log('🎤 Requesting microphone permission...')
      
      // For Safari, we need to test with actual getUserMedia
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      })
      
      // Stop tracks immediately - we just need permission
      stream.getTracks().forEach(track => track.stop())
      
      setPermissionGranted(true)
      setError(null)
      setState('idle')
      
      console.log('🎤 Microphone permission granted')
      return true
      
    } catch (err: any) {
      console.error('🎤 Permission request failed:', err)
      setPermissionGranted(false)
      setState('error')
      setError(getErrorMessage(err.name || 'unknown'))
      return false
    }
  }, [isSupported, getErrorMessage])

  // Create and configure speech recognition instance
  const createRecognition = useCallback(() => {
    if (!SpeechRecognitionClass || recognitionRef.current) {
      return recognitionRef.current
    }

    console.log('🎤 Creating new SpeechRecognition instance')
    const recognition = new SpeechRecognitionClass()

    // Configure recognition settings
    recognition.continuous = continuous
    recognition.interimResults = interimResults
    recognition.lang = language
    recognition.maxAlternatives = 3

    // Event handlers
    recognition.onstart = () => {
      console.log('🎤 Speech recognition started (onstart)')
      setIsListening(true)
      setState('listening')
      setError(null)
      isStartingRef.current = false

      // Play start listening sound
      if (enableAudioFeedback) {
        audioFeedback.playStartListeningSound()
      }
      
      // Safety timeout for push-to-talk
      timeoutRef.current = setTimeout(() => {
        console.log('⏰ Voice recognition timeout (15s)')
        if (recognitionRef.current) {
          recognitionRef.current.stop()
        }
      }, 15000)
    }

    recognition.onaudiostart = () => {
      console.log('🎤 Audio input started (onaudiostart)')
    }

    recognition.onspeechstart = () => {
      console.log('🎤 Speech detected (onspeechstart)')
    }

    recognition.onresult = (event: any) => {
      console.log('🎤 Speech recognition result received')
      let finalTranscript = ''
      let interimTranscript = ''
      let maxConfidence = 0

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        const transcriptPart = result[0].transcript

        if (result.isFinal) {
          finalTranscript += transcriptPart
          maxConfidence = Math.max(maxConfidence, result[0].confidence || 0.5)
          console.log('🎤 Final transcript:', transcriptPart, 'confidence:', result[0].confidence)
        } else {
          interimTranscript += transcriptPart
          console.log('🎤 Interim transcript:', transcriptPart)
        }
      }

      // Update transcript state
      if (finalTranscript) {
        setTranscript(prev => prev + finalTranscript)
        setConfidence(maxConfidence)
      } else if (interimTranscript && interimResults) {
        setTranscript(interimTranscript)
      }
    }

    recognition.onerror = (event: any) => {
      console.error('🎤 Speech recognition error:', event.error, event.message)
      isStartingRef.current = false
      
      // Clear timeouts
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
      if (safariDelayRef.current) {
        clearTimeout(safariDelayRef.current)
        safariDelayRef.current = null
      }

      // Handle different error types
      switch (event.error) {
        case 'not-allowed':
          setPermissionGranted(false)
          setState('error')
          setError(getErrorMessage('not-allowed'))
          break
        case 'no-speech':
          console.log('🎤 No speech detected')
          setState('idle')
          break
        case 'audio-capture':
          setState('error')
          setError('Microphone not accessible. Please check your device settings.')
          break
        case 'network':
          setState('error')
          setError('Network error during speech recognition. Please check your connection.')
          break
        default:
          setState('error')
          setError(`Speech recognition error: ${event.error}`)
      }

      setIsListening(false)
    }

    recognition.onend = () => {
      console.log('🎤 Speech recognition ended (onend)')
      setIsListening(false)
      setState('idle')
      isStartingRef.current = false

      // Play stop listening sound
      if (enableAudioFeedback) {
        audioFeedback.playStopListeningSound()
      }
      
      // Clear timeouts
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
      if (safariDelayRef.current) {
        clearTimeout(safariDelayRef.current)
        safariDelayRef.current = null
      }
    }

    recognitionRef.current = recognition
    return recognition
  }, [SpeechRecognitionClass, continuous, interimResults, language, enableAudioFeedback, getErrorMessage])

  // Enhanced start listening with Safari-specific workarounds
  const startListening = useCallback(async () => {
    console.log('🎤 startListening called', {
      isSupported,
      isListening,
      permissionGranted,
      continuous,
      language,
      isStarting: isStartingRef.current
    })
    
    if (!isSupported) {
      console.error('🎤 Browser does not support speech recognition')
      return
    }
    
    if (isListening || isStartingRef.current) {
      console.log('🎤 Already listening or starting, skipping')
      return
    }

    // Request permission if needed
    if (permissionGranted !== true) {
      console.log('🎤 Requesting permission first...')
      const granted = await requestPermission()
      if (!granted) {
        console.error('🎤 Permission not granted')
        return
      }
    }

    try {
      isStartingRef.current = true
      console.log('🎤 About to start speech recognition...')
      setError(null)
      setState('processing')
      
      // Create or get recognition instance
      const recognition = createRecognition()
      if (!recognition) {
        throw new Error('Failed to create speech recognition instance')
      }

      // Safari-specific: Add delay before actually starting
      if (BROWSER_INFO.isSafari) {
        console.log('🎤 Safari detected: Adding 2s delay before starting recognition')
        safariDelayRef.current = setTimeout(() => {
          try {
            recognition.start()
            console.log('🎤 Safari: Speech recognition start command sent (delayed)')
          } catch (err) {
            console.error('🎤 Safari: Failed to start recognition after delay:', err)
            isStartingRef.current = false
            setState('error')
            setError('Failed to start voice recognition. Please try again.')
          }
        }, 2000)
      } else {
        recognition.start()
        console.log('🎤 Speech recognition start command sent')
      }
      
    } catch (err: any) {
      console.error('🎤 Failed to start recognition:', err)
      isStartingRef.current = false
      setState('error')
      setError('Failed to start voice recognition. Please try again.')
    }
  }, [isSupported, isListening, permissionGranted, requestPermission, createRecognition])

  // Stop listening
  const stopListening = useCallback(() => {
    console.log('🎤 stopListening called')
    
    // Clear Safari delay if active
    if (safariDelayRef.current) {
      clearTimeout(safariDelayRef.current)
      safariDelayRef.current = null
      isStartingRef.current = false
    }
    
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop()
    }
  }, [isListening])

  // Reset transcript
  const resetTranscript = useCallback(() => {
    setTranscript('')
    setConfidence(0)
    console.log('🎤 Transcript reset')
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      if (safariDelayRef.current) {
        clearTimeout(safariDelayRef.current)
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop()
        recognitionRef.current = null
      }
    }
  }, [])

  // Push-to-Talk methods
  const startPushToTalk = useCallback(() => {
    console.log('🎤 Starting Push-to-Talk')
    startListening()
  }, [startListening])

  const stopPushToTalk = useCallback(() => {
    console.log('🎤 Stopping Push-to-Talk')
    stopListening()
  }, [stopListening])

  return {
    state,
    transcript: transcript.trim(),
    confidence,
    isSupported,
    isListening,
    error,
    permissionGranted,
    startListening,
    stopListening,
    resetTranscript,
    requestPermission,
    startPushToTalk,
    stopPushToTalk
  }
}